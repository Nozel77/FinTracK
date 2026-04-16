import "server-only";

import type { TransactionDirection } from "@/src/features/dashboard/domain/dashboard";
import type { Inserts, Updates } from "@/src/shared/supabase/database.types";
import {
  createSupabaseServerClient,
  type TypedSupabaseServerClient,
} from "@/src/shared/supabase/server-client";

import { resolveDashboardUserId } from "../dashboard-user";

type ServiceContext = {
  readonly client: TypedSupabaseServerClient;
  readonly userId: string;
};

type ActionResult<T = Record<string, never>> = {
  readonly ok: true;
  readonly message: string;
  readonly data: T;
  readonly executedAt: string;
};

type CreateClient = () => Promise<TypedSupabaseServerClient>;

type DashboardActionServiceOptions = {
  readonly userId?: string;
  readonly createClient?: CreateClient;
};

type StartOfWeek = "Monday" | "Sunday";

type AddFundsInput = {
  readonly userId?: string;
  readonly amount: number;
  readonly accountId?: string;
  readonly category?: string;
  readonly title?: string;
  readonly occurredAt?: string;
};

type AddTransactionInput = {
  readonly userId?: string;
  readonly title: string;
  readonly category: string;
  readonly direction: TransactionDirection;
  readonly amount: number;
  readonly accountId?: string;
  readonly occurredAt?: string;
};

type PaymentStatus = "paid" | "unpaid";

type AddPayableInput = {
  readonly userId?: string;
  readonly creditor: string;
  readonly amount: number;
  readonly status: PaymentStatus;
  readonly accountId?: string;
  readonly occurredAt?: string;
};

type AddReceivableInput = {
  readonly userId?: string;
  readonly debtor: string;
  readonly amount: number;
  readonly status: PaymentStatus;
  readonly accountId?: string;
  readonly occurredAt?: string;
};

type UpdateDebtStatusInput = {
  readonly userId?: string;
  readonly transactionId: string;
  readonly status: PaymentStatus;
  readonly accountId?: string;
};

type CreateGoalInput = {
  readonly userId?: string;
  readonly name: string;
  readonly target: number;
  readonly saved?: number;
  readonly deadline: string;
};

type AdjustPlanInput = {
  readonly userId?: string;
  readonly goalId: string;
  readonly addSavedAmount?: number;
  /**
   * Deprecated: this field is intentionally rejected by the service because it
   * implies scheduled automation that does not exist.
   */
  readonly monthlyContribution?: number;
};

type SaveSettingsInput = {
  readonly userId?: string;
  readonly profile?: {
    readonly fullName?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly role?: string;
  };
  readonly preferences?: {
    readonly currency?: string;
    readonly timezone?: string;
    readonly language?: string;
    readonly startOfWeek?: StartOfWeek;
    readonly dailyTransactionLimit?: number;
    readonly monthlyDebtInstallment?: number;
    readonly emergencyFundBalance?: number;
  };
  readonly toggles?: {
    readonly emailAlerts?: boolean;
    readonly pushNotifications?: boolean;
    readonly monthlyReport?: boolean;
    readonly compactMode?: boolean;
  };
};

const DEFAULT_CURRENCY = "IDR";
const DEFAULT_TIMEZONE = "UTC+07:00 (Jakarta)";
const DEFAULT_LANGUAGE = "English (US)";
const DEFAULT_DAILY_TRANSACTION_LIMIT = 10_000_000;

export class DashboardActionService {
  private readonly userId?: string;
  private readonly createClient: CreateClient;

  constructor(options: DashboardActionServiceOptions = {}) {
    this.userId = options.userId;
    this.createClient = options.createClient ?? createSupabaseServerClient;
  }

  async addFunds(
    input: AddFundsInput,
  ): Promise<ActionResult<{ transactionId: string }>> {
    const amount = assertPositiveAmount(input.amount, "amount");
    const context = await this.getContext(input.userId);
    const occurredAt = normalizeISODateTime(input.occurredAt);

    const transactionId = await this.insertTransaction(context, {
      title: input.title ?? "Add funds",
      category: input.category ?? "Deposit",
      direction: "income",
      amount,
      occurredAt,
    });

    if (input.accountId) {
      await this.adjustLinkedAccountBalance(context, input.accountId, amount);
    }

    return this.success("Funds added successfully.", { transactionId });
  }

