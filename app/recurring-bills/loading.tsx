import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="recurring-bills"
      title="Recurring & Bill Management"
      subtitle="Pantau langganan dan kalender tagihan agar tidak ada pembayaran terlewat."
      badgeLabel="Tagihan Rutin"
      loadingLabel="Memuat tagihan rutin..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
