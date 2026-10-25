"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/auth-session";
import { locales } from "@/i18n/config";

import {
  getFloorPaged,
  createFloor,
  createFloorRange,
  updateFloor,
  deleteFloor,
  getMaxFlatGenerationSeq,
  getFlatGenerationGroups,

} from "@/lib/api/floor.service";

import {
  getSubFloorPaged,
  createSubFloor,
  updateSubFloor,
  deleteSubFloor,
} from "@/lib/api/subfloor.service";
import { ApiError } from "@/lib/utils/api";

import type {
  Floor,
  FloorFormModel,
  FloorRangePayload,
  SubFloor,
  SubFloorFormModel,
  PagedResponse,
  FlatGenerationGroupOption,
} from "@/types/floor.types";

/* ============================================================
   SERVER ERROR CODE → HUMAN-READABLE MESSAGE MAP
============================================================ */
const FLOOR_SERVER_ERROR_CODES: Record<string, string> = {
  FloorCode_MaxLen_5: "Floor code cannot exceed 5 characters.",
  FloorCode_Required: "Floor code is required.",
  Floor_DescriptionEnglish_Required: "English description is required.",
  Floor_Description_Required: "Description is required.",
  Floor_DescriptionEnglish_MaxLen: "Description (English) cannot exceed 100 characters.",
  Floor_SequenceNo_Required: "Sequence number is required.",
  Floor_FLatGenerationGroupId_Required: "Flat Generation Type is required.",
  Floor_FLatGenerationSeq_Required: "Flat Generation Sequence is required.",
  Floor_FLatGenerationGroupId_Range: "Flat Generation Type must be selected.",
  Floor_FLatGenerationSeq_Range: "Flat Generation Sequence must be greater than 0.",
  SubFloorId_MaxLen_5: "Sub-floor code cannot exceed 5 characters.",
  SubFloorCode_Required: "Sub-floor code is required.",
  SubFloor_Description_Required: "Sub-floor description is required.",
  Template_Description_Required: "Description is required.",
};

function parseFloorApiError(error: ApiError): string {
  try {
    const parsed = JSON.parse(error.responseText);
    if (parsed?.errors && typeof parsed.errors === "object") {
      const messages: string[] = [];
      for (const codes of Object.values(parsed.errors)) {
        if (Array.isArray(codes)) {
          for (const code of codes) {
            const msg = FLOOR_SERVER_ERROR_CODES[code as string];
            if (msg) messages.push(msg);
          }
        }
      }
      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // not JSON — fall through
  }
  return error.responseText || "An unexpected error occurred.";
}

/**
 * Detects if an API error response indicates a duplicate or overlapping floor range.
 * Checks response text and JSON payloads for duplicate/overlap keywords.
 */
function isFloorRangeDuplicateOrOverlapError(responseText: string): boolean {
  const hasDuplicateKeyword = (value: string): boolean => {
    const msg = value.toLowerCase();
    return (
      msg.includes("duplicate") ||
      msg.includes("already exists") ||
      msg.includes("overlap") ||
      msg.includes("conflict") ||
      msg.includes("same details")
    );
  };

  if (!responseText) return false;
  if (hasDuplicateKeyword(responseText)) return true;

  try {
    const parsed = JSON.parse(responseText) as {
      title?: string;
      detail?: string;
      message?: string;
      errors?: Record<string, unknown>;
    };

    if (
      (parsed.title && hasDuplicateKeyword(parsed.title)) ||
      (parsed.detail && hasDuplicateKeyword(parsed.detail)) ||
      (parsed.message && hasDuplicateKeyword(parsed.message))
    ) {
      return true;
    }

    if (parsed.errors && typeof parsed.errors === "object") {
      for (const value of Object.values(parsed.errors)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string" && hasDuplicateKeyword(item)) {
              return true;
            }
          }
        } else if (typeof value === "string" && hasDuplicateKeyword(value)) {
          return true;
        }
      }
    }
  } catch {
    // Non-JSON error payload; keyword checks above already handled.
  }

  return false;
}

