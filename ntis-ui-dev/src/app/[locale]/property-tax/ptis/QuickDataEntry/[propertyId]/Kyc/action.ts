'use server';

import { KycDetails } from '@/types/property-kyc.types';
import { revalidatePath } from 'next/cache';
import { OwnerTypeApiItem } from '@/types/property-kyc.types';
import {
  getOwnerTypes,
  getPropertyKycById,
  updatePropertyKyc,
} from '@/lib/api/property-kyc.service';

// Error message constants (matching i18n keys in quickDataEntry.kyc.errors)
// These can be translated client-side
const KYC_ACTION_ERRORS = {
  FETCH_OWNER_TYPES: 'Failed to fetch owner types',
  INVALID_PROPERTY_ID: 'Invalid property ID provided',
  KYC_NOT_FOUND: 'KYC details not found',
  FETCH_KYC_DETAILS: 'Failed to fetch KYC details',
  UPDATE_KYC_DETAILS: 'Failed to update KYC details',
} as const;

const KYC_ACTION_SUCCESS = {
  UPDATE_SUCCESS: 'KYC details updated successfully',
} as const;

/**
 * Fetches owner types list with error handling
 */
export async function getOwnerTypesAction(): Promise<{
  success: boolean;
  data: OwnerTypeApiItem[];
  error?: string;
  statusCode?: number;
}> {
  try {
    const data = await getOwnerTypes();
    return { success: true, data: data ?? [] };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : KYC_ACTION_ERRORS.FETCH_OWNER_TYPES,
      statusCode: typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode?: number }).statusCode
        : undefined,
    };
  }
}
/**
 * Fetches property KYC details by ID with comprehensive error handling
 */
export async function getPropertyKycByIdAction(
  propertyId: number
): Promise<{ success: boolean; data: KycDetails | null; error?: string }> {
  if (!propertyId || propertyId <= 0) {
    return { success: false, data: null, error: KYC_ACTION_ERRORS.INVALID_PROPERTY_ID };
  }

  try {
    const response = await getPropertyKycById(propertyId);
    if (response.items) {
      /**
       * Field name normalization for backward compatibility
       * 
       * @deprecated aadharCardNo is deprecated in favor of adharCardNo (correct spelling)
       * 
       * Deprecation Plan:
       * - Phase 1 (Current): Support both adharCardNo and aadharCardNo, normalize to adharCardNo
       * - Phase 2 (Q3 2026): Add deprecation warnings in API responses for aadharCardNo usage
       * - Phase 3 (Q1 2027): Remove aadharCardNo field support entirely, use adharCardNo only
       * 
       * Migration: Update all API consumers to use adharCardNo before Q1 2027
       */
      const adharCardNo = response.items.adharCardNo ?? response.items.aadharCardNo ?? null;
      const normalizedItems: KycDetails = {
        ...response.items,
        adharCardNo,
        aadharCardNo: adharCardNo, // Kept for backward compatibility only
      };
      return { success: true, data: normalizedItems };
    }
    return { success: false, data: null, error: KYC_ACTION_ERRORS.KYC_NOT_FOUND };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : KYC_ACTION_ERRORS.FETCH_KYC_DETAILS,
    };
  }
}

import { patchIndividualProperty } from '@/lib/api/ptis/individual';

/**
 * Updates property KYC details with validation and error handling
 */
export async function updatePropertyKycAction(
  propertyId: number,
  payload: KycDetails,
  locale: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Validation
  if (!propertyId || propertyId <= 0) {
    return { success: false, error: KYC_ACTION_ERRORS.INVALID_PROPERTY_ID };
  }

  try {
    const response = await updatePropertyKyc(propertyId, payload);
    if (response?.success) {
      // Revalidate the affected KYC page cache for the current locale only
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Kyc`, 'page');
      revalidatePath(`/${locale}/property-tax/ptis/individual`, 'page');
      return {
        success: true,
        message: response.message || KYC_ACTION_SUCCESS.UPDATE_SUCCESS,
      };
    }

    const isIndividual = payload.ownerType?.toLowerCase() === 'individual';

    if (isIndividual) {
      // Fallback: try dedicated PATCH /Property/{propertyId}/individual
      const patchRes = await patchIndividualProperty(propertyId, {
        ownerName: payload.ownerName,
        ownerNameRegional: payload.ownerNameRegional,
        ownerNameEnglish: payload.ownerNameEnglish,
        ownerTitle: payload.ownerTitle,
        ownerTitleEnglish: payload.ownerTitleEnglish,
        occupierName: payload.occupierName,
        occupierNameRegional: payload.occupierNameRegional,
        occupierNameEnglish: payload.occupierNameEnglish,
        occupierTitle: payload.occupierTitle,
        occupierTitleEnglish: payload.occupierTitleEnglish,
        ownerTypeId: payload.ownerTypeId,
        aadharNo: payload.adharCardNo || payload.aadharCardNo,
        mobileNo: payload.mobileNo,
        alternateMobileNo: payload.alternateMobileNo,
        emailId: payload.emailId,
        address: payload.address,
        addressRegional: payload.addressRegional,
        addressEnglish: payload.addressEnglish,
        pinCode: payload.pinCode,
        flatOrShopNo: payload.flatOrShopNo,
        flatOrShopName: payload.flatOrShopName,
        flatOrShopNameEnglish: payload.flatOrShopNameEnglish,
      });

      if (patchRes.success) {
        revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Kyc`, 'page');
        revalidatePath(`/${locale}/property-tax/ptis/individual`, 'page');
        return {
          success: true,
          message: 'KYC details updated successfully',
        };
      }
    }

    return {
      success: false,
      error:
        (response as unknown as { error?: string })?.error ||
        (typeof response?.errors === 'string' ? response.errors : undefined) ||
        KYC_ACTION_ERRORS.UPDATE_KYC_DETAILS,
    };
  } catch (error) {
    const isIndividual = payload.ownerType?.toLowerCase() === 'individual';
    if (isIndividual) {
      try {
        const patchRes = await patchIndividualProperty(propertyId, {
          ownerName: payload.ownerName,
          ownerNameRegional: payload.ownerNameRegional,
          ownerNameEnglish: payload.ownerNameEnglish,
          ownerTitle: payload.ownerTitle,
          ownerTitleEnglish: payload.ownerTitleEnglish,
          occupierName: payload.occupierName,
          occupierNameRegional: payload.occupierNameRegional,
          occupierNameEnglish: payload.occupierNameEnglish,
          occupierTitle: payload.occupierTitle,
          occupierTitleEnglish: payload.occupierTitleEnglish,
          ownerTypeId: payload.ownerTypeId,
          aadharNo: payload.adharCardNo || payload.aadharCardNo,
          mobileNo: payload.mobileNo,
          alternateMobileNo: payload.alternateMobileNo,
          emailId: payload.emailId,
          address: payload.address,
          addressRegional: payload.addressRegional,
          addressEnglish: payload.addressEnglish,
          pinCode: payload.pinCode,
          flatOrShopNo: payload.flatOrShopNo,
          flatOrShopName: payload.flatOrShopName,
          flatOrShopNameEnglish: payload.flatOrShopNameEnglish,
        });

        if (patchRes.success) {
          revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Kyc`, 'page');
          revalidatePath(`/${locale}/property-tax/ptis/individual`, 'page');
          return {
            success: true,
            message: 'KYC details updated successfully',
          };
        }
      } catch (_e) {
        // ignore
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : KYC_ACTION_ERRORS.UPDATE_KYC_DETAILS,
    };
  }
}

