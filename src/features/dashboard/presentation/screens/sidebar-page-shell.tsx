"use client";

import {
  useEffect,
  useMemo,
  useRef,
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
  readonly themeOverrides?: SidebarPageThemeOverrides;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly sidebarClassName?: string;
};

type CSSVariables = CSSProperties & Partial<Record<`--${string}`, string>>;
type SidebarThemeMode = "light" | "dark";

const THEME_MODE_STORAGE_KEY = "dashboard.theme";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "dashboard.sidebar.collapsed";

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
  themeOverrides,
  className,
  contentClassName,
  sidebarClassName,
}: SidebarPageShellProps) {
  const [themeMode, setThemeMode] = useState<SidebarThemeMode>("light");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    const storedCollapsed = window.localStorage.getItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
    );
    return storedCollapsed === "true";
  });
  const hasHydratedThemeRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);

    const nextThemeMode: SidebarThemeMode =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    hasHydratedThemeRef.current = true;
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextThemeMode);
    document.documentElement.dataset.theme = nextThemeMode;

    if (nextThemeMode !== "light") {
      queueMicrotask(() => {
        setThemeMode(nextThemeMode);
      });
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedThemeRef.current) return;

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      isSidebarCollapsed ? "true" : "false",
    );
  }, [isSidebarCollapsed]);

  const handleThemeToggleAction = () => {
    setThemeMode((previous) => (previous === "dark" ? "light" : "dark"));
  };

  const themedStyle = useMemo(() => toThemeVariables(themeMode), [themeMode]);

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
            collapsed={isSidebarCollapsed}
            onCollapsedChangeAction={setIsSidebarCollapsed}
            themeMode={themeMode}
            onThemeToggleAction={handleThemeToggleAction}
          />

          <section
            className={cx(
              "sidebar-shell-content min-w-0 space-y-6 p-4 sm:p-6 lg:transition-[margin-left] lg:duration-200",
              isSidebarCollapsed ? "lg:ml-27" : "lg:ml-68",
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
  themeMode: SidebarThemeMode = "light",
): CSSVariables | undefined {
  if (themeMode === "dark") {
    return DARK_THEME_VARS;
  }

  return undefined;
}

function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
