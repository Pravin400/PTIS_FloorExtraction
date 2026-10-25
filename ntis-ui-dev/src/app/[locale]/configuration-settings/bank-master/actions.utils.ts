import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { ApiError } from '@/lib/utils/api';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse } from '@/types/common.types';
import type { BankMasterDto } from '@/types/bank-master.types';
import {
  validateBankMasterDto,
  normalizeBankData,
} from '@/lib/api/configuration-settings/bank/bank-master.validator';

export const BANK_MASTER_PATH = '/configuration-settings/bank-master';

export type ValidationResult =
  | {
      isValid: true;
      normalizedData: ReturnType<typeof normalizeBankData>;
    }
  | {
      isValid: false;
      validationCode: string;
    };

const BANK_API_ERROR_MAP: Record<string, string> = {
  IFSCCode_Invalid_Format: 'validation.ifscFormat',
  BankCode_Already_Exists: 'validation.bankCodeExists',
  BankName_Already_Exists: 'validation.bankNameExists',
  IFSCCode_Already_Exists: 'validation.ifscCodeExists',
  IFSC_Already_Exists: 'validation.ifscCodeExists',
  IFSCCode_Exists: 'validation.ifscCodeExists',
  IFSC_Exists: 'validation.ifscCodeExists',
  Pincode_Invalid_Format: 'validation.pincodeFormat',
};

export function parseApiError(
  responseText?: string,
  defaultKey = 'messages.errorOccurred'
): string {
  if (!responseText) return defaultKey;

  const trimmed = responseText.trim();
  if (BANK_API_ERROR_MAP[trimmed]) return BANK_API_ERROR_MAP[trimmed];

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    if (parsed.errors && typeof parsed.errors === 'object') {
      const [, messages] = Object.entries(parsed.errors)[0] ?? [];
      let code: string | undefined;

      if (typeof messages === 'string') code = messages.trim();
      else if (Array.isArray(messages) && typeof messages[0] === 'string')
        code = messages[0].trim();

      if (code && BANK_API_ERROR_MAP[code]) return BANK_API_ERROR_MAP[code];
      if (code) return code;
    }

    const flat = (parsed.message || parsed.error || parsed.code) as string | undefined;
    if (typeof flat === 'string') {
      const flatTrimmed = flat.trim();
      if (BANK_API_ERROR_MAP[flatTrimmed]) return BANK_API_ERROR_MAP[flatTrimmed];
      if (flatTrimmed) return flatTrimmed;
    }
  } catch {}

  return defaultKey;
}

export function handleActionError<T = void>(
  error: unknown,
  fallbackMessage: string
): ApiResponse<T> {
  if (error instanceof ApiError) {
    logger.error('[BankMaster] ApiError encountered', {
      statusCode: error.statusCode,
      message: error.message,
    });

    const parsed = parseApiError(error.responseText, fallbackMessage);
    const resolvedError =
      parsed === fallbackMessage && error.responseText ? error.responseText : parsed;

    return {
      success: false,
      error: resolvedError,
      statusCode: error.statusCode,
    };
  }

  logger.error('[BankMaster] Unexpected error in action handler', {
    error: error instanceof Error ? error : new Error(String(error)),
  });

  return {
    success: false,
    error: error instanceof Error ? error.message : fallbackMessage,
  };
}

export function validateAndNormalize(data: BankMasterDto): ValidationResult {
  const validationCode = validateBankMasterDto(data);

  if (validationCode) {
    return { isValid: false, validationCode };
  }

  return { isValid: true, normalizedData: normalizeBankData(data) };
}

export function revalidateBankMaster(): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}${BANK_MASTER_PATH}`, 'page');
  }
}

export async function resolveUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore);
}
