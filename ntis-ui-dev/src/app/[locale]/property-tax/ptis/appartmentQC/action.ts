"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { PropertyPhotoDto } from "@/types/photoplan.types";
import type { ApartmentQCDetail, ApartmentQCSearchParams } from "@/types/apartmentQC.types";
import {
  getApartmentQCDetailsLocalized,
  getApartmentQCDetailsSafe,
  updateApartmentQCDetailsLocalized,
  getFloorQCByPropertyIdLocalized,
  getFloorQCByPropertyIdSafe,
  updateFloorQCDetailLocalized,
  updateFloorQCDetailsBulkLocalized,
  updateBasicDetailsLocalized,
  getOldPropertyDataLocalized,
  syncRoomsForPropertyDetailsLocalized,
  getFilterOptionsLocalized,
  getApartmentPropertyTaxDetailsLocalized,
  getPartTypeFromMainTab,
  getApartmentPropertyTaxDetailsCvLocalized,
  getDualMethodTaxDetails,
  getApartmentPropertyTaxDetailsByIdLocalized,
  getApartmentPropertyTaxDetailsCvByIdLocalized,
  getDualMethodTaxDetailsById,
  getPropertyPhotosLocalized,
  getPropertyPhotosSafe, 
} from "@/lib/api/ptis/appartmentQC/appartmentQC.service";
import type { OldPropertyData } from "@/lib/api/ptis/appartmentQC/appartmentQC.service";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { getAppConfig } from "@/config/app.config";
import type {
  ApartmentTaxDetailsItems,
  ApartmentPartType,
  DualMethodTaxDetails,
} from "@/types/apartmentQC.types";
import { getUseTypesPagedServer } from "@/lib/api/typeofuse.service";
import { getConstructionPaged } from "@/lib/api/constructiontypemaster/construction-crud.service";
import { createRoomWiseMinusSafe, createRoomWiseSubmissionSafe, deleteRoomWiseMinusSafe, deleteRoomWiseSubmissionSafe, getRoomWiseSubmissionsSafe, updateRoomWiseMinusSafe, updateRoomWiseSubmissionSafe } from "@/lib/api/ptis/appartmentQC/appartmentQC-room.service";
import type { RoomWiseSubmissionData } from "@/lib/api/ptis/appartmentQC/appartmentQC-room.service";
import { getSubTypesPagedServer } from "@/lib/api/typeofusesubtype.service";
import { getPropertyTypesPaged } from "@/lib/api/property-type-crud.service";
import { getRoomTypeData } from "@/lib/api/ptis/floorSubmission";
import { getFloorPaged } from "@/lib/api/floor.service";

/* ============================================================
   ACTION RESULT TYPE
 ============================================================ */

export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/* ============================================================
   ERROR HELPERS
 ============================================================ */

/**
 * Convert translation keys or error messages to user-facing strings.
 * If the input looks like a translation key (e.g., "ptis.apartmentQC.errors.fetchFailed"),
 * convert it to a human-readable message as a fallback.
 * Backend error messages (e.g., "Rate not found for...") are returned as-is.
 */
function toUserFacingErrorMessage(messageOrKey: string): string {
  const value = messageOrKey.trim();
  if (!value) {
    return "An unexpected error occurred.";
  }

  // Check if it looks like a translation key (dotted notation with only lowercase/numbers)
  const looksLikeTranslationKey = /^[a-z0-9]+(?:\.[a-z0-9]+)+$/i.test(value);

  if (!looksLikeTranslationKey) {
    // Already a plain message (including backend error messages), return as-is
    return value;
  }

  // Extract the last segment and convert camelCase/PascalCase to readable text
  const fallbackMessage = value
    .split(".")
    .pop()
    ?.replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!fallbackMessage) {
    return "An unexpected error occurred.";
  }

  // Capitalize first letter
  return fallbackMessage.charAt(0).toUpperCase() + fallbackMessage.slice(1);
}

function handleActionError(error: unknown, defaultKey: string): { success: false; error: string } {
  logger.error(`[appartmentQC.action] ${defaultKey}`, { error: error as Error });
  if (error instanceof ApiError) {
    return {
      success: false,
      error: toUserFacingErrorMessage(error.error || error.contextMessage || defaultKey),
    };
  }
  return { success: false, error: toUserFacingErrorMessage(defaultKey) };
}

/* ============================================================
   SEARCH / FETCH ACTIONS
 ============================================================ */

/**
 * Fetch apartment QC detail records for the given search parameters.
 */
