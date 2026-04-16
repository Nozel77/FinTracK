"use client";

import type { ChangeEventHandler, MouseEventHandler } from "react";

import { ActionPill } from "../components/action-pill";
import { DashboardCard } from "../components/dashboard-card";
import { PaginationControls } from "../components/pagination-controls";
import { SidebarPageShell } from "./sidebar-page-shell";
import { LIGHT_BLUE_THEME } from "./light-blue-theme";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";

export type TransactionFilter = "all" | "income" | "expense";

type TransactionsScreenProps = {
  readonly viewModel: DashboardViewModel;
  readonly locale?: "en" | "id";
  readonly activeFilter?: TransactionFilter;
  readonly searchQuery?: string;
  readonly onAddTransactionAction?: MouseEventHandler<HTMLButtonElement>;
  readonly onSelectDateRangeAction?: MouseEventHandler<HTMLButtonElement>;
  readonly onFilterChangeAction?: (filter: TransactionFilter) => void;
  readonly onSearchChangeAction?: ChangeEventHandler<HTMLInputElement>;
  readonly onResetFiltersAction?: MouseEventHandler<HTMLButtonElement>;
  readonly transactionsPage?: number;
  readonly transactionsPageSize?: number;
  readonly onTransactionsPageChangeAction?: (nextPage: number) => void;
  readonly isSectionLoading?: boolean;
};

const FILTER_IDS: ReadonlyArray<TransactionFilter> = [
  "all",
  "income",
  "expense",
];

const transactionsTheme = LIGHT_BLUE_THEME;

export function TransactionsScreen({
  viewModel,
  locale = "id",
  activeFilter = "all",
  searchQuery = "",
  onAddTransactionAction,
  onSelectDateRangeAction,
  onFilterChangeAction,
  onSearchChangeAction,
  onResetFiltersAction,
  transactionsPage = 1,
  transactionsPageSize = 10,
  onTransactionsPageChangeAction,
  isSectionLoading = false,
}: TransactionsScreenProps) {
  const filteredTransactions = viewModel.recentTransactions.filter(
    (transaction) => {
      const filterMatch =
        activeFilter === "all" ||
        (activeFilter === "income" && transaction.tone === "positive") ||
        (activeFilter === "expense" && transaction.tone === "negative");

      const search = searchQuery.trim().toLowerCase();
      if (!search) return filterMatch;

      const content =
        `${transaction.title} ${transaction.category} ${transaction.dateLabel}`.toLowerCase();

      return filterMatch && content.includes(search);
    },
  );

  const safePageSize = Math.max(1, Math.floor(transactionsPageSize));
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / safePageSize),
  );
  const currentPage = clamp(Math.floor(transactionsPage), 1, totalPages);
  const pageStart = (currentPage - 1) * safePageSize;
  const pagedTransactions = filteredTransactions.slice(
    pageStart,
    pageStart + safePageSize,
  );

  const copy = getTransactionsCopy(locale);
  const filters: ReadonlyArray<{ id: TransactionFilter; label: string }> =
    FILTER_IDS.map((id) => ({
      id,
      label: copy.filterLabels[id],
    }));

  const hasActiveFilters =
    activeFilter !== "all" || searchQuery.trim().length > 0;

  return (
    <SidebarPageShell
      activeSidebarItemId="transactions"
      title={copy.title}
      subtitle={copy.subtitle}
      badgeLabel={copy.badgeLabel}
      isSectionLoading={isSectionLoading}
      loadingLabel={
        locale === "id" ? "Memuat transaksi..." : "Loading transactions..."
      }
      themeOverrides={transactionsTheme}
      headerActions={
        <>
          <ActionPill
            label={viewModel.heading.dateRangeLabel}
            icon={<CalendarIcon />}
            tone="outline"
            onClick={onSelectDateRangeAction}
          />
          <ActionPill
            label={copy.addTransaction}
            icon={<PlusIcon />}
            tone="primary"
            onClick={onAddTransactionAction}
          />
        </>
      }
    >
      <div className="space-y-6">
        <DashboardCard
          title={copy.filtersTitle}
          subtitle={copy.filtersSubtitle}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const isActive = filter.id === activeFilter;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => onFilterChangeAction?.(filter.id)}
                      className={cn(
                        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-foreground hover:bg-surface-2",
                      )}
                      aria-pressed={isActive}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onResetFiltersAction}
                disabled={!hasActiveFilters || !onResetFiltersAction}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                  hasActiveFilters && onResetFiltersAction
                    ? "border-border bg-surface text-foreground hover:bg-surface-2"
                    : "cursor-not-allowed border-border/70 bg-surface-2 text-muted",
                )}
              >
                {copy.resetFilters}
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-muted">
                {copy.searchActivity}
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={onSearchChangeAction}
                readOnly={!onSearchChangeAction}
                placeholder={copy.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted focus-visible:ring-2 focus-visible:ring-(--primary)/35"
              />
            </label>
          </div>
        </DashboardCard>

        <DashboardCard
          title={copy.activityLog}
          subtitle={`${filteredTransactions.length} ${
            filteredTransactions.length === 1
              ? copy.transactionSingular
              : copy.transactionPlural
          } ${copy.foundSuffix}`}
        >
          {filteredTransactions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted">
              {copy.noTransactionsMatch}
            </p>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-3">
                {pagedTransactions.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {transaction.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {transaction.category} • {transaction.dateLabel}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                          toneBadgeClassName[transaction.tone],
                        )}
                      >
                        {transactionToneToLabel(transaction.tone, locale)}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          toneAmountClassName[transaction.tone],
                        )}
                      >
                        {transaction.amountLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <PaginationControls
                page={currentPage}
                pageSize={safePageSize}
                totalItems={filteredTransactions.length}
                onPageChangeAction={onTransactionsPageChangeAction}
                locale={locale}
              />
            </div>
          )}
        </DashboardCard>
      </div>
    </SidebarPageShell>
  );
}

