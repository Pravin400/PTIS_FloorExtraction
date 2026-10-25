'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import {
  addDepreciationRangeBulk,
  bulkCreateDepreciation,
  deleteDepreciationRange,
  getConstructionTypes,
  getDepreciationPaged,
  syncDepreciationRatesFromPage,
} from '@/lib/api/depreciation.services';
import type { ActionResult, DepreciationConstructionType, DepreciationRow, RangeRow } from '@/types/depreciation.types';
import { ApiError } from '@/lib/utils/api';

const getPagePath = (locale: string) => `/${locale}/property-tax/depreciation-master`;

const SERVER_ERROR_CODES: Record<string, string> = {
  MaxYear_Range_0_9999: "Maximum age must be between 0 and 999.",
  MinYear_Range_0_9999: "Minimum age must be between 0 and 999.",
};

function parseAddRangeError(error: unknown): string {
  if (!(error instanceof Error)) return "Add range failed";

  const msg = error.message;

  // Check for 409 conflict / duplicate record errors
  if (msg.includes("(409)") || 
      msg.toLowerCase().includes("same details already exists") ||
      msg.toLowerCase().includes("already exists")) {
    return "This age range already exists. Please choose different age values.";
  }

  if (msg.toLowerCase().includes("overlap") ||
      msg.toLowerCase().includes("duplicate") ||
      msg.toLowerCase().includes("conflict")) {
    return "Age range overlaps with existing range. Please choose different values.";
  }

  // Try to parse server validation JSON embedded in the message
  const jsonStart = msg.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(msg.slice(jsonStart, msg.lastIndexOf("}") + 1)) as {
        title?: string;
        errors?: Record<string, string[]>;
      };

      if (parsed.errors && typeof parsed.errors === "object") {
        const codes = Object.values(parsed.errors).flat();
        const unique = [...new Set(codes)];
        const readable = unique
          .map((c) => SERVER_ERROR_CODES[c] ?? c)
          .join(" ");
        return readable || parsed.title || "Validation failed.";
      }

      if (parsed.title) return parsed.title;
    } catch {
      // fall through
    }
  }

  return msg;
}

/**
 * Fetches paginated depreciation records with RANGE-BASED pagination.
 * Converts user's desired range count to record count for backend API.
 * pageSize parameter = number of RANGES to show (not records)
 */
export async function fetchRangesPagedServerAction(
  pageNumber: number,
  rangePageSize: number
): Promise<{
  success: boolean;
  data?: {
    rows: DepreciationRow[];
    allRanges: RangeRow[];
    constructionTypes: DepreciationConstructionType[];
    pageNumber: number;
    pageSize: number;
    totalRanges: number;
    totalPages: number;
    totalRecords: number;
  };
  error?: string;
}> {
  try {
    // Validation
    if (pageNumber <= 0 || (rangePageSize !== -1 && rangePageSize <= 0)) {
      return {
        success: false,
        error: "Invalid pagination parameters",
      };
    }

    // Fetch all data
    const [constructionTypes, paginatedResponse] = await Promise.all([
      getConstructionTypes(),
      getDepreciationPaged(1, -1),
    ]);

    const allRows = paginatedResponse.items || [];

    // Group rows by range
    const groupedRanges = new Map<string, DepreciationRow[]>();

    allRows.forEach((row) => {
      const key = `${row.minYear}-${row.maxYear}`;

      if (!groupedRanges.has(key)) {
        groupedRanges.set(key, []);
      }

      groupedRanges.get(key)?.push(row);
    });

    // Convert map to array
    const allRangeGroups = Array.from(groupedRanges.values());

    // Sort ranges properly
    allRangeGroups.sort((a, b) => {
      const firstA = a[0];
      const firstB = b[0];

      return firstA.minYear - firstB.minYear;
    });

    const allRanges: import('@/types/depreciation.types').RangeRow[] = allRangeGroups.map((group) => {
      const first = group[0];
      return {
        id: `${first.minYear}-${first.maxYear}`,
        min: first.minYear,
        max: first.maxYear,
        label: `${first.minYear}-${first.maxYear}`,
      };
    });

    // Total ranges
    const totalRanges = allRangeGroups.length;

    // Total pages
    const totalPages =
      rangePageSize === -1
        ? 1
        : Math.max(1, Math.ceil(totalRanges / rangePageSize));

    // Clamp page number
    const clampedPageNumber = Math.min(pageNumber, totalPages);

    // Paginate grouped ranges
    let paginatedGroups: DepreciationRow[][];

    if (rangePageSize === -1) {
      paginatedGroups = allRangeGroups;
    } else {
      const startIndex = (clampedPageNumber - 1) * rangePageSize;

      paginatedGroups = allRangeGroups.slice(
        startIndex,
        startIndex + rangePageSize
      );
    }

    // Flatten groups back into rows
    const rows = paginatedGroups.flat();

    return {
      success: true,
      data: {
        rows,
        allRanges,
        constructionTypes,
        pageNumber: clampedPageNumber,
        pageSize: rangePageSize,
        totalRanges,
        totalPages,
        totalRecords: allRows.length,
      },
    };
  } catch (error: unknown) {
    console.error("[fetchRangesPagedServerAction] Error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load depreciation data",
    };
  }
}

