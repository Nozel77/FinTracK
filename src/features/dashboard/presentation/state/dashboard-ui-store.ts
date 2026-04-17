import { create } from "zustand";

import type { TransactionFilter } from "../screens/transactions-screen";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";

export type ScreenId =
  | "dashboard"
  | "wallet"
  | "transactions"
  | "goals"
  | "analytics"
  | "smart-budgeting"
  | "recurring-bills"
  | "financial-health"
  | "debt-manager"
  | "settings";

export type SettingsProfile = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
};

export type SettingsPreferences = {
  currency: string;
  timezone: string;
  language: string;
  startOfWeek: "Monday" | "Sunday";
  dailyTransactionLimit?: number | string;
  monthlyDebtInstallment?: number | string;
  emergencyFundBalance?: number | string;
};

export type SettingsToggleId =
  | "email-alerts"
  | "push-notifications"
  | "monthly-report"
  | "compact-mode";

export type SettingsToggle = {
  id: SettingsToggleId;
  label: string;
  description: string;
  enabled: boolean;
};

export type SettingsToggles = SettingsToggle[];

export type ActionDialogId =
  | "date-range"
  | "add-funds"
  | "add-transaction"
  | "create-goal"
  | "adjust-plan"
  | "set-over-speed-alert"
  | "configure-rollover-budget"
  | "add-subscription"
  | "add-bill"
  | "add-debt"
  | "add-receivable"
  | "run-debt-strategy";

export type DateRange = {
  from?: string;
  to?: string;
};

export type QuickRangePreset = "today" | "week" | "monthly" | "custom";

export type DashboardPagination = {
  recentTransactionsPage: number;
  goalsPage: number;
  spendingBreakdownPage: number;
  transactionsPage: number;
  pageSize: number;
};

export type DashboardUiStoreInit = {
  initialViewModel: DashboardViewModel;
  initialScreen?: ScreenId;
  initialFrom?: string;
  initialTo?: string;
};

export const DEFAULT_PROFILE: SettingsProfile = {
  fullName: "Alex Morgan",
  email: "alex.morgan@fintrack.app",
  phone: "+1 (555) 812-2091",
  role: "Owner",
};

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  currency: "IDR",
  timezone: "UTC+07:00 (Jakarta)",
  language: "Bahasa Indonesia",
  startOfWeek: "Monday",
  dailyTransactionLimit: 10_000_000,
  monthlyDebtInstallment: 0,
  emergencyFundBalance: 0,
};

export const DEFAULT_TOGGLES: SettingsToggles = [
  {
    id: "email-alerts",
    label: "Email alerts",
    description: "Receive billing and account status updates by email.",
    enabled: true,
  },
  {
    id: "push-notifications",
    label: "Push notifications",
    description: "Get instant transaction and card activity notifications.",
    enabled: true,
  },
  {
    id: "monthly-report",
    label: "Monthly report",
    description: "Send a monthly PDF summary to your inbox.",
    enabled: false,
  },
  {
    id: "compact-mode",
    label: "Compact mode",
    description: "Use denser cards and table rows across dashboard screens.",
    enabled: false,
  },
];

export type DashboardUiState = {
  screen: ScreenId;
  viewModel: DashboardViewModel;
  range: DateRange;
  quickRangePreset: QuickRangePreset;
  pagination: DashboardPagination;
  busy: boolean;
  message: string;
  transactionFilter: TransactionFilter;
  searchQuery: string;
  openDialog: ActionDialogId | null;
  dialogError: string;
  adjustPlanGoalId: string | null;
  profile: SettingsProfile;
  preferences: SettingsPreferences;
  toggles: SettingsToggles;
};

export type DashboardUiActions = {
  setScreen: (screen: ScreenId) => void;
  setViewModel: (viewModel: DashboardViewModel) => void;
  setRange: (range: DateRange) => void;
  patchRange: (patch: Partial<DateRange>) => void;
  setQuickRangePreset: (preset: QuickRangePreset) => void;
  setPaginationPage: (
    key: Exclude<keyof DashboardPagination, "pageSize">,
    page: number,
  ) => void;
  setPaginationPageSize: (pageSize: number) => void;
  resetPagination: () => void;
  setBusy: (busy: boolean) => void;
  setMessage: (message: string) => void;
  clearMessage: () => void;
  setTransactionFilter: (filter: TransactionFilter) => void;
  setSearchQuery: (query: string) => void;
  resetTransactionFilters: () => void;
  openDialogById: (dialog: ActionDialogId) => void;
  closeDialog: () => void;
  setDialogError: (error: string) => void;
  clearDialogError: () => void;
  setAdjustPlanGoalId: (goalId: string | null) => void;
  setProfile: (profile: SettingsProfile) => void;
  setProfileField: <K extends keyof SettingsProfile>(
    field: K,
    value: SettingsProfile[K],
  ) => void;
  setPreferences: (preferences: SettingsPreferences) => void;
  setPreferenceField: <K extends keyof SettingsPreferences>(
    field: K,
    value: SettingsPreferences[K],
  ) => void;
  setToggles: (toggles: SettingsToggles) => void;
  togglePreference: (toggleId: SettingsToggleId) => void;
  resetEphemeralUi: () => void;
};

