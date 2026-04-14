import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import { DashboardClientScreen } from "@/src/features/dashboard/presentation/client/dashboard-client-screen";
import { toDashboardViewModel } from "@/src/features/dashboard/presentation/view-models/dashboard-view-model";
import { resolveAuthorizedUserId } from "@/src/shared/supabase/authorization";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

type WalletPageProps = {
  searchParams?: Promise<RawSearchParams> | RawSearchParams;
};

export default async function Page({ searchParams }: WalletPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const from = readOptionalString(resolvedSearchParams.from);
  const to = readOptionalString(resolvedSearchParams.to);
  const requestedUserId = readOptionalString(resolvedSearchParams.userId);

  const authenticatedUserId = await resolveAuthorizedUserId(requestedUserId);

  const dependencies = createDashboardDependencies({
    preferSupabase: true,
    supabaseUserId: authenticatedUserId,
  });

  const snapshot = await dependencies.getDashboardSnapshot.execute({
    from,
    to,
  });
  const viewModel = toDashboardViewModel(snapshot);

  return (
    <DashboardClientScreen
      initialViewModel={viewModel}
      initialScreen="wallet"
      initialFrom={snapshot.range.from}
      initialTo={snapshot.range.to}
      userId={authenticatedUserId}
    />
  );
}

function readOptionalString(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) return undefined;
  const single = Array.isArray(value) ? value[0] : value;
  const trimmed = single.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
