import { DashboardCard } from "../components/dashboard-card";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";

type BalanceSummarySectionProps = {
  readonly summary: DashboardViewModel["summary"];
  readonly locale?: "en" | "id";
};

const BALANCE_SUMMARY_COPY = {
  en: {
    title: "Balance summary",
    subtitle: "Your current financial snapshot",
    totalBalance: "Total balance",
    monthlyIncome: "Monthly income",
    monthlyExpense: "Monthly expense",
    availableToSpend: "Available to spend",
  },
  id: {
    title: "Ringkasan saldo",
    subtitle: "Ringkasan kondisi keuangan Anda saat ini",
    totalBalance: "Total saldo",
    monthlyIncome: "Pemasukan bulanan",
    monthlyExpense: "Pengeluaran bulanan",
    availableToSpend: "Saldo tersedia",
  },
} as const;

export function BalanceSummarySection({
  summary,
  locale = "id",
}: BalanceSummarySectionProps) {
  const copy = BALANCE_SUMMARY_COPY[locale];

  return (
    <DashboardCard
      title={copy.title}
      subtitle={copy.subtitle}
      className="h-full"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border bg-primary-soft p-4 sm:col-span-2">
          <p className="text-xs font-medium text-muted">{copy.totalBalance}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {summary.totalBalance}
          </p>
        </article>

        <SummaryMiniCard
          label={copy.monthlyIncome}
          value={summary.monthlyIncome}
          toneClassName="text-primary"
        />
        <SummaryMiniCard
          label={copy.monthlyExpense}
          value={summary.monthlyExpense}
          toneClassName="text-accent"
        />
        <SummaryMiniCard
          label={copy.availableToSpend}
          value={summary.availableToSpend}
          toneClassName="text-foreground sm:col-span-2"
        />
      </div>
    </DashboardCard>
  );
}

type SummaryMiniCardProps = {
  readonly label: string;
  readonly value: string;
  readonly toneClassName?: string;
};

function SummaryMiniCard({
  label,
  value,
  toneClassName,
}: SummaryMiniCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface-2 p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={[
          "mt-2 text-lg font-semibold",
          toneClassName ?? "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </article>
  );
}
