"use client";

import type { ReactNode } from "react";

import { ActionPill } from "../components/action-pill";
import type {
  DashboardSidebarItemId,
} from "../sections/dashboard-sidebar";
import {
  SidebarPageShell,
  type SidebarPageThemeOverrides,
} from "./sidebar-page-shell";

export type DashboardRouteLoadingScreenProps = {
  readonly activeSidebarItemId: DashboardSidebarItemId;
  readonly title: string;
  readonly subtitle?: string;
  readonly badgeLabel?: string;
  readonly loadingLabel?: string;
  readonly themeOverrides?: SidebarPageThemeOverrides;
  readonly className?: string;
  readonly contentClassName?: string;
  readonly sidebarClassName?: string;
  readonly headerActions?: ReactNode;
};

export function DashboardRouteLoadingScreen({
  activeSidebarItemId,
  title,
  subtitle,
  badgeLabel,
  loadingLabel = "Memuat halaman...",
  themeOverrides,
  className,
  contentClassName,
  sidebarClassName,
  headerActions,
}: DashboardRouteLoadingScreenProps) {
  return (
    <SidebarPageShell
      activeSidebarItemId={activeSidebarItemId}
      title={title}
      subtitle={subtitle}
      badgeLabel={badgeLabel}
      themeOverrides={themeOverrides}
      className={className}
      contentClassName={contentClassName}
      sidebarClassName={sidebarClassName}
      headerActions={headerActions ?? <DefaultHeaderActions />}
      isSectionLoading={false}
    >
      <section className="space-y-6" aria-busy aria-live="polite">
        <span className="sr-only">{loadingLabel}</span>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
        </div>

        <SkeletonCard className="h-72" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_349px]">
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
        </div>
      </section>
    </SidebarPageShell>
  );
}

function DefaultHeaderActions() {
  return (
    <>
      <ActionPill
        label="Memuat..."
        tone="outline"
        className="pointer-events-none opacity-70"
      />
      <ActionPill
        label="Mohon tunggu"
        tone="primary"
        className="pointer-events-none opacity-80"
      />
    </>
  );
}

type SkeletonCardProps = {
  readonly className?: string;
};

function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-border bg-surface p-4",
        className,
      )}
      aria-hidden
    >
      <div className="space-y-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-primary-soft" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}

function cx(...classNames: Array<string | undefined | null | false>) {
  return classNames.filter(Boolean).join(" ");
}
