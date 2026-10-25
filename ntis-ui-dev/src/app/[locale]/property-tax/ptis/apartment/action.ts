'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { ApiResponse } from '@/types/common.types';
import {
  AssessmentUnit,
  ApartmentDetailsWingWiseResponseDto,
  SearchWingWiseFilters,
  ApartmentQCTopSectionBelowFlexResponseDto,
  WingWiseDetailsItems,
} from '@/types/property-tax/apartment';
import {
  getApartmentDetailsWingWise,
  getApartmentPropertyTaxDetailsRv,
  getApartmentPropertyTaxDetailsCv,
  getApartmentQCTopSectionBelowFlex,
  type ApartmentQCTopSectionBelowFlexParams,
  getWingWiseDetails,
  updateApartmentQcWingDetails,
  getApartmentTaxDetails,
  getApartmentDemandDetails,
  getApartmentYearWiseDetails,
  type UpdateApartmentQcWingDetailsPayload,
} from '@/lib/api/ptis/apartment';
import { getPropertyRuleLogs } from '@/lib/api/rule-engine/property-rule-log.service';
import { getDiscountDetails } from '@/lib/api/discount.service';
import type { PropertyRuleLogResponse } from '@/types/rule-engine';
import type { PropertyDiscountInfoResponseDto } from '@/types/discount.types';
import {
  getPtisMainTaxDetailsByPropertyId,
  getPtisMainTaxDetailsCvByPropertyId,
} from '@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import { getPropertyBasicDetails } from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';
import type { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import { createLogger } from '@/lib/utils/server-logger';
import type {
  ApartmentTaxDetailsResponse,
  ApartmentDemandDetailsResponse,
} from '@/types/property-tax/apartment';
import {
  getMappedNewProperties,
  getMappedOldProperties,
} from '@/lib/api/property-mapping/property-mapping.service';
import type {
  MappedNewPropertiesApiResponse,
  MappedNewPropertiesParams,
  MappedOldPropertiesApiResponse,
  MappedOldPropertiesParams,
} from '@/types/property-mapping';
import type { DiscountData } from '@/types/ptis.types';
import { ApiError } from 'next/dist/server/api-utils';
import { getTranslations } from 'next-intl/server';

const logger = createLogger('ApartmentActions');

type ActionResult<T> = { success: boolean; data?: T | null; error?: string; statusCode?: number };

export async function fetchApartmentDetailsWingWiseAction(
  filters: SearchWingWiseFilters
): Promise<ApartmentDetailsWingWiseResponseDto> {
  try {
    return await getApartmentDetailsWingWise(filters);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch apartment details',
      errors: [error instanceof Error ? error.message : 'Unknown server action error'],
    };
  }
}

export async function fetchApartmentPropertyTaxDetailsRvAction(
  propertyId: number
): Promise<{ success: boolean; data?: Record<string, unknown> | null; error?: string }> {
  try {
    return await getApartmentPropertyTaxDetailsRv(propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed RV tax fetch',
    };
  }
}

export async function fetchApartmentPropertyTaxDetailsCvAction(
  propertyId: number
): Promise<{ success: boolean; data?: Record<string, unknown> | null; error?: string }> {
  try {
    return await getApartmentPropertyTaxDetailsCv(propertyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed CV tax fetch',
    };
  }
}

export async function fetchApartmentQCTopSectionBelowFlexAction(
  propertyIdOrParams: number | string | ApartmentQCTopSectionBelowFlexParams
): Promise<ApartmentQCTopSectionBelowFlexResponseDto> {
  return await getApartmentQCTopSectionBelowFlex(propertyIdOrParams);
}

