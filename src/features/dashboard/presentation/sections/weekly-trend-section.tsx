import { DashboardCard } from "../components/dashboard-card";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import type { Locale } from "@/src/shared/i18n/locale";

type WeeklyTrendSectionProps = {
  readonly trend: DashboardViewModel["weeklyTrend"];
  readonly locale?: Locale;
};

const WEEKLY_TREND_COPY: Record<
  Locale,
  {
    readonly title: string;
    readonly subtitle: string;
    readonly incomeLabel: string;
    readonly expenseLabel: string;
    readonly incomeSubtitle: string;
    readonly expenseSubtitle: string;
    readonly incomeAria: string;
    readonly expenseAria: string;
  }
> = {
  en: {
    title: "Weekly trend",
    subtitle: "Income and expenses this week",
    incomeLabel: "Income",
    expenseLabel: "Expense",
    incomeSubtitle: "Income trend (own scale)",
    expenseSubtitle: "Expense trend (own scale)",
    incomeAria: "income",
    expenseAria: "expense",
  },
  id: {
    title: "Tren mingguan",
    subtitle: "Pemasukan dan pengeluaran minggu ini",
    incomeLabel: "Pemasukan",
    expenseLabel: "Pengeluaran",
    incomeSubtitle: "Tren pemasukan (skala sendiri)",
    expenseSubtitle: "Tren pengeluaran (skala sendiri)",
    incomeAria: "pemasukan",
    expenseAria: "pengeluaran",
  },
};

export function WeeklyTrendSection({
  trend,
  locale = "id",
}: WeeklyTrendSectionProps) {
  const copy = WEEKLY_TREND_COPY[locale];

  return (
    <DashboardCard title={copy.title} subtitle={copy.subtitle}>
      <div className="space-y-5">
        <TrendRow
          title={copy.incomeLabel}
          subtitle={copy.incomeSubtitle}
          toneClassName="bg-success"
          ariaSuffix={copy.incomeAria}
          items={trend.items.map((item) => ({
            label: item.label,
            valueLabel: item.incomeLabel,
            heightPct: item.incomeHeightPct,
          }))}
        />

        <TrendRow
          title={copy.expenseLabel}
          subtitle={copy.expenseSubtitle}
          toneClassName="bg-danger"
          ariaSuffix={copy.expenseAria}
          items={trend.items.map((item) => ({
            label: item.label,
            valueLabel: item.expenseLabel,
            heightPct: item.expenseHeightPct,
          }))}
        />
      </div>
    </DashboardCard>
  );
}

type TrendRowProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly toneClassName: string;
  readonly ariaSuffix: string;
  readonly items: ReadonlyArray<{
    readonly label: string;
    readonly valueLabel: string;
    readonly heightPct: number;
  }>;
};

function TrendRow({
  title,
  subtitle,
  toneClassName,
  ariaSuffix,
  items,
}: TrendRowProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <Legend colorClassName={toneClassName} label={title} />
        <p className="text-xs text-muted">{subtitle}</p>
      </div>

      <ul className="grid grid-cols-7 gap-3">
        {items.map((item) => {
          const height = item.heightPct > 0 ? Math.max(6, item.heightPct) : 0;

          return (
            <li
              key={`${title}-${item.label}`}
              className="flex min-w-0 flex-col items-center gap-2"
            >
              <div className="flex h-24 w-full items-end justify-center rounded-xl border border-border bg-surface-2 px-2 py-2">
                <div
                  className={`w-3 rounded-full ${toneClassName}`}
                  style={{ height: `${height}%` }}
                  title={`${title} ${item.valueLabel}`}
                  aria-label={`${item.label} ${ariaSuffix} ${item.valueLabel}`}
                />
              </div>

              <p className="text-xs font-medium text-muted">{item.label}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type LegendProps = {
  readonly colorClassName: string;
  readonly label: string;
};

function Legend({ colorClassName, label }: LegendProps) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${colorClassName}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
