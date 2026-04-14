import { createDashboardActionService } from "@/src/features/dashboard/infrastructure/supabase/services/dashboard-action-service";
import { resolveDashboardUserIdFromRequest } from "@/src/features/dashboard/infrastructure/supabase/dashboard-user";
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

type AddFundsRequestBody = {
  readonly amount: number;
  readonly accountId?: string;
  readonly category?: string;
  readonly title?: string;
  readonly occurredAt?: string;
  readonly userId?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseRequestBody<AddFundsRequestBody>(
      request,
      parseAddFundsRequestBody,
      {
        requireJsonContentType: true,
        allowEmptyBody: false,
        maxBytes: 32_768,
      },
    );

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to add funds.",
    );

    const requestedUserId = resolveDashboardUserIdFromRequest(request, {
      requestedUserId: body.userId ?? null,
      fallbackUserId: authenticatedUser.id,
    });

    const userId = assertAuthorizedUserId(
      authenticatedUser.id,
      requestedUserId,
    );

    const service = createDashboardActionService({ userId });

    const result = await service.addFunds({
      userId,
      amount: body.amount,
      accountId: body.accountId,
      category: body.category,
      title: body.title,
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
        code: "BAD_REQUEST",
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

    return jsonError("Failed to add funds.", {
      status: 500,
      code: "INTERNAL_ERROR",
      details: errorToObject(error),
    });
  }
}

function parseAddFundsRequestBody(value: unknown): AddFundsRequestBody {
  const object = assertRecord(value);

  const amountRaw = object.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? Number.parseFloat(amountRaw)
        : Number.NaN;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('"amount" must be a positive number.');
  }

  const accountId = readOptionalString(object.accountId);
  const category = readOptionalString(object.category);
  const title = readOptionalString(object.title);
  const userId = readOptionalString(object.userId);
  const occurredAt = readOptionalString(object.occurredAt);

  if (occurredAt) {
    const timestamp = new Date(occurredAt).getTime();
    if (Number.isNaN(timestamp)) {
      throw new Error('"occurredAt" must be a valid ISO datetime string.');
    }
  }

  return {
    amount,
    accountId,
    category,
    title,
    occurredAt,
    userId,
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
