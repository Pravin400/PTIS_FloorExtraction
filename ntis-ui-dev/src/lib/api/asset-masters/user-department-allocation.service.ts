import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PagedResponse } from "@/types/common.types";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
  WardOption,
  GrievanceWorkflowStageOption,
  SaveAssetUserAllocationPayload,
  UpdateAssetUserAllocationPayload,
  UserAccessAllocationItem,
} from "@/types/asset-masters/user-department-allocation.types";
import { normalizeAssetUser } from "./user-department-allocation.mapper";

/**
 * Fetch paged list of Asset Users with allocations from GET /api/AssetUserAllocation/GetAllUserList
 */
export async function getAssetUsersPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<AssetUserListItem>> {
  const params = new URLSearchParams();

  params.set("PageNumber", String(pageNumber));
  params.set("PageSize", String(pageSize));
  if (searchTerm?.trim()) params.set("SearchTerm", searchTerm.trim());
  if (sortBy?.trim()) params.set("SortBy", sortBy.trim());
  if (sortOrder?.trim()) params.set("SortOrder", sortOrder.trim());

  const response = await apiClient.get<PagedResponse<Record<string, unknown>>>(
    `/AssetUserAllocation/GetAllUserList?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to fetch asset users list",
      "Get asset users list failed"
    );
  }

  const items = Array.isArray(response.data.items)
    ? response.data.items.map(normalizeAssetUser)
    : [];

  return {
    ...response.data,
    items,
  };
}

/**
 * Fetch active Owning Departments from GET /api/OwningDepartment?IsActive=true&PageSize=-1
 */
export async function getOwningDepartmentsForAllocation(): Promise<OwningDepartmentOption[]> {
  const response = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    "/OwningDepartment?PageSize=-1&IsActive=true"
  );

  if (!response.success || !response.data) {
    return [];
  }

  const rawItems = Array.isArray(response.data)
    ? response.data
    : Array.isArray((response.data as PagedResponse<Record<string, unknown>>).items)
      ? (response.data as PagedResponse<Record<string, unknown>>).items
      : [];

  return rawItems.map((item) => ({
    id: Number(item.id) || 0,
    owningDepartmentName: String(item.owningDepartmentName ?? ""),
    description: item.description ? String(item.description) : undefined,
    isActive: Boolean(item.isActive),
  }));
}

/**
 * Fetch active Zones from GET /api/Zone?PageSize=-1&IsActive=true
 */
export async function getZonesForAllocation(): Promise<ZoneOption[]> {
  const response = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    "/Zone?PageSize=-1&IsActive=true"
  );

  if (!response.success || !response.data) {
    return [];
  }

  const rawItems = Array.isArray(response.data)
    ? response.data
    : Array.isArray((response.data as PagedResponse<Record<string, unknown>>).items)
      ? (response.data as PagedResponse<Record<string, unknown>>).items
      : [];

  return rawItems
    .filter((item) => Boolean(item.isActive))
    .map((item) => ({
      id: Number(item.id) || 0,
      zoneNo: String(item.zoneNo ?? item.name ?? ""),
      description: item.description ? String(item.description) : undefined,
      isActive: Boolean(item.isActive),
    }));
}

/**
 * Fetch active Wards for a specific Zone from GET /api/Ward?ZoneId=${zoneId}&IsActive=true&PageSize=-1
 */
export async function getWardsForAllocation(zoneId: number): Promise<WardOption[]> {
  if (!zoneId || Number(zoneId) <= 0) return [];
  const params = new URLSearchParams();
  params.set("PageNumber", "1");
  params.set("PageSize", "-1");
  params.set("ZoneId", String(zoneId));
  params.set("IsActive", "true");

  const response = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    `/Ward?${params.toString()}`
  );

  if (!response.success || !response.data) {
    return [];
  }

  const rawData = response.data as unknown as Record<string, unknown>;
  const rawItems = Array.isArray(response.data)
    ? response.data
    : Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray((rawData?.data as { items?: unknown[] })?.items)
        ? (rawData.data as { items: unknown[] }).items
        : [];

  return (rawItems as Array<Record<string, unknown>>)
    .filter(
      (w) =>
        Number(w.id) > 0 &&
        (w.isActive === undefined || Boolean(w.isActive)) &&
        (w.zoneId ? Number(w.zoneId) === Number(zoneId) : true)
    )
    .map((w) => ({
      id: Number(w.id),
      wardNo: String(w.wardNo ?? w.WardNo ?? ""),
      description: w.description
        ? String(w.description)
        : w.Description
          ? String(w.Description)
          : w.wardDescription
            ? String(w.wardDescription)
            : undefined,
      zoneId: Number(w.zoneId ?? w.ZoneId ?? zoneId),
    }));
}

/**
 * Fetch active Grievance Workflow Stages from GET /api/asset-management/grievance-workflow-stage
 */
export async function getGrievanceWorkflowStages(): Promise<GrievanceWorkflowStageOption[]> {
  const response = await apiClient.get<PagedResponse<Record<string, unknown>> | Record<string, unknown>[]>(
    "/asset-management/grievance-workflow-stage?IsActive=true&MarkedForDeletion=false&PageSize=-1"
  );

  if (!response.success || !response.data) { 
    return [];
  }

  const rawItems = Array.isArray(response.data)
    ? response.data
    : Array.isArray((response.data as PagedResponse<Record<string, unknown>>).items)
      ? (response.data as PagedResponse<Record<string, unknown>>).items
      : [];

  return rawItems
    .filter((s) => Number(s.id) > 0)
    .map((s) => ({
      id: Number(s.id),
      stageCode: String(s.stageCode ?? s.StageCode ?? ""),
      stageName: String(s.stageName ?? s.StageName ?? ""),
      stageNameLocal: s.stageNameLocal ? String(s.stageNameLocal) : undefined,
      description: s.description ? String(s.description) : undefined,
      stageOrder: typeof s.stageOrder === "number" ? s.stageOrder : undefined,
      status: s.status ? String(s.status) : undefined,
      isActive: Boolean(s.isActive),
    }));
}

/**
 * Save user allocations atomically via POST /api/AssetUserAllocation
 */
export async function saveAssetUserAllocations(
  payload: SaveAssetUserAllocationPayload
): Promise<void> {
  const cleanPayload: SaveAssetUserAllocationPayload = {
    userId: payload.userId,
    owningDepartments: payload.owningDepartments,
    zoneAllocations: payload.zoneAllocations,
    ...(payload.stageAccess !== undefined
      ? { stageAccess: payload.stageAccess.map((s) => ({ stageId: Number(s.stageId) })) }
      : {}),
  };
  const response = await apiClient.post<void>("/AssetUserAllocation", cleanPayload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to save user department and zone allocation",
      "Save asset user allocation failed"
    );
  }
}

/**
 * Update user allocations atomically via PUT /api/AssetUserAllocation/{userId}
 */
export async function updateAssetUserAllocations(
  userId: number,
  payload: UpdateAssetUserAllocationPayload
): Promise<void> {
  const cleanPayload: UpdateAssetUserAllocationPayload = {
    owningDepartments: payload.owningDepartments,
    zoneAllocations: payload.zoneAllocations,
    ...(payload.stageAccess !== undefined
      ? { stageAccess: payload.stageAccess.map((s) => ({ stageId: Number(s.stageId) })) }
      : {}),
  };
  const response = await apiClient.put<void>(
    `/AssetUserAllocation/${encodeURIComponent(String(userId))}`,
    cleanPayload
  );

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || "Failed to update user department and zone allocation",
      "Update asset user allocation failed"
    );
  }
}

/**
 * Defensively extracts payload and allocation arrays handling both PascalCase
 * and camelCase response shapes from .NET API.
 */
function extractAllocationPayload(allocData: Record<string, unknown> | null | undefined) {
  if (!allocData || typeof allocData !== "object") {
    return {
      payload: {} as Record<string, unknown>,
      rawAccessObj: null,
      rawOwningDepts: undefined,
      rawZoneAllocs: undefined,
      rawStageAccess: undefined,
    };
  }

  const rawAccessObj =
    allocData.items && typeof allocData.items === "object" && !Array.isArray(allocData.items)
      ? (allocData.items as Record<string, unknown>)
      : allocData.Items && typeof allocData.Items === "object" && !Array.isArray(allocData.Items)
        ? (allocData.Items as Record<string, unknown>)
        : allocData;

  const getArray = (key1: string, key2: string) => {
    if (rawAccessObj && typeof rawAccessObj === "object") {
      const v = rawAccessObj[key1] || rawAccessObj[key2];
      if (Array.isArray(v)) return v;
    }
    const v = allocData[key1] || allocData[key2];
    return Array.isArray(v) ? v : undefined;
  };

  return {
    payload: rawAccessObj,
    rawAccessObj,
    rawOwningDepts: getArray("owningDepartments", "OwningDepartments"),
    rawZoneAllocs: getArray("zoneAllocations", "ZoneAllocations"),
    rawStageAccess: getArray("stageAccess", "StageAccess"),
  };
}

/**
 * Fetch a specific user's active allocations from GET /api/AssetUserAllocation/{userId}
 */
export async function getAssetUserAllocationsById(
  userId: number
): Promise<UserAccessAllocationItem[]> {
  const response = await apiClient.get<Record<string, unknown>>(
    `/AssetUserAllocation/${encodeURIComponent(String(userId))}`
  );

  if (!response.success || !response.data) {
    return [];
  }

  const { payload, rawOwningDepts, rawZoneAllocs, rawStageAccess } =
    extractAllocationPayload(response.data);

  return normalizeAssetUser({
    id: userId,
    ...payload,
    owningDepartments: rawOwningDepts,
    zoneAllocations: rawZoneAllocs,
    stageAccess: rawStageAccess,
  }).accessAllocations;
}

/**
 * Fetch a single user by ID directly from GET /api/users/{userId} and their allocations
 */
export async function getAssetUserById(
  userId: number
): Promise<AssetUserListItem | null> {
  const [userRes, allocRes] = await Promise.all([
    apiClient.get<Record<string, unknown>>(`/users/${encodeURIComponent(String(userId))}`),
    apiClient.get<Record<string, unknown>>(`/AssetUserAllocation/${encodeURIComponent(String(userId))}`),
  ]);

  if (!userRes.success || !userRes.data) {
    throw new ApiError(
      userRes.statusCode ?? 500,
      userRes.error || "Failed to fetch user",
      "Get user failed"
    );
  }

  const userData = userRes.data;
  const { rawAccessObj, rawOwningDepts, rawZoneAllocs, rawStageAccess } =
    extractAllocationPayload(allocRes.success && allocRes.data ? allocRes.data : null);

  return normalizeAssetUser({
    ...userData,
    owningDepartments: rawOwningDepts,
    zoneAllocations: rawZoneAllocs,
    stageAccess: rawStageAccess,
    accessAllocation: rawAccessObj,
  });
}
