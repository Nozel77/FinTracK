import type { MouseEventHandler } from "react";

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
  readonly onOpenLimitSettingsAction?: MouseEventHandler<HTMLButtonElement>;
};

const DAILY_LIMIT_COPY: Record<
  DailyLimitLocale,
  {
    readonly title: string;
    readonly todaySpent: string;
    readonly usageAriaLabel: string;
    readonly limit: string;
    readonly remaining: string;
    readonly settingsAria: string;
    readonly settingsTitle: string;
  }
> = {
  en: {
    title: "Daily transactions limit",
    todaySpent: "Today spent",
    usageAriaLabel: "Daily transaction usage",
    limit: "Limit",
    remaining: "Remaining",
    settingsAria: "Open daily limit settings",
    settingsTitle: "Daily limit settings",
  },
  id: {
    title: "Batas transaksi harian",
    todaySpent: "Pengeluaran hari ini",
    usageAriaLabel: "Penggunaan transaksi harian",
    limit: "Batas",
    remaining: "Sisa",
    settingsAria: "Buka pengaturan batas harian",
    settingsTitle: "Pengaturan batas harian",
  },
};

export function DailyLimitSection({
  dailyLimit,
  locale = "id",
  onOpenLimitSettingsAction,
}: DailyLimitSectionProps) {
  const progressSafe = clamp(dailyLimit.progressPct, 0, 100);
  const copy = DAILY_LIMIT_COPY[locale];

  return (
    <DashboardCard
      title={copy.title}
      action={
        <button
          type="button"
          aria-label={copy.settingsAria}
          title={copy.settingsTitle}
          onClick={onOpenLimitSettingsAction}
          className="grid size-8 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <GearIcon />
        </button>
      }
    >
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

function GearIcon() {
  return (
    <svg className="size-4" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.91675L11.0556 4.73426C11.1835 4.95466 11.4095 5.10482 11.6674 5.14122L13.75 5.43758L12.2917 6.91675C12.1099 7.10116 12.0266 7.35867 12.0677 7.61456L12.3958 9.66675L10.5 8.80842C10.2668 8.70284 10.0002 8.70284 9.76702 8.80842L7.87119 9.66675L8.19936 7.61456C8.24046 7.35867 8.15713 7.10116 7.97535 6.91675L6.51702 5.43758L8.59964 5.14122C8.85753 5.10482 9.08352 4.95466 9.21144 4.73426L10 2.91675Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="10"
        cy="10.75"
        r="2.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.58331 11.6667L2.91665 12.5M15.4166 11.6667L17.0833 12.5M10 15.4167V17.0834"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
