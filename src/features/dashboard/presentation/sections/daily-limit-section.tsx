import { DashboardCard } from "../components/dashboard-card";

export type DailyLimitViewModel = {
  readonly usedLabel: string;
  readonly limitLabel: string;
  readonly remainingLabel: string;
  readonly progressPct: number;
};

type DailyLimitLocale = "en" | "id";

type DailyLimitSectionProps = {
  readonly dailyLimit: DailyLimitViewModel;
  readonly locale?: DailyLimitLocale;
};

const DAILY_LIMIT_COPY: Record<
  DailyLimitLocale,
  {
    readonly title: string;
    readonly todaySpent: string;
    readonly usageAriaLabel: string;
    readonly limit: string;
    readonly remaining: string;
  }
> = {
  en: {
    title: "Daily transactions limit",
    todaySpent: "Today spent",
    usageAriaLabel: "Daily transaction usage",
    limit: "Limit",
    remaining: "Remaining",
  },
  id: {
    title: "Batas transaksi harian",
    todaySpent: "Pengeluaran hari ini",
    usageAriaLabel: "Penggunaan transaksi harian",
    limit: "Batas",
    remaining: "Sisa",
  },
};

export function DailyLimitSection({
  dailyLimit,
  locale = "en",
}: DailyLimitSectionProps) {
  const progressSafe = clamp(dailyLimit.progressPct, 0, 100);
  const copy = DAILY_LIMIT_COPY[locale];

  return (
    <DashboardCard title={copy.title}>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">{copy.todaySpent}</p>
          <p className="text-2xl font-semibold text-foreground">
            {dailyLimit.usedLabel}
          </p>
        </div>

        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-(--blue-100)"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressSafe)}
          aria-label={copy.usageAriaLabel}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progressSafe}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <p>
            {copy.limit}:{" "}
            <span className="font-medium text-foreground">
              {dailyLimit.limitLabel}
            </span>
          </p>
          <p>
            {copy.remaining}:{" "}
            <span className="font-medium text-foreground">
              {dailyLimit.remainingLabel}
            </span>
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
