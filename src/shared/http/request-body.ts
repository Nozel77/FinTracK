export type RequestBodyParser<T> = (value: unknown) => T;

export type ParseRequestBodyOptions = {
  readonly requireJsonContentType?: boolean;
  readonly allowEmptyBody?: boolean;
  readonly maxBytes?: number;
};

export class RequestBodyError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      readonly status: number;
      readonly code: string;
      readonly details?: unknown;
    },
  ) {
    super(message);
    this.name = "RequestBodyError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

/**
 * Parse a JSON request body and optionally validate/transform it.
 *
 * Usage:
 * - `await parseRequestBody(request)` -> returns `unknown`
 * - `await parseRequestBody(request, parseFn)` -> returns typed value
 */
export async function parseRequestBody<T = unknown>(
  request: Request,
  parser?: RequestBodyParser<T>,
  options: ParseRequestBodyOptions = {},
): Promise<T> {
  const requireJsonContentType = options.requireJsonContentType ?? true;
  const allowEmptyBody = options.allowEmptyBody ?? false;

  const contentType = request.headers.get("content-type");
  if (requireJsonContentType && !isJsonContentType(contentType)) {
    throw new RequestBodyError(
      'Unsupported content type. Expected "application/json".',
      {
        status: 415,
        code: "unsupported_media_type",
        details: { contentType },
      },
    );
  }

  const rawText = await request.text();

  if (!rawText.trim()) {
    if (!allowEmptyBody) {
      throw new RequestBodyError("Request body is required.", {
        status: 400,
        code: "empty_body",
      });
    }

    const emptyValue = undefined as unknown;
    return parser ? safeRunParser(parser, emptyValue) : (emptyValue as T);
  }

  if (typeof options.maxBytes === "number") {
    const byteLength = new TextEncoder().encode(rawText).length;
    if (byteLength > options.maxBytes) {
      throw new RequestBodyError("Request body is too large.", {
        status: 413,
        code: "payload_too_large",
        details: { maxBytes: options.maxBytes, receivedBytes: byteLength },
      });
    }
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new RequestBodyError("Invalid JSON body.", {
      status: 400,
      code: "invalid_json",
    });
  }

  return parser ? safeRunParser(parser, parsedJson) : (parsedJson as T);
}

function safeRunParser<T>(parser: RequestBodyParser<T>, value: unknown): T {
  try {
    return parser(value);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      throw error;
    }

    throw new RequestBodyError("Invalid request body payload.", {
      status: 422,
      code: "invalid_body",
      details:
        error instanceof Error
          ? { message: error.message }
          : { error: String(error) },
    });
  }
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;

  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("application/json") ||
    normalized.includes("+json")
  );
}
