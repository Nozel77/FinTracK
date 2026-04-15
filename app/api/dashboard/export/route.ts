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
import {
  PDFDocument,
  PDFPage,
  StandardFonts,
  rgb,
  type PDFFont,
} from "pdf-lib";

export const dynamic = "force-dynamic";

type ExportFormat = "json" | "csv" | "pdf";

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

    if (format === "pdf") {
      const pdfBytes = await toDashboardPdf(snapshot, viewModel);
      const pdfArrayBuffer = new Uint8Array(pdfBytes).buffer;
      const filename = `dashboard-report-${snapshot.range.from}_to_${snapshot.range.to}.pdf`;

      return new Response(pdfArrayBuffer, {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store",
        },
      });
    }

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
  if (normalized === "json" || normalized === "csv" || normalized === "pdf") {
    return normalized;
  }
  throw new Error('Invalid "format". Supported values: "json", "csv", "pdf".');
}

function readOptionalUserId(request: Request, url: URL): string | null {
  const fromHeader = request.headers.get("x-dashboard-user-id");
  if (fromHeader && fromHeader.trim()) return fromHeader.trim();

  const fromQuery = url.searchParams.get("userId");
  if (fromQuery && fromQuery.trim()) return fromQuery.trim();

  return null;
}

function toDashboardRows(
  snapshot: DashboardSnapshot,
  viewModel: DashboardViewModel,
): string[][] {
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

  return rows;
}

function toDashboardCsv(
  snapshot: DashboardSnapshot,
  viewModel: DashboardViewModel,
): string {
  const rows = toDashboardRows(snapshot, viewModel);
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

async function toDashboardPdf(
  snapshot: DashboardSnapshot,
  viewModel: DashboardViewModel,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 841.89;
  const PAGE_HEIGHT = 595.28;
  const margin = 28;
  const titleHeight = 42;
  const headerHeight = 24;
  const rowHeight = 20;
  const fontSize = 9;
  const columnWidths: readonly [number, number, number] = [150, 230, 403.89];

  const rows = toDashboardRows(snapshot, viewModel);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - margin;

  page.drawRectangle({
    x: margin,
    y: y - titleHeight,
    width: PAGE_WIDTH - margin * 2,
    height: titleHeight,
    color: rgb(0.07, 0.36, 0.75),
  });

  page.drawText("Dashboard Financial Report", {
    x: margin + 12,
    y: y - 17,
    size: 15,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Periode: ${snapshot.range.from} s/d ${snapshot.range.to}`, {
    x: margin + 12,
    y: y - 32,
    size: 9,
    font: regularFont,
    color: rgb(0.9, 0.96, 1),
  });

  y = y - titleHeight - 14;
  y = drawPdfTableHeader({
    page,
    y,
    margin,
    headerHeight,
    columnWidths,
    boldFont,
    fontSize,
  });

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? ["", "", ""];

    if (y - rowHeight < margin) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - margin;

      page.drawRectangle({
        x: margin,
        y: y - 28,
        width: PAGE_WIDTH - margin * 2,
        height: 28,
        color: rgb(0.07, 0.36, 0.75),
      });

      page.drawText("Dashboard Financial Report (lanjutan)", {
        x: margin + 10,
        y: y - 18,
        size: 11,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      y = y - 38;
      y = drawPdfTableHeader({
        page,
        y,
        margin,
        headerHeight,
        columnWidths,
        boldFont,
        fontSize,
      });
    }

    const rowBackground = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.94, 0.97, 1);

    let x = margin;
    for (const width of columnWidths) {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width,
        height: rowHeight,
        color: rowBackground,
        borderColor: rgb(0.72, 0.82, 0.95),
        borderWidth: 0.6,
      });
      x += width;
    }

    page.drawText(
      fitPdfCellText(row[0] ?? "", regularFont, fontSize, columnWidths[0] - 10),
      {
        x: margin + 5,
        y: y - rowHeight + 6,
        size: fontSize,
        font: regularFont,
        color: rgb(0.09, 0.22, 0.42),
      },
    );
    page.drawText(
      fitPdfCellText(row[1] ?? "", regularFont, fontSize, columnWidths[1] - 10),
      {
        x: margin + columnWidths[0] + 5,
        y: y - rowHeight + 6,
        size: fontSize,
        font: regularFont,
        color: rgb(0.09, 0.22, 0.42),
      },
    );
    page.drawText(
      fitPdfCellText(row[2] ?? "", regularFont, fontSize, columnWidths[2] - 10),
      {
        x: margin + columnWidths[0] + columnWidths[1] + 5,
        y: y - rowHeight + 6,
        size: fontSize,
        font: regularFont,
        color: rgb(0.09, 0.22, 0.42),
      },
    );

    y -= rowHeight;
  }

  return await pdf.save();
}

function drawPdfTableHeader(input: {
  page: PDFPage;
  y: number;
  margin: number;
  headerHeight: number;
  columnWidths: readonly [number, number, number];
  boldFont: PDFFont;
  fontSize: number;
}): number {
  const { page, y, margin, headerHeight, columnWidths, boldFont, fontSize } =
    input;

  const labels = ["Section", "Field", "Value"] as const;
  let x = margin;

  for (let index = 0; index < columnWidths.length; index += 1) {
    const width = columnWidths[index];
    const label = labels[index] ?? "";

    page.drawRectangle({
      x,
      y: y - headerHeight,
      width,
      height: headerHeight,
      color: rgb(0.14, 0.45, 0.86),
      borderColor: rgb(0.1, 0.38, 0.75),
      borderWidth: 0.8,
    });

    page.drawText(label, {
      x: x + 5,
      y: y - headerHeight + 7,
      size: fontSize,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    x += width;
  }

  return y - headerHeight;
}

function fitPdfCellText(
  value: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "-";

  if (font.widthOfTextAtSize(normalized, fontSize) <= maxWidth) {
    return normalized;
  }

  const suffix = "...";
  let end = normalized.length;

  while (end > 1) {
    const sliced = `${normalized.slice(0, end)}${suffix}`;
    if (font.widthOfTextAtSize(sliced, fontSize) <= maxWidth) {
      return sliced;
    }
    end -= 1;
  }

  return suffix;
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
