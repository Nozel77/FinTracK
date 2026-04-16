import { createDashboardActionService } from "@/src/features/dashboard/infrastructure/supabase/services/dashboard-action-service";
import {
  errorToObject,
  jsonError,
  jsonSuccess,
} from "@/src/shared/http/api-response";
import {
  assertAuthorizedUserId,
  requireAuthenticatedUser,
  toAuthorizationErrorResponse,
} from "@/src/shared/supabase/authorization";
import {
  parseRequestBody,
  RequestBodyError,
} from "@/src/shared/http/request-body";

type AddPayableRouteBody = {
  readonly userId?: string;
  readonly creditor: string;
  readonly amount: number;
  readonly status: "paid" | "unpaid";
  readonly accountId?: string;
  readonly occurredAt?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseRequestBody(request, parseAddPayableBody, {
      maxBytes: 32 * 1024,
    });

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to add a payable.",
    );
    const userId = assertAuthorizedUserId(authenticatedUser.id, body.userId);

    const actionService = createDashboardActionService({ userId });

    const result = await actionService.addPayable({
      userId,
      creditor: body.creditor,
      amount: body.amount,
      status: body.status,
      accountId: body.accountId,
      occurredAt: body.occurredAt,
    });

    return jsonSuccess(result, { message: result.message });
  } catch (error) {
    const authorizationResponse = toAuthorizationErrorResponse(error);
    if (authorizationResponse) {
      return authorizationResponse;
    }

    if (error instanceof RequestBodyError) {
      return jsonError(error.message, {
        status: error.status,
        code: toApiErrorCodeFromStatus(error.status),
        details: error.details,
      });
    }

    if (error instanceof Error) {
      return jsonError(error.message, {
        status: 400,
        code: "BAD_REQUEST",
        details: errorToObject(error),
      });
    }

    return jsonError("Failed to add payable.", {
      status: 500,
      code: "INTERNAL_ERROR",
      details: errorToObject(error),
    });
  }
}

function parseAddPayableBody(value: unknown): AddPayableRouteBody {
  const payload = assertRecord(value);

  const creditor = getRequiredString(payload, "creditor", 120);
  const amount = getRequiredPositiveNumber(payload, "amount");
  const status = getRequiredStatus(payload, "status");
  const userId = getOptionalString(payload, "userId", 128);
  const accountId = getOptionalString(payload, "accountId", 128);
  const occurredAt = getOptionalDateTime(payload, "occurredAt");

  return {
    userId,
    creditor,
    amount,
    status,
    accountId,
    occurredAt,
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestBodyError("Request body must be a JSON object.", {
      status: 422,
      code: "invalid_body",
    });
  }

  return value as Record<string, unknown>;
}

function getRequiredString(
  payload: Record<string, unknown>,
  fieldName: string,
  maxLength: number,
): string {
  const value = payload[fieldName];

  if (typeof value !== "string") {
    throw new RequestBodyError(`"${fieldName}" must be a string.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new RequestBodyError(`"${fieldName}" is required.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  if (trimmed.length > maxLength) {
    throw new RequestBodyError(
      `"${fieldName}" must be at most ${maxLength} characters.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName, maxLength },
      },
    );
  }

  return trimmed;
}

function getOptionalString(
  payload: Record<string, unknown>,
  fieldName: string,
  maxLength: number,
): string | undefined {
  const value = payload[fieldName];

  if (value === undefined || value === null) return undefined;

  if (typeof value !== "string") {
    throw new RequestBodyError(`"${fieldName}" must be a string.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) return undefined;

  if (trimmed.length > maxLength) {
    throw new RequestBodyError(
      `"${fieldName}" must be at most ${maxLength} characters.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName, maxLength },
      },
    );
  }

  return trimmed;
}

function getRequiredStatus(
  payload: Record<string, unknown>,
  fieldName: string,
): "paid" | "unpaid" {
  const value = payload[fieldName];

  if (value !== "paid" && value !== "unpaid") {
    throw new RequestBodyError(
      `"${fieldName}" must be one of: paid, unpaid.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName },
      },
    );
  }

  return value;
}

function getRequiredPositiveNumber(
  payload: Record<string, unknown>,
  fieldName: string,
): number {
  const value = payload[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RequestBodyError(`"${fieldName}" must be a positive number.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  return value;
}

function getOptionalDateTime(
  payload: Record<string, unknown>,
  fieldName: string,
): string | undefined {
  const value = payload[fieldName];

  if (value === undefined || value === null) return undefined;

  if (typeof value !== "string") {
    throw new RequestBodyError(
      `"${fieldName}" must be an ISO datetime string.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName },
      },
    );
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new RequestBodyError(
      `"${fieldName}" is not a valid datetime value.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName },
      },
    );
  }

  return parsed.toISOString();
}

function toApiErrorCodeFromStatus(
  status: number,
):
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR" {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 413) return "BAD_REQUEST";
  if (status === 415) return "BAD_REQUEST";
  if (status === 422) return "UNPROCESSABLE_ENTITY";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return "BAD_REQUEST";
}
