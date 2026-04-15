import type { MouseEventHandler } from "react";

import type { DashboardSidebarItemId } from "./sections/dashboard-sidebar";
import { DashboardSidebar } from "./sections/dashboard-sidebar";
import { BalanceSummarySection } from "./sections/balance-summary-section";
import { DailyLimitSection } from "./sections/daily-limit-section";
import { DashboardHeaderSection } from "./sections/dashboard-header-section";
import { GoalsSection } from "./sections/goals-section";
import { RecentTransactionsSection } from "./sections/recent-transactions-section";
import { SpendingBreakdownSection } from "./sections/spending-breakdown-section";
import { WeeklyTrendSection } from "./sections/weekly-trend-section";
import type { DashboardViewModel } from "./view-models/dashboard-view-model";

type DashboardLocale = "en" | "id";

export type DashboardScreenProps = {
  readonly viewModel: DashboardViewModel;
  readonly activeSidebarItemId?: DashboardSidebarItemId;
  readonly locale?: DashboardLocale;
  readonly onAddWidget?: MouseEventHandler<HTMLButtonElement>;
  readonly onSelectDateRange?: MouseEventHandler<HTMLButtonElement>;
  readonly onOpenDailyLimitSettings?: MouseEventHandler<HTMLButtonElement>;
};

export function DashboardScreen({
  viewModel,
  activeSidebarItemId = "dashboard",
  locale = "id",
  onAddWidget,
  onSelectDateRange,
  onOpenDailyLimitSettings,
}: DashboardScreenProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <main className="h-full w-full bg-background p-4 sm:p-6">
        <div className="relative h-full dashboard-screen-root">
          <DashboardSidebar
            activeItemId={activeSidebarItemId}
            className="fixed left-4 top-4 hidden h-[calc(100vh-2rem)] lg:flex sm:left-6 sm:top-6 sm:h-[calc(100vh-3rem)]"
          />

          <section className="dashboard-screen-content h-full min-w-0 space-y-6 overflow-y-auto p-4 transition-[margin-left] duration-200 sm:p-6 lg:ml-68 lg:peer-data-[collapsed=true]/sidebar:ml-27">
            <DashboardHeaderSection
              title={viewModel.heading.title}
              subtitle={viewModel.heading.subtitle}
              dateRangeLabel={viewModel.heading.dateRangeLabel}
              locale={locale}
              onAddWidget={onAddWidget}
              onSelectDateRange={onSelectDateRange}
            />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_349px]">
              <div className="min-w-0 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <BalanceSummarySection
                    summary={viewModel.summary}
                    locale={locale}
                  />
                  <WeeklyTrendSection
                    trend={viewModel.weeklyTrend}
                    locale={locale}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <SpendingBreakdownSection
                    items={viewModel.spendingBreakdown}
                    locale={locale}
                  />
                  <GoalsSection goals={viewModel.goals} locale={locale} />
                </div>
              </div>

              <aside className="min-w-0 space-y-6">
                <RecentTransactionsSection
                  transactions={viewModel.recentTransactions}
                  locale={locale}
                />
                <DailyLimitSection
                  dailyLimit={viewModel.dailyLimit}
                  locale={locale}
                  onOpenLimitSettingsAction={onOpenDailyLimitSettings}
                />
              </aside>
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
