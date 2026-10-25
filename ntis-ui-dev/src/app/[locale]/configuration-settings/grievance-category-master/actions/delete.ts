'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { deleteGrievanceCategory } from '@/lib/api/configuration-settings/grievance-category-master/grievanceCategory.service';
import { locales } from '@/i18n/config';
import { logger } from '@/lib/utils/logger';
import { getCurrentUserId, localizeBackendMessage } from './utils';

/**
 * Delete Grievance Category Action
 */
export async function deleteGrievanceCategoryAction(
  id: number,
  locale: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'unauthorized' };
  }

  if (!locales.includes(locale as (typeof locales)[number])) {
    return { success: false, error: 'invalidLocale' };
  }

  const t = await getTranslations({ locale, namespace: 'grievanceCategory' });

  if (!id || !Number.isInteger(id) || id <= 0) {
    return { success: false, error: 'invalidId' };
  }

  try {
    // Pass userId for audit trail and permission verification
    logger.info('Deleting grievance category', { id, userId, locale });

    const response = await deleteGrievanceCategory(id, userId);
    if (response.success) {
      logger.info('Successfully deleted grievance category', { id, userId });

      // Revalidate the list page to ensure fresh data
      revalidatePath(`/[locale]/configuration-settings/grievance-category-master`, 'page');

      return {
        success: true,
        message: t('master.toast.deleteSuccess'),
      };
    }
    const errorMsg = await localizeBackendMessage(response.error || response.message, locale, 'operationFailed', 'Operation failed');
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    logger.error('Failed to delete grievance category:', {
      error: error instanceof Error ? error : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
      id,
      userId,
      locale,
    });
    const errMsg = error instanceof Error ? error.message : String(error);
    const errorMsg = await localizeBackendMessage(errMsg, locale, 'unexpected', 'Unexpected error occurred');
    return {
      success: false,
      error: errorMsg,
    };
  }
}

