import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv, hasSupabasePublicEnv } from "./env";

const LOGIN_PATH = "/login";
const HOME_PATH = "/";
const AUTH_PAGES = new Set<string>(["/login", "/register"]);
const PUBLIC_AUTH_PREFIX = "/auth";

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasSupabasePublicEnv()) {
    return supabaseResponse;
  }

  let url: string;
  let anonKey: string;
  try {
    const env = getSupabasePublicEnv();
    url = env.url;
    anonKey = env.anonKey;
  } catch (error) {
    console.error("Supabase environment variables error:", error);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/auth-code-error";
    redirectUrl.searchParams.set("error", "env_config");
    redirectUrl.searchParams.set(
      "error_description",
      "Supabase environment variables are missing or misconfigured. Please check your .env.local file and restart the development server.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        supabaseResponse = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = AUTH_PAGES.has(pathname);
  const isPublicAuthPath =
    pathname === PUBLIC_AUTH_PREFIX ||
    pathname.startsWith(`${PUBLIC_AUTH_PREFIX}/`);
  const isProtectedPath = !isAuthPage && !isPublicAuthPath;

  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = HOME_PATH;
    redirectUrl.search = "";

    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}
