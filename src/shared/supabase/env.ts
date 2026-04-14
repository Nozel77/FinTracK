const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";

export type SupabasePublicEnv = {
  readonly url: string;
  readonly anonKey: string;
};

export type SupabaseServerEnv = SupabasePublicEnv & {
  readonly serviceRoleKey: string;
};

let publicEnvCache: SupabasePublicEnv | undefined;
let serverEnvCache: SupabaseServerEnv | undefined;

/**
 * Returns true when the minimum public Supabase env vars are present.
 * Useful for health checks and non-throwing guards.
 */
export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    readOptionalPublicSupabaseUrl()?.trim() &&
    readOptionalPublicSupabaseAnonKey()?.trim(),
  );
}

/**
 * Reads and validates public Supabase env vars.
 * Throws a descriptive error if required values are missing or malformed.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  if (publicEnvCache) return publicEnvCache;

  const url = readRequiredPublicSupabaseUrl();
  const anonKey = readRequiredPublicSupabaseAnonKey();

  assertValidUrl(SUPABASE_URL_ENV, url);

  publicEnvCache = { url, anonKey };
  return publicEnvCache;
}

/**
 * Reads and validates server-only Supabase env vars.
 * Includes public values + `SUPABASE_SERVICE_ROLE_KEY`.
 */
export function getSupabaseServerEnv(): SupabaseServerEnv {
  if (serverEnvCache) return serverEnvCache;

  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = readRequiredEnv(SUPABASE_SERVICE_ROLE_KEY_ENV);

  serverEnvCache = {
    ...publicEnv,
    serviceRoleKey,
  };

  return serverEnvCache;
}

function readOptionalPublicSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function readOptionalPublicSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function readRequiredPublicSupabaseUrl(): string {
  const rawValue = readOptionalPublicSupabaseUrl();

  if (!rawValue || rawValue.trim() === "") {
    throw new Error(
      `[supabase/env] Missing required environment variable: ${SUPABASE_URL_ENV}`,
    );
  }

  return rawValue.trim();
}

function readRequiredPublicSupabaseAnonKey(): string {
  const rawValue = readOptionalPublicSupabaseAnonKey();

  if (!rawValue || rawValue.trim() === "") {
    throw new Error(
      `[supabase/env] Missing required environment variable: ${SUPABASE_ANON_KEY_ENV}`,
    );
  }

  return rawValue.trim();
}

function readRequiredEnv(name: string): string {
  const rawValue = process.env[name];

  if (!rawValue || rawValue.trim() === "") {
    throw new Error(
      `[supabase/env] Missing required environment variable: ${name}`,
    );
  }

  return rawValue.trim();
}

function assertValidUrl(name: string, value: string): void {
  try {
    // Ensures value is a valid absolute URL.
    // Supabase URLs are typically HTTPS in production.
    new URL(value);
  } catch {
    throw new Error(
      `[supabase/env] Invalid URL in ${name}. Received: "${value}"`,
    );
  }
}