/**
 * @deprecated Use fetchRangesPagedServerAction for better performance
 * This function fetches all records which is inefficient for large datasets
 */
export async function getDepreciationScreenAction(): Promise<
  ActionResult<{
    constructionTypes: DepreciationConstructionType[];
    rows: DepreciationRow[];
  }>
> {
  console.warn('getDepreciationScreenAction is deprecated - use fetchRangesPagedServerAction instead');
  try {
    // This is inefficient - fetches all records
    const [constructionTypes, allRowsResponse] = await Promise.all([
      getConstructionTypes(),
      getDepreciationPaged(1, 1000), // Limit to first 1000 records as fallback
    ]);

    return {
      success: true,
      data: { constructionTypes, rows: allRowsResponse.items || [] },
    };
  } catch (error: unknown) {
    console.error('[getDepreciationScreenAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load screen data',
    };
  }
}

/**
 * Efficient Global Sync Action - uses only current page records
 * This handles the "Dirty Tracking" update with proper server-side pagination.
 * Only updates the records that were changed in the UI grid from current page.
 * @param locale - Current locale for revalidation 
 * @param currentPageRecords - Records currently loaded in the UI (from current page)
 * @param changes - Object mapping id to new rate value
 */
export async function syncDepreciationRatesAction(
  locale: string,
  currentPageRecords: DepreciationRow[],
  changes: Record<number, number>,
  newRecords?: Record<string, { minYear: number; maxYear: number; constructionTypeId: number; rate: number }>
): Promise<ActionResult> {
  try {
    const newRecordsList = newRecords ? Object.values(newRecords) : [];
    if ((!changes || Object.keys(changes).length === 0) && newRecordsList.length === 0) return { success: true };

    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    if (changes && Object.keys(changes).length > 0) {
      await syncDepreciationRatesFromPage(currentPageRecords, changes, userId.toString());
    }

    if (newRecordsList.length > 0) {
      // Group newRecordsList by minYear-maxYear
      const grouped = newRecordsList.reduce((acc, curr) => {
        const key = `${curr.minYear}-${curr.maxYear}`;
        if (!acc[key]) {
          acc[key] = {
            minYear: curr.minYear,
            maxYear: curr.maxYear,
            rates: []
          };
        }
        acc[key].rates.push({ constructionTypeId: curr.constructionTypeId, rate: curr.rate });
        return acc;
      }, {} as Record<string, { minYear: number; maxYear: number; rates: { constructionTypeId: number; rate: number }[] }>);

      for (const group of Object.values(grouped)) {
        // Find existing yearRangeRVId from currentPageRecords
        const existingRecordForRange = currentPageRecords.find(r => r.minYear === group.minYear && r.maxYear === group.maxYear);
        const yearRangeRVId = existingRecordForRange?.yearRangeRVId;
        
        if (yearRangeRVId) {
          const payload = {
            minYear: group.minYear,
            maxYear: group.maxYear,
            yearRangeRVId,
            rates: group.rates,
            createdBy: Number(userId.toString())
          };
          await bulkCreateDepreciation(payload);
        } else {
          console.warn('Could not find yearRangeRVId for range', group.minYear, group.maxYear);
        }
      }
    }

    revalidatePath(getPagePath(locale));

    return { success: true };
  } catch (error: unknown) {
    console.error('[syncDepreciationRatesAction] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
  }
}

/**
 * Action to add a new range across all construction types.
 * This creates a default row (rate 0) for every construction type in the new range.
 * Server-side validation will reject overlapping ranges.
 */
export async function addRangeAction(
  locale: string,
  payload: { minYear: number; maxYear: number; defaultRate?: number }
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    await addDepreciationRangeBulk(payload, userId.toString());

    revalidatePath(getPagePath(locale));

    return { success: true };
  } catch (error: unknown) {
    console.error('[addRangeAction] Error:', error);
    return { success: false, error: parseAddRangeError(error) };
  }
}

/**
 * Action to delete an entire range.
 * Deletes all construction type records associated with this min/max year.
 */
export async function deleteRangeAction(
  locale: string,
  payload: { minYear: number; maxYear: number }
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    await deleteDepreciationRange(payload, userId.toString());

    revalidatePath(getPagePath(locale));

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
}
