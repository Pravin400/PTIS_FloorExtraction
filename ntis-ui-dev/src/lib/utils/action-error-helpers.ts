import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ApiResponse } from "@/types/common.types";
import { logger } from "@/lib/utils/logger";

/**
 * Extract the locale from the request's referer header.
 * Falls back to "en" if extraction fails.
 */
export async function getLocaleFromHeaders(): Promise<string> {
    try {
        const headersList = await headers();
        const referer = headersList.get("referer");
        if (referer) {
            const url = new URL(referer);
            const pathParts = url.pathname.split("/").filter(Boolean);
            if (pathParts.length > 0 && ["en", "hi", "mr"].includes(pathParts[0])) {
                return pathParts[0];
            }
        }
    } catch { /* fallback to default */ }
    return "en";
}

/**
 * Parse JSON-encoded backend error strings into user-friendly messages.
 * Handles nested `{ errors: { ... } }` and `{ message, title }` patterns.
 * Returns null if no JSON pattern matched (caller should continue with other checks).
 */
export async function parseJsonApiError(
    str: string,
    locale: string,
    namespace: string
): Promise<string | null> {
    if (!str.startsWith("{") || !str.endsWith("}")) return null;
    try {
        const parsed = JSON.parse(str);
        const errors = parsed.errors;
        if (errors && typeof errors === "object" && !Array.isArray(errors)) {
            for (const key of Object.keys(errors).filter(k => k !== "General" && k !== "dto")) {
                const val = errors[key];
                const msg = Array.isArray(val) ? val[0] : val;
                if (typeof msg === "string" && msg.trim()) {
                    return await cleanCommonApiError(msg, locale, namespace);
                }
            }
        }
        const msg = parsed.message || parsed.title;
        if (msg) return await cleanCommonApiError(msg, locale, namespace);
    } catch { /* not valid JSON, return null */ }
    return null;
}

/**
 * Clean common backend error patterns shared across all action files.
 * Handles: JSON objects, type conversion errors, required field errors.
 */
export async function cleanCommonApiError(
    err: string | undefined | null,
    locale: string,
    namespace = "quickDataEntry",
    fallbackKey = "discount.socialConfirm.unexpectedError"
): Promise<string> {
    const t = await getTranslations({ locale, namespace });
    if (!err) return t(fallbackKey) || "An unexpected error occurred";

    const str = String(err).trim();

    const jsonResult = await parseJsonApiError(str, locale, namespace);
    if (jsonResult) return jsonResult;

    if (str.includes("could not be converted") || str.includes("System.Nullable")) {
        return str.includes("Int32")
            ? (t("discount.socialValidation.invalidInteger") || "Value must be a valid integer.")
            : (t("discount.socialValidation.invalidDecimal") || "Value format is invalid.");
    }
    if (str.toLowerCase().includes("dto field is required")) {
        return t("discount.socialValidation.required", { fieldName: "Value" }) || "Required information is missing.";
    }
    if (str.includes("InvalidCharacters")) {
        return t("property.validation.invalidCharacters") || "Input contains invalid characters. Only alphanumeric characters and standard punctuation are allowed.";
    }
    return str;
}

/**
 * Build a failed ApiResponse from an error, with localized user-friendly message.
 */
export async function handleActionError<T>(
    error: unknown,
    fallbackKey: string,
    locale?: string,
    namespace = "quickDataEntry",
    cleanErrorFn?: (err: string, locale: string, namespace: string) => Promise<string>
): Promise<ApiResponse<T>> {
    const loc = locale || await getLocaleFromHeaders();
    const t = await getTranslations({ locale: loc, namespace });
    const rawMsg = error instanceof Error ? error.message : (typeof error === "string" ? error : (t(fallbackKey) || "An error occurred"));
    const cleanFn = cleanErrorFn || cleanCommonApiError;
    const cleanedMessage = await cleanFn(rawMsg, loc, namespace);
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    return {
        success: false,
        error: cleanedMessage,
        message: cleanedMessage,
        statusCode
    };
}

/**
 * Log and return a failed ApiResponse — convenience wrapper for Server Actions.
 */
export async function logAndHandleError<T>(
    context: string,
    error: unknown,
    fallbackKey: string,
    logMeta: Record<string, unknown>,
    locale?: string,
    namespace?: string,
    cleanErrorFn?: (err: string, locale: string, namespace: string) => Promise<string>
): Promise<ApiResponse<T>> {
    logger.error(context, { ...logMeta, error: error as Error });
    return handleActionError<T>(error, fallbackKey, locale, namespace, cleanErrorFn);
}
