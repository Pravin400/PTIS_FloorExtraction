"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { createLogger } from "@/lib/utils/server-logger";
import {
  getAssetUsersPaged,
  getOwningDepartmentsForAllocation,
  getZonesForAllocation,
  getWardsForAllocation,
  getGrievanceWorkflowStages,
  saveAssetUserAllocations,
  updateAssetUserAllocations,
  getAssetUserAllocationsById,
  getAssetUserById,
} from "@/lib/api/asset-masters/user-department-allocation.service";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
  WardOption,
  SaveUserAllocationResult,
  GrievanceWorkflowStageOption,
  UserAccessAllocationItem,
  OwningDepartmentAllocationItemDto,
  ZoneAllocationItemDto,
  StageAccessAllocationItemDto,
} from "@/types/asset-masters/user-department-allocation.types";
import type { PagedResponse } from "@/types/common.types";

export type { WardOption, SaveUserAllocationResult };

const logger = createLogger("UserDepartmentAllocationActions");

const PAGE_PATH = "/assets/configuration/master-data/user-department-allocation";

export async function fetchAssetUsersPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetUserListItem>> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  try {
    return await getAssetUsersPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder);
  } catch (error) {
    logger.error("Failed to fetch asset users paged", { pageNumber, pageSize, searchTerm, sortBy, sortOrder }, error);
    throw error;
  }
}

export async function fetchGrievanceWorkflowStagesAction(): Promise<GrievanceWorkflowStageOption[]> {
  try {
    return await getGrievanceWorkflowStages();
  } catch (err) {
    logger.error("Failed to fetch grievance workflow stages", {}, err);
    return [];
  }
}

export async function fetchAllocationOptionsAction(): Promise<{
  owningDepartments: OwningDepartmentOption[];
  zones: ZoneOption[];
  stages: GrievanceWorkflowStageOption[];
}> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore);
  if (!userId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }

  const [owningDepartments, zones, stages] = await Promise.all([
    getOwningDepartmentsForAllocation(),
    getZonesForAllocation(),
    getGrievanceWorkflowStages(),
  ]);

  return {
    owningDepartments,
    zones,
    stages,
  };
}

export async function fetchUserAllocationsByIdAction(
  userId: number
): Promise<UserAccessAllocationItem[]> {
  const cookieStore = await cookies();
  const currentUserId = getUserIdFromCookies(cookieStore);
  if (!currentUserId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }
  return getAssetUserAllocationsById(userId);
}

export async function fetchUserForAllocationByIdAction(
  userId: number
): Promise<AssetUserListItem> {
  const cookieStore = await cookies();
  const currentUserId = getUserIdFromCookies(cookieStore);
  if (!currentUserId) {
    throw new ApiError(401, "you are unauthorized", "Unauthorized");
  }

  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid User ID is required", "Validation failed");
  }

  try {
    const user = await getAssetUserById(numericId);
    if (!user) {
      throw new ApiError(404, "User not found", "Not Found");
    }
    return user;
  } catch (error) {
    logger.error("Failed to fetch user for allocation by ID", { userId: numericId }, error);
    throw error;
  }
}


export async function fetchWardsByZoneAction(zoneId: number): Promise<WardOption[]> {
  try {
    return await getWardsForAllocation(zoneId);
  } catch (err) {
    logger.error("Failed to fetch wards for zone", { zoneId }, err);
    return [];
  }
}

export async function saveUserAllocationAction(
  userId: number,
  owningDepartmentIds: number[],
  zoneIds: number[],
  isUpdate: boolean = false,
  zoneWardSelections?: Record<number, number[] | number>,
  allocationMode?: "ZONE" | "WARD",
  stageIds?: number[]
): Promise<SaveUserAllocationResult> {
  try {
    const cookieStore = await cookies();
    const currentUserId = getUserIdFromCookies(cookieStore);
    if (!currentUserId) {
      return { ok: false, error: "unauthorized", message: "You are unauthorized." };
    }

    if (!userId || userId <= 0) {
      return { ok: false, error: "invalid_user", message: "Invalid user selected." };
    }

    if (!Array.isArray(owningDepartmentIds) || owningDepartmentIds.length === 0) {
      return {
        ok: false,
        error: "department_required",
        message: "At least one Owning Department must be selected.",
      };
    }

    const distinctDeptIds = Array.from(
      new Set(owningDepartmentIds.filter((id) => id > 0))
    );
    const distinctZoneIds = Array.from(
      new Set(zoneIds.filter((id) => id > 0))
    );

    const owningDepartments: OwningDepartmentAllocationItemDto[] = distinctDeptIds.map((id) => ({
      owningDepartmentId: id,
      designationId: null,
    }));

    // In updated backend contract, zoneAllocations accepts:
    // { zoneId: number, wardIds: number[] }
    // Empty wardIds array [] or null allocates the entire zone (all active wards).
    const zoneAllocations: ZoneAllocationItemDto[] = [];

    const hasWardSelections =
      zoneWardSelections &&
      Object.values(zoneWardSelections).some((v) =>
        Array.isArray(v) ? v.length > 0 : typeof v === "number" && v > 0
      );

    const isWardMode =
      allocationMode === "WARD" || (allocationMode === undefined && Boolean(hasWardSelections));

    if (isWardMode && zoneWardSelections) {
      for (const [zIdStr, val] of Object.entries(zoneWardSelections)) {
        const zoneId = Number(zIdStr);
        if (!zoneId || zoneId <= 0) continue;

        const wardIds: number[] = Array.isArray(val)
          ? val.filter((id): id is number => typeof id === "number" && id > 0)
          : typeof val === "number" && val > 0
            ? [val]
            : [];

        if (wardIds.length > 0) {
          zoneAllocations.push({
            zoneId,
            wardIds,
          });
        }
      }
    } else {
      // Zone-wise allocation: allocates entire zone (wardIds: [])
      for (const zoneId of distinctZoneIds) {
        zoneAllocations.push({
          zoneId,
          wardIds: [],
        });
      }
    }

    const stageAccess: StageAccessAllocationItemDto[] | undefined = Array.isArray(stageIds)
      ? Array.from(new Set(stageIds.filter((id) => typeof id === "number" && id > 0))).map((id) => ({
          stageId: id,
        }))
      : undefined;

    if (isUpdate) {
      // Updates existing allocation via PUT /api/AssetUserAllocation/{userId}
      await updateAssetUserAllocations(userId, {
        owningDepartments,
        zoneAllocations,
        stageAccess: stageAccess ?? [],
      });
    } else {
      // Creates new allocation via POST /api/AssetUserAllocation
      await saveAssetUserAllocations({
        userId,
        owningDepartments,
        zoneAllocations,
        stageAccess: stageAccess ?? [],
      });
    }

    // Revalidate server paths across all locales so table and drawer reflect changes immediately
    for (const loc of locales) {
      revalidatePath(`/${loc}${PAGE_PATH}`, "page");
      revalidatePath(`/${loc}${PAGE_PATH}/edit/${userId}`, "page");
    }

    return { ok: true };
  } catch (error) {
    logger.error("Failed to save user allocation", { userId, owningDepartmentIds, zoneIds, isUpdate }, error);
    if (error instanceof ApiError) {
      const msg = error.responseText || error.error || error.message;
      return {
        ok: false,
        error: "api_error",
        message: msg,
        statusCode: error.statusCode,
      };
    }
    return {
      ok: false,
      error: "unknown",
      message: error instanceof Error ? error.message : "An unexpected error occurred while saving.",
    };
  }
}
