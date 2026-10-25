'use server';

import { ApiResponse } from '@/types/common.types';
import {
  getIndividualQcTopSectionAction,
  patchIndividualPropertyAction,
} from '@/lib/api/ptis/individual';
import {
  fetchIndividualOldDetails,
  fetchIndividualOldFloorDetails,
  fetchIndividualOldTaxesDetails,
  fetchIndividualMappedProperties,
} from '@/lib/api/ptis/individual/individual-old-details.service';
import type {
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  MappedPropertyItem,
  BuildingPermissionData,
  DiscountData,
} from '@/types/ptis.types';
import { ptisDetailsService } from '@/lib/api/ptis/tab/ptis-details';
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
import { getRateableValue as getRateableValueService } from '@/lib/api/rateableValue.service';
import { getCapitalValue as getCapitalValueService } from '@/lib/api/capitalValue.service';
import { getDualMethod as getDualMethodService } from '@/lib/api/dualMethod.service';
import type { RateableValueResponse } from '@/types/rateableValue.types';
import type { CapitalValueResponse } from '@/types/capitalValue.types';
import type { DualMethodResponse } from '@/types/dualMethod.types';
import { getApartmentTaxDetails } from '@/lib/api/ptis/apartment/apartment-tax-details.service';
import type { ApartmentTaxDetailsResponse } from '@/types/property-tax/apartment';
import type { ActionResult } from '@/types/common.types';

import { getPropertyComparisonAction } from '@/app/[locale]/property-tax/ptis/PropertyComparison.action';
import type { PropertyComparisonResponse } from '@/types/propertyComparison.types';

// Re-export core individual property actions
export { getIndividualQcTopSectionAction, patchIndividualPropertyAction };

/**
 * Fetches basic old details for an individual property.
 */
export async function getIndividualOldDetailsAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: OldDetailsData; error?: string }> {
  if (!propertyId) {
    return { success: false, error: 'Property identifier is missing.' };
  }
  return fetchIndividualOldDetails(propertyId);
}

/**
 * Fetches historical floor details for an individual property.
 */
export async function getIndividualOldFloorDetailsAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: OldFloorDetailsData[]; error?: string }> {
  if (!propertyId) {
    return { success: false, error: 'Property identifier is missing.' };
  }
  return fetchIndividualOldFloorDetails(propertyId);
}

/**
 * Fetches historical taxes details for an individual property.
 */
export async function getIndividualOldTaxesDetailsAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: OldTaxesData; error?: string }> {
  if (!propertyId) {
    return { success: false, error: 'Property identifier is missing.' };
  }
  return fetchIndividualOldTaxesDetails(propertyId);
}

/**
 * Fetches mapped properties (pre/post migration) for an individual property.
 */
export async function getIndividualMappedPropertiesAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: MappedPropertyItem[]; error?: string }> {
  if (!propertyId) {
    return { success: false, error: 'Property identifier is missing.' };
  }
  return fetchIndividualMappedProperties(propertyId);
}

/**
 * Fetches Property Comparison data (changeOfUse, alv, rv, cv, tax) for an individual property.
 */
export async function fetchIndividualPropertyComparisonAction(
  propertyId: number | string
): Promise<ActionResult<PropertyComparisonResponse>> {
  return getPropertyComparisonAction(propertyId);
}

/**
 * Fetches tax details (current taxes and arrears) for an individual property.
 * Endpoint: /ApartmentQC/Taxdetails?wardId={wardId}&propertyNo={propertyNo}&taxType={taxType}
 */
export async function getIndividualTaxDetailsAction(
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

/**
 * Fetches Rateable Value details for an individual property.
 */
export async function fetchIndividualRateableValueAction(
  propertyId: number | string,
  financeYear?: number,
  forceRecalculate: boolean = true
): Promise<ActionResult<RateableValueResponse>> {
  return getRateableValueService(propertyId, financeYear, forceRecalculate);
}

/**
 * Fetches Capital Value details for an individual property.
 */
export async function fetchIndividualCapitalValueAction(
  propertyId: number | string
): Promise<ActionResult<CapitalValueResponse>> {
  return getCapitalValueService(propertyId);
}

/**
 * Fetches Dual Method valuation comparison details for an individual property.
 */
export async function fetchIndividualDualMethodAction(
  propertyId: number | string
): Promise<ActionResult<DualMethodResponse>> {
  return getDualMethodService(propertyId);
}

/**
 * Fetches discount details for an individual property.
 */
export async function fetchDiscountDetailsAction(
  propertyId: number | string
): Promise<ApiResponse<PropertyDiscountInfoResponseDto>> {
  try {
    return await getDiscountDetails(String(propertyId));
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch discount details',
    };
  }
}

/**
 * Fetches rateable and capital tax details for an individual property.
 */
export async function fetchUnitTaxDetailsAction(propertyId: number | string): Promise<{
  success: boolean;
  rateable?: TaxDetailsData;
  capital?: TaxDetailsData;
  error?: string;
}> {
  const numericId = Number(propertyId);
  if (!numericId || numericId <= 0) {
    return { success: false, error: 'Invalid property ID' };
  }
  try {
    const [rateable, capital] = await Promise.all([
      getPtisMainTaxDetailsByPropertyId(numericId).catch(() => undefined),
      getPtisMainTaxDetailsCvByPropertyId(numericId).catch(() => undefined),
    ]);
    return { success: true, rateable, capital };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tax details',
    };
  }
}

/**
 * Fetches property rule logs for audit/tax calculation verification.
 */
export async function fetchPropertyRuleLogsAction(
  propertyId: number,
  propertyDetailsId?: number,
  financeYear?: number
): Promise<{ success: boolean; data?: PropertyRuleLogResponse; error?: string }> {
  try {
    const data = await getPropertyRuleLogs(propertyId, propertyDetailsId, financeYear);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rule logs',
    };
  }
}

/**
 * Fetches quick data entry basic property details for the modal / preview.
 */
export async function fetchUnitQuickDataEntryAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: PropertyBasicDetailsApiItem | null; error?: string }> {
  try {
    const numericId = Number(propertyId);
    if (!numericId || numericId <= 0) {
      return { success: false, error: 'Invalid property ID' };
    }
    const data = await getPropertyBasicDetails(numericId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quick entry details',
    };
  }
}

/**
 * Fetches mapped new properties.
 */
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

/**
 * Fetches mapped old properties.
 */
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

/**
 * Fetches building permission certificates for an individual property grid.
 */
export async function getIndividualBuildingCertificatesAction(
  propertyId: number | string
): Promise<{ success: boolean; data?: BuildingPermissionData; error?: string }> {
  try {
    const numericId = Number(propertyId);
    if (!numericId || numericId <= 0) {
      return { success: false, error: 'Invalid property ID' };
    }
    return await ptisDetailsService.getBuildingPermissionDetails(numericId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch building certificates',
    };
  }
}

/**
 * Fetches discount and social details for an individual property or its parent society.
 */
export async function fetchIndividualSocialAndDiscountDetailsAction(
  propertyId: number,
  societyDetailId?: number | null,
  wingDetailId?: number | null
): Promise<{
  success: boolean;
  discountData?: DiscountData;
  socialData?: DiscountData;
  error?: string;
}> {
  const { getIndividualSocialAndDiscountDetailsService } = await import(
    '@/lib/api/ptis/individual/individual-discount-social.service'
  );
  return await getIndividualSocialAndDiscountDetailsService(
    propertyId,
    societyDetailId,
    wingDetailId
  );
}