  async addTransaction(
    input: AddTransactionInput,
  ): Promise<ActionResult<{ transactionId: string }>> {
    const amount = assertPositiveAmount(input.amount, "amount");
    const context = await this.getContext(input.userId);
    const occurredAt = normalizeISODateTime(input.occurredAt);

    if (input.direction === "expense") {
      await this.assertWithinDailyExpenseLimit(context, amount, occurredAt);
    }

    const transactionId = await this.insertTransaction(context, {
      title: input.title,
      category: input.category,
      direction: input.direction,
      amount,
      occurredAt,
    });

    if (input.direction === "expense") {
      await this.incrementDailyExpenseLimit(context, amount, occurredAt);
    }

    if (input.accountId) {
      const delta = toAccountDelta(input.direction, amount);
      if (delta !== 0) {
        await this.adjustLinkedAccountBalance(context, input.accountId, delta);
      }
    }

    return this.success("Transaction recorded successfully.", {
      transactionId,
    });
  }

  async addPayable(
    input: AddPayableInput,
  ): Promise<ActionResult<{ transactionId: string; status: PaymentStatus }>> {
    const amount = assertPositiveAmount(input.amount, "amount");
    const context = await this.getContext(input.userId);
    const occurredAt = normalizeISODateTime(input.occurredAt);
    const creditor = input.creditor.trim();

    if (!creditor) {
      throw new Error(
        '[dashboard-action-service] "creditor" must be a non-empty string.',
      );
    }

    const isPaid = input.status === "paid";
    const direction: TransactionDirection = isPaid ? "expense" : "transfer";

    const transactionId = await this.insertTransaction(context, {
      title: `Hutang: ${creditor} (${isPaid ? "Lunas" : "Belum Lunas"})`,
      category: "Hutang",
      direction,
      amount,
      occurredAt,
    });

    if (isPaid && input.accountId) {
      await this.adjustLinkedAccountBalance(
        context,
        input.accountId,
        toAccountDelta("expense", amount),
      );
    }

    return this.success(
      isPaid
        ? "Payable recorded and marked as paid."
        : "Payable recorded as unpaid.",
      {
        transactionId,
        status: input.status,
      },
    );
  }

  async addReceivable(
    input: AddReceivableInput,
  ): Promise<ActionResult<{ transactionId: string; status: PaymentStatus }>> {
    const amount = assertPositiveAmount(input.amount, "amount");
    const context = await this.getContext(input.userId);
    const occurredAt = normalizeISODateTime(input.occurredAt);
    const debtor = input.debtor.trim();

    if (!debtor) {
      throw new Error(
        '[dashboard-action-service] "debtor" must be a non-empty string.',
      );
    }

    const isPaid = input.status === "paid";
    const direction: TransactionDirection = isPaid ? "income" : "transfer";

    const transactionId = await this.insertTransaction(context, {
      title: `Piutang: ${debtor} (${isPaid ? "Lunas" : "Belum Lunas"})`,
      category: "Piutang",
      direction,
      amount,
      occurredAt,
    });

    if (isPaid && input.accountId) {
      await this.adjustLinkedAccountBalance(
        context,
        input.accountId,
        toAccountDelta("income", amount),
      );
    }

    return this.success(
      isPaid
        ? "Receivable recorded and marked as paid."
        : "Receivable recorded as unpaid.",
      {
        transactionId,
        status: input.status,
      },
    );
  }

