import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="smart-budgeting"
      title="Smart Budgeting"
      subtitle="Atur anggaran dinamis dengan peringatan over-speed dan rollover otomatis."
      badgeLabel="Anggaran Dinamis"
      loadingLabel="Memuat Smart Budgeting..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
