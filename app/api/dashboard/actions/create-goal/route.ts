import { createDashboardActionService } from "@/src/features/dashboard/infrastructure/supabase/services/dashboard-action-service";
import {
  errorToObject,
  jsonError,
  jsonSuccess,
} from "@/src/shared/http/api-response";
import {
  parseRequestBody,
  RequestBodyError,
} from "@/src/shared/http/request-body";
import {
  assertAuthorizedUserId,
  requireAuthenticatedUser,
  toAuthorizationErrorResponse,
} from "@/src/shared/supabase/authorization";

type CreateGoalRequestBody = {
  readonly userId?: string;
  readonly name: string;
  readonly target: number;
  readonly saved?: number;
  readonly deadline: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseRequestBody<CreateGoalRequestBody>(
      request,
      parseCreateGoalRequestBody,
      {
        maxBytes: 16_384,
      },
    );

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to create a goal.",
    );
    const userId = assertAuthorizedUserId(authenticatedUser.id, body.userId);

    const service = createDashboardActionService({ userId });

    const result = await service.createGoal({
      userId,
      name: body.name,
      target: body.target,
      saved: body.saved,
      deadline: body.deadline,
    });

    return jsonSuccess(result, { message: result.message }, { status: 201 });
  } catch (error) {
    const authorizationResponse = toAuthorizationErrorResponse(error);
    if (authorizationResponse) {
      return authorizationResponse;
    }

    if (error instanceof RequestBodyError) {
      return jsonError(error.message, {
        status: error.status,
        code: toApiErrorCodeFromStatus(error.status),
        details: {
          requestBodyCode: error.code,
          requestBodyDetails: error.details,
        },
      });
    }

    if (error instanceof Error) {
      return jsonError(error.message, {
        status: 400,
        code: "BAD_REQUEST",
        details: errorToObject(error),
      });
    }

    return jsonError("Failed to create goal.", {
      status: 500,
      code: "INTERNAL_ERROR",
      details: errorToObject(error),
    });
  }
}

function parseCreateGoalRequestBody(value: unknown): CreateGoalRequestBody {
  const payload = assertRecord(value);

  const userId = getOptionalString(payload, "userId", 128);
  const name = getRequiredString(payload, "name", 120);
  const target = getRequiredPositiveNumber(payload, "target");
  const saved = getOptionalNonNegativeNumber(payload, "saved");
  const deadline = getRequiredDate(payload, "deadline");

  return {
    userId,
    name,
    target,
    saved,
    deadline,
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
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
    throw new Error(`"${fieldName}" must be a string.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`"${fieldName}" is required.`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`"${fieldName}" must be at most ${maxLength} characters.`);
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
    throw new Error(`"${fieldName}" must be a string when provided.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.length > maxLength) {
    throw new Error(`"${fieldName}" must be at most ${maxLength} characters.`);
  }

  return trimmed;
}

function getRequiredPositiveNumber(
  payload: Record<string, unknown>,
  fieldName: string,
): number {
  const value = payload[fieldName];
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`"${fieldName}" must be a positive number.`);
  }

  return numeric;
}

function getOptionalNonNegativeNumber(
  payload: Record<string, unknown>,
  fieldName: string,
): number | undefined {
  const value = payload[fieldName];

  if (value === undefined || value === null) return undefined;

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(
      `"${fieldName}" must be a non-negative number when provided.`,
    );
  }

  return numeric;
}

function getRequiredDate(
  payload: Record<string, unknown>,
  fieldName: string,
): string {
  const value = payload[fieldName];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`"${fieldName}" must be a valid date string.`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`"${fieldName}" is not a valid date.`);
  }

  return parsed.toISOString().slice(0, 10);
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
  if (status === 422) return "UNPROCESSABLE_ENTITY";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return "BAD_REQUEST";
}
