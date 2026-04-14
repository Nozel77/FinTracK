import { createDashboardDependencies } from "@/src/features/dashboard/infrastructure/dashboard-dependencies";
import { toDashboardViewModel } from "@/src/features/dashboard/presentation/view-models/dashboard-view-model";
import {
  assertAuthorizedUserId,
  requireAuthenticatedUser,
  toAuthorizationErrorResponse,
} from "@/src/shared/supabase/authorization";
import { jsonError, jsonSuccess } from "@/src/shared/http/api-response";

export const dynamic = "force-dynamic";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);

    const from = readOptionalIsoDate(url.searchParams.get("from"), "from");
    const to = readOptionalIsoDate(url.searchParams.get("to"), "to");
    const requestedUserId = readOptionalUserId(request, url);

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to load the dashboard snapshot.",
    );
    const authorizedUserId = assertAuthorizedUserId(
      authenticatedUser.id,
      requestedUserId,
    );

    const dependencies = createDashboardDependencies({
      preferSupabase: true,
      supabaseUserId: authorizedUserId,
    });

    const snapshot = await dependencies.getDashboardSnapshot.execute({
      from,
      to,
    });
    const viewModel = toDashboardViewModel(snapshot);

    return jsonSuccess(
      {
        repositorySource: dependencies.repositorySource,
        range: snapshot.range,
        snapshot,
        viewModel,
      },
      {
        message: "Dashboard snapshot loaded successfully.",
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    const authorizationResponse = toAuthorizationErrorResponse(error);
    if (authorizationResponse) {
      return authorizationResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard snapshot.";

    return jsonError(
      message,
      {
        code: "BAD_REQUEST",
        status: 400,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }
}

function readOptionalIsoDate(
  value: string | null,
  fieldName: "from" | "to",
): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!ISO_DATE_PATTERN.test(trimmed)) {
    throw new Error(`Invalid "${fieldName}" format. Expected YYYY-MM-DD.`);
  }

  const timestamp = new Date(trimmed).getTime();
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid "${fieldName}" value.`);
  }

  return trimmed;
}

function readOptionalUserId(request: Request, url: URL): string | null {
  const fromHeader = request.headers.get("x-dashboard-user-id");
  if (fromHeader && fromHeader.trim()) return fromHeader.trim();

  const fromQuery = url.searchParams.get("userId");
  if (fromQuery && fromQuery.trim()) return fromQuery.trim();

  return null;
}