  async updateDebtStatus(
    input: UpdateDebtStatusInput,
  ): Promise<ActionResult<{ transactionId: string; status: PaymentStatus }>> {
    const context = await this.getContext(input.userId);
    const transactionId = input.transactionId.trim();

    if (!transactionId) {
      throw new Error(
        '[dashboard-action-service] "transactionId" must be a non-empty string.',
      );
    }

    const { data: transaction, error: readError } = await context.client
      .from("transactions")
      .select("id,title,category,direction,amount")
      .eq("id", transactionId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (readError) {
      throw new Error(
        `[dashboard-action-service] updateDebtStatus read failed: ${readError.message}`,
      );
    }

    if (!transaction) {
      throw new Error(
        `[dashboard-action-service] Transaction "${transactionId}" not found.`,
      );
    }

    const kind = resolveDebtKind(transaction.title, transaction.category);
    if (!kind) {
      throw new Error(
        "[dashboard-action-service] Transaction is not payable/receivable.",
      );
    }

    const nextDirection = toDebtDirection(kind, input.status);
    const nextTitle = withDebtStatusSuffix(transaction.title, input.status);

    const { error: updateError } = await context.client
      .from("transactions")
      .update({
        direction: nextDirection,
        title: nextTitle,
        updated_at: nowIso(),
      })
      .eq("id", transaction.id)
      .eq("user_id", context.userId);

    if (updateError) {
      throw new Error(
        `[dashboard-action-service] updateDebtStatus update failed: ${updateError.message}`,
      );
    }

    if (input.accountId) {
      const previousDelta = toAccountDelta(
        transaction.direction as TransactionDirection,
        transaction.amount,
      );
      const nextDelta = toAccountDelta(nextDirection, transaction.amount);
      const rebalanceDelta = nextDelta - previousDelta;

      if (rebalanceDelta !== 0) {
        await this.adjustLinkedAccountBalance(
          context,
          input.accountId,
          rebalanceDelta,
        );
      }
    }

    return this.success("Debt status updated successfully.", {
      transactionId: transaction.id,
      status: input.status,
    });
  }

  async createGoal(
    input: CreateGoalInput,
  ): Promise<ActionResult<{ goalId: string }>> {
    const context = await this.getContext(input.userId);
    const target = assertPositiveAmount(input.target, "target");
    const saved = clampNonNegative(input.saved ?? 0);
    const deadline = normalizeISODate(input.deadline);

    const payload: Inserts<"financial_goals"> = {
      user_id: context.userId,
      name: input.name.trim(),
      target,
      saved,
      deadline,
      currency: DEFAULT_CURRENCY,
      updated_at: nowIso(),
    };

    const { data, error } = await context.client
      .from("financial_goals")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(
        `[dashboard-action-service] createGoal failed: ${error.message}`,
      );
    }

    return this.success("Goal created successfully.", { goalId: data.id });
  }

  async adjustPlan(
    input: AdjustPlanInput,
  ): Promise<ActionResult<{ goalId: string; saved: number; target: number }>> {
    const context = await this.getContext(input.userId);

    const { data: currentGoal, error: selectError } = await context.client
      .from("financial_goals")
      .select("*")
      .eq("id", input.goalId)
      .eq("user_id", context.userId)
      .single();

    if (selectError) {
      throw new Error(
        `[dashboard-action-service] adjustPlan read failed: ${selectError.message}`,
      );
    }

    if (typeof input.monthlyContribution === "number") {
      throw new Error(
        '[dashboard-action-service] "monthlyContribution" is no longer supported. Use "addSavedAmount" to record actual saved progress.',
      );
    }

    const legacyPayload = input as Record<string, unknown>;

    if (legacyPayload.newTarget !== undefined) {
      throw new Error(
        '[dashboard-action-service] "newTarget" is no longer supported. Goal adjustment only allows incrementing "addSavedAmount".',
      );
    }

    if (legacyPayload.newDeadline !== undefined) {
      throw new Error(
        '[dashboard-action-service] "newDeadline" is no longer supported. Goal adjustment only allows incrementing "addSavedAmount".',
      );
    }

    const increment = assertPositiveAmount(
      input.addSavedAmount ?? Number.NaN,
      "addSavedAmount",
    );

    const update: Updates<"financial_goals"> = {
      saved: currentGoal.saved + increment,
      updated_at: nowIso(),
    };

    const { data: updatedGoal, error: updateError } = await context.client
      .from("financial_goals")
      .update(update)
      .eq("id", input.goalId)
      .eq("user_id", context.userId)
      .select("id,saved,target")
      .single();

    if (updateError) {
      throw new Error(
        `[dashboard-action-service] adjustPlan update failed: ${updateError.message}`,
      );
    }

    return this.success("Goal plan adjusted successfully.", {
      goalId: updatedGoal.id,
      saved: updatedGoal.saved,
      target: updatedGoal.target,
    });
  }

