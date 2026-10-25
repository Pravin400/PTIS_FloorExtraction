
'use server';

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { apiClient } from "@/services/api.service";
import { IRateMaster, ISelectOption, IZoneDescription, RateCategory, AssessmentYearRangeOption, IBackendRateMaster } from "@/types/RVRateMaster";
import * as rateMasterService from "@/lib/api/rvRateMaster";
import { queryRateSections } from "@/lib/api/rate-section-master/rateSection.services";
import type { RateItem } from "@/types/rateSectionMaster.types";
import { getUseGroupsPagedServer, iconKeyToApi } from "@/lib/api/typeofusemaster.service";
import { UseGroupIconKey } from "@/types/typeOfUse.types";
import { getAssessmentYearRangePaged } from "@/lib/api/assessment-year-range.service";
import { rateableValueConfig } from "@/components/modules/property-tax/assessment-year-range/config/rateableValue.config";
import { getTaxZonePagedServer } from "@/lib/api/taxzone.services";
import { getDetailedRates } from "@/lib/api/rvRateMaster";
import { getConstructionPaged } from "@/lib/api/constructiontypemaster/construction-crud.service";
import { createLogger } from "@/lib/utils/server-logger";
import { getPolicyConfigurationsPagedServer } from "@/lib/api/policy-configuration.services";
const logger = createLogger('RVRateMasterAction');

/* ========== POLICY CONFIGURATION ========== */

/**
 * Get rate frequency policy configuration (Monthly/Yearly)
 * Fetches the RateMonthlyOrYearly policy and returns the configured value
 * Falls back to DefaultValue if PolicyValue is empty
 */
export async function getRateFrequencyPolicy(): Promise<{
  value: 'Monthly' | 'Yearly';
  isConfigured: boolean;
}> {
  try {
    // Search for the RateMonthlyOrYearly policy
    const response = await getPolicyConfigurationsPagedServer(1, 100, 'RateMonthlyOrYearly');

    // Find the exact policy by policyCode
    const policy = response.items?.find(
      (item) => item.policyCode === 'RateMonthlyOrYearly' && item.isActive
    );

    if (!policy) {
      // No policy found, return default
      logger.warn('RateMonthlyOrYearly policy not found, using default', { operation: 'getRateFrequencyPolicy' });
      return {
        value: 'Yearly',
        isConfigured: false,
      };
    }

    // Use PolicyValue if available, otherwise use DefaultValue
    const rawValue = policy.policyValue?.trim() || policy.defaultValue?.trim() || 'Yearly';

    // Normalize the value to ensure it's either 'Monthly' or 'Yearly'
    const normalizedValue = rawValue.toLowerCase() === 'yearly' ? 'Yearly' : 'Monthly';

    return {
      value: normalizedValue,
      isConfigured: true,
    };
  } catch (error) {
    logger.error('Failed to fetch rate frequency policy', { operation: 'getRateFrequencyPolicy' }, error);
    // Return default on error to prevent UI from breaking
    return {
      value: 'Yearly',
      isConfigured: false,
    };
  }
}

/**
 * Get rate unit policy configuration (SqMeter/SqFeet)
 * Fetches the RateMasterAreaUnit policy and returns the configured value
 * Falls back to DefaultValue if PolicyValue is empty
 */
export async function getRateUnitPolicy(): Promise<{
  value: 'SqMeter' | 'SqFeet';
  isConfigured: boolean;
}> {
  try {
    // Search for the RateMasterAreaUnit policy
    const response = await getPolicyConfigurationsPagedServer(1, 100, 'RateMasterAreaUnit');

    // Find the exact policy by policyCode
    const policy = response.items?.find(
      (item) => item.policyCode === 'RateMasterAreaUnit' && item.isActive
    );

    if (!policy) {
      // No policy found, return default
      logger.warn('RateMasterAreaUnit policy not found, using default', { operation: 'getRateUnitPolicy' });
      return {
        value: 'SqMeter',
        isConfigured: false,
      };
    }

    // Use PolicyValue if available, otherwise use DefaultValue
    const rawValue = policy.policyValue?.trim() || policy.defaultValue?.trim() || 'SqMeter';

    // Normalize the value to ensure it's either 'SqMeter' or 'SqFeet'
    const normalizedValue = rawValue.toLowerCase() === 'sqfeet' ? 'SqFeet' : 'SqMeter';

    return {
      value: normalizedValue,
      isConfigured: true,
    };
  } catch (error) {
    logger.error('Failed to fetch rate unit policy', { operation: 'getRateUnitPolicy' }, error);
    // Return default on error to prevent UI from breaking
    return {
      value: 'SqMeter',
      isConfigured: false,
    };
  }
}

