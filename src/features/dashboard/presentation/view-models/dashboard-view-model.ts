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
    readonly incomeMaxValue: number;
    readonly expenseMaxValue: number;
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
  readonly financialHealth: {
    readonly status: "Sehat" | "Waspada" | "Bahaya";
    readonly statusLabel: string;
    readonly debtToIncomeRatioLabel: string;
    readonly emergencyFundRatioLabel: string;
    readonly monthlyDebtInstallmentLabel: string;
    readonly emergencyFundBalanceLabel: string;
    readonly monthlyIncomeLabel: string;
    readonly monthlyExpenseLabel: string;
    readonly debtToIncomeHealthy: boolean;
    readonly emergencyFundHealthy: boolean;
  };
};

export function toDashboardViewModel(
  snapshot: DashboardSnapshot,
): DashboardViewModel {
  const incomeMaxTrendValue = getMaxIncomeTrendValue(snapshot.weeklyTrend);
  const expenseMaxTrendValue = getMaxExpenseTrendValue(snapshot.weeklyTrend);

  return {
    heading: {
      title: "Dasbor",
      subtitle: "Kelola pembayaran dan transaksi Anda dalam satu klik",
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
      incomeMaxValue: incomeMaxTrendValue,
      expenseMaxValue: expenseMaxTrendValue,
      items: snapshot.weeklyTrend.map((point) =>
        mapTrendPointToViewModel(
          point,
          incomeMaxTrendValue,
          expenseMaxTrendValue,
        ),
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
    financialHealth: mapFinancialHealthToViewModel(snapshot),
  };
}

function mapTrendPointToViewModel(
  point: WeeklyTrendPoint,
  incomeMax: number,
  expenseMax: number,
) {
  const incomeValue = Math.max(0, point.income.amount);
  const expenseValue = Math.max(0, point.expense.amount);

  return {
    label: point.label,
    incomeLabel: formatMoney(point.income),
    expenseLabel: formatMoney(point.expense),
    incomeHeightPct: toPct(incomeValue, incomeMax),
    expenseHeightPct: toPct(expenseValue, expenseMax),
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

function mapFinancialHealthToViewModel(snapshot: DashboardSnapshot) {
  const primaryCurrency = snapshot.balance.monthlyIncome.currency;
  const fallbackInput = {
    monthlyIncome: snapshot.balance.monthlyIncome,
    monthlyExpense: snapshot.balance.monthlyExpense,
    monthlyDebtInstallment: { amount: 0, currency: primaryCurrency },
    emergencyFundBalance: { amount: 0, currency: primaryCurrency },
  };

  const input = snapshot.financialHealth?.input ?? fallbackInput;

  const derivedDebtToIncome =
    input.monthlyIncome.amount > 0
      ? (input.monthlyDebtInstallment.amount / input.monthlyIncome.amount) * 100
      : input.monthlyDebtInstallment.amount > 0
        ? Number.POSITIVE_INFINITY
        : 0;

  const derivedEmergencyFundMonths =
    input.monthlyExpense.amount > 0
      ? input.emergencyFundBalance.amount / input.monthlyExpense.amount
      : input.emergencyFundBalance.amount > 0
        ? Number.POSITIVE_INFINITY
        : 0;

  const debtToIncomeRatioPct =
    snapshot.financialHealth?.ratios.debtToIncomeRatioPct ??
    derivedDebtToIncome;
  const emergencyFundRatioMonths =
    snapshot.financialHealth?.ratios.emergencyFundRatioMonths ??
    derivedEmergencyFundMonths;

  const debtToIncomeHealthy =
    snapshot.financialHealth?.evaluation.debtToIncomeHealthy ??
    debtToIncomeRatioPct <= 35;
  const emergencyFundHealthy =
    snapshot.financialHealth?.evaluation.emergencyFundHealthy ??
    emergencyFundRatioMonths >= 3;

  const status =
    snapshot.financialHealth?.status ??
    (debtToIncomeHealthy && emergencyFundHealthy
      ? "Sehat"
      : !debtToIncomeHealthy && !emergencyFundHealthy
        ? "Bahaya"
        : "Waspada");

  return {
    status,
    statusLabel: status,
    debtToIncomeRatioLabel: formatRatioValue(debtToIncomeRatioPct, "%"),
    emergencyFundRatioLabel: formatRatioValue(emergencyFundRatioMonths, "x"),
    monthlyDebtInstallmentLabel: formatMoney(input.monthlyDebtInstallment),
    emergencyFundBalanceLabel: formatMoney(input.emergencyFundBalance),
    monthlyIncomeLabel: formatMoney(input.monthlyIncome),
    monthlyExpenseLabel: formatMoney(input.monthlyExpense),
    debtToIncomeHealthy,
    emergencyFundHealthy,
  };
}

function getMaxIncomeTrendValue(
  points: ReadonlyArray<WeeklyTrendPoint>,
): number {
  const values = points.map((point) => Math.max(0, point.income.amount));
  return Math.max(1, ...values);
}

function getMaxExpenseTrendValue(
  points: ReadonlyArray<WeeklyTrendPoint>,
): number {
  const values = points.map((point) => Math.max(0, point.expense.amount));
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

function formatRatioValue(value: number, suffix: "%" | "x"): string {
  if (!Number.isFinite(value)) {
    return suffix === "%" ? "∞%" : "∞x";
  }

  const rounded = Math.round(value * 100) / 100;
  return suffix === "%" ? `${rounded}%` : `${rounded}x`;
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

const JAKARTA_TIMEZONE = "Asia/Jakarta";

function parseISODateInJakarta(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;

  const date = new Date(`${isoDate}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function formatDateRange(fromISO: string, toISO: string): string {
  const from = parseISODateInJakarta(fromISO);
  const to = parseISODateInJakarta(toISO);

  if (!from || !to) {
    return `${fromISO} - ${toISO}`;
  }

  const fromText = new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIMEZONE,
    month: "short",
    day: "2-digit",
  }).format(from);

  const toText = new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIMEZONE,
    month: "short",
    day: "2-digit",
  }).format(to);

  return `${fromText} - ${toText}`;
}

export function formatLongDate(isoDate: string): string {
  const date = parseISODateInJakarta(isoDate);

  if (!date) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIMEZONE,
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
    timeZone: JAKARTA_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
