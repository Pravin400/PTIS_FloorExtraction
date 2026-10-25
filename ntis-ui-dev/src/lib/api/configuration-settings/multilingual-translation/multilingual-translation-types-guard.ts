import { ApiError } from "@/lib/utils/api";
import { MultilingualTranslation } from "@/types/multilingual-translation.types";

export function isMultilingualTranslationShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id);
  return Number.isFinite(id) && id > 0;
}

export function normalizeMultilingualTranslation(
  data: Record<string, unknown>
): MultilingualTranslation {
  const id = Number(data.id ?? data.Id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid translation id: ${data.id ?? data.Id}`
    );
  }

  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = data[k];
      if (v != null) return String(v);
    }
    return "";
  };

  return {
    id,
    resource: pick("resource", "Resource"),
    key: pick("key", "Key"),
    en_US: pick("en_US", "En_US", "enUS"),
    hi_IN: pick("hi_IN", "Hi_IN", "hiIN"),
    mr_IN: pick("mr_IN", "Mr_IN", "mrIN"),
  };
}
