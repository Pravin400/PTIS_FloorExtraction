import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { ULB_API_ERROR_MAP } from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.error-map';

/** Resolves ULB configuration errors to human-readable, translatable messages. */
export function resolveUlbConfigurationErrorMessage(
  error: string | undefined,
  translate: (key: string) => string,
  fallback: string
): string {
  if (!error?.trim()) return fallback;

  const trimmed = error.trim();

  if (trimmed.startsWith('validation.') || trimmed.startsWith('messages.')) {
    return translate(trimmed);
  }

  const mappedKey = ULB_API_ERROR_MAP[trimmed];
  if (mappedKey) return translate(mappedKey);

  return getCleanErrorMessage(trimmed, fallback);
}
