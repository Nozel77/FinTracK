import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="goals"
      title="Tujuan"
      subtitle="Fokus pada tujuan yang perlu tindakan sekarang."
      badgeLabel="Mode eksekusi"
      loadingLabel="Memuat halaman tujuan..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
