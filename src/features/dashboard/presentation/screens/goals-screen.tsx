import type { MouseEventHandler } from "react";

import { ActionPill } from "../components/action-pill";
import { DashboardCard } from "../components/dashboard-card";
import { GoalItem } from "../components/goal-item";
import {
  SidebarPageShell,
  type SidebarPageThemeOverrides,
} from "./sidebar-page-shell";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import { whenLocale, type Locale } from "@/src/shared/i18n/locale";

export type GoalsScreenProps = {
  readonly viewModel: DashboardViewModel;
  readonly locale?: Locale;
  readonly onCreateGoal?: MouseEventHandler<HTMLButtonElement>;
  readonly onAdjustPlanForGoal?: (goalId: string) => void;
  readonly onSelectDateRange?: MouseEventHandler<HTMLButtonElement>;
};

type ActionableGoal = {
  readonly id: string;
  readonly name: string;
  readonly deadlineLabel: string;
  readonly savedLabel: string;
  readonly targetLabel: string;
  readonly progressPct: number;
  readonly requiredMonthly: number;
  readonly daysUntilDeadline: number;
  readonly urgencyScore: number;
};

const goalsTheme: SidebarPageThemeOverrides = {
  background: "#f9f7ff",
  surface: "#ffffff",
  surface2: "#f2edff",
  border: "#e3dafc",
  foreground: "#1f1147",
  muted: "#6f62a5",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  primarySoft: "#ede9fe",
  accent: "#8b5cf6",
  success: "#16a34a",
  danger: "#ef4444",
};

const ACTION_WINDOW_DAYS = 90;

