import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import { DashboardClientScreen } from "@/src/features/dashboard/presentation/client/dashboard-client-screen";
import { toDashboardViewModel } from "@/src/features/dashboard/presentation/view-models/dashboard-view-model";
import {
  assertAuthorizedUserId,
  requireAuthenticatedUser,
} from "@/src/shared/supabase/authorization";

export const dynamic = "force-dynamic";

type SearchParams = {
  readonly from?: string | string[];
  readonly to?: string | string[];
  readonly userId?: string | string[];
};

type TransactionsPageProps = {
  readonly searchParams?: Promise<SearchParams> | SearchParams;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function Page({ searchParams }: TransactionsPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);

  const from = readOptionalIsoDate(resolvedSearchParams.from);
  const to = readOptionalIsoDate(resolvedSearchParams.to);
  const requestedUserId = readOptionalString(resolvedSearchParams.userId);

  const authenticatedUser = await requireAuthenticatedUser(
    "You must be signed in to view transactions.",
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

  return (
    <DashboardClientScreen
      initialViewModel={viewModel}
      initialScreen="transactions"
      initialFrom={snapshot.range.from}
      initialTo={snapshot.range.to}
      userId={authorizedUserId}
    />
  );
}

async function resolveSearchParams(
  value: TransactionsPageProps["searchParams"],
): Promise<SearchParams> {
  if (!value) return {};
  return await Promise.resolve(value);
}

function readOptionalString(
  value: string | string[] | undefined,
): string | undefined {
  const first = firstValue(value);
  if (!first) return undefined;

  const trimmed = first.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readOptionalIsoDate(
  value: string | string[] | undefined,
): string | undefined {
  const parsed = readOptionalString(value);
  if (!parsed) return undefined;

  if (!ISO_DATE_PATTERN.test(parsed)) return undefined;
  if (Number.isNaN(new Date(parsed).getTime())) return undefined;

  return parsed;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
