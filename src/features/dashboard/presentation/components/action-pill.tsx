import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionPillTone = "outline" | "primary";

export interface ActionPillProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly tone?: ActionPillTone;
  readonly fullWidth?: boolean;
}

const toneClassName: Record<ActionPillTone, string> = {
  outline:
    "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-2)] active:bg-[var(--primary-soft)]",
  primary:
    "bg-[var(--primary)] text-white border border-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--blue-800)]",
};

function cx(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(" ");
}

export function ActionPill({
  label,
  icon,
  tone = "outline",
  fullWidth = false,
  className,
  type,
  ...buttonProps
}: ActionPillProps) {
  return (
    <button
      type={type ?? "button"}
      className={cx(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium leading-[1.366] transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth && "w-full",
        toneClassName[tone],
        className,
      )}
      {...buttonProps}
    >
      {icon ? (
        <span
          className="inline-flex size-5 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
    </button>
  );
}
