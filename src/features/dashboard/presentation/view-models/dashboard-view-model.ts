import type {
  DashboardSnapshot,
  FinancialGoal,
  Money,
  Transaction,
  TransactionDirection,
  WeeklyTrendPoint,
} from "../../domain/dashboard";

export type DashboardViewModel = {
  readonly heading: {
    readonly title: string;
    readonly subtitle: string;
    readonly dateRangeLabel: string;
  };
  readonly summary: {
    readonly totalBalance: string;
    readonly monthlyIncome: string;
    readonly monthlyExpense: string;
    readonly availableToSpend: string;
  };
  readonly shortcuts: ReadonlyArray<{
    readonly id: "deposit" | "transfer";
    readonly label: string;
    readonly tone: "outline" | "primary";
  }>;
  readonly weeklyTrend: {
    readonly maxValue: number;
    readonly items: ReadonlyArray<{
      readonly label: string;
      readonly incomeLabel: string;
      readonly expenseLabel: string;
      readonly incomeHeightPct: number;
      readonly expenseHeightPct: number;
    }>;
  };
  readonly spendingBreakdown: ReadonlyArray<{
    readonly category: string;
    readonly amountLabel: string;
    readonly percentageLabel: string;
    readonly colorHex: string;
  }>;
  readonly goals: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly deadlineISO: string;
    readonly deadlineLabel: string;
    readonly savedAmount: number;
    readonly savedLabel: string;
    readonly targetAmount: number;
    readonly targetLabel: string;
    readonly progressPct: number;
  }>;
  readonly recentTransactions: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly category: string;
    readonly dateLabel: string;
    readonly amountLabel: string;
    readonly tone: "positive" | "negative" | "accent";
  }>;
  readonly dailyLimit: {
    readonly usedLabel: string;
    readonly limitLabel: string;
    readonly remainingLabel: string;
    readonly progressPct: number;
  };
};

export function toDashboardViewModel(
  snapshot: DashboardSnapshot,
): DashboardViewModel {
  const maxTrendValue = getMaxTrendValue(snapshot.weeklyTrend);

  return {
    heading: {
      title: "Dashboard",
      subtitle: "Manage your payments and transactions in one click",
      dateRangeLabel: formatDateRange(snapshot.range.from, snapshot.range.to),
    },
    summary: {
      totalBalance: formatMoney(snapshot.balance.totalBalance),
      monthlyIncome: formatMoney(snapshot.balance.monthlyIncome),
      monthlyExpense: formatMoney(snapshot.balance.monthlyExpense),
      availableToSpend: formatMoney(snapshot.balance.availableToSpend),
    },
    shortcuts: snapshot.shortcuts.map((shortcut) => ({
      id: shortcut.id,
      label: shortcut.label,
      tone: shortcut.isPrimary ? "primary" : "outline",
    })),
    weeklyTrend: {
      maxValue: maxTrendValue,
      items: snapshot.weeklyTrend.map((point) =>
        mapTrendPointToViewModel(point, maxTrendValue),
      ),
    },
    spendingBreakdown: snapshot.spendingBreakdown.map((item) => ({
      category: item.category,
      amountLabel: formatMoney(item.amount),
      percentageLabel: `${Math.round(item.percentage)}%`,
      colorHex: item.colorHex,
    })),
    goals: snapshot.goals.map(mapGoalToViewModel),
    recentTransactions: snapshot.recentTransactions.map(
      mapTransactionToViewModel,
    ),
    dailyLimit: mapDailyLimitToViewModel(
      snapshot.dailyTransactionLimit.used,
      snapshot.dailyTransactionLimit.limit,
    ),
  };
}

function mapTrendPointToViewModel(point: WeeklyTrendPoint, max: number) {
  const incomeValue = Math.max(0, point.income.amount);
  const expenseValue = Math.max(0, point.expense.amount);

  return {
    label: point.label,
    incomeLabel: formatMoney(point.income),
    expenseLabel: formatMoney(point.expense),
    incomeHeightPct: toPct(incomeValue, max),
    expenseHeightPct: toPct(expenseValue, max),
  };
}

function mapGoalToViewModel(goal: FinancialGoal) {
  const progress = calculateProgress(goal.saved.amount, goal.target.amount);

  return {
    id: goal.id,
    name: goal.name,
    deadlineISO: goal.deadline,
    deadlineLabel: formatLongDate(goal.deadline),
    savedAmount: goal.saved.amount,
    savedLabel: formatMoney(goal.saved),
    targetAmount: goal.target.amount,
    targetLabel: formatMoney(goal.target),
    progressPct: progress,
  };
}

function mapTransactionToViewModel(transaction: Transaction) {
  const amountLabel = formatTransactionAmount(
    transaction.amount,
    transaction.direction,
  );

  return {
    id: transaction.id,
    title: transaction.title,
    category: transaction.category,
    dateLabel: formatDateTime(transaction.occurredAt),
    amountLabel,
    tone: transactionDirectionToTone(transaction.direction),
  };
}

function mapDailyLimitToViewModel(used: Money, limit: Money) {
  const remaining = Math.max(limit.amount - used.amount, 0);

  return {
    usedLabel: formatMoney(used),
    limitLabel: formatMoney(limit),
    remainingLabel: formatMoney({ amount: remaining, currency: used.currency }),
    progressPct: calculateProgress(used.amount, limit.amount),
  };
}

function getMaxTrendValue(points: ReadonlyArray<WeeklyTrendPoint>): number {
  const values: number[] = [];

  for (const point of points) {
    values.push(
      Math.max(0, point.income.amount),
      Math.max(0, point.expense.amount),
    );
  }

  return Math.max(1, ...values);
}

function calculateProgress(value: number, target: number): number {
  if (target <= 0) return 0;
  return clamp((value / target) * 100, 0, 100);
}

function toPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return clamp((value / max) * 100, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function transactionDirectionToTone(
  direction: TransactionDirection,
): "positive" | "negative" | "accent" {
  if (direction === "income") return "positive";
  if (direction === "expense") return "negative";
  return "accent";
}

function formatTransactionAmount(
  money: Money,
  direction: TransactionDirection,
): string {
  const sign = direction === "expense" ? "-" : "+";
  return `${sign}${formatMoney(money)}`;
}

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(money.amount);
}

export function formatDateRange(fromISO: string, toISO: string): string {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return `${fromISO} - ${toISO}`;
  }

  const fromText = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "2-digit",
  }).format(from);

  const toText = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "2-digit",
  }).format(to);

  return `${fromText} - ${toText}`;
}

export function formatLongDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }

  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
