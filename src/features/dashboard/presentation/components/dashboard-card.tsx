import type { ComponentPropsWithoutRef, ReactNode } from "react";

type DashboardCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  children?: ReactNode;
} & ComponentPropsWithoutRef<"section">;

export function DashboardCard({
  title,
  subtitle,
  action,
  footer,
  padded = true,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
        padded && "p-4 sm:p-6",
        className,
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-base font-semibold sm:text-lg">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}

      <div>{children}</div>

      {footer ? (
        <footer className="mt-4 border-t border-[var(--border)] pt-4">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
