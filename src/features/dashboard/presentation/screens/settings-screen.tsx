"use client";

import type { ChangeEventHandler, MouseEventHandler } from "react";

import { ActionPill } from "../components/action-pill";
import { DashboardCard } from "../components/dashboard-card";
import {
  SidebarPageShell,
  type SidebarPageThemeOverrides,
} from "./sidebar-page-shell";
import type { DashboardViewModel } from "../view-models/dashboard-view-model";
import type { Locale } from "@/src/shared/i18n/locale";

type SettingsProfile = {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly role: string;
};

type SettingsPreferences = {
  readonly currency: string;
  readonly timezone: string;
  readonly language: string;
  readonly startOfWeek: "Monday" | "Sunday";
  readonly dailyTransactionLimit?: number | string;
};

type PreferenceToggle = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
};

export type SettingsScreenProps = {
  readonly viewModel: DashboardViewModel;
  readonly locale?: Locale;
  readonly profile?: SettingsProfile;
  readonly preferences?: SettingsPreferences;
  readonly toggles?: ReadonlyArray<PreferenceToggle>;
  readonly onSaveSettings?: MouseEventHandler<HTMLButtonElement>;
  readonly onPreviewChanges?: MouseEventHandler<HTMLButtonElement>;
  readonly onProfileChange?: ChangeEventHandler<HTMLInputElement>;
  readonly onPreferenceChange?: ChangeEventHandler<
    HTMLSelectElement | HTMLInputElement
  >;
  readonly onTogglePreference?: (toggleId: string) => void;
  readonly onResetSessions?: MouseEventHandler<HTMLButtonElement>;
};

const settingsTheme: SidebarPageThemeOverrides = {
  background: "#f8fafc",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  border: "#cbd5e1",
  foreground: "#0f172a",
  muted: "#475569",
  primary: "#334155",
  primaryHover: "#1e293b",
  primarySoft: "#e2e8f0",
  accent: "#64748b",
  success: "#16a34a",
  danger: "#dc2626",
};

const defaultProfile: SettingsProfile = {
  fullName: "Alex Morgan",
  email: "alex.morgan@fintrack.app",
  phone: "+1 (555) 812-2091",
  role: "Pemilik",
};

const defaultPreferences: SettingsPreferences = {
  currency: "IDR",
  timezone: "UTC+07:00 (Jakarta)",
  language: "Bahasa Indonesia",
  startOfWeek: "Monday",
  dailyTransactionLimit: 10000000,
};

const defaultToggles: ReadonlyArray<PreferenceToggle> = [
  {
    id: "email-alerts",
    label: "Peringatan email",
    description: "Terima pembaruan tagihan dan status akun melalui email.",
    enabled: true,
  },
  {
    id: "push-notifications",
    label: "Notifikasi push",
    description:
      "Dapatkan notifikasi instan untuk transaksi dan aktivitas kartu.",
    enabled: true,
  },
  {
    id: "monthly-report",
    label: "Laporan bulanan",
    description: "Kirim ringkasan PDF bulanan ke kotak masuk Anda.",
    enabled: false,
  },
  {
    id: "compact-mode",
    label: "Mode ringkas",
    description:
      "Gunakan kartu dan baris tabel yang lebih padat di seluruh dashboard.",
    enabled: false,
  },
];

