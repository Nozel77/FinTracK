import type { MouseEventHandler } from "react";

import { ActionPill } from "../components/action-pill";
import { DashboardCard } from "../components/dashboard-card";
import { SpendingBreakdownSection } from "../sections/spending-breakdown-section";
import { WeeklyTrendSection } from "../sections/weekly-trend-section";
import { SidebarPageShell } from "./sidebar-page-shell";
import { LIGHT_BLUE_THEME } from "./light-blue-theme";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import type { Locale } from "@/src/shared/i18n/locale";

export type AnalyticsScreenProps = {
  readonly viewModel: DashboardViewModel;
  readonly locale?: Locale;
  readonly onSelectDateRange?: MouseEventHandler<HTMLButtonElement>;
  readonly onExportReport?: MouseEventHandler<HTMLButtonElement>;
  readonly isLoading?: boolean;
};

const analyticsTheme = LIGHT_BLUE_THEME;

export function AnalyticsScreen({
  viewModel,
  locale = "id",
  onSelectDateRange,
  onExportReport,
  isLoading = false,
}: AnalyticsScreenProps) {
  const copy = getAnalyticsCopy(locale);
  const topCategories = getTopCategories(viewModel.spendingBreakdown, 4);
  const insights = getInsights(viewModel, topCategories, locale);

  return (
    <SidebarPageShell
      activeSidebarItemId="analytics"
      title={copy.title}
      subtitle={copy.subtitle}
      badgeLabel={copy.badgeLabel}
      themeOverrides={analyticsTheme}
      isSectionLoading={isLoading}
      loadingLabel="Memuat data analitik..."
      headerActions={
        <>
          <ActionPill
            label={viewModel.heading.dateRangeLabel}
            icon={<CalendarIcon />}
            tone="outline"
            onClick={onSelectDateRange}
          />
          <ActionPill
            label={copy.exportReport}
            icon={<DownloadIcon />}
            tone="primary"
            onClick={onExportReport}
          />
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-4">
          <MetricCard
            label={copy.totalBalance}
            value={viewModel.summary.totalBalance}
            toneClassName="text-primary"
          />
          <MetricCard
            label={copy.monthlyIncome}
            value={viewModel.summary.monthlyIncome}
            toneClassName="text-success"
          />
          <MetricCard
            label={copy.monthlyExpense}
            value={viewModel.summary.monthlyExpense}
            toneClassName="text-primary"
          />
          <MetricCard
            label={copy.availableToSpend}
            value={viewModel.summary.availableToSpend}
            toneClassName="text-accent"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <WeeklyTrendSection trend={viewModel.weeklyTrend} locale={locale} />
            <SpendingBreakdownSection
              items={viewModel.spendingBreakdown}
              locale={locale}
            />
          </div>

          <aside className="min-w-0 space-y-6">
            <DashboardCard
              title={copy.performanceInsights}
              subtitle={copy.quickHighlights}
            >
              <ul className="space-y-3">
                {insights.map((insight) => (
                  <li
                    key={insight.label}
                    className="rounded-2xl border border-border bg-surface-2 px-4 py-3"
                  >
                    <p className="text-xs font-medium text-muted">
                      {insight.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm font-semibold",
                        insight.toneClassName,
                      )}
                    >
                      {insight.value}
                    </p>
                  </li>
                ))}
              </ul>
            </DashboardCard>

            <DashboardCard
              title={copy.topCategories}
              subtitle={copy.highestSpendingSegments}
            >
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted">{copy.noCategoryData}</p>
              ) : (
                <ul className="space-y-4">
                  {topCategories.map((category) => (
                    <li key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-foreground">
                          {category.category}
                        </span>
                        <span className="text-xs text-muted">
                          {category.amountLabel} • {category.percentageLabel}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor:
                              category.colorHex || "var(--primary)",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </aside>
        </section>
      </div>
    </SidebarPageShell>
  );
}

type MetricCardProps = {
  readonly label: string;
  readonly value: string;
  readonly toneClassName: string;
};

function MetricCard({ label, value, toneClassName }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight",
          toneClassName,
        )}
      >
        {value}
      </p>
    </article>
  );
}

type TopCategory = {
  readonly category: string;
  readonly amountLabel: string;
  readonly percentageLabel: string;
  readonly percentage: number;
  readonly colorHex: string;
};

