import { ConstructionTypeFormModel, ConstructionType } from "@/types/construction.types";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import { HAS_LETTER_REGEX } from "@/lib/utils/validation";

const ENGLISH_FORMAT_REGEX = /^[A-Za-z0-9\s/,.()&-]+$/;

/**
 * Validates construction type ID
 */
export function validateid(id: number): boolean {
  return Number.isFinite(id) && id > 0;
}

/**
 * Validates and prepares search term for API request
 */
export function validateAndPrepareSearchTerm(searchTerm?: string): string | undefined {
  if (typeof searchTerm !== "string") return undefined;
  
  const trimmedSearchTerm = searchTerm.trim();
  if (trimmedSearchTerm.length === 0) return undefined;
  
  const MAX_SEARCH_TERM_LENGTH = 100;
  return trimmedSearchTerm.slice(0, MAX_SEARCH_TERM_LENGTH);
}

/**
 * Validates form data for create operation
 */
export async function validateCreateFormData(
  data: ConstructionTypeFormModel,
  existingItems?: ConstructionType[]
): Promise<void> {
  const t = await getTranslations("construction.constructionType").catch(() => null);

  if (!data.constructionCode?.trim()) {
    throw new ApiError(400, t ? t("form.validation.constructionCodeRequired", { constructionType: t("aliasFallback.entity") }) : "Construction code is required", "Validation failed");
  }
  if (!data.descriptionEnglish?.trim()) {
    throw new ApiError(400, t ? t("form.validation.descriptionEnglishRequired") : "English description is required", "Validation failed");
  }
  if (data.descriptionEnglish.trim().length > 100) {
    throw new ApiError(400, t ? t("form.validation.descriptionEnglishMaxLength") : "English description cannot exceed 100 characters", "Validation failed");
  }
  if (!data.description?.trim()) {
    throw new ApiError(400, t ? t("form.validation.descriptionRequired") : "Regional description is required", "Validation failed");
  }
  if (data.description.trim().length > 100) {
    throw new ApiError(400, t ? t("form.validation.descriptionMaxLength") : "Regional description cannot exceed 100 characters", "Validation failed");
  }
  if (!HAS_LETTER_REGEX.test(data.constructionCode)) {
    throw new ApiError(400, t ? t("form.validation.constructionCodeNumbersOnlyNotAllowed", { constructionType: t("aliasFallback.entity") }) : "Construction code must contain at least one letter", "Validation failed");
  }
  if (!HAS_LETTER_REGEX.test(data.descriptionEnglish)) {
    throw new ApiError(400, t ? t("form.validation.descriptionEnglishNumbersOnlyNotAllowed") : "English description must contain at least one letter", "Validation failed");
  }
  if (!ENGLISH_FORMAT_REGEX.test(data.descriptionEnglish)) {
    throw new ApiError(
      400,
      t ? t("form.validation.descriptionEnglishFormat") : "Only English letters, numbers, spaces, and basic punctuation allowed (,./-()).",
      "Validation failed"
    );
  }
  if (!HAS_LETTER_REGEX.test(data.description)) {
    throw new ApiError(400, t ? t("form.validation.descriptionNumbersOnlyNotAllowed") : "Regional description must contain at least one letter", "Validation failed");
  }

  if (existingItems?.length) {
    const code = data.constructionCode.trim().toLowerCase();
    const descEng = data.descriptionEnglish.trim().toLowerCase();
    const desc = data.description.trim().toLowerCase();

    if (existingItems.some((i) => (i.constructionCode ?? "").trim().toLowerCase() === code)) {
      throw new ApiError(409, t ? t("form.validation.constructionCodeExists", { constructionType: t("aliasFallback.entity") }) : "This Construction Code already exists. Please use a different code.", "Validation failed");
    }
    if (existingItems.some((i) => (i.descriptionEnglish ?? "").trim().toLowerCase() === descEng)) {
      throw new ApiError(409, t ? (t("form.validation.descriptionEnglishExists") || t("form.validation.descriptionExists")) : "English Description already exists. Please enter a different description.", "Validation failed");
    }
    if (existingItems.some((i) => (i.description ?? "").trim().toLowerCase() === desc)) {
      throw new ApiError(409, t ? t("form.validation.descriptionExists") : "Description already exists. Please enter a different description.", "Validation failed");
    }
  }
}

/**
 * Validates form data for update operation
 */
