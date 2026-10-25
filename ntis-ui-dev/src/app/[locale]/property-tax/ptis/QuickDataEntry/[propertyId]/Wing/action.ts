'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { getSocietyWingDetails } from '@/lib/api/zone-property.service';
import {
  getSocietyDetailsByProperty,
  createSocietyDetail,
  updateSocietyDetail,
  deleteSocietyDetail,
} from '@/lib/api/societyDetails.services';
import { getAllActiveWings } from '@/lib/api/wing.service';
import { SocietyWingDetailItem } from '@/types/zone-master/properties/society-wing-details.types';
import {
  SocietyDetailItem,
  CreateSocietyDetailPayload,
  UpdateSocietyDetailPayload,
} from '@/types/zone-master/properties/societyDetails.types';
import { WingItem } from '@/types/zone-master/properties/wing.types';
import { ActionResult } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('WingDetailsActions');

async function getCurrentUserId(): Promise<number> {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId')?.value || cookieStore.get('userid')?.value;
    if (userIdCookie) {
      const parsed = parseInt(userIdCookie, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return 1; // Default fallback for local testing
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (error instanceof ApiError) {
    return error.contextMessage || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/**
 * Action to fetch society wing details for a property
 */
export async function getSocietyWingDetailsAction(
  propertyId: number
): Promise<ActionResult<SocietyWingDetailItem[]>> {
  try {
    if (!propertyId || propertyId <= 0) {
      return { success: false, error: 'Invalid Property ID' };
    }
    const wingDetails = await getSocietyWingDetails(propertyId);
    return { success: true, data: wingDetails };
  } catch (error) {
    logger.error('Error fetching society wing details', { error, propertyId });
    return {
      success: false,
      error: getActionErrorMessage(error, 'Failed to fetch wing details'),
    };
  }
}

/**
 * Action to fetch society detail records (wings) for a property
 */
export async function getSocietyDetailsByPropertyAction(
  propertyId: number
): Promise<ActionResult<SocietyDetailItem[]>> {
  try {
    if (!propertyId || propertyId <= 0) {
      return { success: false, error: 'Invalid Property ID' };
    }
    const response = await getSocietyDetailsByProperty(propertyId);
    return { success: true, data: response.items || [] };
  } catch (error) {
    logger.error('Error fetching society details by property', { error, propertyId });
    return {
      success: false,
      error: getActionErrorMessage(error, 'Failed to fetch society details'),
    };
  }
}

/**
 * Action to fetch all active wings master list
 */
export async function getAllActiveWingsAction(): Promise<ActionResult<WingItem[]>> {
  try {
    const wings = await getAllActiveWings();
    return { success: true, data: wings };
  } catch (error) {
    logger.error('Error fetching active wings master', { error });
    return {
      success: false,
      error: getActionErrorMessage(error, 'Failed to fetch wing master list'),
    };
  }
}

/**
 * Action to create a new society wing
 */
export async function createSocietyDetailAction(
  propertyId: number,
  payload: Omit<CreateSocietyDetailPayload, 'createdBy' | 'propertyId'>
): Promise<ActionResult<SocietyDetailItem>> {
  try {
    if (!propertyId || propertyId <= 0) {
      return { success: false, error: 'Invalid Property ID' };
    }
    const userId = await getCurrentUserId();
    const fullPayload: CreateSocietyDetailPayload = {
      ...payload,
      propertyId,
      createdBy: userId,
      isActive: payload.isActive ?? true,
    };

    const result = await createSocietyDetail(fullPayload);
    if (!result.success || !result.items) {
      return { success: false, error: result.message || 'Failed to create wing' };
    }

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Wing`, 'page');
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Society`, 'page');
    }

    return { success: true, data: result.items };
  } catch (error) {
    logger.error('Error creating society wing', { error, propertyId });
    return {
      success: false,
      error: getActionErrorMessage(error, 'Failed to create wing'),
    };
  }
}

/**
 * Action to update an existing society wing
 */
export async function updateSocietyDetailAction(
  propertyId: number,
  id: number,
  payload: UpdateSocietyDetailPayload
): Promise<ActionResult<SocietyDetailItem>> {
  try {
    if (!id || id <= 0) {
      return { success: false, error: 'Invalid Wing Detail ID' };
    }
    const userId = await getCurrentUserId();
    const fullPayload: UpdateSocietyDetailPayload = {
      ...payload,
      propertyId,
      updatedBy: userId,
    };

    const result = await updateSocietyDetail(id, fullPayload);
    if (!result.success || !result.items) {
      return { success: false, error: result.message || 'Failed to update wing' };
    }

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Wing`, 'page');
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Society`, 'page');
    }

    return { success: true, data: result.items };
  } catch (error) {
    logger.error('Error updating society wing', { error, id });
    return {
      success: false,
      error: getActionErrorMessage(error, 'Failed to update wing'),
    };
  }
}

/**
 * Action to delete a society wing
 */
export async function deleteSocietyDetailAction(
  propertyId: number,
  id: number
): Promise<ActionResult<null>> {
  try {
    if (!id || id <= 0) {
      return { success: false, error: 'Invalid Wing Detail ID' };
    }
    const result = await deleteSocietyDetail(id);
    if (!result.success) {
      return { success: false, error: result.message || 'Failed to delete wing' };
    }

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Wing`, 'page');
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Society`, 'page');
    }

    return { success: true };
  } catch (error) {
    logger.error('Error deleting society wing', { error, id });
    return {
      success: false,
      error: getActionErrorMessage(error, 'Failed to delete wing'),
    };
  }
}
