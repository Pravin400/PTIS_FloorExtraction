"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";
import {
  getRateSectionTotalCount,
  queryRateSections,
  getRateSectionById,
  createRateSection,
  updateRateSection,
} from "@/lib/api/rate-section-master/rateSection.services";
import {
  getAllRateSectionDetails,
  getWardTotalCount,
  getWardPagedServer,
  bulkUpdateRateSectionDetails,
  bulkPurgeRateSectionDetails,
  bulkCreateRateSectionDetails,
  getWardsByRateSectionId,
} from "@/lib/api/rate-section-master/rateSectionDetails.services";
import { getWards, getWardById, updateWard } from "@/lib/api/ward.services";
import {
  ActionResponse,
  SectionItem,
  RateItem,
  ActionResult,
  RateSectionDetailPayload,
} from "@/types/rateSectionMaster.types";
import type { WardItem, UpdateWardPayload } from "@/types/wardMaster.types";
import { apiClient } from "@/services/api.service";
import { getUserIdFromCookies } from "@/lib/utils/cookie";



/**
 * Common helper to retrieve the authenticated user ID from cookies.
 * Resolves type mismatches (null to undefined) for service payloads.
 */
async function getAuthenticatedUserId(): Promise<number | undefined> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  return userId ?? undefined;
}


/* ------------------------------------------------------------------ */
/* READ: ALL rate sectionS (MASTER + DETAILS) */
/* ------------------------------------------------------------------ */

/**
 * Fetches all rate sections from backend API
 * Source: GET /api/RateSection
 */
