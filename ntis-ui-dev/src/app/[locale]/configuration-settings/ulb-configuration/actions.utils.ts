import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { ApiError } from '@/lib/utils/api';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse } from '@/types/common.types';
import type {
  ULBConfigurationFormData,
  UlbSectionKey,
} from '@/types/ulbconfig-master.types';
import {
  normalizeUlbFormData,
  validateUlbConfigurationForm,
  validateUlbConfigurationFormats,
  validateUlbConfigurationSection,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.validator';
import { ULB_API_ERROR_MAP } from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.error-map';

export const ULB_CONFIGURATION_PATH = '/configuration-settings/ulb-configuration';

export type ValidationResult =
  | {
      isValid: true;
      normalizedData: ReturnType<typeof normalizeUlbFormData>;
    }
  | {
      isValid: false;
      validationCode: string;
    };

export function parseApiError(
  responseText?: string,
  defaultKey = 'messages.errorOccurred'
): string {
  if (!responseText) return defaultKey;

  const trimmed = responseText.trim();
  if (ULB_API_ERROR_MAP[trimmed]) return ULB_API_ERROR_MAP[trimmed];

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    if (parsed.errors && typeof parsed.errors === 'object') {
      const [, messages] = Object.entries(parsed.errors as Record<string, unknown>)[0] ?? [];
      let code: string | undefined;

      if (typeof messages === 'string') code = messages.trim();
      else if (Array.isArray(messages) && typeof messages[0] === 'string') code = messages[0].trim();

      if (code && ULB_API_ERROR_MAP[code]) return ULB_API_ERROR_MAP[code];
      if (code) return code;
    }

    const flat = (parsed.message || parsed.error || parsed.title) as string | undefined;
    if (typeof flat === 'string') {
      const flatTrimmed = flat.trim();
      if (ULB_API_ERROR_MAP[flatTrimmed]) return ULB_API_ERROR_MAP[flatTrimmed];
      if (flatTrimmed) return flatTrimmed;
    }
  } catch {}

  return defaultKey;
}

function shouldLogApiError(statusCode?: number): boolean {
  if (statusCode == null) return true;
  return statusCode >= 500;
}

export function handleActionError<T = void>(
  error: unknown,
  fallbackMessage: string
): ApiResponse<T> {
  if (error instanceof ApiError) {
    if (shouldLogApiError(error.statusCode)) {
      logger.error('[ULBConfiguration] ApiError encountered', {
        statusCode: error.statusCode,
        message: error.message,
      });
    }

    const parsed = parseApiError(error.responseText, fallbackMessage);
    const resolvedError =
      parsed === fallbackMessage && error.responseText ? error.responseText : parsed;

    return {
      success: false,
      error: resolvedError,
      statusCode: error.statusCode,
    };
  }

  logger.error('[ULBConfiguration] Unexpected error in action handler', {
    error: error instanceof Error ? error : new Error(String(error)),
  });

  return {
    success: false,
    error: error instanceof Error ? error.message : fallbackMessage,
  };
}

export function validateAndNormalize(
  data: ULBConfigurationFormData,
  section?: UlbSectionKey
): ValidationResult {
  const normalizedData = normalizeUlbFormData(data);

  const validationCode = section
    ? validateUlbConfigurationSection(normalizedData, section)
    : validateUlbConfigurationForm(normalizedData);

  if (validationCode) {
    return { isValid: false, validationCode };
  }

  const formatCode = validateUlbConfigurationFormats(normalizedData, section);
  if (formatCode) {
    return { isValid: false, validationCode: formatCode };
  }

  return { isValid: true, normalizedData };
}

export function revalidateUlbConfiguration(): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}${ULB_CONFIGURATION_PATH}`, 'page');
  }
}

export async function resolveUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore);
}
