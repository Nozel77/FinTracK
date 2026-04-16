import type { MouseEventHandler } from "react";

import { ActionPill } from "../components/action-pill";
import { DashboardCard } from "../components/dashboard-card";
import { SidebarPageShell } from "./sidebar-page-shell";
import { LIGHT_BLUE_THEME } from "./light-blue-theme";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";

type WalletLocale = "en" | "id";

export type WalletScreenProps = {
  readonly viewModel: DashboardViewModel;
  readonly locale?: WalletLocale;
  readonly onAddFunds?: MouseEventHandler<HTMLButtonElement>;
  readonly onSelectDateRange?: MouseEventHandler<HTMLButtonElement>;
  readonly isSectionLoading?: boolean;
  readonly loadingLabel?: string;
};

const walletTheme = LIGHT_BLUE_THEME;

const WALLET_COPY: Record<
  WalletLocale,
  {
    readonly title: string;
    readonly subtitle: string;
    readonly badgeLabel: string;
    readonly addFunds: string;
    readonly walletBalanceTitle: string;
    readonly walletBalanceSubtitle: string;
    readonly totalWalletBalance: string;
    readonly walletAllocationTitle: string;
    readonly walletAllocationSubtitle: string;
    readonly walletHealthTitle: string;
    readonly walletHealthSubtitle: string;
    readonly savingsRate: string;
    readonly budgetUsage: string;
    readonly largestAllocation: string;
    readonly noAllocationData: string;
    readonly smartActionsTitle: string;
    readonly smartActionsSubtitle: string;
    readonly highBudgetUsage: string;
    readonly healthyBudgetUsage: string;
    readonly increaseSavings: string;
    readonly strongSavings: string;
    readonly monthlyReview: string;
  }
> = {
  en: {
    title: "Wallet",
    subtitle: "Manage your cards, accounts, and available balance",
    badgeLabel: "Accounts & cards",
    addFunds: "Add funds",
    walletBalanceTitle: "Wallet balance",
    walletBalanceSubtitle: "Available funds across your linked accounts",
    totalWalletBalance: "Total wallet balance",
    walletAllocationTitle: "Wallet allocation",
    walletAllocationSubtitle: "Category usage from your connected wallet",
    walletHealthTitle: "Wallet health",
    walletHealthSubtitle: "Cashflow and allocation quality for this period",
    savingsRate: "Savings rate",
    budgetUsage: "Budget usage",
    largestAllocation: "Largest allocation",
    noAllocationData: "No allocation data",
    smartActionsTitle: "Smart wallet actions",
    smartActionsSubtitle: "Practical steps to improve balance stability",
    highBudgetUsage:
      "Your budget usage is high. Consider lowering discretionary spend this week.",
    healthyBudgetUsage:
      "Your budget usage is in a healthy range. Keep current spending discipline.",
    increaseSavings:
      "Increase your automated monthly transfer to build a stronger safety buffer.",
    strongSavings:
      "Great savings momentum. Redirect part of surplus to medium-term goals.",
    monthlyReview:
      "Review wallet allocation monthly and rebalance top categories to avoid concentration risk.",
  },
  id: {
    title: "Dompet",
    subtitle: "Kelola kartu, akun, dan saldo tersedia Anda",
    badgeLabel: "Akun & kartu",
    addFunds: "Tambah dana",
    walletBalanceTitle: "Saldo dompet",
    walletBalanceSubtitle: "Dana tersedia di seluruh akun terhubung Anda",
    totalWalletBalance: "Total saldo dompet",
    walletAllocationTitle: "Alokasi dompet",
    walletAllocationSubtitle: "Penggunaan kategori dari dompet terhubung Anda",
    walletHealthTitle: "Kesehatan dompet",
    walletHealthSubtitle: "Kualitas arus kas dan alokasi untuk periode ini",
    savingsRate: "Rasio tabungan",
    budgetUsage: "Penggunaan anggaran",
    largestAllocation: "Alokasi terbesar",
    noAllocationData: "Tidak ada data alokasi",
    smartActionsTitle: "Aksi dompet cerdas",
    smartActionsSubtitle: "Langkah praktis untuk menjaga stabilitas saldo",
    highBudgetUsage:
      "Penggunaan anggaran Anda tinggi. Pertimbangkan mengurangi pengeluaran diskresioner minggu ini.",
    healthyBudgetUsage:
      "Penggunaan anggaran Anda berada pada rentang sehat. Pertahankan disiplin pengeluaran saat ini.",
    increaseSavings:
      "Tingkatkan transfer bulanan otomatis Anda untuk membangun buffer keamanan yang lebih kuat.",
    strongSavings:
      "Momentum tabungan sangat baik. Arahkan sebagian surplus ke tujuan jangka menengah.",
    monthlyReview:
      "Tinjau alokasi dompet setiap bulan dan seimbangkan kembali kategori utama untuk menghindari risiko konsentrasi.",
  },
};

