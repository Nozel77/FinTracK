import { createDashboardActionService } from "@/src/features/dashboard/infrastructure/supabase/services/dashboard-action-service";
import {
  assertAuthorizedUserId,
  requireAuthenticatedUser,
  toAuthorizationErrorResponse,
} from "@/src/shared/supabase/authorization";
import {
  errorToObject,
  jsonError,
  jsonSuccess,
} from "@/src/shared/http/api-response";
import {
  parseRequestBody,
  RequestBodyError,
} from "@/src/shared/http/request-body";

type ResetSessionsRequestBody = {
  readonly userId?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseRequestBody<ResetSessionsRequestBody>(
      request,
      parseResetSessionsRequestBody,
      {
        requireJsonContentType: false,
        allowEmptyBody: true,
        maxBytes: 8_192,
      },
    );

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to reset sessions.",
    );
    const userId = assertAuthorizedUserId(authenticatedUser.id, body.userId);

    const actionService = createDashboardActionService({ userId });
    const result = await actionService.resetSessions({ userId });

    return jsonSuccess(result, { message: result.message });
  } catch (error) {
    const authorizationResponse = toAuthorizationErrorResponse(error);
    if (authorizationResponse) {
      return authorizationResponse;
    }

    if (error instanceof RequestBodyError) {
      return jsonError(error.message, {
        status: error.status,
        code: "BAD_REQUEST",
        details: {
          requestBodyCode: error.code,
          requestBodyDetails: error.details,
        },
      });
    }

    if (error instanceof Error) {
      const status =
        error.message.includes("dashboard user id") ||
        error.message.includes("Invalid")
          ? 400
          : 500;

      return jsonError(error.message, {
        status,
        code: status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
        details: errorToObject(error),
      });
    }

    return jsonError("Failed to reset sessions.", {
      status: 500,
      code: "INTERNAL_ERROR",
      details: errorToObject(error),
    });
  }
}

function parseResetSessionsRequestBody(
  value: unknown,
): ResetSessionsRequestBody {
  if (value === undefined || value === null) {
    return {};
  }

  if (!isRecord(value)) {
    throw new Error("Request body must be a JSON object when provided.");
  }

  return {
    userId: parseOptionalString(value.userId, "userId"),
  };
}

function parseOptionalString(
  value: unknown,
  fieldName: string,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Field "${fieldName}" must be a string when provided.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
