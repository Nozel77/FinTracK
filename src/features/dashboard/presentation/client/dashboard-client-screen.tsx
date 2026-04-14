"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";

import {
  ActionFormDialog,
  type ActionFormDialogField,
  type ActionFormValues,
} from "../components/action-form-dialog";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  DEFAULT_TOGGLES,
  createDashboardUiStore,
  type ScreenId,
  type SettingsPreferences,
  type SettingsProfile,
  type SettingsToggleId,
} from "../state/dashboard-ui-store";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import { getSupabaseBrowserClient } from "@/src/shared/supabase/browser-client";
import {
  localeFromLanguagePreference,
  whenLocale,
} from "@/src/shared/i18n/locale";

const DashboardScreen = dynamic(() =>
  import("../dashboard-screen").then((module) => module.DashboardScreen),
);

const WalletScreen = dynamic(() =>
  import("../screens/wallet-screen").then((module) => module.WalletScreen),
);

const TransactionsScreen = dynamic(() =>
  import("../screens/transactions-screen").then(
    (module) => module.TransactionsScreen,
  ),
);

const GoalsScreen = dynamic(() =>
  import("../screens/goals-screen").then((module) => module.GoalsScreen),
);

const AnalyticsScreen = dynamic(() =>
  import("../screens/analytics-screen").then(
    (module) => module.AnalyticsScreen,
  ),
);

const SettingsScreen = dynamic(() =>
  import("../screens/settings-screen").then((module) => module.SettingsScreen),
);

type SnapshotApiData = {
  repositorySource: "supabase" | "static";
  range: {
    from: string;
    to: string;
  };
  viewModel: DashboardViewModel;
};

type UserSettingsRow = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  currency: string;
  timezone: string;
  language: string;
  start_of_week: "Monday" | "Sunday";
  email_alerts: boolean;
  push_notifications: boolean;
  monthly_report: boolean;
  compact_mode: boolean;
};

type DashboardClientScreenProps = {
  initialViewModel: DashboardViewModel;
  initialScreen?: ScreenId;
  initialFrom?: string;
  initialTo?: string;
  userId?: string;
};