/* ============================================================
   FLOOR PAGED (SEARCH + SORT)
============================================================ */
export async function fetchFloorPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<Floor>> {
  try {
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;

    // Allow pageSize -1 to fetch all records (like construction type)
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      (pageSize !== -1 && pageSize <= 0) ||
      (pageSize !== -1 && pageSize > MAX_PAGE_SIZE) ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new Error("Invalid pagination parameters");
    }


    const allowedSortColumns = [
      "floorCode",
      "descriptionEnglish",
      "description",
      "sequenceNo",
      "isActive",
    ];

    const validSortBy = sortBy && allowedSortColumns.includes(sortBy)
      ? sortBy
      : undefined;

    const validSortOrder =
      sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : undefined;

    return await getFloorPaged(
      pageNumber,
      pageSize,
      searchTerm,
      validSortBy,
      validSortOrder
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(
        `[fetchFloorPagedServerAction] API Error ${error.statusCode}:`,
        error.responseText
      );
    } else if (error instanceof Error) {
      console.error(
        "[fetchFloorPagedServerAction] Error:",
        error.message
      );
    } else {
      console.error("[fetchFloorPagedServerAction] Unknown error:", error);
    }

    throw error;
  }
}

/* ============================================================
   CREATE FLOOR
============================================================ */
export async function createFloorAction(
  data: FloorFormModel
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    await createFloor(data, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/floor`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    // Handle 409 Conflict (duplicate record)
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        success: false,
        messageKey: "messages.duplicateRecord",
        statusCode: 409,
      };
    }

    // Handle other API errors
    if (error instanceof ApiError) {
      return {
        success: false,
        // Return raw responseText for client-side field error parsing, fallback to parsed message
        message: error.responseText || parseFloorApiError(error),
        statusCode: error.statusCode,
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, messageKey: "messages.createFailed" };
  }
}

/* ============================================================
   UPDATE FLOOR
============================================================ */
export async function updateFloorAction(
  data: FloorFormModel
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    await updateFloor(data, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/floor`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    // Handle 409 Conflict (duplicate record)
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        success: false,
        messageKey: "messages.duplicateRecord",
        statusCode: 409,
      };
    }

    // Handle other API errors
    if (error instanceof ApiError) {
      return {
        success: false,
        // Return raw responseText for client-side field error parsing, fallback to parsed message
        message: error.responseText || parseFloorApiError(error),
        statusCode: error.statusCode,
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, messageKey: "messages.updateFailed" };
  }
}

/* ============================================================
   DELETE FLOOR
============================================================ */
export async function deleteFloorAction(
  id: number
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number }> {

  if (!id || id <= 0) {
    return {
      success: false,
      messageKey: "messages.validFloorIdRequired",
      statusCode: 400,
    };
  }

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    await deleteFloor(id, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/floor`, "page");
    }

    return {
      success: true,
      messageKey: "messages.deleteSuccess",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      let errorMessage = error.responseText;
      try {
        const parsed = JSON.parse(error.responseText);
        if (parsed?.message) errorMessage = parsed.message;
      } catch {
        // use raw text
      }

      const lowerErr = errorMessage.toLowerCase();
      if (
        error.statusCode === 409 ||
        (error.statusCode === 400 && (lowerErr.includes("referenced") || lowerErr.includes("in use") || lowerErr.includes("cannot deactivate"))) ||
        lowerErr.includes("referenced") ||
        lowerErr.includes("in use") ||
        lowerErr.includes("invalid object name") ||
        lowerErr.includes("floorfactorcvmaster")
      ) {
        return {
          success: false,
          messageKey: "apiErrors.inUse",
          statusCode: 409,
        };
      }

      return {
        success: false,
        message: errorMessage,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      messageKey: "messages.deleteFailed",
    };
  }
}

/* ============================================================
   CREATE FLOOR RANGE (BULK CREATE)
============================================================ */
export async function createFloorRangeAction(
  data: FloorRangePayload
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number; floorsCreated?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    const rangeFrom = Number.parseInt(data.rangeFrom, 10);
    const rangeTo = Number.parseInt(data.rangeTo, 10);

    // Pre-check: prevent known duplicate scenario before API call
    // Check if existing floors overlap with the requested sequence range
    if (Number.isFinite(rangeFrom) && Number.isFinite(rangeTo)) {
      try {
        const existingFloors = await getFloorPaged(1, -1);
        const hasConflict = existingFloors.items.some((floor) => {
          const sequenceNo = Number(floor.sequenceNo);
          if (!Number.isFinite(sequenceNo)) return false;
          // Check if sequence overlaps with requested range
          if (sequenceNo < rangeFrom || sequenceNo > rangeTo) return false;

          // Conflict found: same sequence pattern
          return true;
        });

        if (hasConflict) {
          return {
            success: false,
            messageKey: "messages.duplicateRecord",
            message: "Floor range with this pattern already exists",
            statusCode: 409,
          };
        }
      } catch {
        // Non-blocking guard: if pre-check fails, let backend API decide
      }
    }

    await createFloorRange(data, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/floor`, "page");
    }

    const floorsCreated = Number.parseInt(data.rangeTo) - Number.parseInt(data.rangeFrom) + 1;
    return { success: true, floorsCreated };
  } catch (error: unknown) {
    // Handle 409 Conflict (duplicate record)
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        success: false,
        messageKey: "messages.duplicateRecord",
        statusCode: 409,
      };
    }

    // Handle other API errors
    if (error instanceof ApiError) {
      // Check if error response indicates duplicate/overlap (even if status is 500)
      if (isFloorRangeDuplicateOrOverlapError(error.responseText)) {
        return {
          success: false,
          messageKey: "messages.duplicateRecord",
          message: error.responseText || "Duplicate floor range detected",
          statusCode: 409,
        };
      }

      return {
        success: false,
        // Return raw responseText for client-side field error parsing, fallback to parsed message
        message: error.responseText || parseFloorApiError(error),
        statusCode: error.statusCode,
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, messageKey: "messages.createFailed" };
  }
}

