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
    readonly incomeAria: string;
    readonly expenseAria: string;
  }
> = {
  en: {
    title: "Weekly trend",
    subtitle: "Income vs expenses this week",
    incomeLabel: "Income",
    expenseLabel: "Expense",
    incomeAria: "income",
    expenseAria: "expense",
  },
  id: {
    title: "Tren mingguan",
    subtitle: "Pemasukan vs pengeluaran minggu ini",
    incomeLabel: "Pemasukan",
    expenseLabel: "Pengeluaran",
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
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <Legend
            colorClassName="bg-[var(--primary)]"
            label={copy.incomeLabel}
          />
          <Legend
            colorClassName="bg-[var(--blue-400)]"
            label={copy.expenseLabel}
          />
        </div>

        <ul className="grid grid-cols-7 gap-3">
          {trend.items.map((item) => {
            const incomeHeight = Math.max(6, item.incomeHeightPct);
            const expenseHeight = Math.max(6, item.expenseHeightPct);

            return (
              <li
                key={item.label}
                className="flex min-w-0 flex-col items-center gap-2"
              >
                <div className="flex h-36 w-full items-end justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-1 py-2">
                  <div
                    className="w-2 rounded-full bg-[var(--primary)]"
                    style={{ height: `${incomeHeight}%` }}
                    title={`${copy.incomeLabel} ${item.incomeLabel}`}
                    aria-label={`${item.label} ${copy.incomeAria} ${item.incomeLabel}`}
                  />
                  <div
                    className="w-2 rounded-full bg-[var(--blue-400)]"
                    style={{ height: `${expenseHeight}%` }}
                    title={`${copy.expenseLabel} ${item.expenseLabel}`}
                    aria-label={`${item.label} ${copy.expenseAria} ${item.expenseLabel}`}
                  />
                </div>

                <p className="text-xs font-medium text-[var(--muted)]">
                  {item.label}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardCard>
  );
}

type LegendProps = {
  readonly colorClassName: string;
  readonly label: string;
};

function Legend({ colorClassName, label }: LegendProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClassName}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
