import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type { PagedResponse } from '@/types/common.types';
import type { AssessmentYearRange } from '@/types/assessment-year-range.types';
import type {
  DepreciationConstructionType,
  DepreciationRow,
  DepreciationPagedResponse,
} from '@/types/depreciation.types';
import { getConstructionPaged } from './constructiontypemaster/construction-crud.service';
import { ConstructionType } from '@/types/construction.types';

/**
 * Fetch paginated depreciation records (for range-wise pagination)
 * @param pageNumber - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated depreciation response
 */
export async function getDepreciationPaged(
  pageNumber: number,
  pageSize: number
): Promise<DepreciationPagedResponse> {
  const params = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await apiClient.get<DepreciationPagedResponse>(
    `/Depreciation?${params.toString()}`
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch depreciation records',
      'Get depreciation records failed'
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', 'Invalid response format');
  }

  return response.data;
}

/**
 * Get construction types from construction-crud service
 */
/**
 * Get construction types
 */
export async function getConstructionTypes(): Promise<DepreciationConstructionType[]> {
  const response = await getConstructionPaged(1, -1);

  const items = response.items || [];

  return items
    .filter((ct: ConstructionType) => ct.isActive === true)
    .map((ct: ConstructionType) => ({
      constructionId: ct.id,
      constructionCode: ct.constructionCode,
    }));
}

/**
 * Fetch all depreciation records (for bulk operations)
 * Handles API pagination by fetching all pages
 * @returns Array of all depreciation records
 * @throws ApiError if pagination exceeds safety limit
 */
