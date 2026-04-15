import { redirect } from "next/navigation";

import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import { DashboardClientScreen } from "@/src/features/dashboard/presentation/client/dashboard-client-screen";
import { toDashboardViewModel } from "@/src/features/dashboard/presentation/view-models/dashboard-view-model";
import { getAuthenticatedUser } from "@/src/shared/supabase/authorization";

export const dynamic = "force-dynamic";

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

type RecurringBillsPageProps = {
  searchParams?: SearchParams;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function Page({ searchParams }: RecurringBillsPageProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?next=/recurring-bills");
  }

  const params = await resolveSearchParams(searchParams);
  const from = toOptionalIsoDate(readSingleQueryParam(params.from));
  const to = toOptionalIsoDate(readSingleQueryParam(params.to));

  const dependencies = createDashboardDependencies({
    preferSupabase: true,
    supabaseUserId: user.id,
  });

  const snapshot = await dependencies.getDashboardSnapshot.execute({
    from,
    to,
  });
  const viewModel = toDashboardViewModel(snapshot);

  return (
    <DashboardClientScreen
      initialViewModel={viewModel}
      initialScreen="recurring-bills"
      initialFrom={snapshot.range.from}
      initialTo={snapshot.range.to}
      userId={user.id}
    />
  );
}

async function resolveSearchParams(
  value: SearchParams | undefined,
): Promise<Record<string, string | string[] | undefined>> {
  if (!value) return {};
  return await value;
}

function readSingleQueryParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toOptionalNonEmptyString(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalIsoDate(value: string | undefined): string | undefined {
  const trimmed = toOptionalNonEmptyString(value);
  if (!trimmed) return undefined;
  if (!ISO_DATE_PATTERN.test(trimmed)) return undefined;

  const timestamp = new Date(trimmed).getTime();
  if (Number.isNaN(timestamp)) return undefined;

  return trimmed;
}
