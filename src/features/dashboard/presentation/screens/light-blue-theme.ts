import type { SidebarPageThemeOverrides } from "./sidebar-page-shell";

/**
 * Shared blue-white light theme preset for dashboard pages.
 * Keep this aligned with the global light palette in `app/globals.css`.
 */
export const LIGHT_BLUE_THEME: SidebarPageThemeOverrides = {
  background: "#f8fbff",
  foreground: "#0f172a",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  border: "#dbe7f5",
  muted: "#64748b",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primarySoft: "#dbeafe",
  accent: "#3b82f6",
  success: "#16a34a",
  danger: "#ef4444",
};
