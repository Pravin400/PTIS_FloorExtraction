import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { createLogger } from '@/lib/utils/server-logger';

export const logger = createLogger('AssetGisActions');

export function revalidateAllLocales(path: string): void {
    for (const locale of locales) {
        try {
            revalidatePath(`/${locale}${path}`, 'page');
        } catch (err) {
            logger.warn('Failed to revalidate path for locale', { locale, path, operation: 'revalidateAllLocales' }, err);
        }
    }
}

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error || 'An unexpected error occurred');
};
