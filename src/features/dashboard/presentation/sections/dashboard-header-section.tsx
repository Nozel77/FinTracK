"use client";

import type { MouseEventHandler } from "react";

type DashboardHeaderSectionProps = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly addWidgetLabel?: string;
  readonly locale?: HeaderLocale;
  readonly dateRangeLabel: string;
  readonly onAddWidgetAction?: MouseEventHandler<HTMLButtonElement>;
  readonly onSelectDateRangeAction?: MouseEventHandler<HTMLButtonElement>;
  readonly className?: string;
};

type HeaderLocale = "en" | "id";

const HEADER_COPY: Record<
  HeaderLocale,
  {
    readonly title: string;
    readonly subtitle: string;
    readonly addWidget: string;
  }
> = {
  en: {
    title: "Dasbor",
    subtitle: "Kelola pembayaran dan transaksi Anda dalam satu klik",
    addWidget: "Tambah widget",
  },
  id: {
    title: "Dasbor",
    subtitle: "Kelola pembayaran dan transaksi Anda dalam satu klik",
    addWidget: "Tambah widget",
  },
} as const;

export function DashboardHeaderSection({
  title,
  subtitle,
  addWidgetLabel,
  locale: explicitLocale,
  dateRangeLabel,
  onAddWidgetAction,
  onSelectDateRangeAction,
  className,
}: DashboardHeaderSectionProps) {
  const locale: HeaderLocale = explicitLocale ?? "id";
  const copy = HEADER_COPY[locale];
  const resolvedTitle = title ?? copy.title;
  const resolvedSubtitle = subtitle ?? copy.subtitle;
  const resolvedAddWidgetLabel = addWidgetLabel ?? copy.addWidget;

  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold leading-[1.366] text-foreground sm:text-[26px]">
          {resolvedTitle}
        </h1>
        <p className="mt-2 truncate text-sm font-medium leading-[1.366] text-muted sm:text-base">
          {resolvedSubtitle}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:flex-nowrap">
        {onAddWidgetAction ? (
          <button
            type="button"
            onClick={onAddWidgetAction}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium leading-[1.366] text-foreground transition-colors hover:bg-surface-2 active:bg-primary-soft sm:flex-none"
          >
            <PlusIcon />
            <span>{resolvedAddWidgetLabel}</span>
          </button>
        ) : (
          <a
            href="/goals"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium leading-[1.366] text-foreground transition-colors hover:bg-surface-2 active:bg-primary-soft sm:flex-none"
          >
            <PlusIcon />
            <span>{resolvedAddWidgetLabel}</span>
          </a>
        )}

        <button
          type="button"
          onClick={onSelectDateRangeAction}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-primary bg-primary px-4 text-sm font-medium leading-[1.366] text-white transition-colors hover:bg-primary-hover active:bg-(--blue-800) sm:flex-none"
        >
          <CalendarIcon />
          <span>{dateRangeLabel}</span>
        </button>
      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 4.16675V15.8334M4.16669 10H15.8334"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="3.33337"
        y="4.16675"
        width="13.3333"
        height="12.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.66669 2.91675V5.41675M13.3334 2.91675V5.41675M3.33337 7.91675H16.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