export function SettingsScreen({
  viewModel,
  locale: _explicitLocale,
  profile = defaultProfile,
  preferences = defaultPreferences,
  toggles = defaultToggles,
  onSaveSettings,
  onPreviewChanges,
  onProfileChange,
  onPreferenceChange,
  onTogglePreference,
  onResetSessions,
}: SettingsScreenProps) {
  const locale: Locale = "id";

  const copy = {
    title: "Pengaturan",
    subtitle:
      "Kelola profil akun, tampilan, notifikasi, dan preferensi keamanan.",
    badgeLabel: "Tema Slate",
    previewChanges: "Pratinjau perubahan",
    saveSettings: "Simpan pengaturan",
    profileTitle: "Profil",
    profileSubtitle: "Informasi pribadi dan kontak untuk akun ini",
    preferencesTitle: "Preferensi",
    preferencesSubtitle: "Format regional dan default workspace",
    notificationsTitle: "Notifikasi & perilaku",
    notificationsSubtitle: "Atur cara dan waktu Anda menerima pembaruan",
    securityTitle: "Keamanan",
    securitySubtitle: "Kontrol sesi dan keamanan akun",
    fullName: "Nama lengkap",
    email: "Email",
    phone: "Telepon",
    role: "Peran",
    currency: "Mata uang",
    language: "Bahasa",
    timezone: "Zona waktu",
    startOfWeek: "Awal minggu",
    dailyTransactionLimit: "Batas transaksi harian",
    activeSessions: "Sesi aktif",
    activeSessionsMeta: "3 perangkat masuk • Aktivitas terakhir hari ini",
    resetAllSessions: "Reset semua sesi",
    lastSyncedRange: "Rentang sinkron terakhir",
    companyName: "FinTracK",
  };

  const localizedToggles = toggles.map((toggle) => {
    switch (toggle.id) {
      case "email-alerts":
        return {
          ...toggle,
          label: "Peringatan email",
          description:
            "Terima pembaruan tagihan dan status akun melalui email.",
        };
      case "push-notifications":
        return {
          ...toggle,
          label: "Notifikasi push",
          description:
            "Dapatkan notifikasi instan untuk transaksi dan aktivitas kartu.",
        };
      case "monthly-report":
        return {
          ...toggle,
          label: "Laporan bulanan",
          description: "Kirim ringkasan PDF bulanan ke kotak masuk Anda.",
        };
      case "compact-mode":
        return {
          ...toggle,
          label: "Mode ringkas",
          description:
            "Gunakan kartu dan baris tabel yang lebih padat di seluruh dashboard.",
        };
      default:
        return toggle;
    }
  });

  return (
    <SidebarPageShell
      activeSidebarItemId="settings"
      title={copy.title}
      subtitle={copy.subtitle}
      badgeLabel={copy.badgeLabel}
      themeOverrides={settingsTheme}
      headerActions={
        <>
          <ActionPill
            label={copy.previewChanges}
            icon={<EyeIcon />}
            tone="outline"
            onClick={onPreviewChanges}
          />
          <ActionPill
            label={copy.saveSettings}
            icon={<CheckIcon />}
            tone="primary"
            onClick={onSaveSettings}
          />
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <DashboardCard
            title={copy.profileTitle}
            subtitle={copy.profileSubtitle}
          >
            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-4">
              <div className="grid size-12 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                AM
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {profile.fullName}
                </p>
                <p className="truncate text-xs text-muted">
                  {profile.role} • {copy.companyName}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                id="fullName"
                label={copy.fullName}
                value={profile.fullName}
                onChange={onProfileChange}
              />
              <ProfileField
                id="email"
                label={copy.email}
                value={profile.email}
                onChange={onProfileChange}
              />
              <ProfileField
                id="phone"
                label={copy.phone}
                value={profile.phone}
                onChange={onProfileChange}
              />
              <ProfileField
                id="role"
                label={copy.role}
                value={profile.role}
                onChange={onProfileChange}
              />
            </div>
          </DashboardCard>

          <DashboardCard
            title={copy.preferencesTitle}
            subtitle={copy.preferencesSubtitle}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="currency"
                label={copy.currency}
                options={[
                  { value: "IDR", label: "IDR (Rupiah)" },
                  { value: "USD", label: "USD (Dolar AS)" },
                  { value: "EUR", label: "EUR (Euro)" },
                  { value: "JPY", label: "JPY (Yen)" },
                ]}
                value={preferences.currency}
                onChange={onPreferenceChange}
              />
              <SelectField
                id="language"
                label={copy.language}
                options={[
                  {
                    value: "Bahasa Indonesia",
                    label: "Bahasa Indonesia",
                  },
                ]}
                value={preferences.language}
                onChange={onPreferenceChange}
              />
              <SelectField
                id="timezone"
                label={copy.timezone}
                options={[
                  {
                    value: "UTC+07:00 (Jakarta)",
                    label: "UTC+07:00 (Jakarta)",
                  },
                  {
                    value: "UTC-08:00 (Waktu Pasifik)",
                    label: "UTC-08:00 (Waktu Pasifik)",
                  },
                  {
                    value: "UTC-05:00 (Waktu Timur)",
                    label: "UTC-05:00 (Waktu Timur)",
                  },
                  { value: "UTC+00:00 (London)", label: "UTC+00:00 (London)" },
                ]}
                value={preferences.timezone}
                onChange={onPreferenceChange}
              />
              <SelectField
                id="startOfWeek"
                label={copy.startOfWeek}
                options={[
                  {
                    value: "Monday",
                    label: "Senin",
                  },
                  {
                    value: "Sunday",
                    label: "Minggu",
                  },
                ]}
                value={preferences.startOfWeek}
                onChange={onPreferenceChange}
              />
              <LimitInputField
                id="dailyTransactionLimit"
                label={copy.dailyTransactionLimit}
                value={preferences.dailyTransactionLimit ?? ""}
                placeholder="Contoh: 10000000"
                onChange={onPreferenceChange}
              />
            </div>
          </DashboardCard>
        </div>

        <aside className="min-w-0 space-y-6">
          <DashboardCard
            title={copy.notificationsTitle}
            subtitle={copy.notificationsSubtitle}
          >
            <ul className="space-y-3">
              {localizedToggles.map((toggle) => (
                <li
                  key={toggle.id}
                  className="rounded-2xl border border-border bg-surface-2 p-3"
                >
                  <label className="flex cursor-pointer items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {toggle.label}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {toggle.description}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={toggle.enabled}
                      onChange={() => onTogglePreference?.(toggle.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                    />
                  </label>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title={copy.securityTitle}
            subtitle={copy.securitySubtitle}
          >
            <div className="space-y-3">
              <article className="rounded-2xl border border-border bg-surface-2 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {copy.activeSessions}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {copy.activeSessionsMeta}
                </p>
              </article>

              <ActionPill
                label={copy.resetAllSessions}
                icon={<ShieldIcon />}
                tone="outline"
                fullWidth
                onClick={onResetSessions}
              />

              <p className="text-xs text-muted">
                {copy.lastSyncedRange}:{" "}
                <span className="font-medium text-foreground">
                  {viewModel.heading.dateRangeLabel}
                </span>
              </p>
            </div>
          </DashboardCard>
        </aside>
      </section>
    </SidebarPageShell>
  );
}

type ProfileFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange?: ChangeEventHandler<HTMLInputElement>;
};

function ProfileField({ id, label, value, onChange }: ProfileFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-muted">{label}</span>
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted focus-visible:ring-2 focus-visible:ring-(--primary)/35"
      />
    </label>
  );
}

type SelectFieldOption = {
  readonly value: string;
  readonly label: string;
};

type SelectFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly options: ReadonlyArray<SelectFieldOption>;
  readonly value: string;
  readonly onChange?: ChangeEventHandler<HTMLSelectElement | HTMLInputElement>;
};

function SelectField({
  id,
  label,
  options,
  value,
  onChange,
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-muted">{label}</span>
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-(--primary)/35"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type LimitInputFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly value: number | string;
  readonly placeholder?: string;
  readonly onChange?: ChangeEventHandler<HTMLSelectElement | HTMLInputElement>;
};

function LimitInputField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: LimitInputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-muted">{label}</span>
      <input
        id={id}
        name={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9.]*"
        value={String(value)}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted focus-visible:ring-2 focus-visible:ring-(--primary)/35"
      />
    </label>
  );
}

function EyeIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M2.5 10C3.9 7.2 6.7 5.33325 10 5.33325C13.3 5.33325 16.1 7.2 17.5 10C16.1 12.8 13.3 14.6666 10 14.6666C6.7 14.6666 3.9 12.8 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.16669 10.4167L8.33335 14.1667L15.8334 6.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.91675L15.8333 5.41675V9.84592C15.8333 12.7951 13.9217 15.4034 10 17.0834C6.07833 15.4034 4.16666 12.7951 4.16666 9.84592V5.41675L10 2.91675Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.91666 9.99992L9.375 11.4583L12.2917 8.54159"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
