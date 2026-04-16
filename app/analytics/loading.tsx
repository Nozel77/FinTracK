import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="analytics"
      title="Analytics"
      subtitle="Menganalisis performa keuangan dan tren pengeluaran Anda."
      badgeLabel="Insights"
      loadingLabel="Memuat data analitik..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
