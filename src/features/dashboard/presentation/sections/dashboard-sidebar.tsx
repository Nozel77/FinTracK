"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { getSidebarRoutePath } from "../sidebar-routes";

export type DashboardSidebarItemId =
  | "dashboard"
  | "wallet"
  | "transactions"
  | "goals"
  | "analytics"
  | "settings";

export type DashboardSidebarItem = {
  readonly id: DashboardSidebarItemId;
  readonly label: string;
  readonly icon: ReactNode;
  readonly isActive?: boolean;
};

type SidebarThemeMode = "light" | "dark";

type DashboardSidebarProps = {
  readonly appName?: string;
  readonly items?: ReadonlyArray<DashboardSidebarItem>;
  readonly activeItemId?: DashboardSidebarItemId;
  readonly className?: string;
  readonly defaultCollapsed?: boolean;
  readonly onLogoutAction?: () => void;
  readonly themeMode?: SidebarThemeMode;
  readonly onThemeToggleAction?: () => void;
};

const defaultItems: ReadonlyArray<DashboardSidebarItem> = [
  { id: "dashboard", label: "Dashboard", icon: <GridIcon /> },
  { id: "transactions", label: "Transactions", icon: <SwapIcon /> },
  { id: "goals", label: "Goals", icon: <TargetIcon /> },
];

const SIDEBAR_COLLAPSED_STORAGE_KEY = "dashboard.sidebar.collapsed";
const SIDEBAR_THEME_STORAGE_KEY = "dashboard.theme";

const SIDEBAR_COPY = {
  en: {
    navigationLabel: "Sidebar navigation",
    primaryLabel: "Primary",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    logout: "Logout",
    loggingOut: "Logging out...",
    dashboard: "Dashboard",
    wallet: "Wallet",
    transactions: "Transactions",
    goals: "Goals",
    analytics: "Analytics",
    settings: "Settings",
  },
  id: {
    navigationLabel: "Navigasi sidebar",
    primaryLabel: "Utama",
    expandSidebar: "Perluas sidebar",
    collapseSidebar: "Ciutkan sidebar",
    darkMode: "Mode gelap",
    lightMode: "Mode terang",
    logout: "Keluar",
    loggingOut: "Sedang keluar...",
    dashboard: "Dasbor",
    wallet: "Dompet",
    transactions: "Transaksi",
    goals: "Tujuan",
    analytics: "Analitik",
    settings: "Pengaturan",
  },
} as const;

type SidebarLocale = keyof typeof SIDEBAR_COPY;