export type DashboardUiStore = DashboardUiState & DashboardUiActions;

export function createDashboardUiStore({
  initialViewModel,
  initialScreen = "dashboard",
  initialFrom,
  initialTo,
}: DashboardUiStoreInit) {
  return create<DashboardUiStore>()((set) => ({
    screen: initialScreen,
    viewModel: initialViewModel,
    range: {
      from: initialFrom,
      to: initialTo,
    },
    quickRangePreset: "week",
    pagination: {
      recentTransactionsPage: 1,
      goalsPage: 1,
      spendingBreakdownPage: 1,
      transactionsPage: 1,
      pageSize: 5,
    },
    busy: false,
    message: "",
    transactionFilter: "all",
    searchQuery: "",
    openDialog: null,
    dialogError: "",
    adjustPlanGoalId: null,
    profile: DEFAULT_PROFILE,
    preferences: DEFAULT_PREFERENCES,
    toggles: DEFAULT_TOGGLES,

    setScreen: (screen) => set({ screen }),
    setViewModel: (viewModel) => set({ viewModel }),
    setRange: (range) =>
      set({
        range,
        quickRangePreset: "custom",
      }),
    patchRange: (patch) =>
      set((state) => ({
        range: {
          ...state.range,
          ...patch,
        },
        quickRangePreset: "custom",
      })),
    setQuickRangePreset: (quickRangePreset) => set({ quickRangePreset }),
    setPaginationPage: (key, page) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          [key]: Math.max(1, Math.floor(page)),
        },
      })),
    setPaginationPageSize: (pageSize) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          pageSize: Math.max(1, Math.floor(pageSize)),
        },
      })),
    resetPagination: () =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          recentTransactionsPage: 1,
          goalsPage: 1,
          spendingBreakdownPage: 1,
          transactionsPage: 1,
        },
      })),
    setBusy: (busy) => set({ busy }),
    setMessage: (message) => set({ message }),
    clearMessage: () => set({ message: "" }),
    setTransactionFilter: (transactionFilter) => set({ transactionFilter }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    resetTransactionFilters: () =>
      set({
        transactionFilter: "all",
        searchQuery: "",
      }),
    openDialogById: (openDialog) =>
      set({
        openDialog,
        dialogError: "",
      }),
    closeDialog: () =>
      set({
        openDialog: null,
        dialogError: "",
      }),
    setDialogError: (dialogError) => set({ dialogError }),
    clearDialogError: () => set({ dialogError: "" }),
    setAdjustPlanGoalId: (adjustPlanGoalId) => set({ adjustPlanGoalId }),
    setProfile: (profile) => set({ profile }),
    setProfileField: (field, value) =>
      set((state) => ({
        profile: {
          ...state.profile,
          [field]: value,
        },
      })),
    setPreferences: (preferences) => set({ preferences }),
    setPreferenceField: (field, value) =>
      set((state) => ({
        preferences: {
          ...state.preferences,
          [field]: value,
        },
      })),
    setToggles: (toggles) => set({ toggles }),
    togglePreference: (toggleId) =>
      set((state) => ({
        toggles: state.toggles.map((toggle) =>
          toggle.id === toggleId
            ? { ...toggle, enabled: !toggle.enabled }
            : toggle,
        ),
      })),
    resetEphemeralUi: () =>
      set({
        busy: false,
        message: "",
        openDialog: null,
        dialogError: "",
        adjustPlanGoalId: null,
      }),
  }));
}

export const dashboardUiSelectors = {
  screen: (state: DashboardUiStore) => state.screen,
  viewModel: (state: DashboardUiStore) => state.viewModel,
  range: (state: DashboardUiStore) => state.range,
  quickRangePreset: (state: DashboardUiStore) => state.quickRangePreset,
  pagination: (state: DashboardUiStore) => state.pagination,
  busy: (state: DashboardUiStore) => state.busy,
  message: (state: DashboardUiStore) => state.message,
  transactionFilter: (state: DashboardUiStore) => state.transactionFilter,
  searchQuery: (state: DashboardUiStore) => state.searchQuery,
  openDialog: (state: DashboardUiStore) => state.openDialog,
  dialogError: (state: DashboardUiStore) => state.dialogError,
  adjustPlanGoalId: (state: DashboardUiStore) => state.adjustPlanGoalId,
  profile: (state: DashboardUiStore) => state.profile,
  preferences: (state: DashboardUiStore) => state.preferences,
  toggles: (state: DashboardUiStore) => state.toggles,
};
