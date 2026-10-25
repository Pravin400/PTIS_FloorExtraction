 
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { ApiError } from '@/lib/utils/api';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { logger } from '@/lib/utils/logger';
import type { ActionResult } from '@/types/common.types';

export const ASSET_MASTER_PATH = '/assets/configuration';

const ASSET_API_ERROR_MAP: Record<string, string> = {};

export function parseApiError(
  responseText?: string,
  defaultKey = 'messages.errorOccurred'
): string {
  if (!responseText) return defaultKey;

  try {
    const parsed = JSON.parse(responseText) as Record<string, unknown>;

    if (parsed.errors && typeof parsed.errors === 'object') {
      const [, messages] = Object.entries(parsed.errors)[0] ?? [];
      let code: string | undefined;

      if (typeof messages === 'string') code = messages;
      else if (Array.isArray(messages) && typeof messages[0] === 'string') code = messages[0];

      if (code && ASSET_API_ERROR_MAP[code]) return ASSET_API_ERROR_MAP[code];
    }

    const flat = (parsed.message || parsed.error || parsed.code) as string | undefined;
    if (typeof flat === 'string' && ASSET_API_ERROR_MAP[flat]) return ASSET_API_ERROR_MAP[flat];
  } catch { }

  return responseText.trim().startsWith('{') ? defaultKey : responseText;
}

function isRedirectError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'digest' in e &&
    typeof (e as { digest?: unknown }).digest === 'string' &&
    String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT')
  );
}

export function deduplicateErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') return message;
  let cleaned = message.trim();
  if (cleaned.includes('| Payload:')) {
    cleaned = cleaned.split('| Payload:')[0].trim();
  }
  // Check exact halves repetition separated by ': ' (e.g., "Cannot delete X: Cannot delete X")
  const colonSeparated = cleaned.split(': ');
  if (colonSeparated.length % 2 === 0 && colonSeparated.length >= 2) {
    const halfLen = colonSeparated.length / 2;
    const firstHalf = colonSeparated.slice(0, halfLen).join(': ').trim();
    const secondHalf = colonSeparated.slice(halfLen).join(': ').trim();
    if (firstHalf === secondHalf && firstHalf.length > 0) {
      return firstHalf;
    }
  }
  // Check exact halves repetition separated by ':'
  const parts = cleaned.split(':').map(p => p.trim());
  if (parts.length % 2 === 0 && parts.length >= 2) {
    const halfLen = parts.length / 2;
    const firstHalf = parts.slice(0, halfLen).join(':').trim();
    const secondHalf = parts.slice(halfLen).join(':').trim();
    if (firstHalf === secondHalf && firstHalf.length > 0) {
      return firstHalf;
    }
  }
  return cleaned;
}

export function handleActionError<T = void>(
  error: unknown,
  fallbackMessage: string
): ActionResult<T> {
  if (isRedirectError(error)) {
    throw error;
  }
  if (error instanceof ApiError) {
    logger.error('[AssetMaster] ApiError encountered', {
      statusCode: error.statusCode,
      message: error.message,
    });

    const parsed = parseApiError(error.responseText || error.error, fallbackMessage);
    let resolvedError =
      parsed !== fallbackMessage ? parsed : 
      (error.responseText ? error.responseText : 
      (error.error ? error.error : 
      (error.message ? error.message : fallbackMessage)));

    if (typeof resolvedError === 'string') {
      resolvedError = deduplicateErrorMessage(resolvedError);
    }

    return {
      success: false,
      error: resolvedError,
      statusCode: error.statusCode,
    };
  }

  logger.error('[AssetMaster] Unexpected error in action handler', {
    error: error instanceof Error ? error : new Error(String(error)),
  });

  return {
    success: false,
    error: fallbackMessage,
  };
}

export function revalidateAssetMaster(masterId?: string): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}${ASSET_MASTER_PATH}`, 'layout');
    if (masterId) {
      revalidatePath(`/${locale}${ASSET_MASTER_PATH}/master-data/${masterId}`, 'page');
    }
  }
}

export async function resolveUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore);
}
