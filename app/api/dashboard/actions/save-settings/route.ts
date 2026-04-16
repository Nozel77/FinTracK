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

type StartOfWeek = "Monday" | "Sunday";

type SaveSettingsRequestBody = {
  readonly userId?: string;
  readonly profile?: {
    readonly fullName?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly role?: string;
  };
  readonly preferences?: {
    readonly currency?: string;
    readonly timezone?: string;
    readonly language?: string;
    readonly startOfWeek?: StartOfWeek;
    readonly dailyTransactionLimit?: number;
    readonly monthlyDebtInstallment?: number;
    readonly emergencyFundBalance?: number;
  };
  readonly toggles?: {
    readonly emailAlerts?: boolean;
    readonly pushNotifications?: boolean;
    readonly monthlyReport?: boolean;
    readonly compactMode?: boolean;
  };
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseRequestBody<SaveSettingsRequestBody>(
      request,
      parseSaveSettingsRequestBody,
      {
        requireJsonContentType: true,
        allowEmptyBody: false,
        maxBytes: 64 * 1024,
      },
    );

    const authenticatedUser = await requireAuthenticatedUser(
      "You must be signed in to save settings.",
    );
    const userId = assertAuthorizedUserId(authenticatedUser.id, body.userId);

    const actionService = createDashboardActionService({ userId });

    const result = await actionService.saveSettings({
      userId,
      profile: body.profile,
      preferences: body.preferences,
      toggles: body.toggles,
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
        code: error.status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
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

    return jsonError("Failed to save settings.", {
      status: 500,
      code: "INTERNAL_ERROR",
      details: errorToObject(error),
    });
  }
}

function parseSaveSettingsRequestBody(value: unknown): SaveSettingsRequestBody {
  const payload = assertRecord(value);

  const userId = getOptionalString(payload.userId, "userId", 128);

  const profileRaw = payload.profile;
  const preferencesRaw = payload.preferences;
  const togglesRaw = payload.toggles;

  const profile =
    profileRaw === undefined ? undefined : parseProfile(profileRaw);
  const preferences =
    preferencesRaw === undefined ? undefined : parsePreferences(preferencesRaw);
  const toggles =
    togglesRaw === undefined ? undefined : parseToggles(togglesRaw);

  if (!profile && !preferences && !toggles) {
    throw new Error(
      'At least one section is required: "profile", "preferences", or "toggles".',
    );
  }

  return {
    userId,
    profile,
    preferences,
    toggles,
  };
}

function parseProfile(value: unknown): SaveSettingsRequestBody["profile"] {
  const profile = assertRecord(value);

  const fullName = getOptionalString(profile.fullName, "profile.fullName", 120);
  const email = getOptionalString(profile.email, "profile.email", 160);
  const phone = getOptionalString(profile.phone, "profile.phone", 40);
  const role = getOptionalString(profile.role, "profile.role", 80);

  if (email && !isLikelyEmail(email)) {
    throw new Error('"profile.email" must be a valid email format.');
  }

  if (!fullName && !email && !phone && !role) {
    return undefined;
  }

  return {
    fullName,
    email,
    phone,
    role,
  };
}

function parsePreferences(
  value: unknown,
): SaveSettingsRequestBody["preferences"] {
  const preferences = assertRecord(value);

  const currency = getOptionalString(
    preferences.currency,
    "preferences.currency",
    16,
  );
  const timezone = getOptionalString(
    preferences.timezone,
    "preferences.timezone",
    80,
  );
  const language = getOptionalString(
    preferences.language,
    "preferences.language",
    80,
  );
  const dailyTransactionLimit = getOptionalPositiveNumber(
    preferences.dailyTransactionLimit,
    "preferences.dailyTransactionLimit",
  );
  const monthlyDebtInstallment = getOptionalNonNegativeNumber(
    preferences.monthlyDebtInstallment,
    "preferences.monthlyDebtInstallment",
  );
  const emergencyFundBalance = getOptionalNonNegativeNumber(
    preferences.emergencyFundBalance,
    "preferences.emergencyFundBalance",
  );

  const startOfWeekRaw = preferences.startOfWeek;
  let startOfWeek: StartOfWeek | undefined;
  if (startOfWeekRaw !== undefined && startOfWeekRaw !== null) {
    if (startOfWeekRaw !== "Monday" && startOfWeekRaw !== "Sunday") {
      throw new Error(
        '"preferences.startOfWeek" must be "Monday" or "Sunday".',
      );
    }
    startOfWeek = startOfWeekRaw;
  }

  if (
    !currency &&
    !timezone &&
    !language &&
    !startOfWeek &&
    dailyTransactionLimit === undefined &&
    monthlyDebtInstallment === undefined &&
    emergencyFundBalance === undefined
  ) {
    return undefined;
  }

  return {
    currency,
    timezone,
    language,
    startOfWeek,
    dailyTransactionLimit,
    monthlyDebtInstallment,
    emergencyFundBalance,
  };
}

function parseToggles(value: unknown): SaveSettingsRequestBody["toggles"] {
  const toggles = assertRecord(value);

  const emailAlerts = getOptionalBoolean(
    toggles.emailAlerts,
    "toggles.emailAlerts",
  );
  const pushNotifications = getOptionalBoolean(
    toggles.pushNotifications,
    "toggles.pushNotifications",
  );
  const monthlyReport = getOptionalBoolean(
    toggles.monthlyReport,
    "toggles.monthlyReport",
  );
  const compactMode = getOptionalBoolean(
    toggles.compactMode,
    "toggles.compactMode",
  );

  if (
    emailAlerts === undefined &&
    pushNotifications === undefined &&
    monthlyReport === undefined &&
    compactMode === undefined
  ) {
    return undefined;
  }

  return {
    emailAlerts,
    pushNotifications,
    monthlyReport,
    compactMode,
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function getOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== "string") {
    throw new Error(`"${fieldName}" must be a string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  if (trimmed.length > maxLength) {
    throw new Error(`"${fieldName}" must be at most ${maxLength} characters.`);
  }

  return trimmed;
}

function getOptionalPositiveNumber(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;

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
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`"${fieldName}" must be a non-negative number.`);
  }

  return numeric;
}

function getOptionalBoolean(
  value: unknown,
  fieldName: string,
): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(`"${fieldName}" must be a boolean.`);
  }
  return value;
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
