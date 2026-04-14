export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiMeta = {
  readonly timestamp: string;
  readonly requestId?: string;
};

export type ApiSuccess<TData> = {
  readonly ok: true;
  readonly message: string;
  readonly data: TData;
  readonly meta: ApiMeta;
};

export type ApiError = {
  readonly ok: false;
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly meta: ApiMeta;
};

export type ApiResult<TData> = ApiSuccess<TData> | ApiError;

export type ApiSuccessOptions = {
  readonly message?: string;
  readonly requestId?: string;
};

export type ApiErrorOptions = {
  readonly code?: ApiErrorCode;
  readonly details?: unknown;
  readonly status?: number;
  readonly requestId?: string;
};

export function createApiSuccess<TData>(
  data: TData,
  options: ApiSuccessOptions = {},
): ApiSuccess<TData> {
  return {
    ok: true,
    message: options.message ?? "Success",
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options.requestId,
    },
  };
}

export function createApiError(
  message: string,
  options: ApiErrorOptions = {},
): ApiError {
  return {
    ok: false,
    code: options.code ?? "BAD_REQUEST",
    message,
    details: options.details,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: options.requestId,
    },
  };
}

export function toApiResponseInit(
  init?: ResponseInit,
  defaultStatus = 200,
): ResponseInit {
  return {
    status: init?.status ?? defaultStatus,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  };
}

export function jsonSuccess<TData>(
  data: TData,
  options: ApiSuccessOptions = {},
  init?: ResponseInit,
): Response {
  const body = createApiSuccess(data, options);
  return new Response(JSON.stringify(body), toApiResponseInit(init, 200));
}

export function jsonError(
  message: string,
  options: ApiErrorOptions = {},
  init?: ResponseInit,
): Response {
  const body = createApiError(message, options);
  const status = options.status ?? init?.status ?? 400;

  return new Response(
    JSON.stringify(body),
    toApiResponseInit({ ...init, status }, status),
  );
}

export function isApiError<TData>(value: ApiResult<TData>): value is ApiError {
  return value.ok === false;
}

export async function readJsonBody<TBody>(
  request: Request,
): Promise<{ ok: true; data: TBody } | { ok: false; error: ApiError }> {
  try {
    const data = (await request.json()) as TBody;
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: createApiError("Invalid JSON request body.", {
        code: "BAD_REQUEST",
        details: errorToObject(error),
      }),
    };
  }
}

export function errorToObject(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
