import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

type RawSearchParams = Record<string, string | string[] | undefined>;

type AuthCodeErrorPageProps = {
  searchParams?: Promise<RawSearchParams> | RawSearchParams;
};

export const metadata: Metadata = {
  title: "Authentication Error",
};

export default async function AuthCodeErrorPage({
  searchParams,
}: AuthCodeErrorPageProps) {
  const params = await Promise.resolve(searchParams ?? {});
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get("accept-language"));

  const copy =
    locale === "id"
      ? {
          title: "Kesalahan Autentikasi",
          authFailedPrefix: "Autentikasi gagal",
          defaultMessage: "Kami tidak dapat menyelesaikan proses masuk.",
          backToLogin: "Kembali ke Login",
          createAccount: "Buat Akun",
        }
      : {
          title: "Authentication Error",
          authFailedPrefix: "Authentication failed",
          defaultMessage: "We couldn’t complete sign-in.",
          backToLogin: "Back to Login",
          createAccount: "Create Account",
        };

  const error = readParam(params.error);
  const errorDescription = readParam(params.error_description);
  const message =
    errorDescription ??
    (error ? `${copy.authFailedPrefix}: ${error}` : copy.defaultMessage);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-16">
      <section className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{copy.title}</h1>

        <p className="mt-3 text-sm text-muted">{message}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {copy.backToLogin}
          </Link>

          <Link
            href="/register"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            {copy.createAccount}
          </Link>
        </div>
      </section>
    </main>
  );
}

function resolveLocale(acceptLanguage: string | null): "en" | "id" {
  if (!acceptLanguage) return "en";

  const normalized = acceptLanguage.toLowerCase();
  if (normalized.startsWith("id")) return "id";
  if (normalized.includes(",id") || normalized.includes(" id")) return "id";

  return "en";
}

function readParam(value: string | string[] | undefined): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  const trimmed = single?.trim();
  return trimmed ? trimmed : undefined;
}