function transactionToneToLabel(
  tone: DashboardViewModel["recentTransactions"][number]["tone"],
  locale: "en" | "id" = "en",
): string {
  if (locale === "id") {
    if (tone === "positive") return "Pemasukan";
    if (tone === "negative") return "Pengeluaran";
    return "Transfer";
  }

  if (tone === "positive") return "Income";
  if (tone === "negative") return "Expense";
  return "Transfer";
}

const toneAmountClassName: Record<
  DashboardViewModel["recentTransactions"][number]["tone"],
  string
> = {
  positive: "text-success",
  negative: "text-danger",
  accent: "text-accent",
};

const toneBadgeClassName: Record<
  DashboardViewModel["recentTransactions"][number]["tone"],
  string
> = {
  positive: "border-success/30 bg-success/10 text-success",
  negative: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/30 bg-accent/10 text-accent",
};

function PlusIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
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
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
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

function getTransactionsCopy(locale: "en" | "id") {
  if (locale === "id") {
    return {
      title: "Transaksi",
      subtitle:
        "Fokus pada aktivitas yang bisa ditindaklanjuti, bukan metrik kosmetik.",
      badgeLabel: "Operasional",
      addTransaction: "Tambah transaksi",
      filtersTitle: "Filter",
      filtersSubtitle:
        "Saring aktivitas penting dan hapus filter dengan cepat.",
      resetFilters: "Reset filter",
      searchActivity: "Cari aktivitas",
      searchPlaceholder: "Cari berdasarkan judul, kategori, atau tanggal",
      activityLog: "Log aktivitas",
      transactionSingular: "transaksi",
      transactionPlural: "transaksi",
      foundSuffix: "ditemukan",
      noTransactionsMatch: "Tidak ada transaksi yang sesuai dengan filter.",
      filterLabels: {
        all: "Semua aktivitas",
        income: "Pemasukan",
        expense: "Pengeluaran",
      } as Record<TransactionFilter, string>,
    };
  }

  return {
    title: "Transactions",
    subtitle: "Focus on actionable activity, not vanity counters.",
    badgeLabel: "Operations",
    addTransaction: "Add transaction",
    filtersTitle: "Filters",
    filtersSubtitle: "Refine meaningful activity and clear filters quickly.",
    resetFilters: "Reset filters",
    searchActivity: "Search activity",
    searchPlaceholder: "Search by title, category, or date",
    activityLog: "Activity log",
    transactionSingular: "transaction",
    transactionPlural: "transactions",
    foundSuffix: "found",
    noTransactionsMatch: "No transactions match the selected filters.",
    filterLabels: {
      all: "All activity",
      income: "Income",
      expense: "Expenses",
    } as Record<TransactionFilter, string>,
  };
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