export async function getRateSectionsAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
) {
  try {
    if (searchTerm && searchTerm.trim() !== '') {
      // Fetch all records to perform manual search on ID and description
      const data = await queryRateSections({
        pageNumber: 1,
        pageSize: -1,
        searchTerm: undefined
      });

      const term = searchTerm.toLowerCase().trim();
      const allItems = data.rateSectionMaster || [];

      const filteredItems = allItems.filter(item => {
        const idMatch = item.id ? String(item.id).toLowerCase().includes(term) : false;
        const descMatch = item.description ? item.description.toLowerCase().includes(term) : false;
        return idMatch || descMatch;
      });

      const totalCount = filteredItems.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

      return {
        items: paginatedItems,
        totalCount: totalCount,
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalPages: totalPages
      };
    } else {
      // Use standard backend pagination when no search term
      const data = await queryRateSections({
        pageNumber: pageNumber,
        pageSize: pageSize,
        searchTerm: undefined
      });
      return {
        items: data.rateSectionMaster || [],
        totalCount: data.totalCount || 0,
        pageNumber: data.pageNumber || pageNumber,
        pageSize: data.pageSize || pageSize,
        totalPages: data.totalPages || 0
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function getRateSectionTotalCountAction(): Promise<
  ActionResponse<number>
> {
  try {
    const totalCount = await getRateSectionTotalCount();
    return { success: true, data: totalCount };
  } catch (error) {
    throw error;
  }
}

export async function getWardsByRateAction(
  rateSectionId: number,
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<{ success: boolean; data: unknown[]; totalCount: number; error?: string }> {
  try {
    if (!Number.isFinite(rateSectionId) || rateSectionId <= 0) {
      return { success: false, data: [], totalCount: 0, error: "Valid Rate Section ID is required" };
    }

    const params = new URLSearchParams({
      RateSectionId: rateSectionId.toString(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString()
    });
    if (searchTerm?.trim()) {
      params.append("SearchTerm", searchTerm.trim());
    }

    const response = await apiClient.get<{ items?: unknown[]; totalCount?: number }>(`/RateSectionDetails?${params.toString()}`);

    if (!response.success || !response.data) {
      return { success: false, data: [], totalCount: 0, error: response.error || "Failed to fetch wards" };
    }

    return {
      success: true,
      data: response.data.items ?? [],
      totalCount: response.data.totalCount ?? 0
    };
  } catch (error) {
    throw error;
  }
}


export async function getRateSectionByNoAction(
  rateSectionNo: string
): Promise<RateItem | null> {
  try {
    if (!rateSectionNo?.trim()) {
      return null;
    }

    const response = await apiClient.get<RateItem>(`/RateSection/GetByNo/${encodeURIComponent(rateSectionNo.trim())}`);

    if (!response.success || !response.data) return null;

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetches a single rate section by its numeric ID.
 * Used for SSR in Edit Rate Section page.
 * @param rateSectionId - The numeric rate section ID
 */
export async function getRateSectionByIdAction(
  rateSectionId: number
): Promise<{ success: boolean; data?: RateItem; error?: string; statusCode?: number }> {
  try {
    if (!Number.isFinite(rateSectionId) || rateSectionId <= 0) {
      return { success: false, error: "Valid Rate Section ID is required", statusCode: 400 };
    }

    const data = await getRateSectionById(String(rateSectionId));

    if (!data) {
      return { success: false, error: "Rate section not found", statusCode: 404 };
    }

    return { success: true, data };
  } catch (error) {
    throw error;
  }
}
/**
 * Fetches ALL ward assignments across all rate sections.
 * Source: GET /api/RateSectionDetails
 */
export async function getAllRateSectionDetailsAction(): Promise<ActionResponse<SectionItem[]>> {
  try {
    const data = await getAllRateSectionDetails();
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to fetch all ward assignments" };
  }
}

/**
 * Fetches rate section details by id and wardId.
 * Used for SSR when editing a specific ward assignment.
 */
export async function getRateSectionDetailsByIdAction(
  id: string,
  wardId: string
): Promise<ActionResponse<SectionItem[]>> {
  try {
    const data = await getWardPagedServer(1, 100);
    const filtered = (data.items ?? []).filter(
      (item: SectionItem) =>
        String(item.id) === id ||
        String(item.wardId) === wardId
    );
    return { success: true, data: filtered };
  } catch (_error) {
    return { success: false, error: "Failed to fetch rate section details", data: [] };
  }
}

export async function getWardTotalCountAction(): Promise<
  ActionResponse<number>
> {
  try {
    return {
      success: true,
      data: await getWardTotalCount(),
    };
  } catch (_error) {
    return {
      success: false,
      error: "Failed to fetch ward total count",
    };
  }
}

/* ------------------------------------------------------------------ */
/* UPDATE: rate section */
/* ------------------------------------------------------------------ */
export async function updateRateSectionAction(
  id: number,
  payload: {
    description: string;
    isActive: boolean;
  }
): Promise<{ success: boolean; message?: string; statusCode?: number; error?: string }> {
  try {
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, message: "Valid Rate Section ID is required", statusCode: 400 };
    }

    if (!payload.description?.trim()) {
      return { success: false, message: "Description is required", statusCode: 400 };
    }

    const userId = await getAuthenticatedUserId();

    if (userId === undefined) {
      return { success: false, error: "User authentication required", statusCode: 401 };
    }

    const result = await updateRateSection(String(id), {
      zoneCode: "",
      zoneEnglish: "",
      zoneRegional: payload.description,
      description: payload.description,
      isActive: payload.isActive,
      wards: [],
      updatedBy: userId
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Failed to update rate section",
        error: result.error || "Failed to update rate section",
        statusCode: result.statusCode
      };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return { success: true, message: "Rate section updated successfully" };
  } catch (_error) {
    return { success: false, message: "Failed to update rate section" };
  }
}

export async function deleteRateSectionAction(
  id: number
): Promise<{ success: boolean; message?: string; error?: string; statusCode?: number }> {
  try {
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, message: "Valid Rate Section ID is required", statusCode: 400 };
    }

    const response = await apiClient.delete(`/RateSection/${id}/purge`);

    if (!response.success) {
      return { success: false, error: response.error || "Failed to delete rate section" };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return { success: true, message: "Rate section deleted successfully" };
  } catch (_error) {
    return { success: false, error: "Failed to delete rate section" };
  }
}


export async function createRateSectionAction(payload: {
  description: string;
  isActive: boolean;
}): Promise<{ success: boolean; message?: string; error?: string; statusCode?: number; data?: { id: number } }> {
  try {
    if (!payload.description?.trim()) {
      return { success: false, message: "Description is required", statusCode: 400 };
    }

    const userId = await getAuthenticatedUserId();

    if (userId === undefined) {
      return { success: false, error: "User authentication required", statusCode: 401 };
    }

    // Check for duplicate rate section (case-insensitive)
    const existingRates = await queryRateSections({ pageNumber: 1, pageSize: -1 });
    const normalizedDescription = payload.description.trim().toLowerCase();
    const duplicate = existingRates.rateSectionMaster.find(
      (r) => (r.description || '').trim().toLowerCase() === normalizedDescription
    );

    if (duplicate) {
      return {
        success: false,
        error: `Rate section "${duplicate.description}" already exists`,
        statusCode: 409
      };
    }

    const result = await createRateSection({
      zoneCode: "",
      zoneEnglish: "",
      zoneRegional: payload.description.trim(),
      description: payload.description.trim(),
      isActive: payload.isActive,
      wards: [],
      createdBy: userId,
      updatedBy: userId
    });

    if (!result.success) {
      return { success: false, error: result.error || "Failed to create rate section", statusCode: 400 };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return { success: true, message: "Rate section created successfully", data: result.data };
  } catch (_error) {
    return { success: false, error: "Failed to create rate section" };
  }
}

/* ------------------------------------------------------------------ */
/* WARD MASTER - PAGED FETCH (for AddWard SSR)                        */
/* ------------------------------------------------------------------ */

/**
 * Fetches ALL wards with PageSize=-1 in a single API call.
 * Used for SSR pre-fetching in Link Ward drawer.
 * Supports optional searchTerm for server-side filtering.
 */
export async function getAllWardsForLinkAction(searchTerm?: string): Promise<{
  success: boolean;
  data?: { id: string; wardNo: string; name: string }[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const data = await getWards(1, -1, searchTerm || undefined);

    // Transform to simplified format for AddWard
    const items = (data.items || []).map((w) => ({
      id: String(w.id),
      wardNo: w.wardNo,
      name: w.description ?? w.wardNo
    }));

    return {
      success: true,
      data: items,
      totalCount: data.totalCount || items.length
    };
  } catch (_error) {
    return { success: false, error: "Failed to fetch wards" };
  }
}

/**
 * Fetches all rate sections for Select All functionality.
 * Used when user clicks Select All in RateSectionWards component.
 * API: GET /api/RateSection?PageSize=-1
 */
export async function getAllRateSectionsForSelectAction(): Promise<{
  success: boolean;
  data?: { id: number; rateSectionNo: string; description: string | null }[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const data = await queryRateSections({
      pageNumber: 1,
      pageSize: -1,
      searchTerm: undefined
    });

    const items = (data.rateSectionMaster || [])
      .filter((rs) => rs.id !== undefined && rs.rateSectionNo !== undefined)
      .map((rs) => ({
        id: rs.id!,
        rateSectionNo: rs.rateSectionNo!,
        description: rs.description ?? null
      }));

    return {
      success: true,
      data: items,
      totalCount: data.totalCount || items.length
    };
  } catch (_error) {
    return { success: false, error: "Failed to fetch all rate sections" };
  }
}

/**
 * Fetches all rate section details (wards) for a specific rate section using PageSize=-1.
 * Used when user clicks Select All in RateSectionWards tab.
 * API: GET /api/RateSectionDetails?RateSectionId={id}&PageSize=-1
 * Returns only wardNo array and count - no IDs exposed to client.
 */
export async function getAllRateSectionDetailsForRateSectionAction(rateSectionId: number): Promise<{
  success: boolean;
  wardNos: string[];
  totalCount: number;
  error?: string;
}> {
  try {
    if (!rateSectionId || !Number.isFinite(rateSectionId)) {
      return { success: false, wardNos: [], totalCount: 0, error: "Valid rate section ID is required" };
    }

    const params = new URLSearchParams({
      RateSectionId: rateSectionId.toString(),
      PageSize: "-1"
    });

    const response = await apiClient.get<{
      items?: Array<{ wardNo?: string }>;
      totalCount?: number
    }>(`/RateSectionDetails?${params.toString()}`);

    if (!response.success || !response.data) {
      return { success: false, wardNos: [], totalCount: 0, error: "Failed to fetch rate section details" };
    }

    const items = response.data.items || [];
    const wardNos = items
      .filter((item) => item.wardNo !== undefined && item.wardNo !== null)
      .map((item) => item.wardNo!);

    return {
      success: true,
      wardNos,
      totalCount: response.data.totalCount || wardNos.length
    };
  } catch (_error) {
    return { success: false, wardNos: [], totalCount: 0, error: "Failed to fetch all rate section details" };
  }
}

/**
 * Fetches wards with pagination and search for View All tab.
 * API: GET /api/Ward?PageNumber={page}&PageSize={size}&SearchTerm={term}
 */
export async function getWardsPagedWithSearchAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<{
  success: boolean;
  data?: { id: string; wardNo: string; name: string }[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}> {
  try {
    const data = await getWards(pageNumber, pageSize, searchTerm || undefined);

    // Transform to simplified format for AddWard
    const items = (data.items || []).map((w) => ({
      id: String(w.id),
      wardNo: w.wardNo,
      name: w.description ?? w.wardNo
    }));

    return {
      success: true,
      data: items,
      totalCount: data.totalCount || items.length,
      pageNumber: data.pageNumber || pageNumber,
      pageSize: data.pageSize || pageSize,
      totalPages: data.totalPages || Math.ceil((data.totalCount || 0) / pageSize)
    };
  } catch (_error) {
    return { success: false, error: "Failed to fetch wards" };
  }
}

/**
 * Link wards to a rate section using bulk update API.
 * Takes rateSectionId and wardNos, fetches ward details server-side,
 * then creates the bulk update payload and calls the new PUT /api/RateSectionDetails/Bulk endpoint.
 * This hides the full payload from the client.
 */
export async function linkWardsToRateSectionAction(
  rateSectionId: number,
  wardNos: string[]
): Promise<{
  success: boolean;
  data?: { successCount: number; failedCount: number; hasFailures: boolean };
  error?: string;
  statusCode?: number;
}> {
  try {
    if (!Number.isFinite(rateSectionId) || rateSectionId <= 0) {
      return { success: false, error: "Valid Rate Section ID is required", statusCode: 400 };
    }

    if (!Array.isArray(wardNos) || wardNos.length === 0) {
      return { success: false, error: "At least one ward is required", statusCode: 400 };
    }

    // Get authenticated user ID from cookies
    const userId = await getAuthenticatedUserId();

    if (userId === undefined) {
      return { success: false, error: "User authentication required", statusCode: 401 };
    }

    // Fetch all wards to get their IDs
    const wardsData = await getWards(1, -1);
    const allWards = wardsData.items || [];

    // Build wardNo to wardId map
    const wardNoToId: Record<string, number> = {};
    allWards.forEach((w) => {
      wardNoToId[w.wardNo] = w.id;
    });

    // Fetch ALL rate section details to find existing IDs for these wards
    // This handles cases where a ward might be assigned to a different rate section
    // or previously assigned to this one (even if inactive)
    // PERFORMANCE NOTE: This fetches all details (capped at 50 pages/~25k records).
    // Consider adding a backend API endpoint that accepts wardNos[] and returns
    // only the relevant RateSectionDetails to avoid loading the entire dataset.
    const allDetailsRes = await getAllRateSectionDetails();
    const wardToAssignment: Record<string, { id: number; rateSectionId: number }> = {};

    allDetailsRes.forEach(detail => {
      const detailRecord = detail as Record<string, unknown>;
      const wNo = (detail.wardNo || detailRecord.WardNo) as string | undefined;
      const detailId = (detail.id) as number | undefined;
      if (wNo && detailId) {
        wardToAssignment[wNo] = {
          id: detailId,
          rateSectionId: detail.rateSectionId || 0
        };
      }
    });

    const toCreate: Array<{
      isActive: boolean; createdBy: number; updatedBy: number;
      rateSectionId: number; wardId: number;
    }> = [];

    const toUpdate: Array<{
      id: number;
      data: { isActive: boolean; updatedBy: number; rateSectionId: number; wardId: number }
    }> = [];

    wardNos.forEach(wardNo => {
      const wardId = wardNoToId[wardNo];
      if (!wardId) return;

      const existing = wardToAssignment[wardNo];
      if (existing) {
        // Update existing record (even if it belonged to another rate section)
        toUpdate.push({
          id: existing.id,
          data: {
            isActive: true,
            updatedBy: userId,
            rateSectionId,
            wardId
          }
        });
      } else {
        // Truly new assignment
        toCreate.push({
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
          rateSectionId,
          wardId
        });
      }
    });

    if (toCreate.length === 0 && toUpdate.length === 0) {
      return { success: false, error: "No valid wards to link", statusCode: 400 };
    }

    let successCount = 0;
    let failedCount = 0;
    let hasFailures = false;

    // 1. Handle New Assignments (POST)
    if (toCreate.length > 0) {
      const createRes = await bulkCreateRateSectionDetails(toCreate);
      successCount += createRes.items?.successCount || 0;
      failedCount += createRes.items?.failedCount || 0;
      if (createRes.items?.hasFailures) hasFailures = true;
      if (!createRes.success && toUpdate.length === 0) {
        return { success: false, error: createRes.message || "Bulk create failed", statusCode: 500 };
      }
    }

    // 2. Handle Existing Assignments (PUT)
    if (toUpdate.length > 0) {
      const updateRes = await bulkUpdateRateSectionDetails(toUpdate);
      successCount += updateRes.items?.successCount || 0;
      failedCount += updateRes.items?.failedCount || 0;
      if (updateRes.items?.hasFailures) hasFailures = true;
      if (!updateRes.success && toCreate.length === 0) {
        return { success: false, error: updateRes.message || "Bulk update failed", statusCode: 500 };
      }
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return {
      success: true,
      data: {
        successCount,
        failedCount,
        hasFailures
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to link wards";
    return { success: false, error: errorMsg, statusCode: 500 };
  }
}

/**
 * Fetches wards assigned to a specific rate section with count.
 * Used for SSR in the "Wards in Rate Section" panel of AddWard drawer.
 * API: GET /api/RateSectionDetails?RateSectionId={id}&PageSize=-1
 * Returns only wardNo array and count - no IDs exposed to client.
 */
export async function getSelectedWardsWithCountAction(rateSectionId: number): Promise<{
  success: boolean;
  wardNos: string[];
  totalCount: number;
  error?: string;
}> {
  try {
    if (!rateSectionId) {
      return { success: false, wardNos: [], totalCount: 0, error: "Rate section ID is required" };
    }

    // Use getWardsByRateSectionId which fetches all wards with PageSize=-1
    const items = await getWardsByRateSectionId(rateSectionId);

    // Extract only wardNo values - don't expose IDs to client
    const wardNos = items
      .map((item: SectionItem) => item.wardNo || (item as SectionItem & { WardNo?: string }).WardNo || "")
      .filter(Boolean);

    return {
      success: true,
      wardNos,
      totalCount: wardNos.length
    };
  } catch (_error) {
    return { success: false, wardNos: [], totalCount: 0, error: "Failed to fetch selected wards" };
  }
}

/**
 * Refreshes selected wards for a rate section.
 * Used after batch operations to get the updated list.
 * API: GET /api/RateSectionDetails?RateSectionId={id}&PageSize=-1
 * Returns minimal data to client - only wardNo array and count.
 */
export async function refreshSelectedWardsAction(rateSectionId: number): Promise<{
  success: boolean;
  wardNos: string[];
  totalCount: number;
  error?: string;
}> {
  try {
    if (!rateSectionId) {
      return { success: false, wardNos: [], totalCount: 0, error: "Rate section ID is required" };
    }

    // Use getWardsByRateSectionId which fetches all wards with PageSize=-1
    const items = await getWardsByRateSectionId(rateSectionId);

    // Extract only wardNo values - don't expose IDs to client
    const wardNos = items
      .map((item: SectionItem) => item.wardNo || (item as SectionItem & { WardNo?: string }).WardNo || "")
      .filter(Boolean);

    return {
      success: true,
      wardNos,
      totalCount: wardNos.length
    };
  } catch (_error) {
    return { success: false, wardNos: [], totalCount: 0, error: "Failed to fetch selected wards" };
  }
}

/**
 * Deletes selected wards from a rate section by their ward numbers using bulk purge delete API.
 * Looks up IDs server-side to avoid exposing IDs to client.
 * API: DELETE /api/RateSectionDetails/Bulk/purge
 */
export async function deleteSelectedWardsAction(rateSectionId: number, wardNos: string[]): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    if (!rateSectionId || wardNos.length === 0) {
      return { success: false, deletedCount: 0, error: "Invalid parameters" };
    }

    // Fetch all assigned wards for this rate section using proper pagination
    // (PageSize=-1 is NOT supported by /RateSectionDetails)
    const allItems = await getWardsByRateSectionId(rateSectionId);

    // Build wardNo to id map
    const wardNoToId: Record<string, number> = {};

    allItems.forEach((item: SectionItem) => {
      const itemRecord = item as Record<string, unknown>;
      const wNo = (item.wardNo || itemRecord.WardNo) as string | undefined;
      const id = item.id;
      if (wNo && id) {
        wardNoToId[wNo] = id;
      }
    });

    // Get IDs to delete
    const idsToDelete = wardNos
      .map(wardNo => wardNoToId[wardNo])
      .filter((id): id is number => id !== undefined);

    if (idsToDelete.length === 0) {
      return { success: false, deletedCount: 0, error: "No matching wards found" };
    }

    // Call bulk purge delete API
    const deleteResponse = await bulkPurgeRateSectionDetails(idsToDelete);

    if (!deleteResponse.success) {
      return { success: false, deletedCount: 0, error: deleteResponse.message || "Delete failed" };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return {
      success: true,
      deletedCount: deleteResponse.items?.successCount || idsToDelete.length
    };
  } catch (_error) {
    return { success: false, deletedCount: 0, error: "Failed to delete wards" };
  }
}

/* ================================================================== */
/* WARD-SPECIFIC ACTIONS (Rate Section Details CRUD)                 */
/* ================================================================== */

/**
 * Fetches a single ward by its ID from Ward Master.
 * Used in SSR for displaying ward details in edit pages.
 * @param wardId - Numeric or string ward ID
 * @returns Ward item with full details or error
 */
export async function getWardByIdAction(
  wardId: number | string
): Promise<ActionResult<WardItem>> {
  try {
    const numericWardId = typeof wardId === "string" ? parseInt(wardId, 10) : wardId;
    if (!Number.isFinite(numericWardId) || numericWardId <= 0) {
      return { success: false, message: "Valid Ward ID is required", statusCode: 400 };
    }

    const data = await getWardById(numericWardId);

    if (!data) {
      return { success: false, message: "Ward not found" };
    }

    return { success: true, data };
  } catch (_error) {
    return { success: false, message: "Failed to fetch ward" };
  }
}

/**
 * Updates a ward in the Ward master.
 * Used when editing ward properties like wardNo, description, isActive.
 * API: PUT /api/Ward/{id}
 * @param wardId - The numeric ward ID
 * @param data - Update payload with ward details
 * @returns Success status with updated ward data
 */
export async function updateWardMasterAction(
  wardId: number,
  data: {
    wardNo: string;
    zoneId: number;
    description: string;
    sequenceNo?: number | null;
    isActive: boolean;
  }
): Promise<ActionResult<WardItem>> {
  try {
    if (!Number.isFinite(wardId) || wardId <= 0) {
      return { success: false, message: "Valid Ward ID is required", statusCode: 400 };
    }

    const payload: UpdateWardPayload = {
      wardNo: data.wardNo,
      zoneId: data.zoneId,
      description: data.description,
      sequenceNo: typeof data.sequenceNo === "number" ? data.sequenceNo : undefined,
      isActive: data.isActive,
      updatedBy: 0, // Will be set by backend based on auth
    };

    const apiResponse = await updateWard(wardId, payload);

    if (!apiResponse || apiResponse.success === false) {
      const firstError = Array.isArray(apiResponse?.errors) ? apiResponse.errors[0] : apiResponse?.errors || "";
      const errorMessage = apiResponse?.message || firstError || "Failed to update ward";
      return { success: false, message: errorMessage };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return { success: true, data: apiResponse.items ?? undefined, message: "Ward updated successfully" };
  } catch (_error) {
    return { success: false, message: "Failed to update ward" };
  }
}

/**
 * Updates a rate section detail (ward assignment) by its ID.
 * Used when editing ward properties like status, wardNo, or description.
 * API: PUT /api/RateSectionDetails/{id}
 * @param id - Rate section detail ID
 * @param payload - Update payload with ward and rate section references
 * @returns Success status with optional data
 */
export async function updateRateSectionDetailAction(
  id: number,
  payload: RateSectionDetailPayload
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(id) || id <= 0) {
      return { success: false, message: "Valid Rate Section Detail ID is required", statusCode: 400 };
    }

    if (!Number.isFinite(payload.rateSectionId) || payload.rateSectionId <= 0) {
      return { success: false, message: "Valid Rate Section ID is required", statusCode: 400 };
    }

    if (!Number.isFinite(payload.wardId) || payload.wardId <= 0) {
      return { success: false, message: "Valid Ward ID is required", statusCode: 400 };
    }

    const response = await apiClient.put(`/RateSectionDetails/${id}`, payload);

    if (!response.success) {
      return { success: false, message: response.error || "Failed to update rate section detail" };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return { success: true, data: response.data, message: "Rate section detail updated successfully" };
  } catch (_error) {
    return { success: false, message: "Failed to update rate section detail" };
  }
}

/**
 * purge deletes a rate section detail (ward assignment) by its ID.
 * Permanently removes the ward from the rate section.
 * API: DELETE /api/RateSectionDetails/{id}/purge
 * @param rateSectionDetailId - Rate section detail ID to delete
 * @returns Success status with message
 */
export async function deleteRateSectionDetailAction(
  rateSectionDetailId: number
): Promise<ActionResult> {
  const id = rateSectionDetailId;

  if (!id || id <= 0) {
    return { success: false, message: "Valid Rate Section Detail ID is required", statusCode: 400 };
  }

  try {
    const response = await apiClient.delete(`/RateSectionDetails/${id}/purge`);

    if (!response.success) {
      return { success: false, message: response.error || "Failed to delete rate section detail" };
    }

    // Revalidate all locale variants
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/rate-section-master`, "page");
    }

    return { success: true, message: "Rate section detail deleted successfully" };
  } catch (_error) {
    return { success: false, message: "Failed to delete rate section detail" };
  }
}
