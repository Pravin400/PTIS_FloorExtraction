import { ApiError } from "@/lib/utils/api";

const GENERIC_PATTERNS = [
  /^something went wrong\.?$/i,
  /^an error occurred\.?$/i,
  /^unknown error\.?$/i,
  /^failed to search properties\.?$/i,
  /^property search failed\.?$/i,
  /^network error\.?$/i,
  /^error\.?$/i,
];

const FALLBACK_MESSAGE =
  "Unable to load search data. Please check your connection and try again.";

function isGenericMessage(message: string): boolean {
  const trimmed = message.trim();
  if (GENERIC_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  const detail = extractDetailAfterColon(trimmed);
  if (detail && GENERIC_PATTERNS.some((pattern) => pattern.test(detail))) {
    return true;
  }

  return false;
}

function isHttpStatusMessage(message: string): boolean {
  return /^(forbidden|unauthorized|not found|bad request|internal server error|request timeout|network error)$/i.test(
    message.trim()
  );
}

function isUnhelpfulMessage(message: string): boolean {
  if (isGenericMessage(message) || isHttpStatusMessage(message)) {
    return true;
  }

  const detail = extractDetailAfterColon(message);
  return Boolean(
    detail && (isGenericMessage(detail) || isHttpStatusMessage(detail))
  );
}

function tryParseJsonError(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const errors = parsed.errors;

    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
      for (const value of Object.values(errors as Record<string, unknown>)) {
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
        if (
          Array.isArray(value) &&
          typeof value[0] === "string" &&
          value[0].trim()
        ) {
          return value[0].trim();
        }
      }
    }

    for (const key of ["message", "error", "title", "detail"] as const) {
      const value = parsed[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

function extractDetailAfterColon(message: string): string | null {
  const idx = message.indexOf(": ");
  if (idx <= 0) {
    return null;
  }

  const detail = message.slice(idx + 2).trim();
  return detail || null;
}

function normalizeCandidate(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  const trimmed = raw.trim();
  const candidates: string[] = [];

  const jsonMessage = tryParseJsonError(trimmed);
  if (jsonMessage) {
    candidates.push(jsonMessage);
  }

  const detail = extractDetailAfterColon(trimmed);
  if (detail) {
    candidates.push(detail);
  }

  candidates.push(trimmed);

  return candidates;
}

function pickUserMessage(...rawCandidates: (string | undefined)[]): string | null {
  for (const raw of rawCandidates) {
    for (const candidate of normalizeCandidate(raw)) {
      if (!isUnhelpfulMessage(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function resolveApiErrorMessage(error: ApiError): string {
  const resolved = pickUserMessage(error.error, error.message, error.contextMessage);

  if (resolved) {
    return resolved;
  }

  if (error.statusCode === 401 || error.statusCode === 403) {
    return "You do not have permission to search properties.";
  }

  if (error.statusCode === 408) {
    return "The search request timed out. Please try again.";
  }

  return FALLBACK_MESSAGE;
}

/**
 * Extracts a user-facing message from errors thrown during Search Property SSR/actions.
 */
export function resolveSearchErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    return resolveApiErrorMessage(error);
  }

  const message = error.message?.trim();
  if (!message) {
    return "Unable to complete the search request.";
  }

  return pickUserMessage(message) ?? FALLBACK_MESSAGE;
}
