import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

export type TypedSupabaseBrowserClient = SupabaseClient<Database>;

let browserClient: TypedSupabaseBrowserClient | null = null;

function createTypedBrowserClient(): TypedSupabaseBrowserClient {
  const { url, anonKey } = getSupabasePublicEnv();

  return createBrowserClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Returns a singleton Supabase client for browser/client components.
 * Throws when called on the server to avoid accidental misuse.
 */
export function getSupabaseBrowserClient(): TypedSupabaseBrowserClient {
  if (typeof window === "undefined") {
    throw new Error(
      "[supabase/browser-client] getSupabaseBrowserClient must be called in the browser.",
    );
  }

  if (!browserClient) {
    browserClient = createTypedBrowserClient();
  }

  return browserClient;
}

/**
 * Optional test helper to reset singleton state between test cases.
 */
export function resetSupabaseBrowserClientForTests(): void {
  browserClient = null;
}
