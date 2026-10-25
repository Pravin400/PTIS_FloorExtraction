"use server";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { revalidatePath } from "next/cache";

import { getFloorQCByPropertyIdSafe, syncRoomsForPropertyDetailsLocalized, updateFloorQCDetailLocalized, updateFloorQCDetailsBulkLocalized } from "@/lib/api/ptis/appartmentQC/appartmentQC.service";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import type { ApartmentQCDetail } from "@/types/apartmentQC.types";
import { getFloorPaged } from "@/lib/api/floor.service";
import { getConstructionPaged } from "@/lib/api/constructiontypemaster/construction-crud.service";
import { getUseTypesPagedServer, getSubTypesPagedServer } from "@/lib/api/typeofusemaster.service";
import type { Floor } from "@/types/floor.types";
import type { ConstructionType } from "@/types/construction.types";
import type { UseType, UseSubType } from "@/types/typeOfUse.types";
import { getRoomTypeData, getSubFloorData } from "@/lib/api/ptis/floorSubmission";
import { createRoomWiseMinusSafe, createRoomWiseSubmissionSafe, deleteRoomWiseSubmissionSafe, getRoomWiseSubmissionsSafe, updateRoomWiseMinusSafe, updateRoomWiseSubmissionSafe } from "@/lib/api/ptis/appartmentQC/appartmentQC-room.service";
import type { RoomWiseSubmissionData } from "@/lib/api/ptis/appartmentQC/appartmentQC-room.service";

interface SubTypeFetchParams {
  pageNumber: number;
  pageSize: number;
  typeOfUseId?: number;
}

export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

function toUserFacingErrorMessage(messageOrKey: string): string {
  const value = messageOrKey.trim();
  if (!value) return "An unexpected error occurred.";

  const looksLikeTranslationKey = /^[a-z0-9]+(?:\.[a-z0-9]+)+$/i.test(value);
  if (!looksLikeTranslationKey) return value;

  const fallbackMessage = value
    .split(".")
    .pop()
    ?.replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!fallbackMessage) return "An unexpected error occurred.";
  return fallbackMessage.charAt(0).toUpperCase() + fallbackMessage.slice(1);
}

function handleActionError(error: unknown, defaultKey: string): { success: false; error: string } {
  logger.error(`[floorSubmission.action] ${defaultKey}`, { error: error as Error });
  if (error instanceof ApiError) {
    return {
      success: false,
      error: toUserFacingErrorMessage(error.error || error.contextMessage || defaultKey),
    };
  }
  return { success: false, error: toUserFacingErrorMessage(defaultKey) };
}

/**
 * Fetch Floor QC Details based on property ID and type filter.
 */
export async function getFloorQCDetailsAction(
  propertyId: number | string,
  type: 'rateable' | 'capital' | 'dual' | string
): Promise<ActionResult<ApartmentQCDetail[]>> {
  try {
    const data = await getFloorQCByPropertyIdSafe(propertyId, type);
    return {
      success: true,
      data,
      message: "messages.fetchFloorQCDetailsSuccess",
    };
  } catch (error: unknown) {
    return handleActionError(error, "messages.fetchFloorQCDetailsFailed");
  }
}

export async function fetchFloorsAction(): Promise<ActionResult<Floor[]>> {
  try {
    const res = await getFloorPaged(1, 1000);
    return { success: true, data: res.items ?? [] };
  } catch (error) {
    return handleActionError(error, "messages.fetchFloorsFailed");
  }
}

export async function fetchConstructionTypesAction(): Promise<ActionResult<ConstructionType[]>> {
  try {
    const res = await getConstructionPaged(1, -1);
    return { success: true, data: res.items ?? [] };
  } catch (error) {
    return handleActionError(error, "messages.fetchConTypesFailed");
  }
}

export async function fetchUseTypesAction(): Promise<ActionResult<UseType[]>> {
  try {
    const res = await getUseTypesPagedServer({ pageNumber: 1, pageSize: -1 });
    return { success: true, data: res.items ?? [] };
  } catch (error) {
    return handleActionError(error, "messages.fetchUseTypesFailed");
  }
}

export async function fetchSubTypesAction(typeOfUseId?: string | number): Promise<ActionResult<UseSubType[]>> {
  try {
    const params: SubTypeFetchParams = { pageNumber: 1, pageSize: -1 };
    if (typeOfUseId) {
      params.typeOfUseId = Number(typeOfUseId);
    }
    const res = await getSubTypesPagedServer(params);
    return { success: true, data: res.items ?? [] };
  } catch (error) {
    return handleActionError(error, "messages.fetchSubTypesFailed");
  }
}

export async function fetchSubFloorsAction(): Promise<ActionResult<Array<{ id?: string | number; description?: string; subFloorCode?: string; subFloorId?: string | number }>>> {
  try {
    const data = await getSubFloorData();
    return { success: true, data: data || [] };
  } catch (error) {
    return handleActionError(error, "messages.fetchSubFloorsFailed");
  }
}

/* ============================================================
   ROOM SUBMISSION ACTIONS (Re-exported from global actions)
 ============================================================ */

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