export function DashboardClientScreen({
  initialViewModel,
  initialScreen = "dashboard",
  initialFrom,
  initialTo,
  userId,
}: DashboardClientScreenProps) {
  const useDashboardUiStoreRef = useRef<ReturnType<
    typeof createDashboardUiStore
  > | null>(null);

  if (!useDashboardUiStoreRef.current) {
    useDashboardUiStoreRef.current = createDashboardUiStore({
      initialViewModel,
      initialScreen,
      initialFrom,
      initialTo,
    });
  }

  const useDashboardUiStore = useDashboardUiStoreRef.current;

  const {
    screen,
    viewModel,
    range,
    busy,
    message,
    transactionFilter,
    searchQuery,
    openDialog,
    dialogError,
    adjustPlanGoalId,
    profile,
    preferences,
    toggles,
  } = useDashboardUiStore(
    useShallow((state) => ({
      screen: state.screen,
      viewModel: state.viewModel,
      range: state.range,
      busy: state.busy,
      message: state.message,
      transactionFilter: state.transactionFilter,
      searchQuery: state.searchQuery,
      openDialog: state.openDialog,
      dialogError: state.dialogError,
      adjustPlanGoalId: state.adjustPlanGoalId,
      profile: state.profile,
      preferences: state.preferences,
      toggles: state.toggles,
    })),
  );

  const {
    setViewModel,
    setRange,
    setBusy,
    setMessage,
    clearMessage,
    setTransactionFilter,
    setSearchQuery,
    resetTransactionFilters,
    openDialogById,
    closeDialog,
    setDialogError,
    clearDialogError,
    setAdjustPlanGoalId,
    setProfile,
    setPreferences,
    setToggles,
    togglePreference,
  } = useDashboardUiStore(
    useShallow((state) => ({
      setViewModel: state.setViewModel,
      setRange: state.setRange,
      setBusy: state.setBusy,
      setMessage: state.setMessage,
      clearMessage: state.clearMessage,
      setTransactionFilter: state.setTransactionFilter,
      setSearchQuery: state.setSearchQuery,
      resetTransactionFilters: state.resetTransactionFilters,
      openDialogById: state.openDialogById,
      closeDialog: state.closeDialog,
      setDialogError: state.setDialogError,
      clearDialogError: state.clearDialogError,
      setAdjustPlanGoalId: state.setAdjustPlanGoalId,
      setProfile: state.setProfile,
      setPreferences: state.setPreferences,
      setToggles: state.setToggles,
      togglePreference: state.togglePreference,
    })),
  );

  const locale = useMemo(
    () => localeFromLanguagePreference(preferences.language, "en"),
    [preferences.language],
  );
  const [showSlowSkeleton, setShowSlowSkeleton] = useState(false);

  const copy = useMemo(
    () =>
      whenLocale(locale, {
        en: {
          actionCompleted: "Action completed.",
          actionFailed: "Action failed.",
          rangeUpdateFailed: "Range update failed.",
          dateRangeUpdated: "Date range updated.",
          reportExported: "Report exported.",
          exportFailed: "Export failed.",
          processing: "Processing...",
          settingsSaved: "Settings saved successfully.",
          sessionReset: "Current session reset successfully.",
          selectDateRangeTitle: "Select date range",
          selectDateRangeDescription:
            "Update your dashboard snapshot date range.",
          applyRange: "Apply range",
          fromDate: "From date",
          toDate: "To date",
          keepCurrentValue: "Leave empty to keep current value.",
          addFundsTitle: "Add funds",
          addFundsDescription:
            "Create a deposit transaction and update your balances.",
          addFundsSubmit: "Add funds",
          addFundsAmount: "Amount (IDR)",
          addFundsFieldTitle: "Title",
          addFundsCategory: "Category",
          addTransactionTitle: "Add transaction",
          addTransactionDescription: "Record a manual transaction.",
          addTransactionSubmit: "Add transaction",
          transactionTitle: "Transaction title",
          transactionCategory: "Category",
          transactionDirection: "Direction",
          transactionAmount: "Amount (IDR)",
          transactionAccountId: "Account ID",
          directionIncome: "Income",
          directionExpense: "Expense",
          directionTransfer: "Transfer",
          createGoalTitle: "Create goal",
          createGoalDescription: "Set a new savings goal target.",
          createGoalSubmit: "Create goal",
          goalName: "Goal name",
          goalTarget: "Target amount (IDR)",
          goalSaved: "Saved amount (IDR)",
          goalDeadline: "Deadline",
          adjustPlanTitle: "Adjust goal plan",
          adjustPlanDescription:
            "Update contribution, target, or deadline for a goal.",
          adjustPlanSubmit: "Apply changes",
          adjustGoalId: "Goal ID",
          adjustAddSavedAmount: "Add saved amount (IDR)",
          adjustNewTarget: "New target (IDR)",
          adjustNewDeadline: "New deadline",
        },
        id: {
          actionCompleted: "Aksi berhasil dijalankan.",
          actionFailed: "Aksi gagal.",
          rangeUpdateFailed: "Gagal memperbarui rentang.",
          dateRangeUpdated: "Rentang tanggal berhasil diperbarui.",
          reportExported: "Laporan berhasil diekspor.",
          exportFailed: "Ekspor gagal.",
          processing: "Memproses...",
          settingsSaved: "Pengaturan berhasil disimpan.",
          sessionReset: "Sesi saat ini berhasil direset.",
          selectDateRangeTitle: "Pilih rentang tanggal",
          selectDateRangeDescription:
            "Perbarui rentang tanggal snapshot dashboard Anda.",
          applyRange: "Terapkan rentang",
          fromDate: "Tanggal mulai",
          toDate: "Tanggal akhir",
          keepCurrentValue: "Kosongkan untuk mempertahankan nilai saat ini.",
          addFundsTitle: "Tambah dana",
          addFundsDescription:
            "Buat transaksi deposit dan perbarui saldo Anda.",
          addFundsSubmit: "Tambah dana",
          addFundsAmount: "Jumlah (IDR)",
          addFundsFieldTitle: "Judul",
          addFundsCategory: "Kategori",
          addTransactionTitle: "Tambah transaksi",
          addTransactionDescription: "Catat transaksi manual.",
          addTransactionSubmit: "Tambah transaksi",
          transactionTitle: "Judul transaksi",
          transactionCategory: "Kategori",
          transactionDirection: "Arah",
          transactionAmount: "Jumlah (IDR)",
          transactionAccountId: "ID akun",
          directionIncome: "Pemasukan",
          directionExpense: "Pengeluaran",
          directionTransfer: "Transfer",
          createGoalTitle: "Buat tujuan",
          createGoalDescription: "Tetapkan target tabungan baru.",
          createGoalSubmit: "Buat tujuan",
          goalName: "Nama tujuan",
          goalTarget: "Target jumlah (IDR)",
          goalSaved: "Jumlah terkumpul (IDR)",
          goalDeadline: "Tenggat",
          adjustPlanTitle: "Sesuaikan rencana tujuan",
          adjustPlanDescription:
            "Perbarui kontribusi, target, atau tenggat tujuan.",
          adjustPlanSubmit: "Terapkan perubahan",
          adjustGoalId: "ID tujuan",
          adjustAddSavedAmount: "Tambah jumlah tabungan (IDR)",
          adjustNewTarget: "Target baru (IDR)",
          adjustNewDeadline: "Tenggat baru",
        },
      }),
    [locale],
  );

  useEffect(() => {
    if (!busy) {
      setShowSlowSkeleton(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowSkeleton(true);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [busy]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettingsFromSupabase() {
      if (!userId) return;

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("user_settings")
          .select(
            "full_name,email,phone,role,currency,timezone,language,start_of_week,email_alerts,push_notifications,monthly_report,compact_mode",
          )
          .eq("user_id", userId)
          .maybeSingle<UserSettingsRow>();

        if (error || !data || cancelled) return;

        setProfile({
          fullName: data.full_name || DEFAULT_PROFILE.fullName,
          email: data.email || DEFAULT_PROFILE.email,
          phone: data.phone || DEFAULT_PROFILE.phone,
          role: data.role || DEFAULT_PROFILE.role,
        });

        setPreferences({
          currency: data.currency || DEFAULT_PREFERENCES.currency,
          timezone: data.timezone || DEFAULT_PREFERENCES.timezone,
          language: data.language || DEFAULT_PREFERENCES.language,
          startOfWeek: data.start_of_week === "Sunday" ? "Sunday" : "Monday",
        });

        setToggles(
          DEFAULT_TOGGLES.map((item) => {
            if (item.id === "email-alerts") {
              return { ...item, enabled: data.email_alerts };
            }
            if (item.id === "push-notifications") {
              return { ...item, enabled: data.push_notifications };
            }
            if (item.id === "monthly-report") {
              return { ...item, enabled: data.monthly_report };
            }
            if (item.id === "compact-mode") {
              return { ...item, enabled: data.compact_mode };
            }
            return item;
          }),
        );
      } catch {
        // Keep defaults when settings cannot be loaded.
      }
    }

    void loadSettingsFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [setPreferences, setProfile, setToggles, userId]);

  const buildQuery = useCallback(
    (overrideRange?: { from?: string; to?: string }) => {
      const params = new URLSearchParams();
      const effectiveRange = overrideRange ?? range;

      if (effectiveRange.from) params.set("from", effectiveRange.from);
      if (effectiveRange.to) params.set("to", effectiveRange.to);
      if (userId) params.set("userId", userId);

      return params.toString();
    },
    [range, userId],
  );

  const refreshSnapshot = useCallback(
    async (overrideRange?: { from?: string; to?: string }) => {
      const query = buildQuery(overrideRange);
      const path = `/api/dashboard/snapshot${query ? `?${query}` : ""}`;
      const payload = await callJsonApi<SnapshotApiData>(path);

      setViewModel(payload.viewModel);
      setRange(payload.range);
    },
    [buildQuery, setRange, setViewModel],
  );

  const runAction = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>,
      options?: {
        refreshSnapshotOnSuccess?: boolean;
        successMessage?: string;
      },
    ) => {
      setBusy(true);
      setMessage("");

      try {
        const result = await callJsonApi<{ message?: string }>(endpoint, {
          method: "POST",
          body: JSON.stringify({
            ...body,
            ...(userId ? { userId } : {}),
          }),
          headers: {
            "content-type": "application/json",
          },
        });

        const shouldRefreshSnapshot = options?.refreshSnapshotOnSuccess ?? true;
        if (shouldRefreshSnapshot) {
          await refreshSnapshot();
        }

        setMessage(
          result.message ?? options?.successMessage ?? copy.actionCompleted,
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : copy.actionFailed);
      } finally {
        setBusy(false);
      }
    },
    [
      copy.actionCompleted,
      copy.actionFailed,
      refreshSnapshot,
      setBusy,
      setMessage,
      userId,
    ],
  );

  const onSelectDateRange = useCallback(() => {
    clearDialogError();
    openDialogById("date-range");
  }, [clearDialogError, openDialogById]);

  const onSubmitDateRange = useCallback(
    async (values: ActionFormValues) => {
      const fromInput = values.from?.trim() ?? "";
      const toInput = values.to?.trim() ?? "";

      const nextRange = {
        from: fromInput || range.from,
        to: toInput || range.to,
      };

      setBusy(true);
      clearMessage();
      clearDialogError();

      try {
        await refreshSnapshot(nextRange);
        setMessage(copy.dateRangeUpdated);
        closeDialog();
      } catch (error) {
        const nextMessage =
          error instanceof Error ? error.message : copy.rangeUpdateFailed;
        setMessage(nextMessage);
        setDialogError(nextMessage);
      } finally {
        setBusy(false);
      }
    },
    [
      clearDialogError,
      clearMessage,
      closeDialog,
      copy.dateRangeUpdated,
      copy.rangeUpdateFailed,
      range.from,
      range.to,
      refreshSnapshot,
      setBusy,
      setDialogError,
      setMessage,
    ],
  );

  const onExportReport = useCallback(async () => {
    setBusy(true);
    setMessage("");

    try {
      const query = new URLSearchParams(buildQuery());
      query.set("format", "csv");

      const response = await fetch(
        `/api/dashboard/export?${query.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dashboard-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setMessage(copy.reportExported);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.exportFailed);
    } finally {
      setBusy(false);
    }
  }, [buildQuery, copy.exportFailed, copy.reportExported, setBusy, setMessage]);

  const onProfileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setProfile({
        ...profile,
        [name]: value,
      } as SettingsProfile);
    },
    [profile, setProfile],
  );

  const onPreferenceChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = event.target;
      setPreferences({
        ...preferences,
        [name]: value,
      } as SettingsPreferences);
    },
    [preferences, setPreferences],
  );

  const onTogglePreference = useCallback(
    (toggleId: string) => {
      togglePreference(toggleId as SettingsToggleId);
    },
    [togglePreference],
  );

  const onAddFunds = useCallback(() => {
    clearDialogError();
    openDialogById("add-funds");
  }, [clearDialogError, openDialogById]);

  const onSubmitAddFunds = useCallback(
    async (values: ActionFormValues) => {
      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Amount must be a positive number.");
        return;
      }

      const title = toOptionalString(values.title ?? "");
      const category = toOptionalString(values.category ?? "");

      setDialogError("");
      await runAction("/api/dashboard/actions/add-funds", {
        amount,
        title,
        category,
        occurredAt: new Date().toISOString(),
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onAddTransaction = useCallback(() => {
    clearDialogError();
    openDialogById("add-transaction");
  }, [clearDialogError, openDialogById]);

  const onSubmitAddTransaction = useCallback(
    async (values: ActionFormValues) => {
      const title = toOptionalString(values.title ?? "", true);
      if (title === null) {
        setDialogError("Transaction title is required.");
        return;
      }

      const category = toOptionalString(values.category ?? "", true);
      if (category === null) {
        setDialogError("Category is required.");
        return;
      }

      const direction = normalizeDirection(values.direction ?? "");
      if (!direction) {
        setDialogError(
          'Direction must be one of: "income", "expense", "transfer".',
        );
        return;
      }

      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Amount must be a positive number.");
        return;
      }

      const accountId = toOptionalString(values.accountId ?? "");

      setDialogError("");
      await runAction("/api/dashboard/actions/add-transaction", {
        title,
        category,
        direction,
        amount,
        accountId,
        occurredAt: new Date().toISOString(),
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onCreateGoal = useCallback(() => {
    clearDialogError();
    openDialogById("create-goal");
  }, [clearDialogError, openDialogById]);

  const onSubmitCreateGoal = useCallback(
    async (values: ActionFormValues) => {
      const name = toOptionalString(values.name ?? "", true);
      if (name === null) {
        setDialogError("Goal name is required.");
        return;
      }

      const target = toPositiveNumber(values.target ?? "");
      if (!target) {
        setDialogError("Target must be a positive number.");
        return;
      }

      const savedRaw = values.saved ?? "";
      const saved = savedRaw.trim() ? toNonNegativeNumber(savedRaw) : 0;
      if (saved === null) {
        setDialogError("Saved amount must be a non-negative number.");
        return;
      }

      const deadline = toIsoDate(values.deadline ?? "");
      if (!deadline) {
        setDialogError("Deadline must be a valid date.");
        return;
      }

      setDialogError("");
      await runAction("/api/dashboard/actions/create-goal", {
        name,
        target,
        saved,
        deadline,
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onAdjustPlan = useCallback(
    (goalId?: string) => {
      clearDialogError();
      setAdjustPlanGoalId(goalId ?? viewModel.goals[0]?.id ?? null);
      openDialogById("adjust-plan");
    },
    [clearDialogError, openDialogById, setAdjustPlanGoalId, viewModel.goals],
  );

  const onSubmitAdjustPlan = useCallback(
    async (values: ActionFormValues) => {
      const goalId = toOptionalString(values.goalId ?? "", true);
      if (goalId === null) {
        setDialogError("Goal ID is required.");
        return;
      }

      const addSavedAmountInput = values.addSavedAmount ?? "";
      const newTargetInput = values.newTarget ?? "";
      const newDeadlineInput = values.newDeadline ?? "";

      const addSavedAmount = parseOptionalPositive(addSavedAmountInput);
      const newTarget = parseOptionalPositive(newTargetInput);
      const newDeadline = newDeadlineInput.trim()
        ? toIsoDate(newDeadlineInput.trim())
        : undefined;

      if (addSavedAmountInput.trim() && addSavedAmount === undefined) {
        setDialogError("Add saved amount must be a positive number.");
        return;
      }

      if (newTargetInput.trim() && newTarget === undefined) {
        setDialogError("New target must be a positive number.");
        return;
      }

      if (newDeadlineInput.trim() && !newDeadline) {
        setDialogError("New deadline must be a valid date.");
        return;
      }

      if (
        addSavedAmount === undefined &&
        newTarget === undefined &&
        !newDeadline
      ) {
        setDialogError("Provide at least one adjustment field.");
        return;
      }

      setDialogError("");
      await runAction("/api/dashboard/actions/adjust-plan", {
        goalId,
        addSavedAmount,
        newTarget,
        newDeadline,
      });
      closeDialog();
      setAdjustPlanGoalId(null);
    },
    [closeDialog, runAction, setAdjustPlanGoalId, setDialogError],
  );

  const onSaveSettings = useCallback(() => {
    void runAction(
      "/api/dashboard/actions/save-settings",
      {
        profile,
        preferences,
        toggles: {
          emailAlerts:
            toggles.find((x) => x.id === "email-alerts")?.enabled ?? true,
          pushNotifications:
            toggles.find((x) => x.id === "push-notifications")?.enabled ?? true,
          monthlyReport:
            toggles.find((x) => x.id === "monthly-report")?.enabled ?? false,
          compactMode:
            toggles.find((x) => x.id === "compact-mode")?.enabled ?? false,
        },
      },
      {
        refreshSnapshotOnSuccess: false,
        successMessage: copy.settingsSaved,
      },
    );
  }, [copy.settingsSaved, preferences, profile, runAction, toggles]);

  const onResetSessions = useCallback(() => {
    void runAction(
      "/api/dashboard/actions/reset-sessions",
      {},
      {
        refreshSnapshotOnSuccess: false,
        successMessage: copy.sessionReset,
      },
    );
  }, [copy.sessionReset, runAction]);

  const dateRangeFields: ActionFormDialogField[] = [
    {
      name: "from",
      label: copy.fromDate,
      type: "date",
      defaultValue: range.from ?? "",
      description: copy.keepCurrentValue,
    },
    {
      name: "to",
      label: copy.toDate,
      type: "date",
      defaultValue: range.to ?? "",
      description: copy.keepCurrentValue,
    },
  ];

  const addFundsFields: ActionFormDialogField[] = [
    {
      name: "amount",
      label: copy.addFundsAmount,
      type: "text",
      defaultValue: "1,000,000",
      required: true,
      min: 0,
      step: 1000,
    },
    {
      name: "title",
      label: copy.addFundsFieldTitle,
      defaultValue: "Add funds",
    },
    {
      name: "category",
      label: copy.addFundsCategory,
      defaultValue: "Deposit",
    },
  ];

  const addTransactionFields: ActionFormDialogField[] = [
    {
      name: "title",
      label: copy.transactionTitle,
      defaultValue: "Manual transaction",
      required: true,
    },
    {
      name: "category",
      label: copy.transactionCategory,
      defaultValue: "General",
      required: true,
    },
    {
      name: "direction",
      label: copy.transactionDirection,
      type: "select",
      defaultValue: "expense",
      required: true,
      options: [
        { label: copy.directionIncome, value: "income" },
        { label: copy.directionExpense, value: "expense" },
        { label: copy.directionTransfer, value: "transfer" },
      ],
    },
    {
      name: "amount",
      label: copy.transactionAmount,
      type: "text",
      defaultValue: "150,000",
      required: true,
      min: 0,
      step: 1000,
    },
    {
      name: "accountId",
      label: copy.transactionAccountId,
    },
  ];

  const createGoalFields: ActionFormDialogField[] = [
    {
      name: "name",
      label: copy.goalName,
      defaultValue: "New goal",
      required: true,
    },
    {
      name: "target",
      label: copy.goalTarget,
      type: "text",
      defaultValue: "10,000,000",
      required: true,
      min: 0,
      step: 1000,
    },
    {
      name: "saved",
      label: copy.goalSaved,
      type: "text",
      defaultValue: "0",
      min: 0,
      step: 1000,
    },
    {
      name: "deadline",
      label: copy.goalDeadline,
      type: "date",
      defaultValue: nextDateMonths(6),
      required: true,
    },
  ];

  const adjustPlanFields: ActionFormDialogField[] = [
    {
      name: "goalId",
      label: copy.adjustGoalId,
      defaultValue: adjustPlanGoalId ?? viewModel.goals[0]?.id ?? "",
      required: true,
    },
    {
      name: "addSavedAmount",
      label: copy.adjustAddSavedAmount,
      type: "text",
      min: 0,
      step: 1000,
    },

    {
      name: "newTarget",
      label: copy.adjustNewTarget,
      type: "text",
      min: 0,
      step: 1000,
    },
    {
      name: "newDeadline",
      label: copy.adjustNewDeadline,
      type: "date",
    },
  ];

  const renderScreen = () => {
    if (screen === "dashboard") {
      return (
        <DashboardScreen
          viewModel={viewModel}
          activeSidebarItemId="dashboard"
          locale={locale}
          onAddWidget={() => void onCreateGoal()}
          onSelectDateRange={() => void onSelectDateRange()}
        />
      );
    }

    if (screen === "wallet") {
      return (
        <WalletScreen
          viewModel={viewModel}
          locale={locale}
          onAddFunds={() => void onAddFunds()}
          onSelectDateRange={() => void onSelectDateRange()}
        />
      );
    }

    if (screen === "transactions") {
      return (
        <TransactionsScreen
          viewModel={viewModel}
          locale={locale}
          activeFilter={transactionFilter}
          searchQuery={searchQuery}
          onFilterChangeAction={setTransactionFilter}
          onSearchChangeAction={(event) => setSearchQuery(event.target.value)}
          onResetFiltersAction={() => {
            resetTransactionFilters();
          }}
          onAddTransactionAction={() => void onAddTransaction()}
          onSelectDateRangeAction={() => void onSelectDateRange()}
        />
      );
    }

    if (screen === "goals") {
      return (
        <GoalsScreen
          viewModel={viewModel}
          locale={locale}
          onCreateGoal={() => void onCreateGoal()}
          onAdjustPlanForGoal={(goalId) => void onAdjustPlan(goalId)}
          onSelectDateRange={() => void onSelectDateRange()}
        />
      );
    }

    if (screen === "analytics") {
      return (
        <AnalyticsScreen
          viewModel={viewModel}
          locale={locale}
          onSelectDateRange={() => void onSelectDateRange()}
          onExportReport={() => void onExportReport()}
        />
      );
    }

    return (
      <SettingsScreen
        viewModel={viewModel}
        locale={locale}
        profile={profile}
        preferences={preferences}
        toggles={toggles}
        onProfileChange={onProfileChange}
        onPreferenceChange={onPreferenceChange}
        onTogglePreference={onTogglePreference}
        onPreviewChanges={() => void onSelectDateRange()}
        onSaveSettings={onSaveSettings}
        onResetSessions={onResetSessions}
      />
    );
  };

  return (
    <>
      {renderScreen()}

      <ActionFormDialog
        open={openDialog === "date-range"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("date-range") : closeDialog()
        }
        title={copy.selectDateRangeTitle}
        description={copy.selectDateRangeDescription}
        fields={dateRangeFields}
        submitLabel={copy.applyRange}
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitDateRange}
      />

      <ActionFormDialog
        open={openDialog === "add-funds"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("add-funds") : closeDialog()
        }
        title={copy.addFundsTitle}
        description={copy.addFundsDescription}
        fields={addFundsFields}
        submitLabel={copy.addFundsSubmit}
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAddFunds}
      />

      <ActionFormDialog
        open={openDialog === "add-transaction"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("add-transaction") : closeDialog()
        }
        title={copy.addTransactionTitle}
        description={copy.addTransactionDescription}
        fields={addTransactionFields}
        submitLabel={copy.addTransactionSubmit}
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAddTransaction}
      />

      <ActionFormDialog
        open={openDialog === "create-goal"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("create-goal") : closeDialog()
        }
        title={copy.createGoalTitle}
        description={copy.createGoalDescription}
        fields={createGoalFields}
        submitLabel={copy.createGoalSubmit}
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitCreateGoal}
      />

      <ActionFormDialog
        open={openDialog === "adjust-plan"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("adjust-plan") : closeDialog()
        }
        title={copy.adjustPlanTitle}
        description={copy.adjustPlanDescription}
        fields={adjustPlanFields}
        submitLabel={copy.adjustPlanSubmit}
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAdjustPlan}
      />

      {(busy || message) && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground shadow-sm">
          {busy ? (
            showSlowSkeleton ? (
              <div className="w-36 space-y-1.5">
                <div className="h-2 w-full animate-pulse rounded bg-muted/40" />
                <div className="h-2 w-4/5 animate-pulse rounded bg-muted/40" />
              </div>
            ) : (
              copy.processing
            )
          ) : (
            message
          )}
        </div>
      )}
    </>
  );
}

async function callJsonApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    message?: string;
    data?: T;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }

  return payload.data as T;
}

function toOptionalString(value: string | null, required: true): string | null;
function toOptionalString(
  value: string | null,
  required?: false,
): string | null | undefined;
function toOptionalString(
  value: string | null,
  required = false,
): string | null | undefined {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return required ? null : undefined;
  return trimmed;
}

function toPositiveNumber(value: string): number | null {
  const parsed = Number(normalizeAmountInput(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function toNonNegativeNumber(value: string): number | null {
  const parsed = Number(normalizeAmountInput(value));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseOptionalPositive(value: string): number | undefined {
  const normalized = normalizeAmountInput(value);
  if (!normalized) return undefined;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;

  return parsed;
}

function normalizeAmountInput(value: string): string {
  return value.replace(/,/g, "").trim();
}

function normalizeDirection(
  value: string,
): "income" | "expense" | "transfer" | undefined {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "income" ||
    normalized === "expense" ||
    normalized === "transfer"
  ) {
    return normalized;
  }
  return undefined;
}

function toIsoDate(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function nextDateMonths(monthsAhead: number): string {
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth() + monthsAhead,
    now.getDate(),
  );
  return target.toISOString().slice(0, 10);
}
