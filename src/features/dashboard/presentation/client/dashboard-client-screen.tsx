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
import { ActionPill } from "../components/action-pill";
import { DashboardCard } from "../components/dashboard-card";
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
import { SidebarPageShell } from "../screens/sidebar-page-shell";
import { getSupabaseBrowserClient } from "@/src/shared/supabase/browser-client";
import { whenLocale } from "@/src/shared/i18n/locale";

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
  daily_transaction_limit: number | null;
  monthly_debt_installment: number | null;
  emergency_fund_balance: number | null;
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
    quickRangePreset,
    pagination,
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
      quickRangePreset: state.quickRangePreset,
      pagination: state.pagination,
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
    setQuickRangePreset,
    setPaginationPage,
    resetPagination,
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
      setQuickRangePreset: state.setQuickRangePreset,
      setPaginationPage: state.setPaginationPage,
      resetPagination: state.resetPagination,
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

  const locale = "id" as const;
  const [showSlowSkeleton, setShowSlowSkeleton] = useState(false);
  const [dailyLimitDialogOpen, setDailyLimitDialogOpen] = useState(false);
  const [apiLoadingCount, setApiLoadingCount] = useState(0);
  const [openDebtMenuId, setOpenDebtMenuId] = useState<string | null>(null);

  const beginApiLoading = useCallback(() => {
    setApiLoadingCount((current) => current + 1);
  }, []);

  const endApiLoading = useCallback(() => {
    setApiLoadingCount((current) => Math.max(0, current - 1));
  }, []);

  const withApiLoading = useCallback(
    async <TResult,>(operation: () => TResult): Promise<Awaited<TResult>> => {
      beginApiLoading();

      try {
        return await operation();
      } finally {
        endApiLoading();
      }
    },
    [beginApiLoading, endApiLoading],
  );

  const isApiLoading = apiLoadingCount > 0;

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
          rangePreset: "Range preset",
          presetToday: "Today",
          presetWeek: "This week",
          presetMonthly: "This month",
          presetCustom: "Custom range",
          fromDate: "From date",
          toDate: "To date",
          keepCurrentValue: "Leave empty to keep current value.",
          customRangeLimit:
            "Custom range supports up to 3 months (from start date).",
          openDailyLimitSettings: "Set daily limit",
          dailyLimitDialogTitle: "Daily limit settings",
          dailyLimitDialogDescription:
            "Set your preferred daily expense limit.",
          dailyLimitField: "Daily transaction limit (IDR)",
          dailyLimitDialogSubmit: "Save daily limit",
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
          directionIncome: "Income",
          directionExpense: "Expense",
          createGoalTitle: "Create goal",
          createGoalDescription: "Set a new savings goal target.",
          createGoalSubmit: "Create goal",
          goalName: "Goal name",
          goalTarget: "Target amount (IDR)",
          goalSaved: "Saved amount (IDR)",
          goalDeadline: "Deadline",
          adjustPlanTitle: "Update saved progress",
          adjustPlanDescription:
            "Record additional savings progress for this goal.",
          adjustPlanSubmit: "Save progress",
          adjustAddSavedAmount: "Add saved amount (IDR)",
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
          rangePreset: "Preset rentang",
          presetToday: "Hari ini",
          presetWeek: "Minggu ini",
          presetMonthly: "Bulan ini",
          presetCustom: "Rentang kustom",
          fromDate: "Tanggal mulai",
          toDate: "Tanggal akhir",
          keepCurrentValue: "Kosongkan untuk mempertahankan nilai saat ini.",
          customRangeLimit:
            "Rentang kustom maksimal 3 bulan (dari tanggal mulai).",
          openDailyLimitSettings: "Atur batas harian",
          dailyLimitDialogTitle: "Pengaturan batas harian",
          dailyLimitDialogDescription:
            "Atur batas pengeluaran harian sesuai kebutuhan Anda.",
          dailyLimitField: "Batas transaksi harian (IDR)",
          dailyLimitDialogSubmit: "Simpan batas",
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
          directionIncome: "Pemasukan",
          directionExpense: "Pengeluaran",
          createGoalTitle: "Buat tujuan",
          createGoalDescription: "Tetapkan target tabungan baru.",
          createGoalSubmit: "Buat tujuan",
          goalName: "Nama tujuan",
          goalTarget: "Target jumlah (IDR)",
          goalSaved: "Jumlah terkumpul (IDR)",
          goalDeadline: "Tenggat",
          adjustPlanTitle: "Update progres tabungan",
          adjustPlanDescription:
            "Catat tambahan uang yang sudah terkumpul untuk tujuan ini.",
          adjustPlanSubmit: "Simpan progres",
          adjustAddSavedAmount: "Tambah jumlah tabungan (IDR)",
        },
      }),
    [locale],
  );

  useEffect(() => {
    const loadingActive = busy || isApiLoading;

    if (!loadingActive) {
      setShowSlowSkeleton(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowSkeleton(true);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [busy, isApiLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettingsFromSupabase() {
      if (!userId) return;

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await withApiLoading(() =>
          supabase
            .from("user_settings")
            .select(
              "full_name,email,phone,role,currency,timezone,language,start_of_week,email_alerts,push_notifications,monthly_report,compact_mode,daily_transaction_limit,monthly_debt_installment,emergency_fund_balance",
            )
            .eq("user_id", userId)
            .maybeSingle<UserSettingsRow>(),
        );

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
          dailyTransactionLimit:
            toPositiveNumberFromUnknown(data.daily_transaction_limit) ??
            DEFAULT_PREFERENCES.dailyTransactionLimit,
          monthlyDebtInstallment:
            typeof data.monthly_debt_installment === "number" &&
            Number.isFinite(data.monthly_debt_installment) &&
            data.monthly_debt_installment >= 0
              ? data.monthly_debt_installment
              : DEFAULT_PREFERENCES.monthlyDebtInstallment,
          emergencyFundBalance:
            typeof data.emergency_fund_balance === "number" &&
            Number.isFinite(data.emergency_fund_balance) &&
            data.emergency_fund_balance >= 0
              ? data.emergency_fund_balance
              : DEFAULT_PREFERENCES.emergencyFundBalance,
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
  }, [setPreferences, setProfile, setToggles, userId, withApiLoading]);

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
      const payload = await withApiLoading(() =>
        callJsonApi<SnapshotApiData>(path),
      );

      setViewModel(payload.viewModel);
      setRange(payload.range);
    },
    [buildQuery, setRange, setViewModel, withApiLoading],
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
        const result = await withApiLoading(() =>
          callJsonApi<{ message?: string }>(endpoint, {
            method: "POST",
            body: JSON.stringify({
              ...body,
              ...(userId ? { userId } : {}),
            }),
            headers: {
              "content-type": "application/json",
            },
          }),
        );

        const shouldRefreshSnapshot = options?.refreshSnapshotOnSuccess ?? true;
        if (shouldRefreshSnapshot) {
          await refreshSnapshot();
          resetPagination();
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
      resetPagination,
      setBusy,
      setMessage,
      userId,
      withApiLoading,
    ],
  );

  const onSelectDateRange = useCallback(() => {
    clearDialogError();
    openDialogById("date-range");
  }, [clearDialogError, openDialogById]);

  const onOpenDailyLimitSettings = useCallback(() => {
    clearDialogError();
    setDailyLimitDialogOpen(true);
  }, [clearDialogError]);

  const onSubmitDailyLimitSettings = useCallback(
    async (values: ActionFormValues) => {
      const dailyLimit = toPositiveNumber(values.dailyTransactionLimit ?? "");
      if (!dailyLimit) {
        setDialogError("Batas transaksi harian harus berupa angka positif.");
        return;
      }

      const monthlyDebtInstallment = toNonNegativeNumberFromUnknown(
        preferences.monthlyDebtInstallment,
      );
      if (monthlyDebtInstallment === null) {
        setDialogError(
          "Nominal cicilan bulanan harus berupa angka nol atau positif.",
        );
        return;
      }

      const emergencyFundBalance = toNonNegativeNumberFromUnknown(
        preferences.emergencyFundBalance,
      );
      if (emergencyFundBalance === null) {
        setDialogError(
          "Saldo dana darurat harus berupa angka nol atau positif.",
        );
        return;
      }

      const nextPreferences: SettingsPreferences = {
        ...preferences,
        dailyTransactionLimit: dailyLimit,
        monthlyDebtInstallment,
        emergencyFundBalance,
      };

      setDialogError("");
      setPreferences(nextPreferences);

      await runAction(
        "/api/dashboard/actions/save-settings",
        {
          profile,
          preferences: nextPreferences,
          toggles: {
            emailAlerts:
              toggles.find((x) => x.id === "email-alerts")?.enabled ?? true,
            pushNotifications:
              toggles.find((x) => x.id === "push-notifications")?.enabled ??
              true,
            monthlyReport:
              toggles.find((x) => x.id === "monthly-report")?.enabled ?? false,
            compactMode:
              toggles.find((x) => x.id === "compact-mode")?.enabled ?? false,
          },
        },
        {
          refreshSnapshotOnSuccess: true,
          successMessage: copy.settingsSaved,
        },
      );

      setDailyLimitDialogOpen(false);
    },
    [
      copy.settingsSaved,
      preferences,
      profile,
      runAction,
      setDialogError,
      setPreferences,
      toggles,
    ],
  );

  const onSubmitDateRange = useCallback(
    async (values: ActionFormValues) => {
      const preset = normalizeQuickRangePreset(
        values.preset ?? quickRangePreset,
      );

      let nextRange: { from: string; to: string };

      if (preset === "today" || preset === "week" || preset === "monthly") {
        nextRange = getPresetDateRange(preset, new Date());
      } else {
        const fromInput = values.from?.trim() ?? "";
        const toInput = values.to?.trim() ?? "";

        const resolvedFrom = fromInput || range.from;
        const resolvedTo = toInput || range.to;

        if (!resolvedFrom || !resolvedTo) {
          setDialogError(
            "Tanggal mulai dan akhir wajib diisi untuk rentang kustom.",
          );
          return;
        }

        if (!isIsoDateString(resolvedFrom) || !isIsoDateString(resolvedTo)) {
          setDialogError("Format tanggal tidak valid.");
          return;
        }

        if (new Date(resolvedFrom).getTime() > new Date(resolvedTo).getTime()) {
          setDialogError(
            "Tanggal mulai harus sebelum atau sama dengan tanggal akhir.",
          );
          return;
        }

        if (!isWithinThreeMonths(resolvedFrom, resolvedTo)) {
          setDialogError(copy.customRangeLimit);
          return;
        }

        nextRange = {
          from: resolvedFrom,
          to: resolvedTo,
        };
      }

      setBusy(true);
      clearMessage();
      clearDialogError();

      try {
        await refreshSnapshot(nextRange);
        setQuickRangePreset(preset);
        resetPagination();
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
      copy.customRangeLimit,
      copy.dateRangeUpdated,
      copy.rangeUpdateFailed,
      quickRangePreset,
      range.from,
      range.to,
      refreshSnapshot,
      resetPagination,
      setBusy,
      setDialogError,
      setMessage,
      setQuickRangePreset,
    ],
  );

  const onExportReport = useCallback(async () => {
    setBusy(true);
    setMessage("");

    try {
      const query = new URLSearchParams(buildQuery());
      query.set("format", "pdf");

      const response = await withApiLoading(() =>
        fetch(`/api/dashboard/export?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        }),
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
        .slice(0, 10)}.pdf`;
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
  }, [
    buildQuery,
    copy.exportFailed,
    copy.reportExported,
    setBusy,
    setMessage,
    withApiLoading,
  ]);

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
    (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
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
        setDialogError("Jumlah harus berupa angka positif.");
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
        setDialogError("Judul transaksi wajib diisi.");
        return;
      }

      const category = toOptionalString(values.category ?? "", true);
      if (category === null) {
        setDialogError("Kategori wajib diisi.");
        return;
      }

      const direction = normalizeDirection(values.direction ?? "");
      if (!direction) {
        setDialogError(
          'Arah transaksi harus salah satu: "income" atau "expense".',
        );
        return;
      }

      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Jumlah harus berupa angka positif.");
        return;
      }

      setDialogError("");
      await runAction("/api/dashboard/actions/add-transaction", {
        title,
        category,
        direction,
        amount,
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
        setDialogError("Nama tujuan wajib diisi.");
        return;
      }

      const target = toPositiveNumber(values.target ?? "");
      if (!target) {
        setDialogError("Target harus berupa angka positif.");
        return;
      }

      const savedRaw = values.saved ?? "";
      const saved = savedRaw.trim() ? toNonNegativeNumber(savedRaw) : 0;
      if (saved === null) {
        setDialogError("Jumlah tabungan harus berupa angka nol atau positif.");
        return;
      }

      const deadline = toIsoDate(values.deadline ?? "");
      if (!deadline) {
        setDialogError("Tenggat harus berupa tanggal yang valid.");
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
      const goalId = adjustPlanGoalId ?? viewModel.goals[0]?.id ?? null;
      if (goalId === null) {
        setDialogError("Tujuan tidak ditemukan.");
        return;
      }

      const addSavedAmountInput = values.addSavedAmount ?? "";
      const addSavedAmount = parseOptionalPositive(addSavedAmountInput);

      if (addSavedAmountInput.trim() && addSavedAmount === undefined) {
        setDialogError("Tambahan tabungan harus berupa angka positif.");
        return;
      }

      if (addSavedAmount === undefined) {
        setDialogError("Jumlah tabungan yang ditambahkan wajib diisi.");
        return;
      }

      setDialogError("");
      await runAction("/api/dashboard/actions/adjust-plan", {
        goalId,
        addSavedAmount,
      });
      closeDialog();
      setAdjustPlanGoalId(null);
    },
    [
      adjustPlanGoalId,
      closeDialog,
      runAction,
      setAdjustPlanGoalId,
      setDialogError,
      viewModel.goals,
    ],
  );

  const onSaveSettings = useCallback(() => {
    const dailyTransactionLimit = toPositiveNumberFromUnknown(
      preferences.dailyTransactionLimit,
    );

    if (dailyTransactionLimit === null) {
      setMessage("Batas transaksi harian harus berupa angka positif.");
      return;
    }

    const monthlyDebtInstallment = toNonNegativeNumberFromUnknown(
      preferences.monthlyDebtInstallment,
    );

    if (monthlyDebtInstallment === null) {
      setMessage(
        "Nominal cicilan bulanan harus berupa angka nol atau positif.",
      );
      return;
    }

    const emergencyFundBalance = toNonNegativeNumberFromUnknown(
      preferences.emergencyFundBalance,
    );

    if (emergencyFundBalance === null) {
      setMessage("Saldo dana darurat harus berupa angka nol atau positif.");
      return;
    }

    void runAction(
      "/api/dashboard/actions/save-settings",
      {
        profile,
        preferences: {
          ...preferences,
          dailyTransactionLimit,
          monthlyDebtInstallment,
          emergencyFundBalance,
        },
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
  }, [
    copy.settingsSaved,
    preferences,
    profile,
    runAction,
    setMessage,
    toggles,
  ]);

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

  const onOpenOverSpeedAlert = useCallback(() => {
    clearDialogError();
    openDialogById("set-over-speed-alert");
  }, [clearDialogError, openDialogById]);

  const onOpenRolloverBudget = useCallback(() => {
    clearDialogError();
    openDialogById("configure-rollover-budget");
  }, [clearDialogError, openDialogById]);

  const onOpenAddSubscription = useCallback(() => {
    clearDialogError();
    openDialogById("add-subscription");
  }, [clearDialogError, openDialogById]);

  const onOpenAddBill = useCallback(() => {
    clearDialogError();
    openDialogById("add-bill");
  }, [clearDialogError, openDialogById]);

  const onOpenAddDebt = useCallback(() => {
    clearDialogError();
    openDialogById("add-debt");
  }, [clearDialogError, openDialogById]);

  const onOpenAddReceivable = useCallback(() => {
    clearDialogError();
    openDialogById("add-receivable");
  }, [clearDialogError, openDialogById]);

  const onOpenRunDebtStrategy = useCallback(() => {
    clearDialogError();
    openDialogById("run-debt-strategy");
  }, [clearDialogError, openDialogById]);

  const onSubmitOverSpeedAlert = useCallback(
    async (values: ActionFormValues) => {
      const category = toOptionalString(values.category ?? "", true);
      if (!category) {
        setDialogError("Kategori wajib diisi.");
        return;
      }

      const thresholdPct = toPositiveNumber(values.thresholdPct ?? "");
      if (!thresholdPct || thresholdPct > 100) {
        setDialogError(
          "Persentase batas over-speed harus antara 1 sampai 100.",
        );
        return;
      }

      setDialogError("");
      setMessage(
        `Peringatan over-speed untuk ${category} diatur pada ${Math.round(
          thresholdPct,
        )}% dari ritme harian.`,
      );
      closeDialog();
    },
    [closeDialog, setDialogError, setMessage],
  );

  const onSubmitRolloverBudget = useCallback(
    async (values: ActionFormValues) => {
      const rolloverPct = toNonNegativeNumber(values.rolloverPct ?? "");
      if (rolloverPct === null || rolloverPct > 100) {
        setDialogError("Persentase rollover harus antara 0 sampai 100.");
        return;
      }

      setDialogError("");
      setMessage(
        `Rollover budget aktif: ${Math.round(
          rolloverPct,
        )}% sisa anggaran akan ditambahkan ke bulan berikutnya.`,
      );
      closeDialog();
    },
    [closeDialog, setDialogError, setMessage],
  );

  const onSubmitAddSubscription = useCallback(
    async (values: ActionFormValues) => {
      const service = toOptionalString(values.service ?? "", true);
      if (!service) {
        setDialogError("Nama layanan wajib diisi.");
        return;
      }

      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Jumlah harus berupa angka positif.");
        return;
      }

      const debitDate = toIsoDate(values.debitDate ?? "");
      if (!debitDate) {
        setDialogError("Tanggal debit harus berupa tanggal valid.");
        return;
      }

      setDialogError("");
      await runAction("/api/dashboard/actions/add-transaction", {
        title: `Langganan: ${service}`,
        category: "Subscription",
        direction: "expense",
        amount,
        occurredAt: new Date(`${debitDate}T08:00:00.000Z`).toISOString(),
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onSubmitAddBill = useCallback(
    async (values: ActionFormValues) => {
      const billName = toOptionalString(values.billName ?? "", true);
      if (!billName) {
        setDialogError("Nama tagihan wajib diisi.");
        return;
      }

      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Jumlah harus berupa angka positif.");
        return;
      }

      const dueDate = toIsoDate(values.dueDate ?? "");
      if (!dueDate) {
        setDialogError("Tanggal jatuh tempo harus berupa tanggal valid.");
        return;
      }

      const category = toOptionalString(values.category ?? "") ?? "Tagihan";

      setDialogError("");
      await runAction("/api/dashboard/actions/add-transaction", {
        title: `Tagihan: ${billName}`,
        category,
        direction: "expense",
        amount,
        occurredAt: new Date(`${dueDate}T08:00:00.000Z`).toISOString(),
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onSubmitAddDebt = useCallback(
    async (values: ActionFormValues) => {
      const creditor = toOptionalString(values.creditor ?? "", true);
      if (!creditor) {
        setDialogError("Nama kreditur wajib diisi.");
        return;
      }

      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Jumlah hutang harus berupa angka positif.");
        return;
      }

      const status = normalizePaymentStatus(values.status ?? "");
      if (!status) {
        setDialogError('Status hutang harus dipilih: "paid" atau "unpaid".');
        return;
      }

      setDialogError("");
      await runAction("/api/dashboard/actions/add-payable", {
        creditor,
        amount,
        status,
        occurredAt: new Date().toISOString(),
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onSubmitAddReceivable = useCallback(
    async (values: ActionFormValues) => {
      const debtor = toOptionalString(values.debtor ?? "", true);
      if (!debtor) {
        setDialogError("Nama peminjam wajib diisi.");
        return;
      }

      const amount = toPositiveNumber(values.amount ?? "");
      if (!amount) {
        setDialogError("Jumlah piutang harus berupa angka positif.");
        return;
      }

      const status = normalizePaymentStatus(values.status ?? "");
      if (!status) {
        setDialogError('Status piutang harus dipilih: "paid" atau "unpaid".');
        return;
      }

      const expectedDate = toIsoDate(values.expectedDate ?? "");
      const occurredAt = expectedDate
        ? new Date(`${expectedDate}T08:00:00.000Z`).toISOString()
        : new Date().toISOString();

      setDialogError("");
      await runAction("/api/dashboard/actions/add-receivable", {
        debtor,
        amount,
        status,
        occurredAt,
      });
      closeDialog();
    },
    [closeDialog, runAction, setDialogError],
  );

  const onToggleDebtStatus = useCallback(
    async (transactionId: string, status: "paid" | "unpaid") => {
      setDialogError("");
      await runAction("/api/dashboard/actions/update-debt-status", {
        transactionId,
        status,
      });
      setOpenDebtMenuId(null);
    },
    [runAction, setDialogError],
  );

  const onSubmitRunDebtStrategy = useCallback(
    async (values: ActionFormValues) => {
      const strategy = (values.strategy ?? "").trim().toLowerCase();
      if (strategy !== "snowball" && strategy !== "avalanche") {
        setDialogError('Strategi harus "snowball" atau "avalanche".');
        return;
      }

      const extraPayment = toNonNegativeNumber(values.extraPayment ?? "") ?? 0;

      setDialogError("");
      setMessage(
        strategy === "avalanche"
          ? `Strategi Avalanche aktif. Prioritas pembayaran pada bunga tertinggi dengan ekstra pembayaran ${formatIdr(
              extraPayment,
            )}.`
          : `Strategi Snowball aktif. Prioritas pembayaran pada saldo terkecil dengan ekstra pembayaran ${formatIdr(
              extraPayment,
            )}.`,
      );
      closeDialog();
    },
    [closeDialog, setDialogError, setMessage],
  );

  const dateRangeFields: ActionFormDialogField[] = [
    {
      name: "preset",
      label: copy.rangePreset,
      type: "select",
      placeholder: copy.rangePreset,
      defaultValue: quickRangePreset,
      required: true,
      options: [
        { label: copy.presetToday, value: "today" },
        { label: copy.presetWeek, value: "week" },
        { label: copy.presetMonthly, value: "monthly" },
        { label: copy.presetCustom, value: "custom" },
      ],
    },
    {
      name: "from",
      label: copy.fromDate,
      type: "date",
      placeholder: "Pilih tanggal mulai",
      description: copy.customRangeLimit,
    },
    {
      name: "to",
      label: copy.toDate,
      type: "date",
      placeholder: "Pilih tanggal akhir",
      description: copy.keepCurrentValue,
    },
  ];

  const dailyLimitSettingsFields: ActionFormDialogField[] = [
    {
      name: "dailyTransactionLimit",
      label: copy.dailyLimitField,
      type: "text",
      placeholder: "Contoh: 10000000",
      defaultValue: `${preferences.dailyTransactionLimit ?? ""}`,
      required: true,
      formatThousands: true,
      min: 1,
      step: 1000,
    },
  ];

  const addFundsFields: ActionFormDialogField[] = [
    {
      name: "amount",
      label: copy.addFundsAmount,
      type: "text",
      placeholder: "Contoh: 1.000.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "title",
      label: copy.addFundsFieldTitle,
      placeholder: "Contoh: Top up saldo",
    },
    {
      name: "category",
      label: copy.addFundsCategory,
      placeholder: "Contoh: Setoran",
    },
  ];

  const addTransactionFields: ActionFormDialogField[] = [
    {
      name: "title",
      label: copy.transactionTitle,
      placeholder: "Contoh: Makan siang kantor",
      required: true,
    },
    {
      name: "category",
      label: copy.transactionCategory,
      type: "select",
      placeholder: "Pilih kategori",
      required: true,
      options: [
        { label: "Makanan & Minuman", value: "Makanan & Minuman" },
        { label: "Transportasi", value: "Transportasi" },
        { label: "Belanja", value: "Belanja" },
        { label: "Tagihan", value: "Tagihan" },
        { label: "Kesehatan", value: "Kesehatan" },
        { label: "Pendidikan", value: "Pendidikan" },
        { label: "Hiburan", value: "Hiburan" },
        { label: "Rumah Tangga", value: "Rumah Tangga" },
        { label: "Gaji", value: "Gaji" },
        { label: "Investasi", value: "Investasi" },
      ],
    },
    {
      name: "direction",
      label: copy.transactionDirection,
      type: "select",
      placeholder: "Pilih arah transaksi",
      required: true,
      options: [
        { label: copy.directionIncome, value: "income" },
        { label: copy.directionExpense, value: "expense" },
      ],
    },
    {
      name: "amount",
      label: copy.transactionAmount,
      type: "text",
      placeholder: "Contoh: 150.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
  ];

  const createGoalFields: ActionFormDialogField[] = [
    {
      name: "name",
      label: copy.goalName,
      placeholder: "Contoh: Dana darurat",
      required: true,
    },
    {
      name: "target",
      label: copy.goalTarget,
      type: "text",
      placeholder: "Contoh: 10.000.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "saved",
      label: copy.goalSaved,
      type: "text",
      placeholder: "Contoh: 0",
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "deadline",
      label: copy.goalDeadline,
      type: "date",
      placeholder: "Pilih tenggat",
      required: true,
    },
  ];

  const adjustPlanFields: ActionFormDialogField[] = [
    {
      name: "addSavedAmount",
      label: copy.adjustAddSavedAmount,
      type: "text",
      placeholder: "Contoh: 500.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
  ];

  const overSpeedAlertFields: ActionFormDialogField[] = [
    {
      name: "category",
      label: "Kategori pengeluaran",
      type: "select",
      placeholder: "Pilih kategori",
      required: true,
      options: [
        { label: "Kopi", value: "Kopi" },
        { label: "Hobi", value: "Hobi" },
        { label: "Hiburan", value: "Hiburan" },
        { label: "Belanja", value: "Belanja" },
      ],
    },
    {
      name: "thresholdPct",
      label: "Batas over-speed (%)",
      type: "text",
      placeholder: "Contoh: 65",
      required: true,
      formatThousands: true,
      min: 1,
      max: 100,
      step: 1,
    },
  ];

  const rolloverBudgetFields: ActionFormDialogField[] = [
    {
      name: "rolloverPct",
      label: "Persentase rollover (%)",
      type: "text",
      placeholder: "Contoh: 100",
      required: true,
      formatThousands: true,
      min: 0,
      max: 100,
      step: 1,
    },
  ];

  const subscriptionFields: ActionFormDialogField[] = [
    {
      name: "service",
      label: "Nama layanan",
      placeholder: "Contoh: Netflix",
      required: true,
    },
    {
      name: "amount",
      label: "Biaya langganan (IDR)",
      type: "text",
      placeholder: "Contoh: 180.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "debitDate",
      label: "Tanggal debit",
      type: "date",
      required: true,
    },
  ];

  const billFields: ActionFormDialogField[] = [
    {
      name: "billName",
      label: "Nama tagihan",
      placeholder: "Contoh: Listrik",
      required: true,
    },
    {
      name: "category",
      label: "Kategori",
      type: "select",
      placeholder: "Pilih kategori",
      required: true,
      options: [
        { label: "Tagihan", value: "Tagihan" },
        { label: "Internet", value: "Internet" },
        { label: "Cicilan", value: "Cicilan" },
      ],
    },
    {
      name: "amount",
      label: "Nominal tagihan (IDR)",
      type: "text",
      placeholder: "Contoh: 650.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "dueDate",
      label: "Jatuh tempo",
      type: "date",
      required: true,
    },
  ];

  const debtFields: ActionFormDialogField[] = [
    {
      name: "creditor",
      label: "Kreditur / sumber hutang",
      placeholder: "Contoh: Bank A",
      required: true,
    },
    {
      name: "amount",
      label: "Nominal cicilan (IDR)",
      type: "text",
      placeholder: "Contoh: 1.500.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "status",
      label: "Status pembayaran",
      type: "select",
      placeholder: "Pilih status",
      required: true,
      options: [
        { label: "Unpaid (belum dibayar)", value: "unpaid" },
        { label: "Paid (sudah dibayar)", value: "paid" },
      ],
    },
  ];

  const receivableFields: ActionFormDialogField[] = [
    {
      name: "debtor",
      label: "Nama peminjam",
      placeholder: "Contoh: Budi",
      required: true,
    },
    {
      name: "amount",
      label: "Nominal piutang (IDR)",
      type: "text",
      placeholder: "Contoh: 500.000",
      required: true,
      formatThousands: true,
      min: 0,
      step: 1000,
    },
    {
      name: "status",
      label: "Status pembayaran",
      type: "select",
      placeholder: "Pilih status",
      required: true,
      options: [
        { label: "Unpaid (belum dibayar)", value: "unpaid" },
        { label: "Paid (sudah dibayar)", value: "paid" },
      ],
    },
    {
      name: "expectedDate",
      label: "Perkiraan pelunasan",
      type: "date",
    },
  ];

  const debtStrategyFields: ActionFormDialogField[] = [
    {
      name: "strategy",
      label: "Strategi pelunasan",
      type: "select",
      placeholder: "Pilih strategi",
      required: true,
      options: [
        { label: "Debt Snowball (saldo terkecil dulu)", value: "snowball" },
        { label: "Debt Avalanche (bunga tertinggi dulu)", value: "avalanche" },
      ],
    },
    {
      name: "extraPayment",
      label: "Ekstra pembayaran per bulan (IDR)",
      type: "text",
      placeholder: "Contoh: 300.000",
      formatThousands: true,
      min: 0,
      step: 1000,
    },
  ];

  const debtEntries = useMemo(
    () =>
      viewModel.recentTransactions
        .map((item) => mapDebtEntryFromTransaction(item))
        .filter((item): item is DebtEntry => item !== null),
    [viewModel.recentTransactions],
  );

  const payableEntries = useMemo(
    () => debtEntries.filter((item) => item.kind === "payable"),
    [debtEntries],
  );

  const receivableEntries = useMemo(
    () => debtEntries.filter((item) => item.kind === "receivable"),
    [debtEntries],
  );

  const renderScreen = () => {
    if (screen === "dashboard") {
      return (
        <DashboardScreen
          viewModel={viewModel}
          activeSidebarItemId="dashboard"
          locale={locale}
          onAddWidgetAction={() => void onCreateGoal()}
          onSelectDateRangeAction={() => void onSelectDateRange()}
          onOpenDailyLimitSettingsAction={() => void onOpenDailyLimitSettings()}
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat konten dashboard..."
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
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat konten dompet..."
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
          transactionsPage={pagination.transactionsPage}
          transactionsPageSize={pagination.pageSize}
          onTransactionsPageChangeAction={(nextPage) => {
            setPaginationPage("transactionsPage", nextPage);
          }}
          onFilterChangeAction={(filter) => {
            setTransactionFilter(filter);
            setPaginationPage("transactionsPage", 1);
          }}
          onSearchChangeAction={(event) => {
            setSearchQuery(event.target.value);
            setPaginationPage("transactionsPage", 1);
          }}
          onResetFiltersAction={() => {
            resetTransactionFilters();
            setPaginationPage("transactionsPage", 1);
          }}
          onAddTransactionAction={() => void onAddTransaction()}
          onSelectDateRangeAction={() => void onSelectDateRange()}
          isSectionLoading={isApiLoading}
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
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat tujuan..."
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
          isLoading={isApiLoading}
        />
      );
    }

    if (screen === "smart-budgeting") {
      return (
        <FeatureWorkspaceScreen
          activeSidebarItemId="smart-budgeting"
          title="Smart Budgeting"
          subtitle="Atur anggaran dinamis dengan peringatan over-speed dan rollover otomatis."
          badgeLabel="Anggaran Dinamis"
          primaryActionLabel="Set Over-speed Alert"
          onPrimaryAction={() => void onOpenOverSpeedAlert()}
          secondaryActionLabel="Konfigurasi Rollover"
          onSecondaryAction={() => void onOpenRolloverBudget()}
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat Smart Budgeting..."
          metrics={[
            {
              label: "Penggunaan batas harian",
              value: `${Math.round(viewModel.dailyLimit.progressPct)}%`,
            },
            {
              label: "Sisa harian",
              value: viewModel.dailyLimit.remainingLabel,
            },
            {
              label: "Anggaran tersedia",
              value: viewModel.summary.availableToSpend,
            },
          ]}
          notes={[
            "Peringatan over-speed membandingkan laju belanja kategori dengan rata-rata harian bulan berjalan.",
            "Rollover budget menambahkan sisa anggaran bulan ini ke plafon bulan berikutnya.",
          ]}
        />
      );
    }

    if (screen === "recurring-bills") {
      return (
        <FeatureWorkspaceScreen
          activeSidebarItemId="recurring-bills"
          title="Recurring & Bill Management"
          subtitle="Pantau langganan dan kalender tagihan agar tidak ada pembayaran terlewat."
          badgeLabel="Tagihan Rutin"
          primaryActionLabel="Tambah Subscription"
          onPrimaryAction={() => void onOpenAddSubscription()}
          secondaryActionLabel="Tambah Tagihan"
          onSecondaryAction={() => void onOpenAddBill()}
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat tagihan rutin..."
          metrics={[
            {
              label: "Pengeluaran bulanan",
              value: viewModel.summary.monthlyExpense,
            },
            {
              label: "Saldo tersedia",
              value: viewModel.summary.availableToSpend,
            },
            {
              label: "Transaksi terbaru",
              value: `${viewModel.recentTransactions.length} item`,
            },
          ]}
          notes={[
            "Subscription Tracker menyiapkan pengingat H-3 sebelum saldo terpotong.",
            "Kalender tagihan membantu Anda melihat jatuh tempo listrik, internet, dan cicilan.",
          ]}
        />
      );
    }

    if (screen === "financial-health") {
      return (
        <FeatureWorkspaceScreen
          activeSidebarItemId="financial-health"
          title="Financial Health Score"
          subtitle="Interpretasi kesehatan keuangan berdasarkan Debt-to-Income Ratio (maks 35%) dan Emergency Fund Ratio (minimal 3x pengeluaran)."
          badgeLabel={`Health Score • ${viewModel.financialHealth.statusLabel}`}
          primaryActionLabel="Atur Rentang Data"
          onPrimaryAction={() => void onSelectDateRange()}
          secondaryActionLabel="Ekspor Ringkasan"
          onSecondaryAction={() => void onExportReport()}
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat health score..."
          metrics={[
            {
              label: "Status",
              value: viewModel.financialHealth.statusLabel,
            },
            {
              label: "Debt-to-Income Ratio",
              value: viewModel.financialHealth.debtToIncomeRatioLabel,
            },
            {
              label: "Emergency Fund Ratio",
              value: viewModel.financialHealth.emergencyFundRatioLabel,
            },
          ]}
          notes={[
            `Cicilan bulanan: ${viewModel.financialHealth.monthlyDebtInstallmentLabel} • Pemasukan bulanan: ${viewModel.financialHealth.monthlyIncomeLabel}.`,
            `Saldo dana darurat: ${viewModel.financialHealth.emergencyFundBalanceLabel} • Pengeluaran bulanan: ${viewModel.financialHealth.monthlyExpenseLabel}.`,
            `DTI ${
              viewModel.financialHealth.debtToIncomeHealthy
                ? "aman"
                : "melewati batas"
            } (maks 35%) dan dana darurat ${
              viewModel.financialHealth.emergencyFundHealthy
                ? "sudah memenuhi"
                : "belum memenuhi"
            } target minimal 3x pengeluaran.`,
          ]}
        />
      );
    }

    if (screen === "debt-manager") {
      return (
        <SidebarPageShell
          activeSidebarItemId="debt-manager"
          title="Debt Manager"
          subtitle="Kelola hutang, piutang, dan ubah status langsung dari daftar."
          badgeLabel="Hutang & Piutang"
          isSectionLoading={isApiLoading}
          loadingLabel="Memuat debt manager..."
          headerActions={
            <>
              <ActionPill
                label="Catat Piutang"
                tone="outline"
                onClick={() => void onOpenAddReceivable()}
              />
              <ActionPill
                label="Tambah Hutang"
                tone="primary"
                onClick={() => void onOpenAddDebt()}
              />
            </>
          }
        >
          <div className="space-y-6">
            <ActionPill
              label="Jalankan Snowball/Avalanche"
              tone="outline"
              onClick={() => void onOpenRunDebtStrategy()}
            />

            <section className="grid gap-6 md:grid-cols-2">
              <DashboardCard
                title="Daftar Hutang (Accounts Payable)"
                subtitle="Orang/lembaga yang harus Anda bayar"
              >
                {payableEntries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-5 text-sm text-muted">
                    Belum ada data hutang.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {payableEntries.map((item) => (
                      <li
                        key={item.id}
                        className="relative rounded-xl border border-border bg-surface-2 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.partyName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {item.amountLabel} • {item.dateLabel}
                            </p>
                            <span
                              className={cn(
                                "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                item.status === "paid"
                                  ? "bg-success/10 text-success"
                                  : "bg-accent/15 text-accent",
                              )}
                            >
                              {debtStatusLabel(item.status)}
                            </span>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              aria-label={`Ubah status hutang ${item.partyName}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-foreground"
                              onClick={() =>
                                setOpenDebtMenuId((current) =>
                                  current === item.id ? null : item.id,
                                )
                              }
                            >
                              <MoreIcon />
                            </button>

                            {openDebtMenuId === item.id ? (
                              <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface-2"
                                  onClick={() =>
                                    void onToggleDebtStatus(
                                      item.id,
                                      item.status === "paid"
                                        ? "unpaid"
                                        : "paid",
                                    )
                                  }
                                >
                                  Tandai{" "}
                                  {item.status === "paid"
                                    ? "Belum Lunas"
                                    : "Lunas"}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </DashboardCard>

              <DashboardCard
                title="Daftar Piutang (Accounts Receivable)"
                subtitle="Orang yang meminjam uang dari Anda"
              >
                {receivableEntries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-5 text-sm text-muted">
                    Belum ada data piutang.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {receivableEntries.map((item) => (
                      <li
                        key={item.id}
                        className="relative rounded-xl border border-border bg-surface-2 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.partyName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {item.amountLabel} • {item.dateLabel}
                            </p>
                            <span
                              className={cn(
                                "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                item.status === "paid"
                                  ? "bg-success/10 text-success"
                                  : "bg-accent/15 text-accent",
                              )}
                            >
                              {debtStatusLabel(item.status)}
                            </span>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              aria-label={`Ubah status piutang ${item.partyName}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-foreground"
                              onClick={() =>
                                setOpenDebtMenuId((current) =>
                                  current === item.id ? null : item.id,
                                )
                              }
                            >
                              <MoreIcon />
                            </button>

                            {openDebtMenuId === item.id ? (
                              <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left text-xs text-foreground hover:bg-surface-2"
                                  onClick={() =>
                                    void onToggleDebtStatus(
                                      item.id,
                                      item.status === "paid"
                                        ? "unpaid"
                                        : "paid",
                                    )
                                  }
                                >
                                  Tandai{" "}
                                  {item.status === "paid"
                                    ? "Belum Lunas"
                                    : "Lunas"}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </DashboardCard>
            </section>
          </div>
        </SidebarPageShell>
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
        isSectionLoading={isApiLoading}
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
        open={dailyLimitDialogOpen}
        onOpenChangeAction={setDailyLimitDialogOpen}
        title={copy.dailyLimitDialogTitle}
        description={copy.dailyLimitDialogDescription}
        fields={dailyLimitSettingsFields}
        submitLabel={copy.dailyLimitDialogSubmit}
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitDailyLimitSettings}
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

      <ActionFormDialog
        open={openDialog === "set-over-speed-alert"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("set-over-speed-alert") : closeDialog()
        }
        title="Set Over-speed Alert"
        description="Notifikasi jika pengeluaran kategori berjalan terlalu cepat dibanding ritme harian."
        fields={overSpeedAlertFields}
        submitLabel="Simpan alert"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitOverSpeedAlert}
      />

      <ActionFormDialog
        open={openDialog === "configure-rollover-budget"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("configure-rollover-budget") : closeDialog()
        }
        title="Konfigurasi Rollover Budget"
        description="Sisa anggaran bulan ini akan otomatis menambah plafon bulan depan."
        fields={rolloverBudgetFields}
        submitLabel="Simpan rollover"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitRolloverBudget}
      />

      <ActionFormDialog
        open={openDialog === "add-subscription"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("add-subscription") : closeDialog()
        }
        title="Tambah Subscription"
        description="Catat layanan langganan dan jadwal debit untuk pengingat H-3."
        fields={subscriptionFields}
        submitLabel="Tambah subscription"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAddSubscription}
      />

      <ActionFormDialog
        open={openDialog === "add-bill"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("add-bill") : closeDialog()
        }
        title="Tambah Tagihan"
        description="Tambahkan tagihan rutin agar muncul di kalender jatuh tempo."
        fields={billFields}
        submitLabel="Tambah tagihan"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAddBill}
      />

      <ActionFormDialog
        open={openDialog === "add-debt"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("add-debt") : closeDialog()
        }
        title="Tambah Hutang"
        description="Catat cicilan atau hutang agar rencana pelunasan lebih terarah."
        fields={debtFields}
        submitLabel="Tambah hutang"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAddDebt}
      />

      <ActionFormDialog
        open={openDialog === "add-receivable"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("add-receivable") : closeDialog()
        }
        title="Tambah Piutang"
        description="Catat uang yang dipinjamkan kepada orang lain."
        fields={receivableFields}
        submitLabel="Tambah piutang"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitAddReceivable}
      />

      <ActionFormDialog
        open={openDialog === "run-debt-strategy"}
        onOpenChangeAction={(open) =>
          open ? openDialogById("run-debt-strategy") : closeDialog()
        }
        title="Jalankan Debt Strategy"
        description="Pilih Snowball atau Avalanche untuk prioritas pelunasan."
        fields={debtStrategyFields}
        submitLabel="Jalankan strategi"
        busy={busy}
        errorMessage={dialogError}
        onSubmitAction={onSubmitRunDebtStrategy}
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

type FeatureWorkspaceScreenProps = {
  readonly activeSidebarItemId:
    | "smart-budgeting"
    | "recurring-bills"
    | "financial-health"
    | "debt-manager";
  readonly title: string;
  readonly subtitle: string;
  readonly badgeLabel: string;
  readonly primaryActionLabel: string;
  readonly onPrimaryAction: () => void;
  readonly secondaryActionLabel?: string;
  readonly onSecondaryAction?: () => void;
  readonly tertiaryActionLabel?: string;
  readonly onTertiaryAction?: () => void;
  readonly metrics: ReadonlyArray<{ label: string; value: string }>;
  readonly notes: ReadonlyArray<string>;
  readonly isSectionLoading?: boolean;
  readonly loadingLabel?: string;
};

function FeatureWorkspaceScreen({
  activeSidebarItemId,
  title,
  subtitle,
  badgeLabel,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
  metrics,
  notes,
  isSectionLoading = false,
  loadingLabel = "Memuat konten...",
}: FeatureWorkspaceScreenProps) {
  return (
    <SidebarPageShell
      activeSidebarItemId={activeSidebarItemId}
      title={title}
      subtitle={subtitle}
      badgeLabel={badgeLabel}
      isSectionLoading={isSectionLoading}
      loadingLabel={loadingLabel}
      headerActions={
        <>
          {secondaryActionLabel ? (
            <ActionPill
              label={secondaryActionLabel}
              tone="outline"
              onClick={onSecondaryAction}
            />
          ) : null}
          <ActionPill
            label={primaryActionLabel}
            tone="primary"
            onClick={onPrimaryAction}
          />
        </>
      }
    >
      <div className="space-y-6">
        {tertiaryActionLabel ? (
          <ActionPill
            label={tertiaryActionLabel}
            tone="outline"
            onClick={onTertiaryAction}
          />
        ) : null}

        <section className="grid gap-6 md:grid-cols-3">
          {metrics.map((metric) => (
            <DashboardCard
              key={metric.label}
              title={metric.label}
              subtitle="Ringkasan"
            >
              <p className="text-xl font-semibold text-foreground">
                {metric.value}
              </p>
            </DashboardCard>
          ))}
        </section>

        <DashboardCard
          title="Rencana Implementasi"
          subtitle="Fitur dan perilaku yang sudah tersambung di dashboard client flow"
        >
          <ul className="space-y-2 text-sm text-foreground">
            {notes.map((note, index) => (
              <li
                key={`${note}-${index}`}
                className="rounded-xl border border-border bg-surface-2 px-3 py-2.5"
              >
                {note}
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>
    </SidebarPageShell>
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

function toPositiveNumberFromUnknown(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(normalizeAmountInput(value))
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function toNonNegativeNumberFromUnknown(value: unknown): number | null {
  if (value === undefined || value === null) return 0;

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(normalizeAmountInput(value))
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 0) return null;
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
  return value.replace(/[.,\s]/g, "").trim();
}

function normalizeDirection(value: string): "income" | "expense" | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "income" || normalized === "expense") {
    return normalized;
  }
  return undefined;
}

function normalizePaymentStatus(value: string): "paid" | "unpaid" | undefined {
  const normalized = value.trim().toLowerCase();

  if (normalized === "paid" || normalized === "lunas") {
    return "paid";
  }

  if (
    normalized === "unpaid" ||
    normalized === "belum lunas" ||
    normalized === "belum-lunas" ||
    normalized === "belum_lunas"
  ) {
    return "unpaid";
  }

  return undefined;
}

type DebtEntry = {
  readonly id: string;
  readonly kind: "payable" | "receivable";
  readonly partyName: string;
  readonly amountLabel: string;
  readonly dateLabel: string;
  readonly status: "paid" | "unpaid";
};

function mapDebtEntryFromTransaction(
  item: DashboardViewModel["recentTransactions"][number],
): DebtEntry | null {
  const kind = resolveDebtKind(item.title, item.category);
  if (!kind) return null;

  return {
    id: item.id,
    kind,
    partyName: extractDebtPartyName(item.title, kind),
    amountLabel: item.amountLabel,
    dateLabel: item.dateLabel,
    status: parseDebtStatus(item.title),
  };
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

function parseDebtStatus(title: string): "paid" | "unpaid" {
  return /\(\s*lunas\s*\)\s*$/i.test(title) ? "paid" : "unpaid";
}

function extractDebtPartyName(
  title: string,
  kind: "payable" | "receivable",
): string {
  const prefix =
    kind === "payable" ? /^(cicilan|hutang)\s*:\s*/i : /^piutang\s*:\s*/i;
  const cleaned = title
    .replace(prefix, "")
    .replace(/\s*\((?:Lunas|Belum Lunas)\)\s*$/i, "")
    .trim();

  return cleaned || (kind === "payable" ? "Kreditur" : "Peminjam");
}

function debtStatusLabel(status: "paid" | "unpaid"): string {
  return status === "paid" ? "Lunas" : "Belum Lunas";
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="4" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function toIsoDate(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeQuickRangePreset(
  value: string,
): "today" | "week" | "monthly" | "custom" {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "today" ||
    normalized === "week" ||
    normalized === "monthly" ||
    normalized === "custom"
  ) {
    return normalized;
  }
  return "today";
}

function getPresetDateRange(
  preset: "today" | "week" | "monthly",
  now: Date,
): { from: string; to: string } {
  if (preset === "today") {
    const today = toLocalIsoDate(now);
    return { from: today, to: today };
  }

  if (preset === "week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + mondayOffset,
    );
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 6,
    );

    return {
      from: toLocalIsoDate(start),
      to: toLocalIsoDate(end),
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: toLocalIsoDate(monthStart),
    to: toLocalIsoDate(monthEnd),
  };
}

function toLocalIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function isWithinThreeMonths(fromISO: string, toISO: string): boolean {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const maxTo = new Date(
    from.getFullYear(),
    from.getMonth() + 3,
    from.getDate(),
  );
  return to.getTime() <= maxTo.getTime();
}
