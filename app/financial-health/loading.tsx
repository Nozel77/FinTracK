import { DashboardRouteLoadingScreen } from "@/src/features/dashboard/presentation/screens/dashboard-route-loading-screen";
import { LIGHT_BLUE_THEME } from "@/src/features/dashboard/presentation/screens/light-blue-theme";

export default function Loading() {
  return (
    <DashboardRouteLoadingScreen
      activeSidebarItemId="financial-health"
      title="Financial Health Score"
      subtitle="Interpretasi kesehatan keuangan berdasarkan Debt-to-Income Ratio (maks 35%) dan Emergency Fund Ratio (minimal 3x pengeluaran)."
      badgeLabel="Health Score"
      loadingLabel="Memuat health score..."
      themeOverrides={LIGHT_BLUE_THEME}
    />
  );
}
