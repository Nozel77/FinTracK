"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/src/shared/supabase/browser-client";

type Locale = "en" | "id";

type LoginCopy = {
  readonly welcomeBack: string;
  readonly signInSubtitle: string;
  readonly email: string;
  readonly password: string;
  readonly emailPasswordRequired: string;
  readonly signedInRedirecting: string;
  readonly signIn: string;
  readonly signingIn: string;
  readonly createAccountPrompt: string;
  readonly createOne: string;
  readonly loadingForm: string;
};

const LOGIN_COPY: Record<Locale, LoginCopy> = {
  en: {
    welcomeBack: "Welcome back",
    signInSubtitle: "Sign in to continue to your dashboard.",
    email: "Email",
    password: "Password",
    emailPasswordRequired: "Email and password are required.",
    signedInRedirecting: "Signed in successfully. Redirecting...",
    signIn: "Sign in",
    signingIn: "Signing in...",
    createAccountPrompt: "Don't have an account?",
    createOne: "Create one",
    loadingForm: "Loading sign-in form...",
  },
  id: {
    welcomeBack: "Selamat datang kembali",
    signInSubtitle: "Masuk untuk melanjutkan ke dasbor Anda.",
    email: "Email",
    password: "Kata sandi",
    emailPasswordRequired: "Email dan kata sandi wajib diisi.",
    signedInRedirecting: "Berhasil masuk. Mengalihkan...",
    signIn: "Masuk",
    signingIn: "Sedang masuk...",
    createAccountPrompt: "Belum punya akun?",
    createOne: "Buat akun",
    loadingForm: "Memuat formulir masuk...",
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

      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage(copy.signedInRedirecting);
      router.replace(nextPath);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <section className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">{copy.welcomeBack}</h1>
          <p className="mt-2 text-sm text-muted">{copy.signInSubtitle}</p>

          <form className="mt-6 space-y-4" action={submitLogin}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                {copy.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                {copy.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? copy.signingIn : copy.signIn}
            </button>
          </form>

          <p className="mt-4 text-sm text-muted">
            {copy.createAccountPrompt}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {copy.createOne}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function LoginPageFallback() {
  const copy = LOGIN_COPY.en;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
        <section className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">FinTracK</h1>
          <p className="mt-2 text-sm text-muted">{copy.loadingForm}</p>
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
