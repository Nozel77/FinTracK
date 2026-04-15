import { redirect } from "next/navigation";

import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import { DashboardClientScreen } from "@/src/features/dashboard/presentation/client/dashboard-client-screen";
import { toDashboardViewModel } from "@/src/features/dashboard/presentation/view-models/dashboard-view-model";
import { getAuthenticatedUser } from "@/src/shared/supabase/authorization";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?next=/smart-budgeting");
  }

  const dependencies = createDashboardDependencies({
    preferSupabase: true,
    supabaseUserId: user.id,
  });

  const snapshot = await dependencies.getDashboardSnapshot.execute();
  const viewModel = toDashboardViewModel(snapshot);

  return (
    <DashboardClientScreen
      initialViewModel={viewModel}
      initialScreen="smart-budgeting"
      initialFrom={snapshot.range.from}
      initialTo={snapshot.range.to}
      userId={user.id}
    />
  );
}
