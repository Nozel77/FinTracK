import type {
  ActionShortcut,
  DailyTransactionLimit,
  DashboardRepository,
  DashboardSnapshot,
  DateRange,
  FinancialGoal,
  Money,
  SpendingCategoryBreakdown,
  Transaction,
  TransactionDirection,
  WeeklyTrendPoint,
} from "@/src/features/dashboard/domain/dashboard";
import { calculateFinancialHealth } from "@/src/features/dashboard/domain/financial-health";
import type { Tables } from "@/src/shared/supabase/database.types";
import {
  createSupabaseServerClient,
  type TypedSupabaseServerClient,
} from "@/src/shared/supabase/server-client";

import { resolveDashboardUserId } from "./dashboard-user";

type ShortcutRow = Tables<"action_shortcuts">;
type WeeklyTrendRow = Tables<"weekly_trend_points">;
type SpendingBreakdownRow = Tables<"spending_breakdown_items">;
type FinancialGoalRow = Tables<"financial_goals">;
type TransactionRow = Tables<"transactions">;
type UserSettingsRow = Tables<"user_settings">;

type SupabaseDashboardRepositoryOptions = {
  readonly userId?: string;
  readonly createClient?: () => Promise<TypedSupabaseServerClient>;
};

const DEFAULT_CURRENCY = "IDR" as const;
const DEFAULT_DAILY_TRANSACTION_LIMIT = 10_000_000;

export class SupabaseDashboardRepository implements DashboardRepository {
  private readonly userId?: string;
  private readonly createClient: () => Promise<TypedSupabaseServerClient>;

  constructor(options: SupabaseDashboardRepositoryOptions = {}) {
    this.userId = options.userId;
    this.createClient = options.createClient ?? createSupabaseServerClient;
  }

  async getSnapshot(range: DateRange): Promise<DashboardSnapshot> {
    const client = await this.createClient();
    const userId = resolveDashboardUserId({ requestedUserId: this.userId });

    const transactions = await this.fetchTransactions(client, userId, range);

    const [
      balanceSummary,
      shortcuts,
      weeklyTrend,
      spendingBreakdown,
      goals,
      dailyLimit,
      financialHealthInputSettings,
    ] = await Promise.all([
      this.fetchBalanceSummary(client, userId, range, transactions),
      this.fetchShortcuts(client, userId),
      this.fetchWeeklyTrend(client, userId, range, transactions),
      this.fetchSpendingBreakdown(client, userId, range, transactions),
      this.fetchGoals(client, userId),
      this.fetchDailyLimit(client, userId, range, transactions),
      this.fetchFinancialHealthInputSettings(client, userId),
    ]);

    const financialHealth = buildFinancialHealthSnapshot(
      balanceSummary,
      transactions,
      goals,
      financialHealthInputSettings,
    );

    return {
      range,
      balance: balanceSummary,
      shortcuts,
      weeklyTrend,
      spendingBreakdown,
      goals,
      recentTransactions: transactions.slice(0, 10),
      dailyTransactionLimit: dailyLimit,
      financialHealth,
    };
  }

