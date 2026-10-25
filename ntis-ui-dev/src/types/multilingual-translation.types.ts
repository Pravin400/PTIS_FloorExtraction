import { PagedResponse } from "./common.types";

export const SUPPORTED_LANGUAGE_CODES = ["hi", "mr"] as const;
export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

/**
 * Server DTO returned by the MultilingualTranslation API.
 * Shape mirrors `MultilingualTranslationDtos` on the platform side.
 */
export interface MultilingualTranslation {
  [key: string]: unknown;
  id: number;
  resource: string;
  key: string;
  en_US: string;
  hi_IN: string;
  mr_IN: string;
}

/**
 * Payload accepted by the bulk-update endpoint.
 * Matches `BulkUpdateItem<int, UpdateMultilingualTranslationDtos>`.
 */
export interface MultilingualTranslationBulkUpdateItem {
  id: number;
  data: {
    resource: string;
    key: string;
    en_US: string;
    hi_IN: string;
    mr_IN: string;
    updatedBy?: number;
  };
}

export interface MultilingualTranslationBulkResult {
  successCount: number;
  failedCount: number;
  allSucceeded: boolean;
}

export interface LocalizationStringsProps
  extends Omit<PagedResponse<MultilingualTranslation>, "items" | "hasPrevious" | "hasNext"> {
  data: MultilingualTranslation[];
  resources: string[];
  resource?: string;
  languages: SupportedLanguageCode[];
}
