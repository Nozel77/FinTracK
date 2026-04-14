/// <reference types="node" />

declare module "@supabase/ssr" {
  import type { SupabaseClient } from "@supabase/supabase-js";

  export type CookieOptions = {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
  };

  export type CookieToSet = {
    name: string;
    value: string;
    options: CookieOptions;
  };

  export type ServerCookieMethods = {
    getAll: () => Array<{ name: string; value: string }>;
    setAll?: (cookies: ReadonlyArray<CookieToSet>) => void;
  };

  export type BrowserClientOptions = {
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
    [key: string]: unknown;
  };

  export type ServerClientOptions = {
    cookies: ServerCookieMethods;
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
    [key: string]: unknown;
  };

  export function createBrowserClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: BrowserClientOptions,
  ): SupabaseClient<Database>;

  export function createServerClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options: ServerClientOptions,
  ): SupabaseClient<Database>;
}