export async function saveSurveyUnitAction(
  unit: AssessmentUnit
): Promise<ApiResponse<AssessmentUnit>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId) return { success: false, error: 'Unauthorized user session' };
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/ptis/apartment`, 'page');
    }
    return { success: true, data: unit, message: 'Survey unit saved successfully' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed save' };
  }
}

export async function fetchPropertyRuleLogsAction(
  propertyId: number,
  propertyDetailsId?: number,
  financeYear?: number
): Promise<{ success: boolean; data?: PropertyRuleLogResponse; error?: string }> {
  try {
    const data = await getPropertyRuleLogs(propertyId, propertyDetailsId, financeYear);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed rule logs' };
  }
}

export async function fetchDiscountDetailsAction(
  propertyId: number | string
): Promise<ApiResponse<PropertyDiscountInfoResponseDto>> {
  try {
    return await getDiscountDetails(String(propertyId));
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed discount details',
    };
  }
}

export async function fetchUnitTaxDetailsAction(
  propertyId: number | string
): Promise<{
  success: boolean;
  rateable?: TaxDetailsData;
  capital?: TaxDetailsData;
  error?: string;
}> {
  const numericId = Number(propertyId);
  if (!numericId || numericId <= 0) return { success: false, error: 'Invalid property ID' };
  try {
    const [rateable, capital] = await Promise.all([
      getPtisMainTaxDetailsByPropertyId(numericId).catch(() => undefined),
      getPtisMainTaxDetailsCvByPropertyId(numericId).catch(() => undefined),
    ]);
    return { success: true, rateable, capital };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed tax details' };
  }
}

export async function fetchUnitQuickDataEntryAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: PropertyBasicDetailsApiItem | null; error?: string }> {
  try {
    const numericId = Number(propertyId);
    if (!numericId || numericId <= 0) return { success: false, error: 'Invalid property ID' };
    const data = await getPropertyBasicDetails(numericId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed quick entry' };
  }
}

export async function getWingWiseDetailsAction(
  wardId: string | number,
  propertyNo: string
): Promise<ActionResult<WingWiseDetailsItems>> {
  const safeWardId = String(wardId || '').trim();
  const safePropNo = String(propertyNo || '').trim();
  if (!safeWardId || !safePropNo)
    return { success: false, error: 'Ward ID and Property Number are required' };
  try {
    const data = await getWingWiseDetails(safeWardId, safePropNo);
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to fetch wing wise details', { wardId, propertyNo }, error);
    if (error instanceof ApiError)
      return { success: false, error: error.message, statusCode: error.statusCode };
    const t = await getTranslations('ptisRedesign');
    return {
      success: false,
      error: t('errors.fetchWingWiseDetails') || 'Failed to fetch wing wise details',
      statusCode: 500,
    };
  }
}

export async function getApartmentTaxDetailsAction(
  wardId: string | number,
  propertyNo: string,
  taxType: string = 'RV'
): Promise<ApartmentTaxDetailsResponse> {
  try {
    return await getApartmentTaxDetails({ wardId, propertyNo, taxType });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch tax details',
      items: null,
      totalCount: null,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      correlationId: null,
    };
  }
}

export async function getApartmentDemandDetailsAction(
  wardId: string | number,
  propertyNo: string,
  taxType: string = 'RV'
): Promise<ApartmentDemandDetailsResponse> {
  try {
    return await getApartmentDemandDetails({ wardId, propertyNo, taxType });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch demand details',
      items: null,
      totalCount: null,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      correlationId: null,
    };
  }
}

export async function getApartmentYearWiseDetailsAction(
  wardId: string | number,
  propertyNo: string,
  taxType: string = 'RV',
  financeYearId: string | number
): Promise<ApartmentDemandDetailsResponse> {
  try {
    return await getApartmentYearWiseDetails({ wardId, propertyNo, taxType, financeYearId });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch year wise details',
      items: null,
      totalCount: null,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      correlationId: null,
    };
  }
}

export async function updateApartmentQcWingDetailsAction(
  wingDetailId: number,
  payload: UpdateApartmentQcWingDetailsPayload
): Promise<ActionResult<object>> {
  try {
    const response = await updateApartmentQcWingDetails(wingDetailId, payload);
    if (!response.success)
      return { success: false, error: response.error || 'Failed to update wing details' };
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/ptis/apartment`, 'page');
    }
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('Failed to update apartment wing details', { wingDetailId }, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update wing details',
    };
  }
}

export async function fetchMappedNewPropertiesAction(
  params: MappedNewPropertiesParams
): Promise<{ success: boolean; data?: MappedNewPropertiesApiResponse | null; error?: string }> {
  try {
    const data = await getMappedNewProperties(params);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mapped properties',
    };
  }
}

export async function fetchMappedOldPropertiesAction(
  params: MappedOldPropertiesParams
): Promise<{ success: boolean; data?: MappedOldPropertiesApiResponse | null; error?: string }> {
  try {
    const data = await getMappedOldProperties(params);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mapped old properties',
    };
  }
}

import { getApartmentSocialAndDiscountDetailsService } from '@/lib/api/ptis/apartment/apartment-discount-social.service';

export async function fetchApartmentSocialAndDiscountDetailsAction(
  societyDetailId: number,
  _propertyId?: number
): Promise<{
  success: boolean;
  discountData?: DiscountData;
  socialData?: DiscountData;
  levelCounts?: {
    all: number;
    apartment: number;
    wing: number;
    unit: number;
  };
  error?: string;
}> {
  return await getApartmentSocialAndDiscountDetailsService(societyDetailId);
}

export const fetchApartmentDiscountAndSocialDetailsAction = fetchApartmentSocialAndDiscountDetailsAction;

