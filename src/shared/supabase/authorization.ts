import "server-only";

import type { User } from "@supabase/supabase-js";

import { jsonError, type ApiErrorCode } from "@/src/shared/http/api-response";

import {
  createSupabaseServerClient,
  type TypedSupabaseServerClient,
} from "./server-client";

type AuthorizationErrorOptions = {
  readonly status?: number;
  readonly code?: ApiErrorCode;
  readonly details?: unknown;
};

type AuthenticatedContext = {
  readonly client: TypedSupabaseServerClient;
  readonly user: User;
};

const DEFAULT_UNAUTHORIZED_MESSAGE = "You must be signed in to access this resource.";

export class AuthorizationError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(message: string, options: AuthorizationErrorOptions = {}) {
    super(message);
    this.name = "AuthorizationError";
    this.status = options.status ?? 401;
    this.code = options.code ?? "UNAUTHORIZED";
    this.details = options.details;
  }
}

/**
 * Loads the currently authenticated user from Supabase.
 * Returns `null` when no active session exists.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new AuthorizationError("Failed to read authenticated user.", {
      status: 401,
      code: "UNAUTHORIZED",
      details: { providerMessage: error.message },
    });
  }

  return data.user ?? null;
}

/**
 * Loads an authenticated user and throws when no session is present.
 */
export async function requireAuthenticatedUser(
  message = DEFAULT_UNAUTHORIZED_MESSAGE,
): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthorizationError(message, {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  return user;
}

/**
 * Returns an authenticated Supabase context for server handlers.
 */
export async function requireAuthenticatedContext(
  message = DEFAULT_UNAUTHORIZED_MESSAGE,
): Promise<AuthenticatedContext> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new AuthorizationError("Failed to read authenticated user.", {
      status: 401,
      code: "UNAUTHORIZED",
      details: { providerMessage: error.message },
    });
  }

  if (!data.user) {
    throw new AuthorizationError(message, {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  return {
    client,
    user: data.user,
  };
}

/**
 * Ensures a requested user id is either omitted or equals the authenticated user id.
 * Returns the resolved authorized user id.
 */
export function assertAuthorizedUserId(
  authenticatedUserId: string,
  requestedUserId?: string | null,
): string {
  const normalizedRequested = requestedUserId?.trim();

  if (!normalizedRequested) {
    return authenticatedUserId;
  }

  if (normalizedRequested !== authenticatedUserId) {
    throw new AuthorizationError("You are not allowed to access another user's data.", {
      status: 403,
      code: "FORBIDDEN",
      details: {
        authenticatedUserId,
        requestedUserId: normalizedRequested,
      },
    });
  }

  return normalizedRequested;
}

/**
 * Convenience helper for route handlers:
 * - requires an authenticated user
 * - validates optional requested user id ownership
 */
export async function resolveAuthorizedUserId(
  requestedUserId?: string | null,
): Promise<string> {
  const user = await requireAuthenticatedUser();
  return assertAuthorizedUserId(user.id, requestedUserId);
}

/**
 * Converts known authorization errors into a JSON API response.
 * Returns `null` for non-authorization errors so callers can handle them normally.
 */
export function toAuthorizationErrorResponse(error: unknown): Response | null {
  if (!(error instanceof AuthorizationError)) {
    return null;
  }

  return jsonError(error.message, {
    status: error.status,
    code: error.code,
    details: error.details,
  });
}