  async saveSettings(
    input: SaveSettingsInput,
  ): Promise<ActionResult<{ userId: string }>> {
    const context = await this.getContext(input.userId);

    const { data: existing, error: readError } = await context.client
      .from("user_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (readError) {
      throw new Error(
        `[dashboard-action-service] saveSettings read failed: ${readError.message}`,
      );
    }

    const existingWithFinancialHealthInputs = existing as
      | (typeof existing & {
          daily_transaction_limit?: number | null;
          monthly_debt_installment?: number | null;
          emergency_fund_balance?: number | null;
        })
      | null;

    const payload: Inserts<"user_settings"> = {
      user_id: context.userId,
      full_name:
        input.profile?.fullName?.trim() ||
        existing?.full_name ||
        "Dashboard User",
      email:
        input.profile?.email?.trim() ||
        existing?.email ||
        `${context.userId}@dashboard.local`,
      phone: input.profile?.phone?.trim() || existing?.phone || "-",
      role: input.profile?.role?.trim() || existing?.role || "Owner",
      currency:
        input.preferences?.currency || existing?.currency || DEFAULT_CURRENCY,
      timezone:
        input.preferences?.timezone || existing?.timezone || DEFAULT_TIMEZONE,
      language:
        input.preferences?.language || existing?.language || DEFAULT_LANGUAGE,
      start_of_week:
        input.preferences?.startOfWeek || existing?.start_of_week || "Monday",
      email_alerts:
        input.toggles?.emailAlerts ?? existing?.email_alerts ?? true,
      push_notifications:
        input.toggles?.pushNotifications ??
        existing?.push_notifications ??
        true,
      monthly_report:
        input.toggles?.monthlyReport ?? existing?.monthly_report ?? false,
      compact_mode:
        input.toggles?.compactMode ?? existing?.compact_mode ?? false,
      updated_at: nowIso(),
    };

    const payloadWithFinancialHealthInputs =
      payload as Inserts<"user_settings"> & {
        daily_transaction_limit?: number;
        monthly_debt_installment?: number;
        emergency_fund_balance?: number;
      };

    payloadWithFinancialHealthInputs.daily_transaction_limit =
      resolveDailyTransactionLimit(
        input.preferences?.dailyTransactionLimit,
        existingWithFinancialHealthInputs?.daily_transaction_limit,
      );

    payloadWithFinancialHealthInputs.monthly_debt_installment =
      resolveNonNegativeAmount(
        input.preferences?.monthlyDebtInstallment,
        existingWithFinancialHealthInputs?.monthly_debt_installment,
        "monthlyDebtInstallment",
      );

    payloadWithFinancialHealthInputs.emergency_fund_balance =
      resolveNonNegativeAmount(
        input.preferences?.emergencyFundBalance,
        existingWithFinancialHealthInputs?.emergency_fund_balance,
        "emergencyFundBalance",
      );

    const { error: upsertError } = await context.client
      .from("user_settings")
      .upsert(payloadWithFinancialHealthInputs, { onConflict: "user_id" });

    if (upsertError) {
      throw new Error(
        `[dashboard-action-service] saveSettings upsert failed: ${upsertError.message}`,
      );
    }

    return this.success("Settings saved successfully.", {
      userId: context.userId,
    });
  }

  async resetSessions(
    input: { readonly userId?: string } = {},
  ): Promise<ActionResult> {
    const context = await this.getContext(input.userId);

    const { error } = await context.client.auth.signOut();
    if (error) {
      throw new Error(
        `[dashboard-action-service] resetSessions failed: ${error.message}`,
      );
    }

    return this.success("Current session reset successfully.", {});
  }

