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

type AdjustPlanRequestBody = {
  readonly userId?: string;
  readonly goalId: string;
  readonly addSavedAmount?: number;
  readonly newTarget?: number;
  readonly newDeadline?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseRequestBody<AdjustPlanRequestBody>(
      request,
      parseAdjustPlanRequestBody,
      {
        requireJsonContentType: true,
        allowEmptyBody: false,
        maxBytes: 16_384,
      },
    );

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to adjust a goal plan.",
    );
    const authorizedUserId = assertAuthorizedUserId(
      authenticatedUser.id,
      body.userId,
    );

    const actionService = createDashboardActionService({
      userId: authorizedUserId,
    });

    const result = await actionService.adjustPlan({
      userId: authorizedUserId,
      goalId: body.goalId,
      addSavedAmount: body.addSavedAmount,
      newTarget: body.newTarget,
      newDeadline: body.newDeadline,
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
        code: mapStatusToApiErrorCode(error.status),
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

    return jsonError("Failed to adjust goal plan.", {
      status: 500,
      code: "INTERNAL_ERROR",
      details: errorToObject(error),
    });
  }
}

function parseAdjustPlanRequestBody(value: unknown): AdjustPlanRequestBody {
  const payload = assertRecord(value);

  const userId = getOptionalString(payload, "userId", 128);
  const goalId = getRequiredString(payload, "goalId", 128);

  const addSavedAmount = getOptionalPositiveNumber(payload, "addSavedAmount");
  const newTarget = getOptionalPositiveNumber(payload, "newTarget");
  const newDeadline = getOptionalISODate(payload, "newDeadline");

  if (Object.prototype.hasOwnProperty.call(payload, "monthlyContribution")) {
    throw new RequestBodyError(
      '"monthlyContribution" is no longer supported. Use "addSavedAmount" to record actual saved progress.',
      {
        status: 422,
        code: "invalid_body",
        details: { field: "monthlyContribution" },
      },
    );
  }

  if (
    addSavedAmount === undefined &&
    newTarget === undefined &&
    newDeadline === undefined
  ) {
    throw new RequestBodyError(
      "At least one adjustment field is required: addSavedAmount, newTarget, or newDeadline.",
      {
        status: 422,
        code: "invalid_body",
      },
    );
  }

  return {
    userId,
    goalId,
    addSavedAmount,
    newTarget,
    newDeadline,
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
  const raw = payload[fieldName];

  if (typeof raw !== "string") {
    throw new RequestBodyError(`"${fieldName}" must be a string.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  const value = raw.trim();

  if (!value) {
    throw new RequestBodyError(`"${fieldName}" is required.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  if (value.length > maxLength) {
    throw new RequestBodyError(
      `"${fieldName}" must be at most ${maxLength} characters.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName, maxLength },
      },
    );
  }

  return value;
}

function getOptionalString(
  payload: Record<string, unknown>,
  fieldName: string,
  maxLength: number,
): string | undefined {
  const raw = payload[fieldName];
  if (raw === undefined || raw === null) return undefined;

  if (typeof raw !== "string") {
    throw new RequestBodyError(`"${fieldName}" must be a string.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  const value = raw.trim();
  if (!value) return undefined;

  if (value.length > maxLength) {
    throw new RequestBodyError(
      `"${fieldName}" must be at most ${maxLength} characters.`,
      {
        status: 422,
        code: "invalid_body",
        details: { field: fieldName, maxLength },
      },
    );
  }

  return value;
}

function getOptionalPositiveNumber(
  payload: Record<string, unknown>,
  fieldName: string,
): number | undefined {
  const raw = payload[fieldName];
  if (raw === undefined || raw === null) return undefined;

  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim()
        ? Number(raw)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new RequestBodyError(`"${fieldName}" must be a positive number.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  return parsed;
}

function getOptionalISODate(
  payload: Record<string, unknown>,
  fieldName: string,
): string | undefined {
  const raw = payload[fieldName];
  if (raw === undefined || raw === null) return undefined;

  if (typeof raw !== "string") {
    throw new RequestBodyError(`"${fieldName}" must be a date string.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new RequestBodyError(`"${fieldName}" must be a valid date value.`, {
      status: 422,
      code: "invalid_body",
      details: { field: fieldName },
    });
  }

  return parsed.toISOString().slice(0, 10);
}

function mapStatusToApiErrorCode(
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
  if (status === 422) return "UNPROCESSABLE_ENTITY";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return "BAD_REQUEST";
}
