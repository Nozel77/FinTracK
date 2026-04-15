"use client";

import { useState } from "react";

import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import { DashboardCard } from "../components/dashboard-card";
import { PaginationControls } from "../components/pagination-controls";
import { whenLocale, type Locale } from "@/src/shared/i18n/locale";

type GoalViewModel = DashboardViewModel["goals"][number];

type GoalsSectionProps = {
  readonly goals: ReadonlyArray<GoalViewModel>;
  readonly className?: string;
  readonly locale?: Locale;
};

type GoalsCopy = {
  readonly title: string;
  readonly viewAllGoals: string;
  readonly emptyGoals: string;
  readonly deadline: string;
  readonly savedUp: string;
  readonly goalPrefix: string;
};

export function GoalsSection({
  goals,
  className,
  locale = "id",
}: GoalsSectionProps) {
  const copy: GoalsCopy = whenLocale(locale, {
    en: {
      title: "Financial goals",
      viewAllGoals: "View all goals",
      emptyGoals:
        "No goals yet. Add your first financial goal to start tracking progress.",
      deadline: "Deadline",
      savedUp: "Saved up",
      goalPrefix: "Goal",
    },
    id: {
      title: "Tujuan keuangan",
      viewAllGoals: "Lihat semua tujuan",
      emptyGoals:
        "Belum ada tujuan. Tambahkan tujuan keuangan pertama Anda untuk mulai melacak progres.",
      deadline: "Tenggat",
      savedUp: "Terkumpul",
      goalPrefix: "Target",
    },
  });

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(goals.length / pageSize));
  const currentPage = clamp(page, 1, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedGoals = goals.slice(startIndex, startIndex + pageSize);

  return (
    <DashboardCard
      title={copy.title}
      className={className}
      action={
        <a
          href="/goals"
          className="grid size-8 place-items-center rounded-full border border-[var(--border)] text-sm text-[var(--muted)] transition-colors hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
          aria-label={copy.viewAllGoals}
        >
          →
        </a>
      }
    >
      {goals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
          {copy.emptyGoals}
        </p>
      ) : (
        <div className="space-y-4">
          <ul role="list" className="divide-y divide-[var(--border)]">
            {pagedGoals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} copy={copy} />
            ))}
          </ul>

          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            totalItems={goals.length}
            onPageChangeAction={setPage}
            locale={locale}
          />
        </div>
      )}
    </DashboardCard>
  );
}

type GoalRowProps = {
  readonly goal: GoalViewModel;
  readonly copy: GoalsCopy;
};

function GoalRow({ goal, copy }: GoalRowProps) {
  const progressSafe = clamp(goal.progressPct, 0, 100);

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${progressSafe}%, var(--primary-soft) ${progressSafe}% 100%)`,
          }}
          aria-hidden
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface)] text-[10px] text-[var(--primary)]">
            {Math.round(progressSafe)}%
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {goal.name}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {copy.deadline}: {goal.deadlineLabel}
          </p>
        </div>
      </div>

      <div className="flex min-w-[130px] flex-col items-end">
        <p className="text-xs text-[var(--muted)]">{copy.savedUp}</p>
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {goal.savedLabel}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {copy.goalPrefix} {goal.targetLabel}
        </p>
      </div>
    </li>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