export function GoalsScreen({
  viewModel,
  locale = "id",
  onCreateGoal,
  onAdjustPlanForGoal,
  onSelectDateRange,
}: GoalsScreenProps) {
  const copy = whenLocale(locale, {
    en: {
      title: "Goals",
      subtitle: "Focus on goals that need action now.",
      badgeLabel: "Execution mode",
      createGoal: "Create goal",
      totalGoals: "Total goals",
      atRiskGoals: "At-risk goals",
      dueSoon: "Due in 30 days",
      monthlyNeed: "Needed this month",
      actionQueueTitle: "Action queue",
      actionQueueSubtitle:
        "Prioritized goals likely to miss target without immediate action.",
      noActionableGoals:
        "No at-risk goals right now. Keep momentum and review after your next update.",
      deadline: "Deadline",
      requiredPerMonth: "Required / month",
      addThisMonth: "Add this month",
      overdue: "Overdue",
      dueSoonBadge: "Due soon",
      onTrack: "On track",
      allGoalsTitle: "All goals",
      allGoalsSubtitle: "Full list and current progress",
      noGoalsDisplay: "No goals yet. Create your first goal.",
    },
    id: {
      title: "Tujuan",
      subtitle: "Fokus pada tujuan yang perlu tindakan sekarang.",
      badgeLabel: "Mode eksekusi",
      createGoal: "Buat tujuan",
      totalGoals: "Total tujuan",
      atRiskGoals: "Tujuan berisiko",
      dueSoon: "Jatuh tempo 30 hari",
      monthlyNeed: "Kebutuhan bulan ini",
      actionQueueTitle: "Daftar tindakan",
      actionQueueSubtitle:
        "Tujuan prioritas yang berpotensi meleset tanpa aksi segera.",
      noActionableGoals:
        "Saat ini tidak ada tujuan berisiko. Pertahankan ritme dan tinjau lagi setelah update berikutnya.",
      deadline: "Tenggat",
      requiredPerMonth: "Perlu / bulan",
      addThisMonth: "Tambahkan bulan ini",
      overdue: "Lewat tenggat",
      dueSoonBadge: "Segera jatuh tempo",
      onTrack: "On track",
      allGoalsTitle: "Semua tujuan",
      allGoalsSubtitle: "Daftar lengkap dan progres terkini",
      noGoalsDisplay: "Belum ada tujuan. Buat tujuan pertama Anda.",
    },
  });

  const goals = viewModel.goals;
  const activeGoals = goals.filter((goal) => goal.progressPct < 100);

  const actionableGoals = activeGoals
    .map<ActionableGoal>((goal) => {
      const daysUntilDeadline = daysUntil(goal.deadlineISO);
      const requiredMonthly = monthlyRequired(
        goal.savedAmount,
        goal.targetAmount,
        goal.deadlineISO,
      );

      return {
        id: goal.id,
        name: goal.name,
        deadlineLabel: goal.deadlineLabel,
        savedLabel: goal.savedLabel,
        targetLabel: goal.targetLabel,
        progressPct: goal.progressPct,
        requiredMonthly,
        daysUntilDeadline,
        urgencyScore: urgency(goal.progressPct, daysUntilDeadline),
      };
    })
    .filter((goal) => goal.daysUntilDeadline <= ACTION_WINDOW_DAYS)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const dueIn30DaysCount = activeGoals.filter((goal) => {
    const days = daysUntil(goal.deadlineISO);
    return days >= 0 && days <= 30;
  }).length;

  const totalMonthlyNeed = actionableGoals.reduce(
    (sum, goal) => sum + goal.requiredMonthly,
    0,
  );

  const handleAdjustPlanForGoal = (goalId: string) => {
    onAdjustPlanForGoal?.(goalId);
  };

  return (
    <SidebarPageShell
      activeSidebarItemId="goals"
      title={copy.title}
      subtitle={copy.subtitle}
      badgeLabel={copy.badgeLabel}
      themeOverrides={goalsTheme}
      headerActions={
        <>
          <ActionPill
            label={viewModel.heading.dateRangeLabel}
            icon={<CalendarIcon />}
            tone="outline"
            onClick={onSelectDateRange}
          />

          <ActionPill
            label={copy.createGoal}
            icon={<PlusIcon />}
            tone="primary"
            onClick={onCreateGoal}
          />
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={copy.totalGoals}
            value={goals.length.toString()}
            toneClassName="text-primary"
          />
          <MetricCard
            label={copy.atRiskGoals}
            value={actionableGoals.length.toString()}
            toneClassName="text-danger"
          />
          <MetricCard
            label={copy.dueSoon}
            value={dueIn30DaysCount.toString()}
            toneClassName="text-accent"
          />
          <MetricCard
            label={copy.monthlyNeed}
            value={formatIdr(totalMonthlyNeed)}
            toneClassName="text-foreground"
          />
        </section>

        <DashboardCard
          title={copy.actionQueueTitle}
          subtitle={copy.actionQueueSubtitle}
        >
          {actionableGoals.length === 0 ? (
            <EmptyMessage text={copy.noActionableGoals} />
          ) : (
            <ul className="space-y-3">
              {actionableGoals.map((goal) => {
                const status =
                  goal.daysUntilDeadline < 0
                    ? copy.overdue
                    : goal.daysUntilDeadline <= 30
                      ? copy.dueSoonBadge
                      : copy.onTrack;

                const statusClassName =
                  goal.daysUntilDeadline < 0
                    ? "bg-red-500/10 text-red-600"
                    : goal.daysUntilDeadline <= 30
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-emerald-500/10 text-emerald-700";

                return (
                  <li
                    key={goal.id}
                    className="rounded-2xl border border-border bg-surface-2 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {goal.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {copy.deadline}: {goal.deadlineLabel}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          statusClassName,
                        )}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-surface px-3 py-2">
                        <p className="text-[11px] text-muted">
                          {copy.requiredPerMonth}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formatIdr(goal.requiredMonthly)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface px-3 py-2">
                        <p className="text-[11px] text-muted">
                          {copy.addThisMonth}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatIdr(goal.requiredMonthly)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                        <span>
                          {goal.savedLabel} / {goal.targetLabel}
                        </span>
                        <span>
                          {Math.round(clamp(goal.progressPct, 0, 100))}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${clamp(goal.progressPct, 0, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title={copy.allGoalsTitle}
          subtitle={copy.allGoalsSubtitle}
        >
          {goals.length === 0 ? (
            <EmptyMessage text={copy.noGoalsDisplay} />
          ) : (
            <ul role="list" className="divide-y divide-border">
              {goals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onAdjustPlanAction={handleAdjustPlanForGoal}
                />
              ))}
            </ul>
          )}
        </DashboardCard>
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

function EmptyMessage({ text }: { readonly text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted">
      {text}
    </p>
  );
}

function monthlyRequired(
  saved: number,
  target: number,
  deadlineISO: string,
): number {
  const remaining = Math.max(0, target - saved);
  const monthsLeft = Math.max(1, Math.ceil(daysUntil(deadlineISO) / 30));
  return remaining / monthsLeft;
}

function urgency(progressPct: number, daysUntilDeadline: number): number {
  const progressGap = 100 - clamp(progressPct, 0, 100);
  const timePressure =
    daysUntilDeadline < 0 ? 200 : 100 - clamp(daysUntilDeadline, 0, 100);
  return progressGap + timePressure;
}

function daysUntil(isoDate: string): number {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 365;

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - now.getTime()) / msPerDay);
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function PlusIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 4.16675V15.8334M4.16669 10H15.8334"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