export async function getDepreciationsAll(): Promise<DepreciationRow[]> {
  const allItems: DepreciationRow[] = [];
  let pageNumber = 1;
  const pageSize = 100;
  const MAX_PAGES_SAFETY_LIMIT = 100;

  while (true) {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await apiClient.get<DepreciationPagedResponse>(
      `/Depreciation?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || 'Failed to fetch depreciation records',
        'Get depreciation records failed'
      );
    }

    if (!response.data) {
      throw new ApiError(500, 'No data received from server', 'Invalid response format');
    }

    const items = response.data.items || [];
    allItems.push(...items);

    const { totalPages, hasNext } = response.data;

    if (pageNumber >= totalPages || hasNext !== true || items.length === 0) {
      break;
    }

    pageNumber++;

    if (pageNumber > MAX_PAGES_SAFETY_LIMIT) {
      throw new ApiError(
        500,
        `Pagination exceeded safety limit of ${MAX_PAGES_SAFETY_LIMIT} pages. Total pages reported: ${totalPages}`,
        'Data fetch incomplete - too many pages'
      );
    }
  }

  return allItems;
}

/**
 * Efficient sync depreciation rates using only current page records
 * No longer fetches all records from database
 */
export async function syncDepreciationRatesFromPage(
  currentPageRecords: DepreciationRow[],
  updates: Record<number, number>,
  userId: string
): Promise<void> {
  const depreciations = Object.entries(updates)
    .map(([idStr, newRate]) => {
      const id = Number(idStr);
      const existing = currentPageRecords.find((d) => d.id === id);

      if (!existing) {
        // Record not found in current page, skip for now
        // UI should prevent this scenario
        return null;
      }

      return {
        id: existing.id,
        minYear: existing.minYear,
        maxYear: existing.maxYear,
        constructionTypeId: existing.constructionTypeId,
        rate: newRate,
        yearRangeRVId: existing.yearRangeRVId,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (depreciations.length === 0) {
    return;
  }

  await bulkUpdateDepreciationRates({
    depreciations,
    updatedBy: Number(userId),
  });
}

/**
 * @deprecated Use syncDepreciationRatesFromPage for better performance
 * This function fetches all records which is inefficient for large datasets
 */
export async function syncDepreciationRates(
  updates: Record<number, number>,
  userId?: string
): Promise<void> {
  const allData = await getDepreciationsAll();

  const depreciations = Object.entries(updates)
    .map(([idStr, newRate]) => {
      const id = Number(idStr);
      const existing = allData.find((d) => d.id === id);

      if (!existing) {
        return null;
      }

      return {
        id: existing.id,
        minYear: existing.minYear,
        maxYear: existing.maxYear,
        constructionTypeId: existing.constructionTypeId,
        rate: newRate,
        yearRangeRVId: existing.yearRangeRVId,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (depreciations.length === 0) {
    return;
  }

  await bulkUpdateDepreciationRates({
    depreciations,
    updatedBy: userId ? Number(userId) : 0,
  });
}

/**
 * Bulk create depreciation records
 */
export async function bulkCreateDepreciation(payload: {
  minYear: number;
  maxYear: number;
  rates: Array<{
    constructionTypeId: number;
    rate: number;
  }>;
  createdBy?: number;
  yearRangeRVId: number;
}): Promise<void> {
  const bulkPayload = payload.rates.map((item) => ({
    isActive: true,
    createdBy: payload.createdBy || 0,
    constructionTypeId: item.constructionTypeId,
    minYear: payload.minYear,
    maxYear: payload.maxYear,
    rate: item.rate,
    yearRangeRVId: payload.yearRangeRVId,
  }));

  const response = await apiClient.post<unknown>('/Depreciation/Bulk', bulkPayload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to create bulk depreciation records',
      'Bulk create failed'
    );
  }
}

/**
 * Add depreciation range for all construction types
 */
export async function addDepreciationRangeBulk(
  payload: {
    minYear: number;
    maxYear: number;
    defaultRate?: number;
  },
  userId: string
): Promise<void> {
  const constructionTypes = await getConstructionTypes();

  const rates = constructionTypes.map((type) => ({
    constructionTypeId: Number(type.constructionId),
    rate: payload.defaultRate ?? 0,
  }));

  let yearRangeRVId: number | null = null;

  // 1. Try to get yearRangeRVId from existing depreciation records
  try {
    const existingRecords = await getDepreciationsAll();
    if (existingRecords.length > 0) {
      const found = existingRecords.find((r) => r.yearRangeRVId && r.yearRangeRVId > 0);
      if (found) {
        yearRangeRVId = found.yearRangeRVId;
      }
    }
  } catch {
    // Failed to fetch existing depreciation records
  }

  // 2. If no existing records, fetch from AssessmentYearRange master
  if (!yearRangeRVId) {
    try {
      const yearRangesResponse = await apiClient.get<PagedResponse<AssessmentYearRange>>(
        '/AssessmentYearRange?PageNumber=1&PageSize=100'
      );
      if (yearRangesResponse.success && yearRangesResponse.data?.items) {
        const activeRange = yearRangesResponse.data.items.find((item) => item.isActive);
        if (activeRange) {
          yearRangeRVId = activeRange.id;
        }
      }
    } catch {
      // Failed to fetch assessment year ranges
    }
  }

  // Throw error if yearRangeRVId could not be resolved, preventing hardcoded defaults
  if (!yearRangeRVId || yearRangeRVId <= 0) {
    throw new ApiError(
      400,
      'Could not resolve active Assessment Year Range (missing active range or failed to fetch). Please ensure an active Assessment Year Range exists in the master and try again.',
      'Validation'
    );
  }

  await bulkCreateDepreciation({
    minYear: payload.minYear,
    maxYear: payload.maxYear,
    rates,
    createdBy: Number(userId),
    yearRangeRVId,
  });
}

/**
 * Delete depreciation range - uses bulk purge for transactional hard delete
 */
export async function deleteDepreciationRange(
  payload: {
    minYear: number;
    maxYear: number;
  },
  _userId: string
): Promise<void> {
  const allData = await getDepreciationsAll();

  const targetIds = allData
    .filter((x) => x.minYear === payload.minYear && x.maxYear === payload.maxYear)
    .map((x) => x.id);

  if (targetIds.length === 0) {
    return;
  }

  // Use DELETE with body - pass body via options
  const response = await apiClient.delete<void>('/Depreciation/Bulk/purge', {
    body: JSON.stringify(targetIds),
  });

  // Purge endpoints may return 204 No Content with an empty body.
  // If the shared client marks that response as unsuccessful because it
  // attempts JSON parsing first, still treat HTTP 204 or JSON parse errors as success.
  if (response.success) {
    return;
  }

  // Handle 204 No Content or JSON parsing error on empty response
  if (response.statusCode === 204 || response.error?.includes('Unexpected end of JSON input')) {
    return;
  }

  throw new ApiError(
    response.statusCode ?? 500,
    response.error || 'Failed to bulk purge depreciation records',
    `Bulk purge depreciation range ${payload.minYear}-${payload.maxYear} failed`
  );
}
/**
 * Bulk update depreciation rates
 */
export async function bulkUpdateDepreciationRates(payload: {
  depreciations: Array<{
    id: number;
    minYear: number;
    maxYear: number;
    constructionTypeId: number;
    rate: number;
    yearRangeRVId: number;
  }>;
  updatedBy?: number;
}): Promise<void> {
  // Build payload exactly as backend expects: [{id, data: {...}}]
  const bulkPayload = payload.depreciations.map((item) => ({
    id: item.id,
    data: {
      id: item.id,
      constructionTypeId: item.constructionTypeId,
      minYear: item.minYear,
      maxYear: item.maxYear,
      rate: item.rate,
      yearRangeRVId: item.yearRangeRVId,
      isActive: true,
      updatedBy: payload.updatedBy ?? 1,
    },
  }));

  const response = await apiClient.put<unknown>('/Depreciation/Bulk', bulkPayload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to bulk update depreciation rates',
      'Bulk update failed'
    );
  }
}

/**
 * Hard delete (purge) a single depreciation record
 */
export async function purgeDepreciation(id: number): Promise<void> {
  if (!id || id <= 0) {
    throw new ApiError(400, 'Valid depreciation ID is required', 'Validation failed');
  }

  const response = await apiClient.delete<void>(
    `/Depreciation/${encodeURIComponent(String(id))}/purge`
  );

  // Purge endpoints may return 204 No Content with an empty body.
  // If the shared client marks that response as unsuccessful because it
  // attempts JSON parsing first, still treat HTTP 204 or JSON parse errors as success.
  if (response.success) {
    return;
  }

  // Handle 204 No Content or JSON parsing error on empty response
  if (response.statusCode === 204 || response.error?.includes('Unexpected end of JSON input')) {
    return;
  }

  throw new ApiError(
    response.statusCode ?? 500,
    response.error || 'Failed to purge depreciation record',
    `Purge depreciation ${id} failed`
  );
}
