import { redirect } from "next/navigation";

import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import { DashboardClientScreen } from "@/src/features/dashboard/presentation/client/dashboard-client-screen";
import { getAuthenticatedUser } from "@/src/shared/supabase/authorization";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function Page({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  const params = (await searchParams) ?? {};
  const from = toOptionalIsoDate(readFirstString(params.from));
  const to = toOptionalIsoDate(readFirstString(params.to));

  const dependencies = createDashboardDependencies({
    preferSupabase: true,
    supabaseUserId: user.id,
  });

  const viewModel = await dependencies.loadDashboardViewModel({
    from,
    to,
  });

  return (
    <DashboardClientScreen
      initialViewModel={viewModel}
      initialScreen="settings"
      initialFrom={from}
      initialTo={to}
      userId={user.id}
    />
  );
}

function readFirstString(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]?.trim();
    return first ? first : undefined;
  }

  return undefined;
}

function toOptionalIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!ISO_DATE_PATTERN.test(value)) return undefined;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return undefined;

  return value;
}
