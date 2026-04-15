import type { DashboardSidebarItemId } from "./sections/dashboard-sidebar";

export type SidebarRoutePath =
  | "/"
  | "/wallet"
  | "/transactions"
  | "/goals"
  | "/analytics"
  | "/settings"
  | "/smart-budgeting"
  | "/recurring-bills"
  | "/financial-health"
  | "/debt-manager";

export const SIDEBAR_ROUTE_MAP: Readonly<
  Record<DashboardSidebarItemId, SidebarRoutePath>
> = {
  dashboard: "/",
  wallet: "/wallet",
  transactions: "/transactions",
  goals: "/goals",
  analytics: "/analytics",
  settings: "/settings",
  "smart-budgeting": "/smart-budgeting",
  "recurring-bills": "/recurring-bills",
  "financial-health": "/financial-health",
  "debt-manager": "/debt-manager",
};

export const SIDEBAR_ITEM_IDS: ReadonlyArray<DashboardSidebarItemId> = [
  "dashboard",
  "wallet",
  "transactions",
  "goals",
  "analytics",
  "settings",
  "smart-budgeting",
  "recurring-bills",
  "financial-health",
  "debt-manager",
];

export function getSidebarRoutePath(
  itemId: DashboardSidebarItemId,
): SidebarRoutePath {
  return SIDEBAR_ROUTE_MAP[itemId];
}

export function getSidebarItemIdByPathname(
  pathname: string,
): DashboardSidebarItemId | null {
  const normalizedPath = normalizePathname(pathname);

  for (const itemId of SIDEBAR_ITEM_IDS) {
    if (SIDEBAR_ROUTE_MAP[itemId] === normalizedPath) {
      return itemId;
    }
  }

  return null;
}

export function isSidebarRoutePath(
  pathname: string,
): pathname is SidebarRoutePath {
  return getSidebarItemIdByPathname(pathname) !== null;
}

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? "";
  const withoutHash = withoutQuery.split("#")[0] ?? "";
  const trimmed = withoutHash.trim();

  if (trimmed === "") return "/";
  if (trimmed === "/") return "/";

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}
