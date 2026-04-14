import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import { DashboardCard } from "../components/dashboard-card";
import { whenLocale, type Locale } from "@/src/shared/i18n/locale";

type RecentTransactionsSectionProps = {
  readonly transactions: DashboardViewModel["recentTransactions"];
  readonly className?: string;
  readonly locale?: Locale;
};

const toneClassName: Record<
  DashboardViewModel["recentTransactions"][number]["tone"],
  string
> = {
  positive: "text-[var(--primary)]",
  negative: "text-[var(--blue-700)]",
  accent: "text-[var(--blue-500)]",
};

export function RecentTransactionsSection({
  transactions,
  className,
  locale = "id",
}: RecentTransactionsSectionProps) {
  const copy = whenLocale(locale, {
    en: {
      title: "Recent transactions",
      subtitle: "Latest account activity",
      empty: "No transactions available.",
    },
    id: {
      title: "Transaksi terbaru",
      subtitle: "Aktivitas akun terbaru",
      empty: "Belum ada transaksi.",
    },
  });

  return (
    <DashboardCard
      title={copy.title}
      subtitle={copy.subtitle}
      className={className}
    >
      {transactions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{copy.empty}</p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {transaction.title}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--muted)]">
                  {transaction.category} • {transaction.dateLabel}
                </p>
              </div>

              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  toneClassName[transaction.tone],
                )}
              >
                {transaction.amountLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}
