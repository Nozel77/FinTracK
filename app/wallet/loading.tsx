import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="wallet"
      title="Dompet"
      subtitle="Kelola kartu, akun, dan saldo tersedia Anda"
      badgeLabel="Akun & kartu"
      loadingLabel="Memuat konten dompet..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
