import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="transactions"
      title="Transaksi"
      subtitle="Lacak pemasukan, pengeluaran, dan aktivitas akun Anda."
      badgeLabel="Aktivitas akun"
      loadingLabel="Memuat halaman transaksi..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