export function DashboardSidebar({
  appName = "FinTracK",
  items = defaultItems,
  activeItemId = "dashboard",
  className,
  defaultCollapsed = false,
  onLogoutAction,
  themeMode,
  onThemeToggleAction,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localThemeMode, setLocalThemeMode] =
    useState<SidebarThemeMode>("light");
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const [locale, setLocale] = useState<SidebarLocale>("en");

  const copy = useMemo(() => SIDEBAR_COPY[locale], [locale]);
  const isThemeControlled = themeMode !== undefined;
  const isDarkMode = (themeMode ?? localThemeMode) === "dark";

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored === "true") setIsCollapsed(true);
      if (stored === "false") setIsCollapsed(false);

      if (!isThemeControlled) {
        const storedTheme = window.localStorage.getItem(
          SIDEBAR_THEME_STORAGE_KEY,
        );
        if (storedTheme === "dark" || storedTheme === "light") {
          setLocalThemeMode(storedTheme);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          setLocalThemeMode("dark");
        }
      }

      const language = window.navigator.language.toLowerCase();
      if (language.startsWith("id")) setLocale("id");
      else setLocale("en");
    } finally {
      setHasLoadedPreference(true);
    }
  }, [isThemeControlled]);

  useEffect(() => {
    if (!hasLoadedPreference) return;
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      isCollapsed ? "true" : "false",
    );
  }, [hasLoadedPreference, isCollapsed]);

  useEffect(() => {
    if (!hasLoadedPreference) return;
    if (isThemeControlled) return;

    window.localStorage.setItem(SIDEBAR_THEME_STORAGE_KEY, localThemeMode);
    document.documentElement.dataset.theme = localThemeMode;
  }, [hasLoadedPreference, isThemeControlled, localThemeMode]);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      if (onLogoutAction) {
        onLogoutAction();
        return;
      }

      await fetch("/api/dashboard/actions/reset-sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{}",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <aside
      className={cn(
        "peer/sidebar fixed left-6 top-6 z-20 flex h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[20px] border border-border bg-surface px-4 py-6 text-foreground shadow-sm transition-[width] duration-200",
        isCollapsed ? "w-21 min-w-21 max-w-21" : "w-62 min-w-62 max-w-62",
        className,
      )}
      data-collapsed={isCollapsed ? "true" : "false"}
      aria-label={copy.navigationLabel}
    >
      <header
        className={cn(
          "mb-5 flex shrink-0 items-center border-b border-border pb-5",
          isCollapsed ? "justify-center" : "justify-between gap-3",
        )}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary text-white">
              <LogoMark />
            </div>
            <p className="text-xl font-bold leading-[1.366] text-foreground">
              {appName}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-primary-soft hover:text-primary"
          aria-label={isCollapsed ? copy.expandSidebar : copy.collapseSidebar}
          title={isCollapsed ? copy.expandSidebar : copy.collapseSidebar}
        >
          <PanelToggleIcon isCollapsed={isCollapsed} />
        </button>
      </header>

      <nav
        className="flex-1 overflow-y-hidden pr-1"
        aria-label={copy.primaryLabel}
      >
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isActive = item.isActive ?? item.id === activeItemId;
            const href = getSidebarRoutePath(item.id);
            const localizedLabel = copy[item.id];

            return (
              <li key={item.id}>
                <Link
                  href={href}
                  prefetch={true}
                  className={cn(
                    "group relative flex h-11 min-h-11 w-full rounded-xl text-sm font-medium transition-colors",
                    isCollapsed
                      ? "items-center justify-center px-2"
                      : "items-center gap-3 px-3 text-left",
                    isCollapsed
                      ? isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:bg-primary-soft hover:text-primary"
                      : isActive
                        ? "bg-primary-soft text-primary"
                        : "text-muted hover:bg-primary-soft hover:text-primary",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={isCollapsed ? localizedLabel : undefined}
                  title={isCollapsed ? localizedLabel : undefined}
                >
                  {isActive ? (
                    <span
                      className={cn(
                        "absolute top-1/2 h-8 w-0.75 -translate-y-1/2 rounded-full bg-primary",
                        isCollapsed ? "hidden" : "left-0",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span className="grid size-6 place-items-center" aria-hidden>
                    {item.icon}
                  </span>
                  {!isCollapsed ? (
                    <span className="truncate">{localizedLabel}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "mt-4 shrink-0 border-t border-border pt-4",
          isCollapsed ? "flex flex-col items-center" : "",
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (onThemeToggleAction) {
              onThemeToggleAction();
              return;
            }

            setLocalThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
          }}
          className={cn(
            "mb-2 flex h-11 min-h-11 rounded-xl text-sm font-medium text-muted transition-colors hover:bg-primary-soft hover:text-primary",
            isCollapsed
              ? "w-11 items-center justify-center px-0"
              : "w-full items-center gap-3 px-3",
          )}
          aria-label={
            isCollapsed
              ? isDarkMode
                ? copy.lightMode
                : copy.darkMode
              : undefined
          }
          title={
            isCollapsed
              ? isDarkMode
                ? copy.lightMode
                : copy.darkMode
              : undefined
          }
        >
          <span className="grid size-6 place-items-center" aria-hidden>
            <ThemeModeIcon isDarkMode={isDarkMode} />
          </span>
          {!isCollapsed ? (
            <span>{isDarkMode ? copy.lightMode : copy.darkMode}</span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className={cn(
            "flex h-11 min-h-11 rounded-xl text-sm font-medium text-muted transition-colors hover:bg-primary-soft hover:text-primary",
            isCollapsed
              ? "w-11 items-center justify-center px-0"
              : "w-full items-center gap-3 px-3",
            isLoggingOut ? "cursor-not-allowed opacity-60" : "",
          )}
          aria-label={isCollapsed ? copy.logout : undefined}
          title={isCollapsed ? copy.logout : undefined}
        >
          <span className="grid size-6 place-items-center" aria-hidden>
            <LogoutIcon />
          </span>
          {!isCollapsed ? (
            <span>{isLoggingOut ? copy.loggingOut : copy.logout}</span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M5 5.5V18.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M5 5.5H15"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M5 11.75H12"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M9 16L12.75 12.25L15.5 15L19 9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PanelToggleIcon({ isCollapsed }: { readonly isCollapsed: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-6" fill="none" aria-hidden>
      <rect
        x="3.25"
        y="3.75"
        width="13.5"
        height="12.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 3.75V16.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x={isCollapsed ? "10.75" : "3.75"}
        y="4.25"
        width="5.5"
        height="11.5"
        rx="1"
        className="fill-current opacity-20"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
      <rect
        x="3"
        y="3"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="11"
        y="3"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="11"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="11"
        y="11"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
      <path
        d="M3 6H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 3L14 6L11 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 14H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 11L6 14L9 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="10"
        cy="10"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function ThemeModeIcon({ isDarkMode }: { readonly isDarkMode: boolean }) {
  if (isDarkMode) {
    return (
      <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
        <path
          d="M13.75 12.5A5 5 0 0 1 7.5 6.25A5 5 0 1 0 13.75 12.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 2.75V4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 15.75V17.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.75 10H4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.75 10H17.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.88 4.88L5.94 5.94"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.06 14.06L15.12 15.12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.06 5.94L15.12 4.88"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.88 15.12L5.94 14.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
      <path
        d="M7 3.75H5.75C4.65 3.75 3.75 4.65 3.75 5.75V14.25C3.75 15.35 4.65 16.25 5.75 16.25H7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 13.5L14.5 10L11 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10H14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function cn(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(" ");
}