  private async fetchBalanceSummary(
    client: TypedSupabaseServerClient,
    userId: string,
    range: DateRange,
    transactions: ReadonlyArray<Transaction>,
  ) {
    const { data, error } = await client
      .from("balance_summaries")
      .select("*")
      .eq("user_id", userId)
      .eq("period_from", range.from)
      .eq("period_to", range.to)
      .maybeSingle();

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load balance summary: ${error.message}`,
      );
    }

    if (data) {
      return {
        totalBalance: toMoney(data.total_balance, data.currency),
        monthlyIncome: toMoney(data.monthly_income, data.currency),
        monthlyExpense: toMoney(data.monthly_expense, data.currency),
        availableToSpend: toMoney(data.available_to_spend, data.currency),
      };
    }

    const monthlyIncome = sumByDirection(transactions, "income");
    const monthlyExpense = sumByDirection(transactions, "expense");
    const available = Math.max(0, monthlyIncome - monthlyExpense);

    return {
      totalBalance: toMoney(available),
      monthlyIncome: toMoney(monthlyIncome),
      monthlyExpense: toMoney(monthlyExpense),
      availableToSpend: toMoney(available),
    };
  }

  private async fetchShortcuts(
    client: TypedSupabaseServerClient,
    userId: string,
  ): Promise<ReadonlyArray<ActionShortcut>> {
    const { data, error } = await client
      .from("action_shortcuts")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load shortcuts: ${error.message}`,
      );
    }

    if (!data || data.length === 0) {
      return [
        { id: "deposit", label: "Deposit", isPrimary: false },
        { id: "transfer", label: "Transfer", isPrimary: true },
      ];
    }

    return data.map((item: ShortcutRow) => ({
      id: item.shortcut_id,
      label: item.label,
      isPrimary: item.is_primary,
    }));
  }

  private async fetchWeeklyTrend(
    client: TypedSupabaseServerClient,
    userId: string,
    range: DateRange,
    transactions: ReadonlyArray<Transaction>,
  ): Promise<ReadonlyArray<WeeklyTrendPoint>> {
    const { data, error } = await client
      .from("weekly_trend_points")
      .select("*")
      .eq("user_id", userId)
      .eq("period_from", range.from)
      .eq("period_to", range.to)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load weekly trend: ${error.message}`,
      );
    }

    if (data && data.length > 0) {
      return data.map((item: WeeklyTrendRow) => ({
        label: item.label,
        income: toMoney(item.income, item.currency),
        expense: toMoney(item.expense, item.currency),
      }));
    }

    return buildWeeklyTrendFromTransactions(transactions);
  }

  private async fetchSpendingBreakdown(
    client: TypedSupabaseServerClient,
    userId: string,
    range: DateRange,
    transactions: ReadonlyArray<Transaction>,
  ): Promise<ReadonlyArray<SpendingCategoryBreakdown>> {
    const { data, error } = await client
      .from("spending_breakdown_items")
      .select("*")
      .eq("user_id", userId)
      .eq("period_from", range.from)
      .eq("period_to", range.to)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load spending breakdown: ${error.message}`,
      );
    }

    if (data && data.length > 0) {
      return data.map((item: SpendingBreakdownRow) => ({
        category: item.category,
        amount: toMoney(item.amount, item.currency),
        percentage: clamp(item.percentage, 0, 100),
        colorHex: item.color_hex,
      }));
    }

    return buildSpendingBreakdownFromTransactions(transactions);
  }

  private async fetchGoals(
    client: TypedSupabaseServerClient,
    userId: string,
  ): Promise<ReadonlyArray<FinancialGoal>> {
    const { data, error } = await client
      .from("financial_goals")
      .select("*")
      .eq("user_id", userId)
      .order("deadline", { ascending: true });

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load goals: ${error.message}`,
      );
    }

    return (data ?? []).map((goal: FinancialGoalRow) => ({
      id: goal.id,
      name: goal.name,
      deadline: toISODateOnly(goal.deadline),
      saved: toMoney(goal.saved, goal.currency),
      target: toMoney(goal.target, goal.currency),
    }));
  }

  private async fetchTransactions(
    client: TypedSupabaseServerClient,
    userId: string,
    range: DateRange,
  ): Promise<ReadonlyArray<Transaction>> {
    const { data, error } = await client
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", `${range.from}T00:00:00.000Z`)
      .lte("occurred_at", `${range.to}T23:59:59.999Z`)
      .order("occurred_at", { ascending: false });

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load transactions: ${error.message}`,
      );
    }

    return (data ?? []).map((tx: TransactionRow) => ({
      id: tx.id,
      title: tx.title,
      category: tx.category,
      direction: tx.direction as TransactionDirection,
      amount: toMoney(tx.amount, tx.currency),
      occurredAt: tx.occurred_at,
    }));
  }

  private async fetchDailyLimit(
    client: TypedSupabaseServerClient,
    userId: string,
    range: DateRange,
    transactions: ReadonlyArray<Transaction>,
  ): Promise<DailyTransactionLimit> {
    const [{ data, error }, { data: settings, error: settingsError }] =
      await Promise.all([
        client
          .from("daily_transaction_limits")
          .select("*")
          .eq("user_id", userId)
          .eq("date", range.to)
          .maybeSingle(),
        client
          .from("user_settings")
          .select("daily_transaction_limit")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    if (error) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load daily limit: ${error.message}`,
      );
    }

    if (settingsError) {
      throw new Error(
        `[supabase-dashboard-repository] Failed to load user settings: ${settingsError.message}`,
      );
    }

    const configuredLimit =
      typeof settings?.daily_transaction_limit === "number" &&
      Number.isFinite(settings.daily_transaction_limit) &&
      settings.daily_transaction_limit > 0
        ? settings.daily_transaction_limit
        : DEFAULT_DAILY_TRANSACTION_LIMIT;

    if (data) {
      return {
        used: toMoney(data.used, data.currency),
        limit: toMoney(configuredLimit, data.currency),
      };
    }

    const used = transactions
      .filter(
        (tx) =>
          tx.direction === "expense" && tx.occurredAt.startsWith(range.to),
      )
      .reduce((sum, tx) => sum + tx.amount.amount, 0);

    return {
      used: toMoney(used),
      limit: toMoney(configuredLimit),
    };
  }

  private async fetchFinancialHealthInputSettings(
    client: TypedSupabaseServerClient,
    userId: string,
  ): Promise<
    | {
        monthlyDebtInstallment: number;
        emergencyFundBalance: number;
      }
    | undefined
  > {
    const { data, error } = await client
      .from("user_settings")
      .select("monthly_debt_installment,emergency_fund_balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingOptionalUserSettingsColumnError(error.message)) {
        return undefined;
      }

      throw new Error(
        `[supabase-dashboard-repository] Failed to load financial health inputs: ${error.message}`,
      );
    }

    if (!data) {
      return undefined;
    }

    const row = data as Pick<
      UserSettingsRow,
      "monthly_debt_installment" | "emergency_fund_balance"
    >;

    return {
      monthlyDebtInstallment:
        typeof row.monthly_debt_installment === "number" &&
        Number.isFinite(row.monthly_debt_installment) &&
        row.monthly_debt_installment >= 0
          ? row.monthly_debt_installment
          : 0,
      emergencyFundBalance:
        typeof row.emergency_fund_balance === "number" &&
        Number.isFinite(row.emergency_fund_balance) &&
        row.emergency_fund_balance >= 0
          ? row.emergency_fund_balance
          : 0,
    };
  }
}

export function createSupabaseDashboardRepository(
  options: SupabaseDashboardRepositoryOptions = {},
): DashboardRepository {
  return new SupabaseDashboardRepository(options);
}

function toMoney(amount: number, currency: string = DEFAULT_CURRENCY): Money {
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency: currency === "IDR" ? "IDR" : DEFAULT_CURRENCY,
  };
}

function toISODateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function sumByDirection(
  transactions: ReadonlyArray<Transaction>,
  direction: TransactionDirection,
): number {
  return transactions
    .filter((tx) => tx.direction === direction)
    .reduce((sum, tx) => sum + tx.amount.amount, 0);
}

function buildWeeklyTrendFromTransactions(
  transactions: ReadonlyArray<Transaction>,
): ReadonlyArray<WeeklyTrendPoint> {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

  const map: Record<
    (typeof labels)[number],
    { income: number; expense: number }
  > = {
    Mon: { income: 0, expense: 0 },
    Tue: { income: 0, expense: 0 },
    Wed: { income: 0, expense: 0 },
    Thu: { income: 0, expense: 0 },
    Fri: { income: 0, expense: 0 },
    Sat: { income: 0, expense: 0 },
    Sun: { income: 0, expense: 0 },
  };

  for (const tx of transactions) {
    const d = new Date(tx.occurredAt);
    if (Number.isNaN(d.getTime())) continue;
    const label = labels[(d.getUTCDay() + 6) % 7];
    if (tx.direction === "income") map[label].income += tx.amount.amount;
    if (tx.direction === "expense") map[label].expense += tx.amount.amount;
  }

  return labels.map((label) => ({
    label,
    income: toMoney(map[label].income),
    expense: toMoney(map[label].expense),
  }));
}

function buildSpendingBreakdownFromTransactions(
  transactions: ReadonlyArray<Transaction>,
): ReadonlyArray<SpendingCategoryBreakdown> {
  const expenseTransactions = transactions.filter(
    (tx) => tx.direction === "expense",
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, tx) => sum + tx.amount.amount,
    0,
  );

  const byCategory = new Map<string, number>();
  for (const tx of expenseTransactions) {
    byCategory.set(
      tx.category,
      (byCategory.get(tx.category) ?? 0) + tx.amount.amount,
    );
  }

  const palette = ["#FFF27A", "#FB5D5D", "#5BC4FF", "#8F7CFF", "#7ED7A6"];

  return [...byCategory.entries()]
    .map(([category, amount], index) => ({
      category,
      amount: toMoney(amount),
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      colorHex: palette[index % palette.length],
    }))
    .sort((a, b) => b.amount.amount - a.amount.amount);
}

function buildFinancialHealthSnapshot(
  balance: {
    monthlyIncome: Money;
    monthlyExpense: Money;
  },
  transactions: ReadonlyArray<Transaction>,
  goals: ReadonlyArray<FinancialGoal>,
  settings?: {
    monthlyDebtInstallment: number;
    emergencyFundBalance: number;
  },
) {
  const monthlyDebtInstallment =
    settings?.monthlyDebtInstallment ??
    sumDebtInstallmentFromTransactions(transactions);
  const emergencyFundBalance =
    settings?.emergencyFundBalance ?? resolveEmergencyFundBalance(goals);

  return calculateFinancialHealth({
    monthlyIncome: balance.monthlyIncome,
    monthlyExpense: balance.monthlyExpense,
    monthlyDebtInstallment: toMoney(monthlyDebtInstallment),
    emergencyFundBalance: toMoney(emergencyFundBalance),
  });
}

function sumDebtInstallmentFromTransactions(
  transactions: ReadonlyArray<Transaction>,
): number {
  return transactions
    .filter(
      (tx) =>
        tx.direction === "expense" &&
        (isDebtKeyword(tx.category) || isDebtKeyword(tx.title)),
    )
    .reduce((sum, tx) => sum + tx.amount.amount, 0);
}

function resolveEmergencyFundBalance(
  goals: ReadonlyArray<FinancialGoal>,
): number {
  const emergencyGoals = goals.filter((goal) =>
    isEmergencyFundKeyword(goal.name),
  );

  if (emergencyGoals.length === 0) {
    return 0;
  }

  return emergencyGoals.reduce(
    (max, goal) => Math.max(max, goal.saved.amount),
    0,
  );
}

function isDebtKeyword(value: string): boolean {
  return /(cicilan|hutang|utang|debt|loan|kredit)/i.test(value);
}

function isEmergencyFundKeyword(value: string): boolean {
  return /(dana\s*darurat|emergency\s*fund)/i.test(value);
}

function isMissingOptionalUserSettingsColumnError(message: string): boolean {
  return /column\s+user_settings\.(monthly_debt_installment|emergency_fund_balance)\s+does not exist/i.test(
    message,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
