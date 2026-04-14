export const SUPPORTED_LOCALES = ["en", "id"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

const LANGUAGE_PREFERENCE_MAP: Record<string, Locale> = {
  "english (us)": "en",
  "english (uk)": "en",
  english: "en",
  en: "en",
  "bahasa indonesia": "id",
  indonesia: "id",
  indonesian: "id",
  id: "id",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

export function normalizeLocale(
  value: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();

  if (isLocale(normalized)) return normalized;
  if (normalized.startsWith("id")) return "id";
  if (normalized.startsWith("en")) return "en";

  return fallback;
}

export function localeFromLanguagePreference(
  value: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  const mapped = LANGUAGE_PREFERENCE_MAP[normalized];
  if (mapped) return mapped;

  return normalizeLocale(normalized, fallback);
}

export function localeFromAcceptLanguage(
  headerValue: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  if (!headerValue) return fallback;

  const tags = headerValue
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter((part): part is string => Boolean(part));

  for (const tag of tags) {
    const locale = normalizeLocale(tag, fallback);
    if (locale === "en" || locale === "id") return locale;
  }

  return fallback;
}

type NavigatorLike = {
  readonly language?: string;
  readonly languages?: readonly string[];
};

export function detectClientLocale(
  fallback: Locale = DEFAULT_LOCALE,
  navigatorLike: NavigatorLike | null | undefined = typeof navigator !==
  "undefined"
    ? navigator
    : undefined,
): Locale {
  if (!navigatorLike) return fallback;

  const candidates = [
    ...(navigatorLike.languages ?? []),
    navigatorLike.language ?? "",
  ].filter((value): value is string => Boolean(value && value.trim()));

  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate, fallback);
    if (locale === "en" || locale === "id") return locale;
  }

  return fallback;
}

export function resolveLocale(input: {
  explicit?: string | null;
  languagePreference?: string | null;
  acceptLanguage?: string | null;
  fallback?: Locale;
}): Locale {
  const fallback = input.fallback ?? DEFAULT_LOCALE;

  if (input.explicit) return normalizeLocale(input.explicit, fallback);
  if (input.languagePreference) {
    return localeFromLanguagePreference(input.languagePreference, fallback);
  }
  if (input.acceptLanguage) {
    return localeFromAcceptLanguage(input.acceptLanguage, fallback);
  }

  return fallback;
}

export function whenLocale<T>(locale: Locale, values: { en: T; id: T }): T {
  return values[locale] ?? values[DEFAULT_LOCALE];
}

export function createTranslator<
  TDict extends Record<string, Partial<Record<Locale, string>>>,
>(dictionary: TDict) {
  return function t(
    key: keyof TDict,
    locale: Locale,
    fallbackLocale: Locale = DEFAULT_LOCALE,
  ): string {
    const row = dictionary[key as string];
    return row?.[locale] ?? row?.[fallbackLocale] ?? String(key);
  };
}
