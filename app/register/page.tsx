"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/shared/supabase/browser-client";

type Locale = "en" | "id";

type RegisterState = {
  loading: boolean;
  error: string | null;
  message: string | null;
};

type RegisterCopy = {
  readonly brand: string;
  readonly title: string;
  readonly subtitle: string;
  readonly fullNameOptional: string;
  readonly emailLabel: string;
  readonly passwordLabel: string;
  readonly confirmPasswordLabel: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly agreeTerms: string;
  readonly emailPasswordRequired: string;
  readonly invalidEmail: string;
  readonly minPasswordLength: string;
  readonly passwordMismatch: string;
  readonly accountCreatedMessage: string;
  readonly creatingAccount: string;
  readonly register: string;
  readonly alreadyHaveAccount: string;
  readonly signIn: string;
  readonly secureNotice: string;
};

const REGISTER_COPY: Record<Locale, RegisterCopy> = {
  en: {
    brand: "FinTracK",
    title: "Create your account ✨",
    subtitle:
      "Start building better money habits with a modern, intuitive financial dashboard.",
    fullNameOptional: "Full name (optional)",
    emailLabel: "Email address",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    showPassword: "Show",
    hidePassword: "Hide",
    agreeTerms:
      "By creating an account, you agree to secure data handling and privacy standards.",
    emailPasswordRequired: "Email and password are required.",
    invalidEmail: "Please enter a valid email address.",
    minPasswordLength: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    accountCreatedMessage:
      "Account created successfully. Please verify your email before signing in.",
    creatingAccount: "Creating account...",
    register: "Create account",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    secureNotice: "Bank-grade encrypted authentication for every session.",
  },
  id: {
    brand: "FinTracK",
    title: "Buat akun Anda ✨",
    subtitle:
      "Mulai kebiasaan finansial yang lebih baik dengan dashboard keuangan modern dan intuitif.",
    fullNameOptional: "Nama lengkap (opsional)",
    emailLabel: "Alamat email",
    passwordLabel: "Kata sandi",
    confirmPasswordLabel: "Konfirmasi kata sandi",
    showPassword: "Tampilkan",
    hidePassword: "Sembunyikan",
    agreeTerms:
      "Dengan membuat akun, Anda menyetujui pengelolaan data yang aman dan standar privasi.",
    emailPasswordRequired: "Email dan kata sandi wajib diisi.",
    invalidEmail: "Masukkan alamat email yang valid.",
    minPasswordLength: "Kata sandi minimal 6 karakter.",
    passwordMismatch: "Kata sandi tidak cocok.",
    accountCreatedMessage:
      "Akun berhasil dibuat. Silakan verifikasi email Anda sebelum masuk.",
    creatingAccount: "Sedang membuat akun...",
    register: "Buat akun",
    alreadyHaveAccount: "Sudah punya akun?",
    signIn: "Masuk",
    secureNotice:
      "Autentikasi terenkripsi setara standar perbankan di tiap sesi.",
  },
};

export default function RegisterPage() {
  const locale = useMemo<Locale>(() => resolveLocaleFromNavigator(), []);
  const copy = REGISTER_COPY[locale] ?? REGISTER_COPY.en;

  const [state, setState] = useState<RegisterState>({
    loading: false,
    error: null,
    message: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(formData: FormData) {
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!email || !password) {
      setState({
        loading: false,
        error: copy.emailPasswordRequired,
        message: null,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setState({
        loading: false,
        error: copy.invalidEmail,
        message: null,
      });
      return;
    }

    if (password.length < 6) {
      setState({
        loading: false,
        error: copy.minPasswordLength,
        message: null,
      });
      return;
    }

    if (password !== confirmPassword) {
      setState({
        loading: false,
        error: copy.passwordMismatch,
        message: null,
      });
      return;
    }

    setState({ loading: true, error: null, message: null });

    const supabase = getSupabaseBrowserClient();
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/`
        : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        emailRedirectTo,
      },
    });

    if (error) {
      setState({
        loading: false,
        error: error.message,
        message: null,
      });
      return;
    }

    formRef.current?.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);

    setState({
      loading: false,
      error: null,
      message: copy.accountCreatedMessage,
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_20px_70px_rgba(37,99,235,0.16)] md:grid-cols-2">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-10 text-white md:flex">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-90">
                {copy.brand}
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Grow your wealth
                <br />
                with confidence.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-blue-50/95">
                Track income, expenses, goals, and recurring bills in one clean
                dashboard built for clarity.
              </p>
            </div>

            <p className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-blue-50 backdrop-blur">
              {copy.secureNotice}
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-6 flex items-center gap-3 md:hidden">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-base font-semibold text-white">
                  F
                </div>
                <span className="text-lg font-semibold text-slate-800">
                  {copy.brand}
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {copy.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.subtitle}
              </p>

              <form ref={formRef} className="mt-8 space-y-5" action={onSubmit}>
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {copy.fullNameOptional}
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {copy.emailLabel}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {copy.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      {showPassword ? copy.hidePassword : copy.showPassword}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {copy.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      {showConfirmPassword
                        ? copy.hidePassword
                        : copy.showPassword}
                    </button>
                  </div>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  {copy.agreeTerms}
                </p>

                {state.error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {state.error}
                  </p>
                ) : null}

                {state.message ? (
                  <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                    {state.message}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={state.loading}
                  aria-busy={state.loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {state.loading ? copy.creatingAccount : copy.register}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                {copy.alreadyHaveAccount}{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {copy.signIn}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function resolveLocaleFromNavigator(): Locale {
  if (typeof navigator === "undefined") return "en";

  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language ?? "",
  ].map((value) => value.toLowerCase());

  for (const value of candidates) {
    if (value.startsWith("id")) return "id";
    if (value.startsWith("en")) return "en";
  }

  return "en";
}
