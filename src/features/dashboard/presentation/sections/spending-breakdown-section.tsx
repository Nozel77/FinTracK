"use client";

import { useState } from "react";

import { DashboardCard } from "../components/dashboard-card";
import { PaginationControls } from "../components/pagination-controls";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import { whenLocale, type Locale } from "@/src/shared/i18n/locale";

type SpendingBreakdownItem = DashboardViewModel["spendingBreakdown"][number];

type SpendingBreakdownSectionProps = {
  readonly items: ReadonlyArray<SpendingBreakdownItem>;
  readonly locale?: Locale;
};

export function SpendingBreakdownSection({
  items,
  locale = "id",
}: SpendingBreakdownSectionProps) {
  const copy = whenLocale(locale, {
    en: {
      title: "Spending breakdown",
      subtitle: "Where your money went this period",
      empty: "No spending data available.",
      spendingAria: "spending",
    },
    id: {
      title: "Rincian pengeluaran",
      subtitle: "Ke mana uang Anda digunakan pada periode ini",
      empty: "Belum ada data pengeluaran.",
      spendingAria: "pengeluaran",
    },
  });

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, page));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedItems = items.slice(startIndex, startIndex + pageSize);
  const paginationLocale = locale === "en" ? "en" : "id";

  return (
    <DashboardCard title={copy.title} subtitle={copy.subtitle}>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{copy.empty}</p>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-4">
            {pagedItems.map((item) => {
              const progress = toPercent(item.percentageLabel);
              const toneColor = item.colorHex || "var(--primary)";

              return (
                <li key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full border border-[var(--border)]"
                        style={{ backgroundColor: toneColor }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium text-[var(--foreground)]">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {item.amountLabel}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {item.percentageLabel}
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--primary-soft)]"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.category} ${copy.spendingAria}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: toneColor,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            totalItems={items.length}
            onPageChangeAction={setPage}
            locale={paginationLocale}
          />
        </div>
      )}
    </DashboardCard>
  );
}

function toPercent(input: string): number {
  const numeric = Number.parseFloat(input.replace("%", "").trim());
  if (Number.isNaN(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}