function getTopCategories(
  items: DashboardViewModel["spendingBreakdown"],
  limit: number,
): ReadonlyArray<TopCategory> {
  return [...items]
    .map((item) => ({
      category: item.category,
      amountLabel: item.amountLabel,
      percentageLabel: item.percentageLabel,
      percentage: toPercent(item.percentageLabel),
      colorHex: item.colorHex,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);
}

function getInsights(
  viewModel: DashboardViewModel,
  topCategories: ReadonlyArray<TopCategory>,
  locale: Locale,
): ReadonlyArray<{ label: string; value: string; toneClassName: string }> {
  const copy = getAnalyticsCopy(locale);
  const strongestDay = getStrongestDay(viewModel.weeklyTrend.items, locale);
  const topCategory = topCategories[0];

  return [
    {
      label: copy.peakSpendingCategory,
      value: topCategory
        ? `${topCategory.category} (${topCategory.percentageLabel})`
        : copy.noCategoryData,
      toneClassName: "text-cyan-700",
    },
    {
      label: copy.bestIncomeVsExpenseDay,
      value: strongestDay,
      toneClassName: "text-success",
    },
    {
      label: copy.dailyLimitUsage,
      value: `${Math.round(viewModel.dailyLimit.progressPct)}% ${copy.usedSuffix}`,
      toneClassName: "text-primary",
    },
    {
      label: copy.currentAvailableBudget,
      value: viewModel.summary.availableToSpend,
      toneClassName: "text-accent",
    },
  ];
}

function getStrongestDay(
  items: DashboardViewModel["weeklyTrend"]["items"],
  locale: Locale,
): string {
  const copy = getAnalyticsCopy(locale);

  if (items.length === 0) return copy.noWeeklyTrendData;

  const strongest = items.reduce((best, current) => {
    const bestDiff = best.incomeHeightPct - best.expenseHeightPct;
    const currentDiff = current.incomeHeightPct - current.expenseHeightPct;
    return currentDiff > bestDiff ? current : best;
  });

  return `${strongest.label} (${strongest.incomeLabel} vs ${strongest.expenseLabel})`;
}

function toPercent(input: string): number {
  const numeric = Number.parseFloat(input.replace("%", "").trim());
  if (Number.isNaN(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

function DownloadIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3.75V11.25M10 11.25L7.25 8.5M10 11.25L12.75 8.5M3.75 13.75V14.25C3.75 15.3546 4.64543 16.25 5.75 16.25H14.25C15.3546 16.25 16.25 15.3546 16.25 14.25V13.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect
        x="3.33337"
        y="4.16675"
        width="13.3333"
        height="12.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.66669 2.91675V5.41675M13.3334 2.91675V5.41675M3.33337 7.91675H16.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getAnalyticsCopy(locale: Locale) {
  if (locale === "id") {
    return {
      title: "Analitik",
      subtitle:
        "Analisis tren, perilaku pengeluaran, dan performa dari waktu ke waktu.",
      badgeLabel: "Insight",
      exportReport: "Ekspor laporan",
      totalBalance: "Total saldo",
      monthlyIncome: "Pemasukan bulanan",
      monthlyExpense: "Pengeluaran bulanan",
      availableToSpend: "Saldo tersedia",
      performanceInsights: "Insight performa",
      quickHighlights: "Ringkasan cepat dari periode terpilih",
      topCategories: "Kategori teratas",
      highestSpendingSegments: "Segmen pengeluaran tertinggi pada periode ini",
      peakSpendingCategory: "Kategori pengeluaran puncak",
      noCategoryData: "Tidak ada data kategori",
      bestIncomeVsExpenseDay: "Hari terbaik pemasukan vs pengeluaran",
      dailyLimitUsage: "Penggunaan batas harian",
      currentAvailableBudget: "Anggaran tersedia saat ini",
      noWeeklyTrendData: "Tidak ada data tren mingguan",
      usedSuffix: "terpakai",
    };
  }

  return {
    title: "Analytics",
    subtitle: "Analyze trends, spending behavior, and performance over time.",
    badgeLabel: "Insights",
    exportReport: "Export report",
    totalBalance: "Total balance",
    monthlyIncome: "Monthly income",
    monthlyExpense: "Monthly expense",
    availableToSpend: "Available to spend",
    performanceInsights: "Performance insights",
    quickHighlights: "Quick highlights from this selected period",
    topCategories: "Top categories",
    highestSpendingSegments: "Highest spending segments this period",
    peakSpendingCategory: "Peak spending category",
    noCategoryData: "No category data",
    bestIncomeVsExpenseDay: "Best income vs expense day",
    dailyLimitUsage: "Daily limit usage",
    currentAvailableBudget: "Current available budget",
    noWeeklyTrendData: "No weekly trend data",
    usedSuffix: "used",
  };
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
