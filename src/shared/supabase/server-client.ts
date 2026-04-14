import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

export type TypedSupabaseServerClient = SupabaseClient<Database>;

type CookieToSet = {
  readonly name: string;
  readonly value: string;
  readonly options: CookieOptions;
};

export async function createSupabaseServerClient(): Promise<TypedSupabaseServerClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: ReadonlyArray<CookieToSet>) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Some Server Component render contexts are read-only for cookies.
        }
      },
    },
  });
}
