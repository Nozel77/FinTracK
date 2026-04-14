import type {
  DashboardRepository,
  DashboardSnapshot,
  DateRange,
  Money,
} from "@/src/features/dashboard/domain/dashboard";

const USD = "IDR" as const;

const money = (amount: number): Money => ({
  amount,
  currency: USD,
});

export class StaticDashboardRepository implements DashboardRepository {
  async getSnapshot(range: DateRange): Promise<DashboardSnapshot> {
    return {
      range,
      balance: {
        totalBalance: money(245600000),
        monthlyIncome: money(84200000),
        monthlyExpense: money(31600000),
        availableToSpend: money(52600000),
      },
      shortcuts: [
        { id: "deposit", label: "Deposit", isPrimary: false },
        { id: "transfer", label: "Transfer", isPrimary: true },
      ],
      weeklyTrend: [
        { label: "Mon", income: money(8500000), expense: money(3000000) },
        { label: "Tue", income: money(12000000), expense: money(5400000) },
        { label: "Wed", income: money(9400000), expense: money(4200000) },
        { label: "Thu", income: money(15100000), expense: money(6800000) },
        { label: "Fri", income: money(9900000), expense: money(3500000) },
        { label: "Sat", income: money(7000000), expense: money(2800000) },
        { label: "Sun", income: money(12300000), expense: money(5900000) },
      ],
      spendingBreakdown: [
        {
          category: "Housing",
          amount: money(14500000),
          percentage: 46,
          colorHex: "#FFF27A",
        },
        {
          category: "Food",
          amount: money(7200000),
          percentage: 23,
          colorHex: "#FB5D5D",
        },
        {
          category: "Transport",
          amount: money(4300000),
          percentage: 14,
          colorHex: "#5BC4FF",
        },
        {
          category: "Utilities",
          amount: money(3200000),
          percentage: 10,
          colorHex: "#8F7CFF",
        },
        {
          category: "Other",
          amount: money(2400000),
          percentage: 7,
          colorHex: "#7ED7A6",
        },
      ],
      goals: [
        {
          id: "goal-iphone",
          name: "Buy iPhone 15",
          deadline: "2024-05-08",
          saved: money(3600000),
          target: money(12000000),
        },
        {
          id: "goal-spain",
          name: "Trip to Spain",
          deadline: "2024-08-16",
          saved: money(32600000),
          target: money(36000000),
        },
        {
          id: "goal-house",
          name: "For a new house",
          deadline: "2025-05-12",
          saved: money(1203000000),
          target: money(1800000000),
        },
      ],
      recentTransactions: [
        {
          id: "tx-1",
          title: "Salary",
          category: "Income",
          direction: "income",
          amount: money(32000000),
          occurredAt: "2024-05-14T09:22:00Z",
        },
        {
          id: "tx-2",
          title: "Grocery Store",
          category: "Food",
          direction: "expense",
          amount: money(1320000),
          occurredAt: "2024-05-14T17:40:00Z",
        },
        {
          id: "tx-3",
          title: "Internet Bill",
          category: "Utilities",
          direction: "expense",
          amount: money(580000),
          occurredAt: "2024-05-13T08:05:00Z",
        },
        {
          id: "tx-4",
          title: "Transfer to Savings",
          category: "Savings",
          direction: "transfer",
          amount: money(5000000),
          occurredAt: "2024-05-12T11:15:00Z",
        },
      ],
      dailyTransactionLimit: {
        used: money(4200000),
        limit: money(10000000),
      },
    };
  }
}

export const staticDashboardRepository = new StaticDashboardRepository();
