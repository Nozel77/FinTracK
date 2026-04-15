import type { DashboardViewModel } from "../view-models/dashboard-view-model";

type GoalItemProps = {
  readonly goal: DashboardViewModel["goals"][number];
  readonly onAdjustPlanAction?: (goalId: string) => void;
};

export function GoalItem({ goal, onAdjustPlanAction }: GoalItemProps) {
  const progressSafe = clamp(goal.progressPct, 0, 100);

  return (
    <li className="relative flex items-center justify-between gap-4 py-4 pr-11">
      <button
        type="button"
        aria-label={`Update progres tabungan untuk ${goal.name}`}
        title="Update progres tabungan"
        className="absolute right-0 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
        onClick={() => onAdjustPlanAction?.(goal.id)}
      >
        <MoreIcon />
      </button>

      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${progressSafe}%, var(--blue-100) ${progressSafe}% 100%)`,
          }}
          aria-hidden
        >
          <div className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[10px] font-semibold text-[var(--primary)]">
            {Math.round(progressSafe)}%
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {goal.name}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Tenggat: {goal.deadlineLabel}
          </p>
        </div>
      </div>

      <div className="flex min-w-[130px] flex-col items-end">
        <p className="text-xs text-[var(--muted)]">Terkumpul</p>
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {goal.savedLabel}
        </p>
        <p className="text-xs text-[var(--muted)]">Target {goal.targetLabel}</p>
      </div>
    </li>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="4" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
