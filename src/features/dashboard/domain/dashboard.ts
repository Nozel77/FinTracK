export type CurrencyCode = "IDR";

export type ISODateString = string;

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface DateRange {
  readonly from: ISODateString;
  readonly to: ISODateString;
}

export type TransactionDirection = "income" | "expense" | "transfer";

export interface Transaction {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly direction: TransactionDirection;
  readonly amount: Money;
  readonly occurredAt: ISODateString;
}

export interface BalanceSummary {
  readonly totalBalance: Money;
  readonly monthlyIncome: Money;
  readonly monthlyExpense: Money;
  readonly availableToSpend: Money;
}

export interface SpendingCategoryBreakdown {
  readonly category: string;
  readonly amount: Money;
  readonly percentage: number; // 0-100
  readonly colorHex: string;
}

export interface WeeklyTrendPoint {
  readonly label: string; // e.g. Mon, Tue
  readonly income: Money;
  readonly expense: Money;
}

export interface FinancialGoal {
  readonly id: string;
  readonly name: string;
  readonly deadline: ISODateString;
  readonly saved: Money;
  readonly target: Money;
}

export interface DailyTransactionLimit {
  readonly used: Money;
  readonly limit: Money;
}

export interface ActionShortcut {
  readonly id: "deposit" | "transfer";
  readonly label: string;
  readonly isPrimary: boolean;
}

export interface DashboardSnapshot {
  readonly range: DateRange;
  readonly balance: BalanceSummary;
  readonly shortcuts: ReadonlyArray<ActionShortcut>;
  readonly weeklyTrend: ReadonlyArray<WeeklyTrendPoint>;
  readonly spendingBreakdown: ReadonlyArray<SpendingCategoryBreakdown>;
  readonly goals: ReadonlyArray<FinancialGoal>;
  readonly recentTransactions: ReadonlyArray<Transaction>;
  readonly dailyTransactionLimit: DailyTransactionLimit;
}

export interface DashboardRepository {
  getSnapshot(range: DateRange): Promise<DashboardSnapshot>;
}