/**
 * Get global frequency mismatch by checking any existing rate in the database against the policy.
 */
export async function getGlobalFrequencyMismatch(
  rateFrequencyPolicy: { value: 'Monthly' | 'Yearly'; isConfigured: boolean; } | null | undefined,
  constructionTypes: RateCategory[],
  zoneDescriptions: IZoneDescription[]
): Promise<{ configuredFrequency: string, existingFrequency: string } | null> {
  if (!rateFrequencyPolicy?.isConfigured) return null;

  try {
    const globalRatesResult = await rateMasterService.getRateMasterPaged(
      1, 1, constructionTypes, zoneDescriptions, undefined, undefined, undefined, []
    );
    if (globalRatesResult.totalCount > 0 && globalRatesResult.items && globalRatesResult.items.length > 0) {
      const sampleRate = globalRatesResult.items[0];
      const hasMonthWise = sampleRate.rates?.some((r: { rateRemark?: string }) => r.rateRemark === "MonthWise Rate");
      const hasYearWise = sampleRate.rates?.some((r: { rateRemark?: string }) => r.rateRemark === "YearWise Rate");

      if (hasMonthWise || hasYearWise) {
        const existingFrequency = hasMonthWise && !hasYearWise ? "Monthly" : "Yearly";
        if (existingFrequency !== rateFrequencyPolicy.value) {
          return {
            configuredFrequency: rateFrequencyPolicy.value,
            existingFrequency
          };
        }
      }
    }
  } catch (e) {
    // Ignore error for global frequency check
    logger.error('Failed to get global frequency mismatch', { operation: 'getGlobalFrequencyMismatch' }, e);
  }

  return null;
}

