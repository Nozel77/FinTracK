"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/shared/supabase/browser-client";

type Locale = "en" | "id";

type LoginCopy = {
  readonly brand: string;
  readonly welcome: string;
  readonly subtitle: string;
  readonly emailLabel: string;
  readonly passwordLabel: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly rememberMe: string;
  readonly emailPasswordRequired: string;
  readonly invalidEmail: string;
  readonly signIn: string;
  readonly signingIn: string;
  readonly successMessage: string;
  readonly createAccountPrompt: string;
  readonly createOne: string;
  readonly loadingForm: string;
  readonly secureNotice: string;
};

const LOGIN_COPY: Record<Locale, LoginCopy> = {
  en: {
    brand: "FinTracK",
    welcome: "Welcome back 👋",
    subtitle:
      "Sign in to manage your financial dashboard with a faster, cleaner experience.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    showPassword: "Show",
    hidePassword: "Hide",
    rememberMe: "Keep me signed in",
    emailPasswordRequired: "Email and password are required.",
    invalidEmail: "Please enter a valid email address.",
    signIn: "Sign in",
    signingIn: "Signing in...",
    successMessage: "Login successful. Redirecting to your dashboard...",
    createAccountPrompt: "Don’t have an account yet?",
    createOne: "Create account",
    loadingForm: "Loading sign-in form...",
    secureNotice: "Your session is secured with encrypted authentication.",
  },
  id: {
    brand: "FinTracK",
    welcome: "Selamat datang kembali 👋",
    subtitle:
      "Masuk untuk mengelola dashboard keuangan Anda dengan pengalaman yang lebih cepat dan rapi.",
    emailLabel: "Alamat email",
    passwordLabel: "Kata sandi",
    showPassword: "Tampilkan",
    hidePassword: "Sembunyikan",
    rememberMe: "Tetap masuk",
    emailPasswordRequired: "Email dan kata sandi wajib diisi.",
    invalidEmail: "Masukkan alamat email yang valid.",
    signIn: "Masuk",
    signingIn: "Sedang masuk...",
    successMessage: "Berhasil masuk. Mengalihkan ke dashboard...",
    createAccountPrompt: "Belum punya akun?",
    createOne: "Buat akun",
    loadingForm: "Memuat formulir masuk...",
    secureNotice: "Sesi Anda dilindungi dengan autentikasi terenkripsi.",
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/")) return "/";
    return next;
  }, [searchParams]);

  const locale = useMemo<Locale>(() => resolveLocaleFromNavigator(), []);
  const copy = LOGIN_COPY[locale] ?? LOGIN_COPY.en;

  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const supabase = getSupabaseBrowserClient();
      const { data, error: sessionError } = await supabase.auth.getUser();

      if (cancelled) return;
      if (sessionError) return;
      if (data.user) {
        router.replace(nextPath);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  async function submitLogin(formData: FormData) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        setError(copy.emailPasswordRequired);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError(copy.invalidEmail);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage(copy.successMessage);
      router.replace(nextPath);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_20px_70px_rgba(37,99,235,0.15)] md:grid-cols-2">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-10 text-white md:flex">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-90">
                {copy.brand}
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                Smart finance,
                <br />
                clear decisions.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-blue-50/95">
                Track transactions, monitor cash flow, and stay in control of
                your goals from one modern dashboard.
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
                {copy.welcome}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.subtitle}
              </p>

              <form className="mt-8 space-y-5" action={submitLogin}>
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
                    required
                    autoComplete="email"
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
                      required
                      minLength={6}
                      autoComplete="current-password"
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

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="remember"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {copy.rememberMe}
                </label>

                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                {message ? (
                  <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                    {message}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  aria-busy={busy}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? copy.signingIn : copy.signIn}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                {copy.createAccountPrompt}{" "}
                <Link
                  href="/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {copy.createOne}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginPageFallback() {
  const copy = LOGIN_COPY.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <section className="w-full rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">FinTracK</h1>
          <p className="mt-2 text-sm text-slate-600">{copy.loadingForm}</p>
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
