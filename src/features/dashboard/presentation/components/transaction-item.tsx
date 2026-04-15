import type { Transaction } from "../../domain/dashboard";

type TransactionItemProps = {
  transaction: Transaction;
};

const toneClassName: Record<Transaction["direction"], string> = {
  income: "text-[var(--primary)]",
  expense: "text-[var(--blue-700)]",
  transfer: "text-[var(--blue-500)]",
};

export function TransactionItem({ transaction }: TransactionItemProps) {
  const sign = transaction.direction === "expense" ? "-" : "+";
  const amountText = `${sign}${formatMoney(
    transaction.amount.amount,
    transaction.amount.currency,
  )}`;

  return (
    <li className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {transaction.title}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {transaction.category} • {formatDate(transaction.occurredAt)}
        </p>
      </div>

      <span
        className={[
          "text-sm font-semibold",
          toneClassName[transaction.direction],
        ].join(" ")}
      >
        {amountText}
      </span>
    </li>
  );
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
