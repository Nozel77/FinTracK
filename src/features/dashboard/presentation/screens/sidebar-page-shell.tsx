import type { CSSProperties, ReactNode } from "react";

import {
  DashboardSidebar,
  type DashboardSidebarItemId,
} from "../sections/dashboard-sidebar";

export type SidebarPageThemeOverrides = {
  readonly background?: string;
  readonly foreground?: string;
  readonly surface?: string;
  readonly surface2?: string;
  readonly border?: string;
  readonly muted?: string;
  readonly primary?: string;
  readonly primaryHover?: string;
  readonly primarySoft?: string;
  readonly accent?: string;
  readonly success?: string;
  readonly danger?: string;
};

export type SidebarPageShellProps = {
  readonly activeSidebarItemId: DashboardSidebarItemId;
  readonly title: string;
  readonly subtitle?: string;
  readonly badgeLabel?: string;
  readonly headerActions?: ReactNode;
  readonly children: ReactNode;
  readonly themeOverrides?: SidebarPageThemeOverrides;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly sidebarClassName?: string;
};

type CSSVariables = CSSProperties & Partial<Record<`--${string}`, string>>;

export function SidebarPageShell({
  activeSidebarItemId,
  title,
  subtitle,
  badgeLabel,
  headerActions,
  children,
  themeOverrides,
  className,
  contentClassName,
  sidebarClassName,
}: SidebarPageShellProps) {
  const themedStyle = toThemeVariables(themeOverrides);

  return (
    <div
      className={cx(
        "h-screen w-screen overflow-hidden bg-background text-foreground",
        className,
      )}
      style={themedStyle}
    >
      <main className="h-full w-full overflow-y-auto bg-background p-4 sm:p-6">
        <div className="relative sidebar-shell-root">
          <DashboardSidebar
            activeItemId={activeSidebarItemId}
            className={cx(
              "hidden lg:fixed lg:left-6 lg:top-6 lg:flex lg:h-[calc(100vh-3rem)]",
              sidebarClassName,
            )}
          />

          <section
            className={cx(
              "sidebar-shell-content min-w-0 space-y-6 p-4 sm:p-6 lg:ml-68 lg:transition-[margin-left] lg:duration-200",
              contentClassName,
            )}
          >
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-2xl font-semibold leading-[1.3] sm:text-[26px]">
                    {title}
                  </h1>
                  {badgeLabel ? (
                    <span className="inline-flex h-7 items-center rounded-full border border-border bg-primary-soft px-3 text-xs font-semibold text-primary">
                      {badgeLabel}
                    </span>
                  ) : null}
                </div>

                {subtitle ? (
                  <p className="mt-2 truncate text-sm font-medium text-muted sm:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {headerActions ? (
                <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
                  {headerActions}
                </div>
              ) : null}
            </header>

            <section className="min-w-0">{children}</section>
          </section>
        </div>
      </main>
    </div>
  );
}

function toThemeVariables(
  overrides?: SidebarPageThemeOverrides,
): CSSVariables | undefined {
  if (!overrides) return undefined;

  const vars: CSSVariables = {};

  if (overrides.background) vars["--background"] = overrides.background;
  if (overrides.foreground) vars["--foreground"] = overrides.foreground;
  if (overrides.surface) vars["--surface"] = overrides.surface;
  if (overrides.surface2) vars["--surface-2"] = overrides.surface2;
  if (overrides.border) vars["--border"] = overrides.border;
  if (overrides.muted) vars["--muted"] = overrides.muted;
  if (overrides.primary) vars["--primary"] = overrides.primary;
  if (overrides.primaryHover) vars["--primary-hover"] = overrides.primaryHover;
  if (overrides.primarySoft) vars["--primary-soft"] = overrides.primarySoft;
  if (overrides.accent) vars["--accent"] = overrides.accent;
  if (overrides.success) vars["--success"] = overrides.success;
  if (overrides.danger) vars["--danger"] = overrides.danger;

  return vars;
}

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