  private async getContext(overrideUserId?: string): Promise<ServiceContext> {
    const client = await this.createClient();
    const userId = resolveDashboardUserId({
      requestedUserId: overrideUserId ?? this.userId,
    });

    return { client, userId };
  }

  private async insertTransaction(
    context: ServiceContext,
    input: {
      readonly title: string;
      readonly category: string;
      readonly direction: TransactionDirection;
      readonly amount: number;
      readonly occurredAt: string;
    },
  ): Promise<string> {
    const payload: Inserts<"transactions"> = {
      user_id: context.userId,
      title: input.title.trim(),
      category: input.category.trim(),
      direction: input.direction,
      amount: input.amount,
      currency: DEFAULT_CURRENCY,
      occurred_at: input.occurredAt,
      updated_at: nowIso(),
    };

    const { data, error } = await context.client
      .from("transactions")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(
        `[dashboard-action-service] insertTransaction failed: ${error.message}`,
      );
    }

    return data.id;
  }

  private async assertWithinDailyExpenseLimit(
    context: ServiceContext,
    amount: number,
    occurredAt: string,
  ): Promise<void> {
    const date = occurredAt.slice(0, 10);

    const [
      { data: existing, error: readError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      context.client
        .from("daily_transaction_limits")
        .select("*")
        .eq("user_id", context.userId)
        .eq("date", date)
        .maybeSingle(),
      context.client
        .from("user_settings")
        .select("daily_transaction_limit")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);

    if (readError) {
      throw new Error(
        `[dashboard-action-service] daily limit read failed: ${readError.message}`,
      );
    }

    if (settingsError) {
      throw new Error(
        `[dashboard-action-service] daily limit settings read failed: ${settingsError.message}`,
      );
    }

    const configuredLimit =
      typeof settings?.daily_transaction_limit === "number" &&
      Number.isFinite(settings.daily_transaction_limit) &&
      settings.daily_transaction_limit > 0
        ? settings.daily_transaction_limit
        : DEFAULT_DAILY_TRANSACTION_LIMIT;

    const usedToday = existing?.used ?? 0;
    const nextUsed = usedToday + amount;

    if (nextUsed > configuredLimit) {
      const remaining = Math.max(0, configuredLimit - usedToday);
      throw new Error(
        `[dashboard-action-service] Daily expense limit exceeded. Remaining daily limit: ${remaining}.`,
      );
    }
  }

  private async incrementDailyExpenseLimit(
    context: ServiceContext,
    amount: number,
    occurredAt: string,
  ): Promise<void> {
    const date = occurredAt.slice(0, 10);

    const [
      { data: existing, error: readError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      context.client
        .from("daily_transaction_limits")
        .select("*")
        .eq("user_id", context.userId)
        .eq("date", date)
        .maybeSingle(),
      context.client
        .from("user_settings")
        .select("daily_transaction_limit")
        .eq("user_id", context.userId)
        .maybeSingle(),
    ]);

    if (readError) {
      throw new Error(
        `[dashboard-action-service] daily limit read failed: ${readError.message}`,
      );
    }

    if (settingsError) {
      throw new Error(
        `[dashboard-action-service] daily limit settings read failed: ${settingsError.message}`,
      );
    }

    const configuredLimit =
      typeof settings?.daily_transaction_limit === "number" &&
      Number.isFinite(settings.daily_transaction_limit) &&
      settings.daily_transaction_limit > 0
        ? settings.daily_transaction_limit
        : DEFAULT_DAILY_TRANSACTION_LIMIT;

    if (!existing) {
      const payload: Inserts<"daily_transaction_limits"> = {
        user_id: context.userId,
        date,
        used: amount,
        limit: configuredLimit,
        currency: DEFAULT_CURRENCY,
        updated_at: nowIso(),
      };

      const { error: createError } = await context.client
        .from("daily_transaction_limits")
        .insert(payload);

      if (createError) {
        throw new Error(
          `[dashboard-action-service] daily limit create failed: ${createError.message}`,
        );
      }

      return;
    }

    const nextUsed = existing.used + amount;

    const { error: updateError } = await context.client
      .from("daily_transaction_limits")
      .update({
        used: nextUsed,
        limit: configuredLimit,
        updated_at: nowIso(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `[dashboard-action-service] daily limit update failed: ${updateError.message}`,
      );
    }
  }

  private async adjustLinkedAccountBalance(
    context: ServiceContext,
    accountId: string,
    delta: number,
  ): Promise<void> {
    const { data: account, error: readError } = await context.client
      .from("linked_accounts")
      .select("id,balance")
      .eq("id", accountId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (readError) {
      throw new Error(
        `[dashboard-action-service] linked account read failed: ${readError.message}`,
      );
    }

    if (!account) {
      return;
    }

    const { error: updateError } = await context.client
      .from("linked_accounts")
      .update({
        balance: account.balance + delta,
        updated_at: nowIso(),
      })
      .eq("id", account.id);

    if (updateError) {
      throw new Error(
        `[dashboard-action-service] linked account update failed: ${updateError.message}`,
      );
    }
  }

  private success<T>(message: string, data: T): ActionResult<T> {
    return {
      ok: true,
      message,
      data,
      executedAt: nowIso(),
    };
  }
}

export function createDashboardActionService(
  options: DashboardActionServiceOptions = {},
): DashboardActionService {
  return new DashboardActionService(options);
}

function assertPositiveAmount(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `[dashboard-action-service] "${fieldName}" must be a positive number.`,
    );
  }
  return value;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function resolveDailyTransactionLimit(
  inputLimit: number | undefined,
  existingLimit: number | null | undefined,
): number {
  if (inputLimit !== undefined) {
    return assertPositiveAmount(inputLimit, "dailyTransactionLimit");
  }

  if (typeof existingLimit === "number") {
    return assertPositiveAmount(existingLimit, "dailyTransactionLimit");
  }

  return DEFAULT_DAILY_TRANSACTION_LIMIT;
}

function resolveNonNegativeAmount(
  inputValue: number | undefined,
  existingValue: number | null | undefined,
  fieldName: string,
): number {
  if (inputValue !== undefined) {
    if (!Number.isFinite(inputValue) || inputValue < 0) {
      throw new Error(
        `[dashboard-action-service] "${fieldName}" must be a non-negative number.`,
      );
    }
    return inputValue;
  }

  if (typeof existingValue === "number") {
    if (!Number.isFinite(existingValue) || existingValue < 0) {
      throw new Error(
        `[dashboard-action-service] "${fieldName}" must be a non-negative number.`,
      );
    }
    return existingValue;
  }

  return 0;
}

function normalizeISODate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `[dashboard-action-service] Invalid date value "${value}". Expected an ISO-compatible date.`,
    );
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizeISODateTime(value?: string): string {
  if (!value) return nowIso();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `[dashboard-action-service] Invalid datetime value "${value}". Expected an ISO-compatible datetime.`,
    );
  }

  return parsed.toISOString();
}

function toAccountDelta(
  direction: TransactionDirection,
  amount: number,
): number {
  if (direction === "income") return amount;
  if (direction === "expense") return -amount;
  return 0;
}

function resolveDebtKind(
  title: string,
  category: string,
): "payable" | "receivable" | null {
  const text = `${title} ${category}`.toLowerCase();
  if (text.includes("hutang")) return "payable";
  if (text.includes("piutang")) return "receivable";
  return null;
}

function toDebtDirection(
  kind: "payable" | "receivable",
  status: PaymentStatus,
): TransactionDirection {
  if (kind === "payable") {
    return status === "paid" ? "expense" : "transfer";
  }

  return status === "paid" ? "income" : "transfer";
}

function withDebtStatusSuffix(title: string, status: PaymentStatus): string {
  const baseTitle = title
    .replace(/\s*\((?:Lunas|Belum Lunas)\)\s*$/i, "")
    .trim();

  return `${baseTitle} (${status === "paid" ? "Lunas" : "Belum Lunas"})`;
}

function nowIso(): string {
  return new Date().toISOString();
}
