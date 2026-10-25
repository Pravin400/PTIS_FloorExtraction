import { ApiError } from "@/lib/utils/api";
import {
  MultilingualTranslationBulkUpdateItem,
  SUPPORTED_LANGUAGE_CODES,
  SupportedLanguageCode,
} from "@/types/multilingual-translation.types";

const MAX_TRANSLATION_LENGTH = 4000;
const MAX_KEY_LENGTH = 200;
const MAX_RESOURCE_LENGTH = 200;
const MAX_BULK_ITEMS = 500;

export function validateTranslationId(id: number): boolean {
  return Number.isFinite(id) && id > 0;
}

export function validateResourceFilter(resource?: string): string | undefined {
  if (typeof resource !== "string") return undefined;
  const trimmed = resource.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, MAX_RESOURCE_LENGTH);
}

export function validateLanguageFilter(
  languages?: readonly string[]
): SupportedLanguageCode[] {
  if (!languages || languages.length === 0) return [];
  const allowed = SUPPORTED_LANGUAGE_CODES as readonly string[];
  const cleaned = languages
    .map((l) => l.trim().toLowerCase())
    .filter((l): l is SupportedLanguageCode => allowed.includes(l));
  return Array.from(new Set(cleaned));
}

/**
 * Validates a bulk-update batch before it leaves the client.
 * Throws ApiError(400) on the first invalid item so the caller sees the
 * specific failure rather than a generic server-side rejection.
 */
export function validateBulkUpdateItems(
  items: MultilingualTranslationBulkUpdateItem[]
): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "No items provided for bulk update", "Validation failed");
  }
  if (items.length > MAX_BULK_ITEMS) {
    throw new ApiError(
      400,
      `Cannot update more than ${MAX_BULK_ITEMS} translations in a single request`,
      "Validation failed"
    );
  }

  const seenIds = new Set<number>();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new ApiError(400, "Invalid bulk update item", "Validation failed");
    }
    if (!validateTranslationId(item.id)) {
      throw new ApiError(400, `Invalid translation id: ${item.id}`, "Validation failed");
    }
    if (seenIds.has(item.id)) {
      throw new ApiError(400, `Duplicate translation id in batch: ${item.id}`, "Validation failed");
    }
    seenIds.add(item.id);

    const data = item.data;
    if (!data || typeof data !== "object") {
      throw new ApiError(400, `Missing data for translation id ${item.id}`, "Validation failed");
    }

    if (typeof data.resource !== "string" || data.resource.trim().length === 0) {
      throw new ApiError(400, `Resource is required for translation id ${item.id}`, "Validation failed");
    }
    if (data.resource.length > MAX_RESOURCE_LENGTH) {
      throw new ApiError(
        400,
        `Resource exceeds ${MAX_RESOURCE_LENGTH} characters for translation id ${item.id}`,
        "Validation failed"
      );
    }
    if (typeof data.key !== "string" || data.key.trim().length === 0) {
      throw new ApiError(400, `Key is required for translation id ${item.id}`, "Validation failed");
    }
    if (data.key.length > MAX_KEY_LENGTH) {
      throw new ApiError(
        400,
        `Key exceeds ${MAX_KEY_LENGTH} characters for translation id ${item.id}`,
        "Validation failed"
      );
    }

    for (const field of ["en_US", "hi_IN", "mr_IN"] as const) {
      const value = data[field];
      if (typeof value !== "string") {
        throw new ApiError(
          400,
          `${field} must be a string for translation id ${item.id}`,
          "Validation failed"
        );
      }
      if (value.length > MAX_TRANSLATION_LENGTH) {
        throw new ApiError(
          400,
          `${field} exceeds ${MAX_TRANSLATION_LENGTH} characters for translation id ${item.id}`,
          "Validation failed"
        );
      }
    }
  }
}
