import { useEffect, useState, type MouseEventHandler } from "react";

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
  readonly onAddWidgetAction?: MouseEventHandler<HTMLButtonElement>;
  readonly onSelectDateRangeAction?: MouseEventHandler<HTMLButtonElement>;
  readonly onOpenDailyLimitSettingsAction?: MouseEventHandler<HTMLButtonElement>;
  readonly isSectionLoading?: boolean;
  readonly loadingLabel?: string;
};

export function DashboardScreen({
  viewModel,
  activeSidebarItemId = "dashboard",
  locale = "id",
  onAddWidgetAction,
  onSelectDateRangeAction,
  onOpenDailyLimitSettingsAction,
  isSectionLoading = false,
  loadingLabel = "Memuat konten dashboard...",
}: DashboardScreenProps) {
  const [isSidebarAnimationReady, setIsSidebarAnimationReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsSidebarAnimationReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <main className="h-full w-full bg-background p-4 sm:p-6">
        <div className="relative h-full dashboard-screen-root">
          <DashboardSidebar
            activeItemId={activeSidebarItemId}
            className="fixed left-4 top-4 hidden h-[calc(100vh-2rem)] lg:flex sm:left-6 sm:top-6 sm:h-[calc(100vh-3rem)]"
          />

          <section
            className={cx(
              "dashboard-screen-content relative h-full min-w-0 space-y-6 overflow-y-auto p-4 sm:p-6 lg:ml-68 lg:peer-data-[collapsed=true]/sidebar:ml-27",
              isSidebarAnimationReady
                ? "lg:peer-data-[preference-ready=true]/sidebar:transition-[margin-left] lg:peer-data-[preference-ready=true]/sidebar:duration-200"
                : "lg:transition-none",
            )}
            aria-busy={isSectionLoading}
          >
            <DashboardHeaderSection
              title={viewModel.heading.title}
              subtitle={viewModel.heading.subtitle}
              dateRangeLabel={viewModel.heading.dateRangeLabel}
              locale={locale}
              onAddWidgetAction={onAddWidgetAction}
              onSelectDateRangeAction={onSelectDateRangeAction}
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
                  onOpenLimitSettingsAction={onOpenDailyLimitSettingsAction}
                />
              </aside>
            </section>

            {isSectionLoading ? (
              <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-[1px]">
                <div className="flex h-full w-full flex-col justify-start gap-4 p-4 sm:p-6">
                  <div className="h-6 w-48 animate-pulse rounded-lg bg-primary-soft" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="h-28 animate-pulse rounded-xl bg-surface-2" />
                    <div className="h-28 animate-pulse rounded-xl bg-surface-2" />
                  </div>
                  <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
                  <span className="sr-only">{loadingLabel}</span>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
