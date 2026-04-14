import type { DashboardSnapshot } from "@/src/features/dashboard/domain/dashboard";
import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import {
  toDashboardViewModel,
  type DashboardViewModel,
} from "@/src/features/dashboard/presentation/view-models/dashboard-view-model";
import {
  assertAuthorizedUserId,
  requireAuthenticatedUser,
  toAuthorizationErrorResponse,
} from "@/src/shared/supabase/authorization";
import {
  errorToObject,
  jsonError,
  jsonSuccess,
} from "@/src/shared/http/api-response";

export const dynamic = "force-dynamic";

type ExportFormat = "json" | "csv";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const from = readOptionalIsoDate(url.searchParams.get("from"), "from");
    const to = readOptionalIsoDate(url.searchParams.get("to"), "to");
    const format = readFormat(url.searchParams.get("format"));

    const requestedUserId = readOptionalUserId(request, url);

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to export dashboard data.",
    );
    const authorizedUserId = assertAuthorizedUserId(
      authenticatedUser.id,
      requestedUserId,
    );

    const dependencies = createDashboardDependencies({
      preferSupabase: true,
      supabaseUserId: authorizedUserId,
    });

    const snapshot = await dependencies.getDashboardSnapshot.execute({
      from,
      to,
    });
    const viewModel = toDashboardViewModel(snapshot);

    if (format === "csv") {
      const csv = toDashboardCsv(snapshot, viewModel);
      const filename = `dashboard-report-${snapshot.range.from}_to_${snapshot.range.to}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store",
        },
      });
    }

    return jsonSuccess(
      {
        repositorySource: dependencies.repositorySource,
        range: snapshot.range,
        generatedAt: new Date().toISOString(),
        snapshot,
        viewModel,
      },
      { message: "Dashboard report exported successfully." },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    const authorizationResponse = toAuthorizationErrorResponse(error);
    if (authorizationResponse) {
      return authorizationResponse;
    }

    return jsonError("Failed to export dashboard report.", {
      code: "BAD_REQUEST",
      status: 400,
      details: errorToObject(error),
    });
  }
}

function readOptionalIsoDate(
  value: string | null,
  fieldName: "from" | "to",
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!ISO_DATE_PATTERN.test(trimmed)) {
    throw new Error(`Invalid "${fieldName}" format. Expected YYYY-MM-DD.`);
  }

  const timestamp = new Date(trimmed).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid "${fieldName}" value.`);
  }

  return trimmed;
}

function readFormat(value: string | null): ExportFormat {
  if (!value) return "json";
  const normalized = value.trim().toLowerCase();
  if (normalized === "json" || normalized === "csv") {
    return normalized;
  }
  throw new Error('Invalid "format". Supported values: "json", "csv".');
}

function readOptionalUserId(request: Request, url: URL): string | null {
  const fromHeader = request.headers.get("x-dashboard-user-id");
  if (fromHeader && fromHeader.trim()) return fromHeader.trim();

  const fromQuery = url.searchParams.get("userId");
  if (fromQuery && fromQuery.trim()) return fromQuery.trim();

  return null;
}

function toDashboardCsv(
  snapshot: DashboardSnapshot,
  viewModel: DashboardViewModel,
): string {
  const rows: string[][] = [];

  rows.push(["Section", "Field", "Value"]);
  rows.push(["Meta", "Range From", snapshot.range.from]);
  rows.push(["Meta", "Range To", snapshot.range.to]);
  rows.push(["Meta", "Generated At", new Date().toISOString()]);

  rows.push(["Summary", "Total Balance", viewModel.summary.totalBalance]);
  rows.push(["Summary", "Monthly Income", viewModel.summary.monthlyIncome]);
  rows.push(["Summary", "Monthly Expense", viewModel.summary.monthlyExpense]);
  rows.push([
    "Summary",
    "Available To Spend",
    viewModel.summary.availableToSpend,
  ]);

  for (const goal of viewModel.goals) {
    rows.push(["Goal", "Name", goal.name]);
    rows.push(["Goal", "Deadline", goal.deadlineLabel]);
    rows.push(["Goal", "Saved", goal.savedLabel]);
    rows.push(["Goal", "Target", goal.targetLabel]);
    rows.push(["Goal", "Progress", `${Math.round(goal.progressPct)}%`]);
  }

  for (const tx of viewModel.recentTransactions) {
    rows.push(["Transaction", "Title", tx.title]);
    rows.push(["Transaction", "Category", tx.category]);
    rows.push(["Transaction", "Date", tx.dateLabel]);
    rows.push(["Transaction", "Amount", tx.amountLabel]);
  }

  for (const item of viewModel.spendingBreakdown) {
    rows.push(["Spending", "Category", item.category]);
    rows.push(["Spending", "Amount", item.amountLabel]);
    rows.push(["Spending", "Percentage", item.percentageLabel]);
  }

  for (const point of viewModel.weeklyTrend.items) {
    rows.push(["Weekly Trend", `${point.label} Income`, point.incomeLabel]);
    rows.push(["Weekly Trend", `${point.label} Expense`, point.expenseLabel]);
  }

  rows.push(["Daily Limit", "Used", viewModel.dailyLimit.usedLabel]);
  rows.push(["Daily Limit", "Limit", viewModel.dailyLimit.limitLabel]);
  rows.push(["Daily Limit", "Remaining", viewModel.dailyLimit.remainingLabel]);
  rows.push([
    "Daily Limit",
    "Progress",
    `${Math.round(viewModel.dailyLimit.progressPct)}%`,
  ]);

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
