import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="debt-manager"
      title="Debt Manager"
      subtitle="Kelola hutang, piutang, dan ubah status langsung dari daftar."
      badgeLabel="Hutang & Piutang"
      loadingLabel="Memuat debt manager..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
