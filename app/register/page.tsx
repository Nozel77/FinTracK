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
  readonly createAccount: string;
  readonly subtitle: string;
  readonly fullNameOptional: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly emailPasswordRequired: string;
  readonly minPasswordLength: string;
  readonly passwordMismatch: string;
  readonly accountCreatedMessage: string;
  readonly creatingAccount: string;
  readonly register: string;
  readonly alreadyHaveAccount: string;
  readonly signIn: string;
};

const REGISTER_COPY: Record<Locale, RegisterCopy> = {
  en: {
    createAccount: "Create your account",
    subtitle: "Register to start using your financial dashboard.",
    fullNameOptional: "Full name (optional)",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    emailPasswordRequired: "Email and password are required.",
    minPasswordLength: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    accountCreatedMessage:
      "Account created. Check your email to verify your account, then sign in.",
    creatingAccount: "Creating account...",
    register: "Register",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
  },
  id: {
    createAccount: "Buat akun Anda",
    subtitle: "Daftar untuk mulai menggunakan dasbor keuangan Anda.",
    fullNameOptional: "Nama lengkap (opsional)",
    email: "Email",
    password: "Kata sandi",
    confirmPassword: "Konfirmasi kata sandi",
    emailPasswordRequired: "Email dan kata sandi wajib diisi.",
    minPasswordLength: "Kata sandi minimal 6 karakter.",
    passwordMismatch: "Kata sandi tidak cocok.",
    accountCreatedMessage:
      "Akun berhasil dibuat. Periksa email Anda untuk verifikasi akun, lalu masuk.",
    creatingAccount: "Sedang membuat akun...",
    register: "Daftar",
    alreadyHaveAccount: "Sudah punya akun?",
    signIn: "Masuk",
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

  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(form: FormData) {
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (!email || !password) {
      setState({
        loading: false,
        error: copy.emailPasswordRequired,
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

    setState({
      loading: false,
      error: null,
      message: copy.accountCreatedMessage,
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">{copy.createAccount}</h1>
          <p className="mt-2 text-sm text-muted">{copy.subtitle}</p>

          <form ref={formRef} className="mt-6 space-y-4" action={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-sm">
                {copy.fullNameOptional}
              </span>
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm">{copy.email}</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm">{copy.password}</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm">{copy.confirmPassword}</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2"
              />
            </label>

            {state.error ? (
              <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            ) : null}

            {state.message ? (
              <p className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
                {state.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={state.loading}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state.loading ? copy.creatingAccount : copy.register}
            </button>
          </form>

          <p className="mt-4 text-sm text-muted">
            {copy.alreadyHaveAccount}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {copy.signIn}
            </Link>
          </p>
        </div>
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