export function WalletScreen({
  viewModel,
  locale = "id",
  onAddFunds,
  onSelectDateRange,
  isSectionLoading = false,
  loadingLabel = "Memuat konten dompet...",
}: WalletScreenProps) {
  const copy = WALLET_COPY[locale];
  const topAllocation = viewModel.spendingBreakdown[0];
  const savingsRatePct = calculateSavingsRate(
    viewModel.summary.monthlyIncome,
    viewModel.summary.monthlyExpense,
  );
  const budgetUsagePct = calculateBudgetUsage(
    viewModel.summary.monthlyIncome,
    viewModel.summary.monthlyExpense,
  );

  return (
    <SidebarPageShell
      activeSidebarItemId="wallet"
      title={copy.title}
      subtitle={copy.subtitle}
      badgeLabel={copy.badgeLabel}
      isSectionLoading={isSectionLoading}
      loadingLabel={loadingLabel}
      themeOverrides={walletTheme}
      headerActions={
        <>
          <ActionPill
            label={copy.addFunds}
            icon={<PlusIcon />}
            tone="outline"
            onClick={onAddFunds}
          />
          <ActionPill
            label={viewModel.heading.dateRangeLabel}
            icon={<CalendarIcon />}
            tone="primary"
            onClick={onSelectDateRange}
          />
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_349px]">
        <div className="min-w-0 space-y-6">
          <DashboardCard
            title={copy.walletBalanceTitle}
            subtitle={copy.walletBalanceSubtitle}
          >
            <div className="space-y-4">
              <article className="rounded-2xl border border-border bg-primary-soft p-4">
                <p className="text-xs font-medium text-muted">
                  {copy.totalWalletBalance}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {viewModel.summary.totalBalance}
                </p>
              </article>

              <div className="grid gap-3">
                <ActionPill
                  label={copy.addFunds}
                  icon={<PlusIcon />}
                  tone="outline"
                  fullWidth
                  onClick={onAddFunds}
                />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title={copy.walletAllocationTitle}
            subtitle={copy.walletAllocationSubtitle}
          >
            <ul className="space-y-4">
              {viewModel.spendingBreakdown.map((item) => (
                <li key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {item.category}
                    </span>
                    <span className="text-xs text-muted">
                      {item.amountLabel} • {item.percentageLabel}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${toPercent(item.percentageLabel)}%`,
                        backgroundColor: item.colorHex || "var(--primary)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>

        <aside className="min-w-0 space-y-6">
          <DashboardCard
            title={copy.walletHealthTitle}
            subtitle={copy.walletHealthSubtitle}
          >
            <ul className="space-y-3">
              <li className="rounded-2xl border border-border bg-surface-2 p-3">
                <p className="text-xs text-muted">{copy.savingsRate}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {savingsRatePct}%
                </p>
              </li>
              <li className="rounded-2xl border border-border bg-surface-2 p-3">
                <p className="text-xs text-muted">{copy.budgetUsage}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {budgetUsagePct}%
                </p>
              </li>
              <li className="rounded-2xl border border-border bg-surface-2 p-3">
                <p className="text-xs text-muted">{copy.largestAllocation}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {topAllocation
                    ? `${topAllocation.category} • ${topAllocation.percentageLabel}`
                    : copy.noAllocationData}
                </p>
              </li>
            </ul>
          </DashboardCard>

          <DashboardCard
            title={copy.smartActionsTitle}
            subtitle={copy.smartActionsSubtitle}
          >
            <ul className="space-y-2 text-sm text-foreground">
              <li className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                {budgetUsagePct >= 85
                  ? copy.highBudgetUsage
                  : copy.healthyBudgetUsage}
              </li>
              <li className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                {savingsRatePct < 20
                  ? copy.increaseSavings
                  : copy.strongSavings}
              </li>
              <li className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                {copy.monthlyReview}
              </li>
            </ul>
          </DashboardCard>
        </aside>
      </section>
    </SidebarPageShell>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
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

function toPercent(input: string): number {
  const numeric = Number.parseFloat(input.replace("%", "").trim());
  if (Number.isNaN(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

function calculateSavingsRate(
  monthlyIncomeLabel: string,
  monthlyExpenseLabel: string,
): number {
  const income = parseCurrencyLabel(monthlyIncomeLabel);
  const expense = parseCurrencyLabel(monthlyExpenseLabel);
  if (income <= 0) return 0;

  const saved = Math.max(income - expense, 0);
  return Math.round((saved / income) * 100);
}

function calculateBudgetUsage(
  monthlyIncomeLabel: string,
  monthlyExpenseLabel: string,
): number {
  const income = parseCurrencyLabel(monthlyIncomeLabel);
  const expense = parseCurrencyLabel(monthlyExpenseLabel);
  if (income <= 0) return 0;

  return Math.round(Math.min(100, Math.max(0, (expense / income) * 100)));
}

function parseCurrencyLabel(label: string): number {
  const numeric = Number.parseFloat(label.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}