export async function validateUpdateFormData(
  data: ConstructionTypeFormModel,
  existingItems?: ConstructionType[]
): Promise<void> {
  const t = await getTranslations("construction.constructionType").catch(() => null);

  if (!data.id || data.id <= 0) {
    throw new ApiError(400, t ? t("form.validation.idRequiredForUpdate", { constructionType: t("aliasFallback.entity") }) : "Construction Type ID is required for update", "Validation failed");
  }
  if (!data.constructionCode?.trim()) {
    throw new ApiError(400, t ? t("form.validation.constructionCodeRequired", { constructionType: t("aliasFallback.entity") }) : "Construction code is required", "Validation failed");
  }
  if (!data.descriptionEnglish?.trim()) {
    throw new ApiError(400, t ? t("form.validation.descriptionEnglishRequired") : "English description is required", "Validation failed");
  }
  if (data.descriptionEnglish.trim().length > 100) {
    throw new ApiError(400, t ? t("form.validation.descriptionEnglishMaxLength") : "English description cannot exceed 100 characters", "Validation failed");
  }
  if (!data.description?.trim()) {
    throw new ApiError(400, t ? t("form.validation.descriptionRequired") : "Regional description is required", "Validation failed");
  }
  if (data.description.trim().length > 100) {
    throw new ApiError(400, t ? t("form.validation.descriptionMaxLength") : "Regional description cannot exceed 100 characters", "Validation failed");
  }
  if (!HAS_LETTER_REGEX.test(data.constructionCode)) {
    throw new ApiError(400, t ? t("form.validation.constructionCodeNumbersOnlyNotAllowed", { constructionType: t("aliasFallback.entity") }) : "Construction code must contain at least one letter", "Validation failed");
  }
  if (!HAS_LETTER_REGEX.test(data.descriptionEnglish)) {
    throw new ApiError(400, t ? t("form.validation.descriptionEnglishNumbersOnlyNotAllowed") : "English description must contain at least one letter", "Validation failed");
  }
  if (!ENGLISH_FORMAT_REGEX.test(data.descriptionEnglish)) {
    throw new ApiError(
      400,
      t ? t("form.validation.descriptionEnglishFormat") : "Only English letters, numbers, spaces, and basic punctuation allowed (,./-()).",
      "Validation failed"
    );
  }
  if (!HAS_LETTER_REGEX.test(data.description)) {
    throw new ApiError(400, t ? t("form.validation.descriptionNumbersOnlyNotAllowed") : "Regional description must contain at least one letter", "Validation failed");
  }

  if (existingItems?.length) {
    const id = Number(data.id);
    const code = data.constructionCode.trim().toLowerCase();
    const descEng = data.descriptionEnglish.trim().toLowerCase();
    const desc = data.description.trim().toLowerCase();

    if (existingItems.some((i) => i.id !== id && (i.constructionCode ?? "").trim().toLowerCase() === code)) {
      throw new ApiError(409, t ? t("form.validation.constructionCodeExists", { constructionType: t("aliasFallback.entity") }) : "This Construction Code already exists. Please use a different code.", "Validation failed");
    }
    if (existingItems.some((i) => i.id !== id && (i.descriptionEnglish ?? "").trim().toLowerCase() === descEng)) {
      throw new ApiError(409, t ? (t("form.validation.descriptionEnglishExists") || t("form.validation.descriptionExists")) : "English Description already exists. Please enter a different description.", "Validation failed");
    }
    if (existingItems.some((i) => i.id !== id && (i.description ?? "").trim().toLowerCase() === desc)) {
      throw new ApiError(409, t ? t("form.validation.descriptionExists") : "Description already exists. Please enter a different description.", "Validation failed");
    }
  }
}

/**
 * Checks if backend response contains error messages and throws appropriate errors
 */
export function checkBackendResponseErrors(responseData: Record<string, unknown> | null, operation: string): void {
  if (!responseData || typeof responseData !== 'object') return;
  
  const { message: rawMessage, error: rawError } = responseData as {
    message?: unknown;
    error?: unknown;
  };
  const messageValue = rawMessage ?? rawError;
  
  if (typeof messageValue === 'string' && messageValue) {
    const message = messageValue;
    const lowerMsg = message.toLowerCase();

    // Only throw error if message indicates an actual error
    const isErrorMessage =
      lowerMsg.includes("already exists") ||
      lowerMsg.includes("duplicate") ||
      lowerMsg.includes("error") ||
      lowerMsg.includes("failed") ||
      lowerMsg.includes("invalid") ||
      lowerMsg.includes("not found");

    // Skip success messages like "Record inserted successfully"
    const isSuccessMessage =
      lowerMsg.includes("success") ||
      lowerMsg.includes("created") ||
      lowerMsg.includes("inserted") ||
      lowerMsg.includes("updated") ||
      lowerMsg.includes("modified");

    if (isErrorMessage && !isSuccessMessage) {
      const isDuplicate =
        lowerMsg.includes("already exists") ||
        lowerMsg.includes("duplicate");

      throw new ApiError(
        isDuplicate ? 409 : 400,
        message,
        `${operation} failed`
      );
    }
  }
}

/**
 * Determines status code from error message for delete operations
 */
export function getDeleteErrorStatusCode(errorMsg: string): number {
  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist")) {
    return 404; // Not Found
  } else if (
    lowerMsg.includes("in use") ||
    lowerMsg.includes("linked") ||
    lowerMsg.includes("referenced") ||
    lowerMsg.includes("associated") ||
    lowerMsg.includes("cannot delete")
  ) {
    return 409; // Conflict - record in use
  } else if (
    lowerMsg.includes("invalid") ||
    lowerMsg.includes("bad request")
  ) {
    return 400; // Bad Request
  } else {
    return 500; // Default to server error
  }
}

/**
 * Creates appropriate ApiError based on response status and message
 */
export function createApiError(statusCode?: number, errorMessage?: string, defaultMessage: string = "Operation failed"): ApiError {
  // Detect duplicate error from backend message
  const errorMsg = errorMessage || "";
  const isDuplicate = errorMsg.toLowerCase().includes("already exists") || 
                      errorMsg.toLowerCase().includes("duplicate");
  
  return new ApiError(
    statusCode ?? (isDuplicate ? 409 : 500),
    errorMessage || defaultMessage,
    defaultMessage
  );
}