/* ============================================================
   SUBFLOOR PAGED
============================================================ */
export async function fetchSubFloorPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<SubFloor>> {
  try {
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;

    // Allow pageSize -1 to fetch all records (like construction type)
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      (pageSize !== -1 && pageSize <= 0) ||
      (pageSize !== -1 && pageSize > MAX_PAGE_SIZE) ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new Error("Invalid pagination parameters");
    }

    return await getSubFloorPaged(
      pageNumber,
      pageSize,
      searchTerm
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      console.error(
        `[fetchSubFloorPagedServerAction] API Error ${error.statusCode}:`,
        error.responseText
      );
    } else if (error instanceof Error) {
      console.error(
        "[fetchSubFloorPagedServerAction] Error:",
        error.message
      );
    } else {
      console.error("[fetchSubFloorPagedServerAction] Unknown error:", error);
    }

    throw error;
  }
}

/* ============================================================
   CREATE SUBFLOOR
============================================================ */
export async function createSubFloorAction(
  data: SubFloorFormModel
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    await createSubFloor(data, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/subfloor`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    // Handle 409 Conflict (duplicate record)
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        success: false,
        messageKey: "messages.duplicateRecord",
        statusCode: 409,
      };
    }

    // Handle other API errors
    if (error instanceof ApiError) {
      return {
        success: false,
        // Return raw responseText for client-side field error parsing, fallback to parsed message
        message: error.responseText || parseFloorApiError(error),
        statusCode: error.statusCode,
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, messageKey: "messages.createFailed" };
  }
}

/* ============================================================
   UPDATE SUBFLOOR
============================================================ */
export async function updateSubFloorAction(
  data: SubFloorFormModel
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    await updateSubFloor(data, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/subfloor`, "page");
    }

    return { success: true };
  } catch (error: unknown) {
    // Handle 409 Conflict (duplicate record)
    if (error instanceof ApiError && error.statusCode === 409) {
      return {
        success: false,
        messageKey: "messages.duplicateRecord",
        statusCode: 409,
      };
    }

    // Handle other API errors
    if (error instanceof ApiError) {
      return {
        success: false,
        // Return raw responseText for client-side field error parsing, fallback to parsed message
        message: error.responseText || parseFloorApiError(error),
        statusCode: error.statusCode,
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, messageKey: "messages.updateFailed" };
  }
}

/* ============================================================
   DELETE SUBFLOOR
============================================================ */
export async function deleteSubFloorAction(
  id: number
): Promise<{ success: boolean; message?: string; messageKey?: string; statusCode?: number }> {

  if (!id || id <= 0) {
    return {
      success: false,
      messageKey: "messages.validSubFloorIdRequired",
      statusCode: 400,
    };
  }

  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);

    if (!userId) {
      throw new ApiError(401, "Unauthorized", "User session expired");
    }

    await deleteSubFloor(id, userId.toString());

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/floormaster/subfloor`, "page");
    }

    return {
      success: true,
      messageKey: "messages.deleteSuccess",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      let errorMessage = error.responseText;
      try {
        const parsed = JSON.parse(error.responseText);
        if (parsed?.message) errorMessage = parsed.message;
      } catch {
        // use raw text
      }

      return {
        success: false,
        message: errorMessage,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      messageKey: "messages.deleteFailed",
    };
  }
}
/* ============================================================
   FLAT GENERATION SEQUENCE & GROUPS ACTIONS
============================================================ */
export async function getMaxFlatGenerationSeqAction(
  flatGenerationGroupId: number
): Promise<number> {
  return await getMaxFlatGenerationSeq(flatGenerationGroupId);
}

export async function fetchFlatGenerationGroupsAction(): Promise<FlatGenerationGroupOption[]> {
  return await getFlatGenerationGroups();
}
