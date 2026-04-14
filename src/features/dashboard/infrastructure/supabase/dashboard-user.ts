const DASHBOARD_USER_ID_ENV = "DASHBOARD_DEFAULT_USER_ID";
const DASHBOARD_USER_ID_HEADER = "x-dashboard-user-id";
const DASHBOARD_USER_ID_QUERY_PARAM = "userId";

export type ResolveDashboardUserIdOptions = {
  readonly requestedUserId?: string | null;
  readonly fallbackUserId?: string;
};

/**
 * Resolves the user id used by dashboard Supabase queries.
 *
 * Resolution order:
 * 1) `options.requestedUserId`
 * 2) `process.env.DASHBOARD_DEFAULT_USER_ID`
 * 3) `options.fallbackUserId`
 *
 * Throws when no valid id can be resolved.
 */
export function resolveDashboardUserId(
  options: ResolveDashboardUserIdOptions = {},
): string {
  const fromOptions = sanitizeUserId(options.requestedUserId);
  if (fromOptions) return fromOptions;

  const fromEnv = sanitizeUserId(process.env[DASHBOARD_USER_ID_ENV]);
  if (fromEnv) return fromEnv;

  const fromFallback = sanitizeUserId(options.fallbackUserId);
  if (fromFallback) return fromFallback;

  throw new Error(
    `[dashboard-user] Could not resolve dashboard user id. Provide options.requestedUserId or set ${DASHBOARD_USER_ID_ENV}.`,
  );
}

/**
 * Convenience helper for API routes / request handlers.
 *
 * Resolution order:
 * 1) `options.requestedUserId`
 * 2) `x-dashboard-user-id` header
 * 3) `?userId=` query param
 * 4) `process.env.DASHBOARD_DEFAULT_USER_ID`
 * 5) `options.fallbackUserId`
 */
export function resolveDashboardUserIdFromRequest(
  request: Request,
  options: ResolveDashboardUserIdOptions = {},
): string {
  const fromHeader = sanitizeUserId(request.headers.get(DASHBOARD_USER_ID_HEADER));
  const fromQuery = sanitizeUserId(
    new URL(request.url).searchParams.get(DASHBOARD_USER_ID_QUERY_PARAM),
  );

  return resolveDashboardUserId({
    requestedUserId: options.requestedUserId ?? fromHeader ?? fromQuery,
    fallbackUserId: options.fallbackUserId,
  });
}

function sanitizeUserId(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  if (!isValidUserId(trimmed)) {
    throw new Error(
      `[dashboard-user] Invalid dashboard user id format: "${trimmed}".`,
    );
  }

  return trimmed;
}

/**
 * Accept:
 * - UUID v1-v5 (common for auth.users.id)
 * - or slug-ish ids for local/dev data partitioning
 */
function isValidUserId(value: string): boolean {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const slugPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;

  return uuidPattern.test(value) || slugPattern.test(value);
}