export async function fetchApartmentQCDetailsAction(
  params: ApartmentQCSearchParams
): Promise<ActionResult<ApartmentQCDetail[]>> {
  try {
    const data = await getApartmentQCDetailsLocalized(params);
    // data.items is PagedResponse<ApartmentQCDetail>; extract the flat items array
    return {
      success: true,
      data: data.items?.items ?? [],
      message: data.message,
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment QC details");
  }
}

/**
 * Fetch apartment QC detail records with full pagination response metadata.
 */
export async function fetchApartmentQCDetailsPagedAction(
  params: ApartmentQCSearchParams
): Promise<ActionResult<{
  items: ApartmentQCDetail[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}>> {
  try {
    const data = await getApartmentQCDetailsLocalized(params);
    // data.items is PagedResponse<ApartmentQCDetail> (the nested object from the API)
    const pagedItems = data.items;
    return {
      success: true,
      data: {
        items: pagedItems?.items ?? [],
        totalCount: pagedItems?.totalCount ?? pagedItems?.items?.length ?? 0,
        totalPages: pagedItems?.totalPages ?? 1,
        pageNumber: pagedItems?.pageNumber ?? 1,
        pageSize: pagedItems?.pageSize ?? (pagedItems?.items?.length || 10),
        hasNext: !!pagedItems?.hasNext,
        hasPrevious: !!pagedItems?.hasPrevious,
      },
      message: data.message,
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment QC details with pagination");
  }
}

/**
 * Safe variant — always resolves; returns an empty array on API failure.
 */
export async function fetchApartmentQCDetailsSafeAction(
  params: ApartmentQCSearchParams
): Promise<ApartmentQCDetail[]> {
  try {
    return await getApartmentQCDetailsSafe(params);
  } catch {
    return [];
  }
}

/**
 * Update apartment QC property details.
 */
export async function updateApartmentQCAction(
  propertyDetailsId: number | string,
  payload: Partial<ApartmentQCDetail>
): Promise<ActionResult<ApartmentQCDetail>> {
  try {
    const data = await updateApartmentQCDetailsLocalized(propertyDetailsId, payload);
    // Revalidate for all locales by using the base path pattern
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return {
      success: true,
      data,
      message: "Apartment QC details updated successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to update apartment QC details");
  }
}

/**
 * Fetch details by WardId only.
 */
export async function fetchApartmentQCByWardAction(
  wardId: number | string
): Promise<ActionResult<ApartmentQCDetail[]>> {
  return fetchApartmentQCDetailsAction({ wardId });
}

/**
 * Fetch details by WardId + PropertyNo.
 */
export async function fetchApartmentQCByPropertyAction(
  wardId: number | string,
  propertyNo: number | string,
  partitionNo?: string
): Promise<ActionResult<ApartmentQCDetail[]>> {
  return fetchApartmentQCDetailsAction({ wardId, propertyNo: String(propertyNo), partitionNo });
}

/* ============================================================
   REVALIDATION HELPER
 ============================================================ */

export async function revalidateApartmentQCAction(): Promise<ActionResult> {
  try {
    // Revalidate for all locales by using the base path pattern
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return { success: true, message: "Apartment QC data refreshed" };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to refresh apartment QC data");
  }
}

/* ============================================================
   FLOOR QC DROPDOWN DATA ACTIONS
 ============================================================ */

/**
 * Fetch all floors for Floor QC dropdown (paginated fetch all pages)
 */
export async function fetchAllFloorsAction(): Promise<ActionResult<Array<{ value: string; label: string }>>> {
  try {
    const res = await getFloorPaged(1, -1);
    const items = res.items ?? [];
    const all = items.map((f: { id: number | string; description?: string; floorCode?: string }) => ({
      value: String(f.id),
      label: f.description || f.floorCode || ''
    }));
    return { success: true, data: all };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch floors");
  }
}

/**
 * Fetch all construction types for Floor QC dropdown (paginated fetch all pages)
 */
export async function fetchAllConstructionTypesAction(): Promise<ActionResult<Array<{ value: string; label: string }>>> {
  try {
    const res = await getConstructionPaged(1, -1);
    const items = res.items ?? [];
    const all = items.map((c: { id: number | string; description?: string; constructionCode?: string }) => ({
      value: String(c.id),
      label: c.description || c.constructionCode || ''
    }));
    return { success: true, data: all };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch construction types");
  }
}

/**
 * Fetch all use types for Floor QC dropdown (paginated fetch all pages)
 */
export async function fetchAllUseTypesAction(): Promise<ActionResult<Array<{ value: string; label: string }>>> {
  try {
    const res = await getUseTypesPagedServer({ pageNumber: 1, pageSize: -1 });
    const items = res.items ?? [];
    const all = items.map(u => ({
      value: String(u.typeOfUseId),
      label: u.description || u.typeOfUseCode || ''
    }));
    return { success: true, data: all };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch use types");
  }
}

/**
 * Fetch all sub-types for Floor QC dropdown (paginated fetch all pages)
 */
export async function fetchAllSubTypesAction(): Promise<ActionResult<Array<{ value: string; label: string; typeOfUseId: string }>>> {
  try {
    const res = await getSubTypesPagedServer({ pageNumber: 1, pageSize: -1 });
    const items = res.items ?? [];
    const all = items.map(s => ({
      value: String(s.subTypeOfUseId),
      label: s.description || '',
      typeOfUseId: String(s.typeOfUseId)
    }));
    return { success: true, data: all };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch sub-types");
  }
}

/* ============================================================
   FLOOR QC DATA ACTIONS
   New API endpoint: GET /Property/apartmentQC-details/{propertyId}?type={type}
   Fetches all floor records for a property filtered by type
 ============================================================ */

/**
 * Fetch Floor QC data by propertyId and type.
 * Uses the new endpoint: /Property/apartmentQC-details/{propertyId}?type={type}
 * Returns all floor records for the property.
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param type - The type filter: 'rateable', 'capital', or 'dual'
 * @returns ActionResult with array of ApartmentQCDetail items (floor records)
 */
export async function fetchFloorQCByPropertyIdAction(
  propertyId: number | string,
  type: 'rateable' | 'capital' | 'dual' | string
): Promise<ActionResult<ApartmentQCDetail[]>> {
  try {
    const data = await getFloorQCByPropertyIdLocalized(propertyId, type);
    // data.items is PagedResponse<ApartmentQCDetail>; extract the flat items array
    return {
      success: true,
      data: data.items?.items ?? [],
      message: data.message,
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch floor QC details");
  }
}

/**
 * Safe variant of fetchFloorQCByPropertyIdAction — always resolves with an array.
 * Returns empty array on failure instead of throwing an error.
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param type - The type filter: 'rateable', 'capital', or 'dual'
 * @returns Array of ApartmentQCDetail items (floor records)
 */
export async function fetchFloorQCByPropertyIdSafeAction(
  propertyId: number | string,
  type: 'rateable' | 'capital' | 'dual' | string
): Promise<ApartmentQCDetail[]> {
  try {
    return await getFloorQCByPropertyIdSafe(propertyId, type);
  } catch {
    return [];
  }
}

/* ============================================================
   FLOOR QC UPDATE ACTION
   Endpoint: PATCH /Property/apartmentQC-details/{propertyId}/detail/{detailId}
   Updates a specific floor detail record
 ============================================================ */

/**
 * Payload for updating a floor QC detail record
 */
export interface FloorQCUpdatePayload {
  floorId?: number;
  constructionTypeId?: number;
  typeOfUseId?: number;
  subTypeOfUseId?: number;
  updatedBy?: number;
  constructionYear?: string;
  assessmentYear?: string;
}

/**
 * Update a Floor QC detail record by propertyId and detailId.
 * Uses the PATCH endpoint: /Property/apartmentQC-details/{propertyId}/detail/{detailId}
 * 
 * @param propertyId - The property ID (e.g., 550299)
 * @param detailId - The detail ID / pdnId (e.g., 206147)
 * @param payload - The fields to update
 * @returns ActionResult indicating success or failure
 */
export async function updateFloorQCDetailAction(
  propertyId: number | string,
  detailId: number | string,
  payload: FloorQCUpdatePayload
): Promise<ActionResult> {
  try {
    await updateFloorQCDetailLocalized(propertyId, detailId, payload);
    // Revalidate the apartment QC pages to reflect changes
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return {
      success: true,
      message: "Floor QC detail updated successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to update floor QC detail");
  }
}

/* ============================================================
   FLOOR QC BULK UPDATE ACTION
   Endpoint: PATCH /Property/apartmentQC-details/{propertyId}/details
   Updates multiple floor detail records at once
 ============================================================ */

/**
 * Payload item for bulk updating floor QC detail records
 */
export interface FloorQCBulkUpdateItem extends FloorQCUpdatePayload {
  detailId: number; // The pdnId of the floor detail to update
}

/**
 * Bulk update Floor QC detail records by propertyId.
 * Uses the PATCH endpoint: /Property/apartmentQC-details/{propertyId}/details
 * 
 * @param propertyId - The property ID (e.g., 550299)
 * @param items - Array of floor detail updates with detailId for each
 * @returns ActionResult indicating success or failure
 */
export async function updateFloorQCDetailsBulkAction(
  propertyId: number | string,
  items: FloorQCBulkUpdateItem[]
): Promise<ActionResult> {
  try {
    await updateFloorQCDetailsBulkLocalized(propertyId, items);
    // Revalidate the apartment QC pages to reflect changes
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return {
      success: true,
      message: "Floor QC details updated successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to update floor QC details");
  }
}

/* ============================================================
   BASIC DETAILS UPDATE ACTION
   Endpoint: PATCH /Property/apartmentQC-details/{propertyId}/basic-details
   Updates the basic information of a property
 ============================================================ */

/**
 * Payload for updating basic details of a property
 */
export interface BasicDetailsUpdatePayload {
  ownerName?: string;
  occupierName?: string;
  renterName?: string;
  propertyType?: number;
  bhk?: string;
  mobileNo?: string;
  emailId?: string;
  wing?: string;
  flatOrShopNo?: string;
  flatOrShopName?: string;
  oldPropertyNo?: string;
  updatedBy?: number;
}

/**
 * Update basic details of a property by propertyId.
 * Uses the PATCH endpoint: /Property/apartmentQC-details/{propertyId}/basic-details
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param payload - The fields to update
 * @returns ActionResult indicating success or failure
 */
export async function updateBasicDetailsAction(
  propertyId: number | string,
  payload: BasicDetailsUpdatePayload
): Promise<ActionResult> {
  try {
    await updateBasicDetailsLocalized(propertyId, payload);
    // Revalidate the apartment QC pages to reflect changes
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return {
      success: true,
      message: "Basic details updated successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to update basic details");
  }
}

/**
 * Fetch all property types for dropdown
 */
export async function fetchAllPropertyTypesAction(): Promise<ActionResult<Array<{ value: string; label: string }>>> {
  try {
    const pageSize = 1000;
    let page = 1;
    let all: Array<{ value: string; label: string }> = [];
    let hasMore = true;

    while (hasMore) {
      const res = await getPropertyTypesPaged(page, pageSize);
      const items = res.items ?? [];
      all = [...all, ...items.map((pt) => ({
        value: String(pt.id),
        label: pt.propertyDescription || pt.type
      }))];
      if (items.length === 0 || all.length >= res.totalCount) hasMore = false;
      else page++;
    }

    return { success: true, data: all };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch property types");
  }
}

/* ============================================================
   ROOM WISE SUBMISSION CRUD ACTIONS
   API: /api/RoomWiseSubmission
============================================================ */

/**
 * Fetch room types with IDs for dropdown mapping
 */
export async function fetchRoomTypesAction(): Promise<ActionResult<Array<{ id: number; code: string; name: string; description: string }>>> {
  try {
    const data = await getRoomTypeData();
    return {
      success: true,
      data: data.map((item: { roomTypeId?: number; id?: number; roomTypeCode?: string; roomTypeName?: string; description?: string }) => ({
        id: item.roomTypeId || item.id || 0,
        code: item.roomTypeCode || String(item.roomTypeId || item.id || 0),
        name: item.roomTypeName || '',
        description: item.description || ''
      }))
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch room types");
  }
}

/**
 * Fetch room wise submissions by propertyId and propertyDetailsId (pdnId)
 */
export async function fetchRoomWiseSubmissionsAction(params: {
  propertyId?: number;
  propertyDetailsId?: number;
}): Promise<ActionResult<unknown[]>> {
  try {
    const data = await getRoomWiseSubmissionsSafe(params);
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch room submissions");
  }
}

/**
 * Fetch room wise submissions with typed result (alternative to fetchRoomWiseSubmissionsAction)
 * This version returns RoomWiseSubmissionData[] for better type safety
 */
export async function getRoomWiseSubmissionsAction(params: {
  propertyId: number;
  propertyDetailsId: number;
}): Promise<{ success: boolean; data?: RoomWiseSubmissionData[]; error?: string }> {
  try {
    const data = await getRoomWiseSubmissionsSafe({
      propertyId: params.propertyId,
      propertyDetailsId: params.propertyDetailsId,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('[getRoomWiseSubmissionsAction] Error', { error: error as Error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch room submissions',
    };
  }
}

/**
 * Create a new room wise submission
 */
export async function createRoomWiseSubmissionAction(payload: {
  propertyDetailsId: number;
  propertyId: number;
  lengthMtr?: number;
  widthMtr?: number;
  heightMtr?: number;
  areaSqMtr?: number;
  noOfRooms?: number;
  totalAreaSqMtr?: number;
  roomNo?: string;
  roomType?: string;
  roomTypeId?: number;  // API expects numeric ID
  shape?: string;
  outerYesNo?: boolean;
  minusYesNo?: boolean;
  submissionType?: string;
  base1Mtr?: number;
  base2Mtr?: number;
  roomWiseMinusData?: Array<{
    id?: number;
    roomWiseSubmissionId?: number;
    lengthMtr?: number;
    widthMtr?: number;
    heightMtr?: number;
    areaSqMtr?: number;
    shape?: string;
    base1Mtr?: number;
    base2Mtr?: number;
    operation?: string;
    remark?: string;
  }>;
}): Promise<ActionResult<unknown>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
    const resolveIsOffset = (offset: { isOffset?: boolean; operation?: string }) =>
      offset.isOffset !== undefined
        ? offset.isOffset
        : String(offset.operation || '').toLowerCase() === 'add';

    const result = await createRoomWiseSubmissionSafe({
      isActive: true,
      createdBy: userId,
      ...payload,
      roomWiseMinusData: payload.roomWiseMinusData?.map(offset => ({
        isActive: true,
        createdBy: userId,
        isOffset: resolveIsOffset(offset),
        ...offset
      }))
    });
    if (!result.success) {
      return { success: false, error: result.error || "Failed to create room" };
    }
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return { success: true, data: result.data, message: "Room created successfully" };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to create room");
  }
}

/**
 * Update an existing room wise submission with offsets
 */
export async function updateRoomWithOffsetsAction(
  id: number,
  payload: {
    propertyDetailsId?: number;
    propertyId?: number;
    lengthMtr?: number;
    widthMtr?: number;
    heightMtr?: number;
    areaSqMtr?: number;
    noOfRooms?: number;
    totalAreaSqMtr?: number;
    roomNo?: string;
    roomType?: string;
    roomTypeId?: number;  // API expects numeric ID
    shape?: string;
    outerYesNo?: boolean;
    minusYesNo?: boolean;
    submissionType?: string;
    base1Mtr?: number;
    base2Mtr?: number;
    roomWiseMinusData?: Array<{
      id?: number;
      roomWiseSubmissionId?: number;
      lengthMtr?: number;
      widthMtr?: number;
      heightMtr?: number;
      areaSqMtr?: number;
      shape?: string;
      base1Mtr?: number;
      base2Mtr?: number;
      operation?: string;
      remark?: string;
    }>;
  }
): Promise<ActionResult<unknown>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore) || 1;
   
    // Update main room (without roomWiseMinusData since we handle offsets separately)
    const { roomWiseMinusData, ...roomPayload } = payload;
    const roomResult = await updateRoomWiseSubmissionSafe(id, {
      isActive: true,
      updatedBy: userId,
      id,
      ...roomPayload,
      minusYesNo: payload.minusYesNo,
    });

    if (!roomResult.success) {
      return { success: false, error: roomResult.error || "Failed to update room" };
    }

    // Process offsets (create new or update existing)
    const processedOffsets = await Promise.all(
      (roomWiseMinusData || []).map(async (offset) => {
        const isExisting = offset.id !== undefined && offset.id !== null && offset.id > 0;

        const resolveIsOffset = (offset: { isOffset?: boolean; operation?: string }) =>
          offset.isOffset !== undefined
            ? offset.isOffset
            : String(offset.operation || '').toLowerCase() === 'add';

        if (isExisting) {
          // Update existing offset
          const offsetId = offset.id as number;
          const updateResult = await updateRoomWiseMinusSafe(offsetId, {
            ...offset,
            isActive: true,
            updatedBy: userId,
            id: offsetId,
            isOffset: resolveIsOffset(offset),
          });
          if (!updateResult.success) {
            console.error('Failed to update offset:', updateResult.error);
            return offset;
          }
          return { ...offset, ...updateResult.data };
        } else {
          // Create new offset
          const createResult = await createRoomWiseMinusSafe({
            ...offset,
            isActive: true,
            createdBy: userId,
            roomWiseSubmissionId: id,
            isOffset: resolveIsOffset(offset),
          });
          if (!createResult.success) {
            console.error('Failed to create offset:', createResult.error);
            return offset;
          }
          return { ...offset, id: createResult.data?.id };
        }
      })
    );

    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");

    return {
      success: true,
      data: { ...roomResult.data, roomWiseMinusData: processedOffsets },
      message: "Room updated successfully"
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to update room");
  }
}

/**
 * Update an existing room wise submission
 */
export async function updateRoomWiseSubmissionAction(
  id: number,
  payload: {
    propertyDetailsId?: number;
    propertyId?: number;
    lengthMtr?: number;
    widthMtr?: number;
    heightMtr?: number;
    areaSqMtr?: number;
    noOfRooms?: number;
    totalAreaSqMtr?: number;
    roomNo?: string;
    roomType?: string;
    roomTypeId?: number;  // API expects numeric ID
    shape?: string;
    outerYesNo?: boolean;
    minusYesNo?: boolean;
    submissionType?: string;
    base1Mtr?: number;
    base2Mtr?: number;
    roomWiseMinusData?: Array<{
      id?: number;
      roomWiseSubmissionId?: number;
      lengthMtr?: number;
      widthMtr?: number;
      heightMtr?: number;
      areaSqMtr?: number;
      shape?: string;
      base1Mtr?: number;
      base2Mtr?: number;
      operation?: string;
      remark?: string;
    }>;
  }
): Promise<ActionResult<unknown>> {
  // Use the new action that handles offsets properly
  return updateRoomWithOffsetsAction(id, payload);
}

/**
 * Delete a room wise submission
 */
export async function deleteRoomWiseSubmissionAction(id: number): Promise<ActionResult<void>> {
  try {
    const result = await deleteRoomWiseSubmissionSafe(id);
    if (!result.success) {
      return { success: false, error: result.error || "Failed to delete room" };
    }
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return { success: true, data: undefined, message: "Room deleted successfully" };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to delete room");
  }
}

/**
 * Delete a room wise minus (offset)
 */
export async function deleteRoomWiseMinusAction(id: number): Promise<ActionResult<void>> {
  try {
    const result = await deleteRoomWiseMinusSafe(id);
    if (!result.success) {
      return { success: false, error: result.error || "Failed to delete offset" };
    }
    revalidatePath("/[locale]/property-tax/ptis/appartmentQC", "page");
    return { success: true, data: undefined, message: "Offset deleted successfully" };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to delete offset");
  }
}

/**
 * Create a new room wise minus (offset)
 */
export async function createRoomWiseMinusAction(payload: {
  isActive: boolean;
  createdBy: number;
  roomWiseSubmissionId: number;
  lengthMtr?: number;
  widthMtr?: number;
  heightMtr?: number;
  areaSqMtr?: number;
  shape?: string;
  operation?: string;
  remark?: string;
  base1Mtr?: number;
  base2Mtr?: number;
  isOffset?: boolean;
}): Promise<ActionResult<{ id: number }>> {
  try {
    const result = await createRoomWiseMinusSafe({
      ...payload,
      isOffset: payload.isOffset !== undefined
        ? payload.isOffset
        : String(payload.operation || '').toLowerCase() === 'add',
    });
    if (!result.success) {
      return { success: false, error: result.error || "Failed to create offset" };
    }
    return { success: true, data: { id: result.data?.id || 0 }, message: "Offset created successfully" };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to create offset");
  }
}

/**
 * Delete room submission without redirect (for hook compatibility)
 */
export async function deleteRoomSubmissionNoRedirectAction(roomId: number | string): Promise<ActionResult<void>> {
  try {
    const result = await deleteRoomWiseSubmissionSafe(Number(roomId));
    if (!result.success) {
      return { success: false, error: result.error || "Failed to delete room" };
    }
    return { success: true, data: undefined };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete room" };
  }
}

/**
 * Delete offset submission without redirect (for hook compatibility)
 */
export async function deleteOffsetSubmissionNoRedirectAction(offsetId: number | string): Promise<ActionResult<void>> {
  try {
    const result = await deleteRoomWiseMinusSafe(Number(offsetId));
    if (!result.success) {
      return { success: false, error: result.error || "Failed to delete offset" };
    }
    return { success: true, data: undefined };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete offset" };
  }
}

/* ============================================================
   OLD PROPERTY DATA ACTION
   Fetches historical data for an old property number
 ============================================================ */

/**
 * Fetch old property data by old property number.
 * 
 * @param oldPropertyNo - The old property number (e.g., "22")
 * @returns ActionResult with old property data
 */
export async function fetchOldPropertyDataAction(
  oldPropertyNo: string
): Promise<ActionResult<OldPropertyData>> {
  try {
    if (!oldPropertyNo || oldPropertyNo.trim() === "") {
      return { success: false, error: "Old property number is required" };
    }

    const data = await getOldPropertyDataLocalized(oldPropertyNo.trim());

    return {
      success: true,
      data,
      message: "Old property data fetched successfully"
    };
  } catch (error) {
    return handleActionError(error, "ptis.apartmentQC.errors.fetchOldPropertyFailed");
  }
}

/* ============================================================
   SYNC ROOMS ACTION
   Fires POST /ApartmentQC/{propertyId}/{propertyDetailsId}/sync-rooms after a
   successful RoomWiseSubmission PUT to recompute aggregates.
 ============================================================ */

export async function syncRoomsForPropertyDetailsAction(
  propertyId: number | string,
  propertyDetailsId: number | string
): Promise<ActionResult<void>> {
  try {
    await syncRoomsForPropertyDetailsLocalized(propertyId, propertyDetailsId);
    return { success: true, message: "Rooms synced successfully" };
  } catch (error) {
    return handleActionError(error, "Failed to sync rooms");
  }
}

/* ============================================================
   FILTER OPTIONS ACTION
   Fetches distinct filter options for column filters.
 ============================================================ */

export type FilterField = 'wing' | 'flatOrShopNo' | 'apartmentType' | 'propertyType';

export interface FilterOptionsItems {
  wings: string[];
  apartmentTypes: string[];
  flatOrShopNos: string[];
  propertyTypes: number[];
}

export async function fetchFilterOptionsAction(
  wardId: number | string,
  propertyNo: string,
  field: FilterField,
  partType?: string
): Promise<ActionResult<FilterOptionsItems>> {
  try {
    const result = await getFilterOptionsLocalized(wardId, propertyNo, field, partType);
    return { success: true, data: result.items, message: result.message };
  } catch (error) {
    return handleActionError(error, "Failed to fetch filter options");
  }
}

/* ============================================================
   EXCEL EXPORT ACTION
   Returns config for client-side Excel download.
   Endpoint: GET /ApartmentQC/export-excel?WardId={wardId}&PropertyNo={propertyNo}
 ============================================================ */

export interface ExcelExportConfig {
  baseUrl: string;
  authToken: string;
}

/**
 * Get the API configuration for client-side Excel export.
 * This action returns the base URL and auth token so the client can
 * directly download the Excel file via fetch.
 * 
 * @returns ActionResult with baseUrl and authToken
 */
export async function getExcelExportConfigAction(): Promise<ActionResult<ExcelExportConfig>> {
  try {
    const store = await cookies();
    const authToken = store.get('auth_token')?.value || '';
    const config = getAppConfig();

    return {
      success: true,
      data: {
        baseUrl: config.api.baseUrl,
        authToken,
      },
    };
  } catch (error) {
    return handleActionError(error, "Failed to get export configuration");
  }
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS ACTION
   Endpoint: GET /Property/apartment-property-tax-details-rv
   Fetches tax details for apartment properties by PartType
 ============================================================ */



/**
 * Fetch apartment property tax details for a specific PartType.
 * 
 * @param wardId - The ward ID
 * @param propertyNo - The property number
 * @param partType - The part type: 'Aminity' (Amenities), 'C' (Commercial), 'R' (Residential)
 * @returns ActionResult with tax details
 */
export async function fetchApartmentPropertyTaxDetailsAction(
  wardId: string | number,
  propertyNo: string,
  partType: ApartmentPartType
): Promise<ActionResult<ApartmentTaxDetailsItems>> {
  try {
    const data = await getApartmentPropertyTaxDetailsLocalized({ wardId, propertyNo, partType });
    return {
      success: true,
      data,
      message: "Tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment property tax details");
  }
}

/**
 * Fetch apartment property tax details based on the selected main tab.
 * Converts main tab value to PartType and fetches the data.
 * 
 * @param wardId - The ward ID
 * @param propertyNo - The property number
 * @param mainTab - The main tab: 'amenities', 'commercial', or 'residential'
 * @returns ActionResult with tax details for the selected tab
 */
export async function fetchApartmentPropertyTaxDetailsByTabAction(
  wardId: string | number,
  propertyNo: string,
  mainTab: string,
  partitionNo?: string
): Promise<ActionResult<ApartmentTaxDetailsItems>> {
  try {
    const partType = getPartTypeFromMainTab(mainTab);
    const data = await getApartmentPropertyTaxDetailsLocalized({ wardId, propertyNo, partType, partitionNo });
    return {
      success: true,
      data,
      message: "Tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment property tax details");
  }
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS - CAPITAL VALUE (CV)
   Endpoint: GET /Property/apartment-property-tax-details-cv
   Fetches capital value tax details for apartment properties
 ============================================================ */

/**
 * Fetch apartment property Capital Value (CV) tax details based on the selected main tab.
 * 
 * @param wardId - The ward ID
 * @param propertyNo - The property number
 * @param mainTab - The main tab: 'amenities', 'commercial', or 'residential'
 * @returns ActionResult with CV tax details for the selected tab
 */
export async function fetchApartmentPropertyTaxDetailsCvByTabAction(
  wardId: string | number,
  propertyNo: string,
  mainTab: string,
  partitionNo?: string
): Promise<ActionResult<ApartmentTaxDetailsItems>> {
  try {
    const partType = getPartTypeFromMainTab(mainTab);
    const data = await getApartmentPropertyTaxDetailsCvLocalized({ wardId, propertyNo, partType, partitionNo });
    return {
      success: true,
      data,
      message: "CV tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment property CV tax details");
  }
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS - DUAL METHOD
   Fetches both RV and CV tax details for dual method display
 ============================================================ */

/**
 * Fetch both Rateable Value and Capital Value tax details for dual method display.
 * 
 * @param wardId - The ward ID
 * @param propertyNo - The property number
 * @param mainTab - The main tab: 'amenities', 'commercial', or 'residential'
 * @returns ActionResult with both RV and CV tax details
 */
export async function fetchDualMethodTaxDetailsByTabAction(
  wardId: string | number,
  propertyNo: string,
  mainTab: string,
  partitionNo?: string
): Promise<ActionResult<DualMethodTaxDetails>> {
  try {
    const partType = getPartTypeFromMainTab(mainTab);
    const data = await getDualMethodTaxDetails(wardId, propertyNo, partType, partitionNo);
    return {
      success: true,
      data,
      message: "Dual method tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch dual method tax details");
  }
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS BY PROPERTY ID
   These actions use propertyId instead of WardId/PropertyNo
   Used by PropertyDetailsEditScreen drawer
 ============================================================ */

/**
 * Fetch apartment property Rateable Value (RV) tax details by property ID.
 * Used by PropertyDetailsEditScreen drawer.
 * 
 * @param propertyId - The property ID
 * @param mainTab - The main tab: 'amenities', 'commercial', or 'residential'
 * @returns ActionResult with RV tax details
 */
export async function fetchApartmentTaxDetailsByIdAction(
  propertyId: string | number,
  mainTab: string
): Promise<ActionResult<ApartmentTaxDetailsItems | null>> {
  try {
    const partType = getPartTypeFromMainTab(mainTab);
    const data = await getApartmentPropertyTaxDetailsByIdLocalized({ propertyId, partType });
    return {
      success: true,
      data,
      message: "Tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment property tax details");
  }
}

/**
 * Fetch apartment property Capital Value (CV) tax details by property ID.
 * Used by PropertyDetailsEditScreen drawer.
 * 
 * @param propertyId - The property ID
 * @param mainTab - The main tab: 'amenities', 'commercial', or 'residential'
 * @returns ActionResult with CV tax details
 */
export async function fetchApartmentTaxDetailsCvByIdAction(
  propertyId: string | number,
  mainTab: string
): Promise<ActionResult<ApartmentTaxDetailsItems | null>> {
  try {
    const partType = getPartTypeFromMainTab(mainTab);
    const data = await getApartmentPropertyTaxDetailsCvByIdLocalized({ propertyId, partType });
    return {
      success: true,
      data,
      message: "CV tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch apartment property CV tax details");
  }
}

/**
 * Fetch both Rateable Value and Capital Value tax details for dual method by property ID.
 * Used by PropertyDetailsEditScreen drawer.
 * 
 * @param propertyId - The property ID
 * @param mainTab - The main tab: 'amenities', 'commercial', or 'residential'
 * @returns ActionResult with both RV and CV tax details
 */
export async function fetchDualMethodTaxDetailsByIdAction(
  propertyId: string | number,
  mainTab: string
): Promise<ActionResult<DualMethodTaxDetails>> {
  try {
    const partType = getPartTypeFromMainTab(mainTab);
    const data = await getDualMethodTaxDetailsById(propertyId, partType);
    return {
      success: true,
      data,
      message: "Dual method tax details fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch dual method tax details");
  }
}

/* ============================================================
   PROPERTY PHOTOS ACTION
   Fetches all photos for a property by property ID
 ============================================================ */

/**
 * Fetch property photos by property ID.
 * 
 * @param propertyId - The property ID
 * @returns ActionResult with array of PropertyPhotoDto
 */
export async function fetchPropertyPhotosAction(
  propertyId: number
): Promise<ActionResult<PropertyPhotoDto[]>> {
  try {
    const data = await getPropertyPhotosLocalized(propertyId);
    return {
      success: true,
      data,
      message: "Property photos fetched successfully",
    };
  } catch (error: unknown) {
    return handleActionError(error, "Failed to fetch property photos");
  }
}

/**
 * Safe variant - Fetch property photos, returns empty array on failure.
 * 
 * @param propertyId - The property ID
 * @returns Array of PropertyPhotoDto
 */
export async function fetchPropertyPhotosSafeAction(
  propertyId: number
): Promise<PropertyPhotoDto[]> {
  try {
    return await getPropertyPhotosSafe(propertyId);
  } catch {
    return [];
  }
}

/* ============================================================
   EXCEL EXPORT ACTION
 ============================================================ */

/**
 * Server action to fetch the Excel export from the backend API.
 * Returns the file data as a Base64 string for the client to download.
 */
export async function exportExcelAction(
  wardId: string,
  propertyNo: string
): Promise<ActionResult<{ base64Data: string; filename: string }>> {
  try {
    if (!wardId || !propertyNo) {
      return { success: false, error: "Missing required parameters: WardId and PropertyNo" };
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return { success: false, error: "Unauthorized: No authentication token found" };
    }

    const config = getAppConfig();
    const params = new URLSearchParams();
    params.append('WardId', wardId);
    params.append('PropertyNo', propertyNo);
    const backendUrl = `${config.api.baseUrl}/ApartmentQC/export-excel?${params.toString()}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      logger.error('[exportExcelAction] Backend API error', {
        status: response.status,
        statusText: response.statusText
      });
      return { success: false, error: `Backend API error: ${response.statusText}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // Extract filename from content-disposition header if present, or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `apartment-qc-${propertyNo}.xlsx`;
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    return {
      success: true,
      data: {
        base64Data,
        filename
      }
    };
  } catch (error: unknown) {
    logger.error('[exportExcelAction] Unexpected error', { error: error instanceof Error ? error : new Error(String(error)) });
    return handleActionError(error, "Failed to export Excel file");
  }
}
