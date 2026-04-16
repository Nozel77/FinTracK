import type {
  FinancialHealthSnapshot,
  FinancialHealthStatus,
  Money,
} from "./dashboard";

export const MAX_DTI_RATIO_PCT = 35;
export const MIN_EMERGENCY_FUND_MONTHS = 3;

export const DANGER_DTI_RATIO_PCT = 50;
export const DANGER_EMERGENCY_FUND_MONTHS = 1;

export type FinancialHealthInput = {
  readonly monthlyIncome: Money;
  readonly monthlyExpense: Money;
  readonly monthlyDebtInstallment: Money;
  readonly emergencyFundBalance: Money;
};

export function calculateFinancialHealth(
  input: FinancialHealthInput,
): FinancialHealthSnapshot {
  assertNonNegativeMoney(input.monthlyIncome, "monthlyIncome");
  assertNonNegativeMoney(input.monthlyExpense, "monthlyExpense");
  assertNonNegativeMoney(input.monthlyDebtInstallment, "monthlyDebtInstallment");
  assertNonNegativeMoney(input.emergencyFundBalance, "emergencyFundBalance");

  const debtToIncomeRatioPct = calculateDebtToIncomeRatioPct(
    input.monthlyDebtInstallment.amount,
    input.monthlyIncome.amount,
  );

  const emergencyFundRatioMonths = calculateEmergencyFundRatioMonths(
    input.emergencyFundBalance.amount,
    input.monthlyExpense.amount,
  );

  const debtToIncomeHealthy = debtToIncomeRatioPct <= MAX_DTI_RATIO_PCT;
  const emergencyFundHealthy =
    emergencyFundRatioMonths >= MIN_EMERGENCY_FUND_MONTHS;

  return {
    input,
    ratios: {
      debtToIncomeRatioPct,
      emergencyFundRatioMonths,
    },
    evaluation: {
      debtToIncomeHealthy,
      emergencyFundHealthy,
    },
    status: resolveFinancialHealthStatus({
      debtToIncomeRatioPct,
      emergencyFundRatioMonths,
      debtToIncomeHealthy,
      emergencyFundHealthy,
    }),
  };
}

export function calculateDebtToIncomeRatioPct(
  monthlyDebtInstallment: number,
  monthlyIncome: number,
): number {
  if (monthlyDebtInstallment <= 0) return 0;
  if (monthlyIncome <= 0) return Number.POSITIVE_INFINITY;
  return round2((monthlyDebtInstallment / monthlyIncome) * 100);
}

export function calculateEmergencyFundRatioMonths(
  emergencyFundBalance: number,
  monthlyExpense: number,
): number {
  if (emergencyFundBalance <= 0) return 0;
  if (monthlyExpense <= 0) return Number.POSITIVE_INFINITY;
  return round2(emergencyFundBalance / monthlyExpense);
}

export function resolveFinancialHealthStatus(input: {
  readonly debtToIncomeRatioPct: number;
  readonly emergencyFundRatioMonths: number;
  readonly debtToIncomeHealthy: boolean;
  readonly emergencyFundHealthy: boolean;
}): FinancialHealthStatus {
  const bothHealthy = input.debtToIncomeHealthy && input.emergencyFundHealthy;
  if (bothHealthy) return "Sehat";

  const isDanger =
    input.debtToIncomeRatioPct > DANGER_DTI_RATIO_PCT ||
    input.emergencyFundRatioMonths < DANGER_EMERGENCY_FUND_MONTHS ||
    (!input.debtToIncomeHealthy && !input.emergencyFundHealthy);

  if (isDanger) return "Bahaya";
  return "Waspada";
}

function assertNonNegativeMoney(value: Money, fieldName: string): void {
  if (!Number.isFinite(value.amount) || value.amount < 0) {
    throw new Error(
      `[financial-health] "${fieldName}" must be a finite non-negative amount.`,
    );
  }
}

function round2(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 100) / 100;
}
