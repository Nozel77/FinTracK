import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="settings"
      title="Pengaturan"
      subtitle="Kelola profil akun, tampilan, notifikasi, dan preferensi keamanan."
      badgeLabel="Tema Slate"
      loadingLabel="Memuat pengaturan..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
