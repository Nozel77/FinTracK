"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

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
  readonly isSectionLoading?: boolean;
  readonly loadingLabel?: string;
  readonly themeOverrides?: SidebarPageThemeOverrides;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly sidebarClassName?: string;
};

type CSSVariables = CSSProperties & Partial<Record<`--${string}`, string>>;
type SidebarThemeMode = "light" | "dark";

const THEME_MODE_STORAGE_KEY = "dashboard.theme";

const DARK_THEME_VARS: CSSVariables = {
  "--background": "#0b1220",
  "--foreground": "#e2e8f0",
  "--surface": "#111827",
  "--surface-2": "#1f2937",
  "--border": "#334155",
  "--muted": "#94a3b8",
  "--primary": "#60a5fa",
  "--primary-hover": "#3b82f6",
  "--primary-soft": "#1e3a8a",
  "--accent": "#38bdf8",
  "--success": "#22c55e",
  "--danger": "#f87171",
};

export function SidebarPageShell({
  activeSidebarItemId,
  title,
  subtitle,
  badgeLabel,
  headerActions,
  children,
  isSectionLoading = false,
  loadingLabel = "Memuat konten...",
  themeOverrides,
  className,
  contentClassName,
  sidebarClassName,
}: SidebarPageShellProps) {
  const [themeMode, setThemeMode] = useState<SidebarThemeMode>(() =>
    getInitialThemeMode(),
  );
  const [isSidebarAnimationReady, setIsSidebarAnimationReady] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsSidebarAnimationReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleThemeToggleAction = () => {
    setThemeMode((previous) => (previous === "dark" ? "light" : "dark"));
  };

  const themedStyle = useMemo(
    () => toThemeVariables(themeMode, themeOverrides),
    [themeMode, themeOverrides],
  );

  return (
    <div
      className={cx(
        "h-screen w-screen overflow-hidden bg-background text-foreground",
        className,
      )}
      data-theme={themeMode}
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
            themeMode={themeMode}
            onThemeToggleAction={handleThemeToggleAction}
          />

          <section
            className={cx(
              "sidebar-shell-content min-w-0 space-y-6 p-4 sm:p-6 lg:ml-68 lg:peer-data-[collapsed=true]/sidebar:ml-27",
              isSidebarAnimationReady
                ? "lg:transition-[margin-left] lg:duration-200"
                : "lg:transition-none",
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

            <section className="relative min-w-0" aria-busy={isSectionLoading}>
              {children}

              {isSectionLoading ? (
                <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-background/70 backdrop-blur-[1px]">
                  <div className="flex h-full w-full flex-col justify-start gap-4 p-4 sm:p-6">
                    <div className="h-6 w-48 animate-pulse rounded-lg bg-primary-soft" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="h-28 animate-pulse rounded-xl bg-surface-2" />
                      <div className="h-28 animate-pulse rounded-xl bg-surface-2" />
                    </div>
                    <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
                    <span className="sr-only">{loadingLabel}</span>
                  </div>
                </div>
              ) : null}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}

function getInitialThemeMode(): SidebarThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const rootThemeMode = document.documentElement.dataset.theme;
  if (rootThemeMode === "light" || rootThemeMode === "dark") {
    return rootThemeMode;
  }

  const storedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (storedThemeMode === "light" || storedThemeMode === "dark") {
    return storedThemeMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function toThemeVariables(
  themeMode: SidebarThemeMode = "light",
  themeOverrides?: SidebarPageThemeOverrides,
): CSSVariables | undefined {
  if (themeMode === "dark") {
    return DARK_THEME_VARS;
  }

  return toOverrideThemeVariables(themeOverrides);
}

function toOverrideThemeVariables(
  themeOverrides?: SidebarPageThemeOverrides,
): CSSVariables | undefined {
  if (!themeOverrides) {
    return undefined;
  }

  const variables: CSSVariables = {};

  if (themeOverrides.background)
    variables["--background"] = themeOverrides.background;
  if (themeOverrides.foreground)
    variables["--foreground"] = themeOverrides.foreground;
  if (themeOverrides.surface) variables["--surface"] = themeOverrides.surface;
  if (themeOverrides.surface2)
    variables["--surface-2"] = themeOverrides.surface2;
  if (themeOverrides.border) variables["--border"] = themeOverrides.border;
  if (themeOverrides.muted) variables["--muted"] = themeOverrides.muted;
  if (themeOverrides.primary) variables["--primary"] = themeOverrides.primary;
  if (themeOverrides.primaryHover)
    variables["--primary-hover"] = themeOverrides.primaryHover;
  if (themeOverrides.primarySoft)
    variables["--primary-soft"] = themeOverrides.primarySoft;
  if (themeOverrides.accent) variables["--accent"] = themeOverrides.accent;
  if (themeOverrides.success) variables["--success"] = themeOverrides.success;
  if (themeOverrides.danger) variables["--danger"] = themeOverrides.danger;

  return Object.keys(variables).length > 0 ? variables : undefined;
}

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