/* ========== DATA FETCHING (GET) ========== */
export async function getDetailedRatesAction(
  rateSection?: string,
  useGroup?: string,
  assessmentYear?: string,
  pageNumber: number = 1,
  pageSize: number = -1
) {
  try {
    return await getDetailedRates(rateSection, useGroup, assessmentYear, pageNumber, pageSize);
  } catch (error) {
    logger.error('Failed to load detailed rates', { operation: 'getDetailedRatesAction', rateSection, useGroup, assessmentYear, pageNumber, pageSize }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load detailed rates for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load detailed rates for RV Rate Master');
  }
}

/**
 * Get paginated rate master data with optional filters
 */
export async function getRateMasterPagedAction(
  pageNumber: number,
  pageSize: number,
  constructionTypes: RateCategory[],
  zoneDescriptions: IZoneDescription[],
  rateSection?: string,
  useGroup?: string,
  assessmentYear?: string,
  taxZoneIds?: number[],
  isOpenPlot: boolean = false
) {
  try {
    return await rateMasterService.getRateMasterPaged(
      pageNumber,
      pageSize,
      constructionTypes,
      zoneDescriptions,
      rateSection,
      useGroup,
      assessmentYear,
      taxZoneIds,
      isOpenPlot
    );
  } catch (error) {
    logger.error('Failed to load RV Rate Master data', { operation: 'getRateMasterPagedAction', pageNumber, pageSize }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load RV Rate Master data');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load RV Rate Master data');
  }
}

/**
 * Get paginated zone descriptions for matrix grid
 */
export async function getZoneDescriptionsPaged(
  pageNumber: number,
  pageSize: number
): Promise<{
  items: IZoneDescription[];
  totalPages: number;
  totalCount: number;
}> {
  try {
    const allZones = await getAllZoneDescriptions();
    const totalCount = allZones.length;

    if (pageSize === -1) {
      return {
        items: allZones,
        totalPages: 1,
        totalCount,
      };
    }

    const safePageSize = pageSize > 0 ? pageSize : 100;
    const safePageNumber = Math.max(1, pageNumber);
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const startIdx = (safePageNumber - 1) * safePageSize;
    const items = allZones.slice(startIdx, startIdx + safePageSize);

    return {
      items,
      totalPages,
      totalCount,
    };
  } catch (error) {
    logger.error('Failed to load zones', { operation: 'getZoneDescriptionsPaged', pageNumber, pageSize }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load zones for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load zones for RV Rate Master');
  }
}

/**
 * Get all zone descriptions (unpaged) for copy rates functionality
 */
export async function getAllZoneDescriptions(): Promise<IZoneDescription[]> {
  try {
    const response = await getTaxZonePagedServer(1, -1); // pageSize: -1 gets all items
    const items = response.items || [];

    // Debug: log raw API response to verify field names

    return items
      .filter((item: { isActive?: boolean; id?: number; Id?: number }) => item.isActive === true && (typeof item.id === 'number' || typeof item.Id === 'number'))
      .map((item: { id?: number; Id?: number; taxZoneNo?: string; remark?: string }) => ({
        taxZoneId: typeof item.id === 'number' ? item.id : (item.Id as number),
        zoneNo: String(item.taxZoneNo ?? '').trim(),
        description: String(item.remark ?? '').trim(),
      }));
  } catch (error) {
    logger.error('Failed to load all zones', { operation: 'getAllZoneDescriptions' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load all zones for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load all zones for RV Rate Master');
  }
}

/**
 * Get rate sections for dropdown
 */
export async function getZoneOptions(): Promise<ISelectOption[]> {
  try {
    const response = await queryRateSections({
      pageNumber: 1,
      pageSize: -1,
    });

    const items = response.rateSectionMaster || [];

    // Only include items with a valid numeric Id - robust field casing and value handling
    const activeItems = items.filter((item: RateItem & { Id?: number; id?: number; IsActive?: number | boolean | string; isActive?: number | boolean | string }) => {
      // Handle both camelCase and PascalCase, both boolean true and numeric 1, and string "1"/"true"
      const isActiveValue = (item.isActive !== undefined ? item.isActive : item.IsActive);
      const isActive = isActiveValue === true || isActiveValue === 1 || isActiveValue === "1" || isActiveValue === "true";
      const hasValidId = (typeof item.Id === 'number' && item.Id > 0) || (typeof item.id === 'number' && item.id > 0);

      return isActive && hasValidId;
    });

    return activeItems.map((item: RateItem & { Id?: number; id?: number; RateSectionNo?: string; rateSectionNo?: string; Description?: string; description?: string }) => ({
      label: item.description || item.Description || String(item.rateSectionNo || item.RateSectionNo || ""),
      value: String(item.id || item.Id),
    })).filter((opt: ISelectOption) => opt.value && opt.value !== 'undefined' && opt.value !== '0');
  } catch (error) {
    logger.error('Failed to load rate sections', { operation: 'getZoneOptions' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load rate sections for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load rate sections for RV Rate Master');
  }
}

/**
 * Get use group dropdown options
 */
export async function getUseGroupOptions(): Promise<ISelectOption[]> {
  try {
    const response = await getUseGroupsPagedServer({
      pageNumber: 1,
      pageSize: -1,
    });

    const activeItems = (response.items || [])
      .filter((item: { status?: string; Status?: string; typeOfUseGroupId?: number; TypeOfUseGroupId?: number; isOpenPlot?: boolean; IsOpenPlot?: boolean }) => {
        const status = item.status || item.Status;
        const isActive = status === 'Active' || status === 'active' || status === 'ACTIVE';
        const useGroupId = item.typeOfUseGroupId || item.TypeOfUseGroupId;
        const isOpenPlot = typeof item.isOpenPlot === 'boolean' ? item.isOpenPlot : (typeof item.IsOpenPlot === 'boolean' ? item.IsOpenPlot : false);
        return isActive && useGroupId && useGroupId > 0 && !isOpenPlot;
      });

    return activeItems.map((item: { groupName?: string; GroupName?: string; typeOfUseGroupId?: number; TypeOfUseGroupId?: number }) => ({
      label: item.groupName || item.GroupName || String(item.typeOfUseGroupId || item.TypeOfUseGroupId),
      value: String(item.typeOfUseGroupId || item.TypeOfUseGroupId),
    })).filter((opt: ISelectOption) => opt.value && opt.value !== 'undefined' && opt.value !== '0');
  } catch (error) {
    logger.error('Failed to load use groups', { operation: 'getUseGroupOptions' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load use groups for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load use groups for RV Rate Master');
  }
}

/**
 * Get assessment years from backend API
 */
export async function getAssessmentYears(): Promise<AssessmentYearRangeOption[]> {
  try {
    const response = await getAssessmentYearRangePaged(rateableValueConfig, 1, 100);
    const items = response.items || [];

    return items
      .filter((item: { isActive?: boolean | number | string; IsActive?: boolean | number | string; id?: number; Id?: number }) => {
        const isActiveValue = (item.isActive !== undefined ? item.isActive : item.IsActive);
        const isActive = isActiveValue === true || isActiveValue === 1 || isActiveValue === "1" || isActiveValue === "true";
        const hasValidId = (typeof item.id === 'number' && item.id > 0) || (typeof item.Id === 'number' && item.Id > 0);
        return isActive && hasValidId;
      })
      .map((item: { id?: number; Id?: number; fromYear?: string | number; FromYear?: string | number; toYear?: string | number; ToYear?: string | number }) => ({
        label: `${item.fromYear ?? item.FromYear ?? ''}-${item.toYear ?? item.ToYear ?? ''}`,
        value: String(item.id ?? item.Id ?? ''),
        fromYear: item.fromYear ?? item.FromYear ?? '',
        toYear: item.toYear ?? item.ToYear ?? '',
      }))
      .filter((opt: AssessmentYearRangeOption) => opt.value && opt.value !== 'undefined')
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    logger.error('Failed to load assessment years', { operation: 'getAssessmentYears' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load assessment years for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load assessment years for RV Rate Master');
  }
}

/**
 * Get construction types from backend API
 */
export async function getConstructionTypes(): Promise<RateCategory[]> {
  try {
    const response = await getConstructionPaged(1, -1);
    const allItems = response.items || [];

    return allItems
      .filter((item: { isActive?: boolean }) => item.isActive === true)
      .map((item: { id?: number; Id?: number; constructionCode?: string; description?: string }) => ({
        constructionId: String(item.id ?? item.Id ?? ''),
        constructionCode: item.constructionCode,
        description: item.description || '',
      }));
  } catch (error) {
    logger.error('Failed to load construction types', { operation: 'getConstructionTypes' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load construction types for RV Rate Master');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load construction types for RV Rate Master');
  }
}

/**
 * Get rate master columns configuration
 */
export async function getRateMasterColumns() {
  const constructionTypes = await getConstructionTypes();
  return await rateMasterService.getRateMasterColumns(constructionTypes);
}

/**
 * Get all rate master table data
 */
export async function getRateMasterTableData(pageNumber: number = 1, pageSize: number = 10): Promise<IRateMaster[]> {
  const [constructionTypes, zoneDescriptionsResult] = await Promise.all([
    getConstructionTypes(),
    getZoneDescriptionsPaged(pageNumber, pageSize)
  ]);
  return await rateMasterService.getRateMasterTableData(constructionTypes, zoneDescriptionsResult.items);
}

/**
 * Get rate master data by ID
 */
export async function getRateMasterById(id: string, pageNumber: number = 1, pageSize: number = 10): Promise<IRateMaster | null> {
  const [constructionTypes, zoneDescriptionsResult] = await Promise.all([
    getConstructionTypes(),
    getZoneDescriptionsPaged(pageNumber, pageSize)
  ]);
  return await rateMasterService.getRateMasterById(id, constructionTypes, zoneDescriptionsResult.items);
}

/**
 * Get rate master records by filters
 */
export async function getRateMasterByFilters(
  zoneSection: string,
  useGroup: string,
  assessmentYear: string,
) {
  try {
    return await rateMasterService.getRateMasterByFilters(zoneSection, useGroup, assessmentYear);
  } catch (error) {
    logger.error('Failed to filter RV Rate Master data', { operation: 'getRateMasterByFilters', zoneSection, useGroup, assessmentYear }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to filter RV Rate Master data');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to filter RV Rate Master data');
  }
}

/**
 * Fetch Type Of Use details for Open Plot
 */
export async function getTypeOfUseDetailsAction(
  pageNumber: number = 1,
  pageSize: number = -1,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
) {
  try {
    return await rateMasterService.getTypeOfUseDetails(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  } catch (error) {
    logger.error('Failed to load Type of Use details', { operation: 'getTypeOfUseDetailsAction' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load Type of Use details');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load Type of Use details');
  }
}

/**
 * Fetch Type Of Use details for Open Plot, filtered by IsOpenPlot=1 groups and sorted with OP first.
 */
export async function getOpenPlotTypeOfUseDetailsAction() {
  try {
    const result = await rateMasterService.getOpenPlotTypeOfUseDetails(1, -1);
    const useTypes = result.items || [];

    // Sort 'OP' to the front so it takes priority for duplicate group IDs
    useTypes.sort((a: { typeOfUseCode?: string }, b: { typeOfUseCode?: string }) => {
      if (a.typeOfUseCode === 'OP') return -1;
      if (b.typeOfUseCode === 'OP') return 1;
      return 0;
    });

    return { items: useTypes };
  } catch (error) {
    logger.error('Failed to load Open Plot Type of Use details', { operation: 'getOpenPlotTypeOfUseDetailsAction' }, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load Open Plot Type of Use details');
  }
}

/**
 * Fetch all data required for the Rate Master page
 */
export async function getRateMasterData(pageNumber: number = 1, pageSize: number = 10) {
  try {
    const [
      constructionTypes,
      rateSections,
      useGroups,
      assessmentYears,
      zoneDescriptionsResult
    ] = await Promise.all([
      getConstructionTypes(),
      getZoneOptions(),
      getUseGroupOptions(),
      getAssessmentYears(),
      getZoneDescriptionsPaged(pageNumber, pageSize)
    ]);
    return {
      constructionTypes,
      rateSections,
      useGroups,
      assessmentYears,
      zoneDescriptions: zoneDescriptionsResult.items,
      totalPages: zoneDescriptionsResult.totalPages,
      totalCount: zoneDescriptionsResult.totalCount
    };
  } catch (error) {
    logger.error('Failed to load RV Rate Master page data', { operation: 'getRateMasterData', pageNumber, pageSize }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load RV Rate Master page data');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load RV Rate Master page data');
  }
}

/* ========== MUTATIONS (POST/PUT/DELETE) ========== */

/**
 * Delete rate master record(s)
 */
export async function deleteRateMasterAction(backendRates: IBackendRateMaster[]): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  if (!backendRates || backendRates.length === 0) {
    logger.warn('No rates found to delete', { operation: 'deleteRateMasterAction' });
    return { success: false, message: 'No rates found to delete.' };
  }
  const ids = backendRates
    .map(rate => rate.id)
    .filter((id): id is number => typeof id === 'number' && id > 0);

  if (ids.length === 0) {
    logger.warn('No valid rate IDs found to delete', { operation: 'deleteRateMasterAction' });
    return { success: false, message: 'No valid rate IDs found to delete.' };
  }
  try {
    await rateMasterService.bulkPurgeRateMaster(ids);
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-master/rvratemaster`);
      revalidatePath(`/${locale}/property-tax/rate-master/openplot`);
    }
    return { success: true, message: 'Rates deleted successfully' };
  } catch (error: unknown) {
    logger.error('Failed to delete rates', { operation: 'deleteRateMasterAction', idsCount: ids.length }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to delete rates. Please try again.' };
  }
}
/**
 * Bulk create rate master records (supports open plot)
 */
export async function bulkCreateRateMasterAction(
  rates: Record<string, unknown>[],
  isOpenPlot: boolean = false
): Promise<{ success: boolean; message?: string; data?: unknown; statusCode?: number }> {
  // Wrap everything in try-catch to ensure we always return a serializable response
  try {
    // Validate input
    if (!rates) {
      logger.warn('No rates data received', { operation: 'bulkCreateRateMasterAction' });
      return { success: false, message: 'No rates data received.' };
    }
    if (!Array.isArray(rates)) {
      logger.warn('Invalid rates data format. Expected an array.', { operation: 'bulkCreateRateMasterAction' });
      return { success: false, message: 'Invalid rates data format. Expected an array.' };
    }
    if (rates.length === 0) {
      logger.warn('No rates to create. Please enter at least one rate value.', { operation: 'bulkCreateRateMasterAction' });
      return { success: false, message: 'No rates to create. Please enter at least one rate value.' };
    }

    // Set createdBy from authenticated user
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      logger.warn('User not authenticated. Cannot set createdBy.', { operation: 'bulkCreateRateMasterAction' });
      return { success: false, message: 'User not authenticated. Cannot set createdBy.' };
    }
    const ratesWithUser = rates.map(rate => ({
      ...rate,
      createdBy: userId,
    }));
    await rateMasterService.bulkCreateRateMaster(ratesWithUser, isOpenPlot);
    for (const locale of locales) {
      const pathSuffix = isOpenPlot ? 'openplot' : 'rvratemaster';
      revalidatePath(`/${locale}/property-tax/rate-master/${pathSuffix}`);
      if (isOpenPlot) {
        revalidatePath(`/${locale}/property-tax/rate-master/openplot/add`);
      }
    }
    return { success: true, message: 'Rates created successfully' };
  } catch (error: unknown) {
    logger.error('Failed to bulk create rates', { operation: 'bulkCreateRateMasterAction', ratesCount: rates?.length }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to create rates. Please try again.' };
  }
}
/**
 * Bulk update rate master records
 */
export async function bulkUpdateRateMasterAction(
  payload: Array<{ id: number, data: Record<string, unknown> }>
): Promise<{ success: boolean; message?: string; data?: unknown; statusCode?: number }> {
  try {
    if (!payload || payload.length === 0) {
      logger.warn('No rates to update. Please enter at least one rate value.', { operation: 'bulkUpdateRateMasterAction' });
      return { success: false, message: 'No rates to update. Please enter at least one rate value.' };
    }

    // Set updatedBy from authenticated user
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) {
      logger.warn('User not authenticated. Cannot set updatedBy.', { operation: 'bulkUpdateRateMasterAction' });
      return { success: false, message: 'User not authenticated. Cannot set updatedBy.' };
    }
    const payloadWithUser = payload.map(item => ({
      ...item,
      data: {
        ...item.data,
        UpdatedBy: userId,
      },
    }));
    await rateMasterService.bulkUpdateRateMaster(payloadWithUser);
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-master/rvratemaster`);
    }
    return { success: true, message: 'Rates updated successfully' };
  } catch (error: unknown) {
    logger.error('Failed to bulk update rates', { operation: 'bulkUpdateRateMasterAction', payloadCount: payload?.length }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to update rates. Please try again.' };
  }
}

/**
 * Helper to get current user ID
 */
async function getCurrentUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    return userId ? String(userId) : "1";
  } catch {
    return "1";
  }
}

/**
 * Server action to create a Use Group and immediately assign it to a Use Type
 */
export async function createUseGroupAndAssignToTypeAction(input: {
  code: string;
  name: string;
  icon: UseGroupIconKey;
  typeOfUseId: number;
  typeOfUseGroupId?: number;
  isOpenPlot?: boolean;
}): Promise<{ success: boolean; message?: string; typeOfUseGroupId?: number }> {
  try {
    const userId = await getCurrentUserId();
    let typeOfUseGroupId = input.typeOfUseGroupId;

    if (!typeOfUseGroupId) {
      // 1. Create the use group via direct POST to resolve envelope structure
      const payload = {
        typeOfUseGroupCode: input.code?.trim(),
        groupName: input.name?.trim(),
        groupIcon: iconKeyToApi(input.icon),
        isOpenPlot: input.isOpenPlot ?? false,
        isActive: true,
        createdBy: Number(userId ?? "1"),
      };

      const response = await apiClient.post<Record<string, unknown>>("/TypeOfUseGroup", payload, {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });

      if (!response.success || !response.data) {
        return { success: false, message: "Failed to create use group on backend" };
      }

      const resData = response.data as Record<string, unknown>;
      const groupData = (resData.items || resData.data || resData) as Record<string, unknown>;
      typeOfUseGroupId = Number(groupData.id ?? groupData.typeOfUseGroupId ?? groupData.typeOfUseGroupID ?? 0);
    }

    if (!typeOfUseGroupId) {
      return { success: false, message: "Failed to resolve use group ID" };
    }

    // 2. Fetch the current use type via direct GET to resolve envelope structure
    const useTypeRes = await apiClient.get<Record<string, unknown>>(`/TypeOfUse/${input.typeOfUseId}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });

    if (!useTypeRes.success || !useTypeRes.data) {
      return { success: false, message: `Type of use not found for ID ${input.typeOfUseId}` };
    }

    const utResData = useTypeRes.data as Record<string, unknown>;
    const useTypeData = (utResData.items || utResData.data || utResData) as Record<string, unknown>;

    const typeOfUseId = Number(useTypeData.id ?? useTypeData.typeOfUseId ?? useTypeData.typeOfUseID ?? 0);
    const typeOfUseCode = String(useTypeData.typeOfUseCode ?? "");
    const description = String(useTypeData.description ?? "");
    const type = String(useTypeData.type ?? "");
    const searchSequence = Number(useTypeData.searchSequence ?? useTypeData.SearchSequence ?? 0);
    const isActive = typeof useTypeData.isActive === "boolean" ? useTypeData.isActive : (typeof useTypeData.IsActive === "boolean" ? useTypeData.IsActive : true);
    const typeOfUseCategoryId = useTypeData.typeOfUseCategoryId !== undefined && useTypeData.typeOfUseCategoryId !== null ? Number(useTypeData.typeOfUseCategoryId) : null;

    if (!typeOfUseId) {
      return { success: false, message: "Failed to resolve use type ID from backend response" };
    }

    // 3. Update the typeOfUseGroupId in the Type of Use via direct PUT
    const updatePayload = {
      typeOfUseId,
      typeOfUseCode,
      description,
      type,
      typeOfUseGroupId,
      searchSequence,
      isActive,
      typeOfUseCategoryId,
      updatedBy: Number(userId ?? "1"),
    };

    const updateRes = await apiClient.put<Record<string, unknown>>(`/TypeOfUse/${typeOfUseId}`, updatePayload, {
      cache: "no-store",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
    });

    if (!updateRes.success) {
      return { success: false, message: "Failed to associate use group to use type on backend" };
    }

    // 4. Revalidate paths to clear caches
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-master/openplot`);
      revalidatePath(`/${locale}/property-tax/rate-master/openplot/add`);
      revalidatePath(`/${locale}/property-tax/typeofusemaster`);
    }

    return {
      success: true,
      typeOfUseGroupId,
    };
  } catch (error: unknown) {
    logger.error('Failed to create group and assign to type of use', { operation: 'createUseGroupAndAssignToTypeAction', input }, error);
    if (error instanceof ApiError) {
      return { success: false, message: error.responseText };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create use group and associate it." };
  }
}

/**
 * Server action to get paginated use groups
 */
export async function getUseGroupsPagedAction(params: {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  filterLogic?: number;
  typeOfUseGroupId?: number;
}) {
  try {
    return await getUseGroupsPagedServer(params);
  } catch (error) {
    logger.error('Failed to load paged use groups', { operation: 'getUseGroupsPagedAction' }, error);
    if (error instanceof ApiError) {
      throw new ApiError(error.statusCode, error.responseText, 'Failed to load use groups');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error', 'Failed to load use groups');
  }
}
