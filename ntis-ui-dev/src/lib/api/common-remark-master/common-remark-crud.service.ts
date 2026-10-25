import { apiClient } from "@/services/api.service";
import { CommonRemark, CommonRemarkFormModel, RemarkCategory } from "@/types/common-remark-master/common-remark.types";
import { PagedResponse } from "@/types/common.types";
import { ApiError } from "@/lib/utils/api";
import { parseBoolean } from "@/lib/utils/type-guards";
import {
  isCommonRemarkShape,
  normalizeCommonRemark,
  isRemarkCategoryShape,
  normalizeRemarkCategory,
} from "./common-remark-types-guard";
import {
  validateId,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  createApiError,
  getDeleteErrorStatusCode,
} from "./common-remark-validation";

// Normalized API response helper to handle items/Items/data nesting structures
function normalizeApiArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const items = obj.items ?? obj.Items ?? obj.data;
  return Array.isArray(items) ? (items as T[]) : [];
}

/**
 * Fetch all categories from CommonRemarkType (with PageSize=-1 logic)
 */
export async function getCommonRemarkCategories(): Promise<RemarkCategory[]> {
  const response = await apiClient.get<unknown>(`/CommonRemarkType?PageSize=-1`);
  if (!response.success) {
    throw createApiError(response.statusCode, response.error, "Failed to fetch categories");
  }
  const items = normalizeApiArray<Record<string, unknown>>(response.data);
  return items
    .filter(isRemarkCategoryShape)
    .map(normalizeRemarkCategory);
}

/**
 * Fetch paginated list of common remarks
 */
export async function getCommonRemarksPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  filterType?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<CommonRemark>> {
  const categories = await getCommonRemarkCategories();

  const params = new URLSearchParams();
  params.append("PageNumber", String(pageNumber));
  params.append("PageSize", String(pageSize));

  const safeSearch = validateAndPrepareSearchTerm(searchTerm);
  if (safeSearch) {
    params.append("SearchTerm", safeSearch);
  }
  if (sortBy?.trim()) {
    params.append("SortBy", sortBy.trim());
  }
  if (sortOrder?.trim()) {
    params.append("SortOrder", sortOrder.trim());
  }
  if (filterType && filterType !== "All") {
    const matchedCat = categories.find(
      (c) => c.categoryName.toLowerCase() === filterType.toLowerCase()
    );
    if (matchedCat) {
      params.append("RemarkTypeId", String(matchedCat.id));
    } else {
      // If they filter by something non-existent, return an ID that won't match anything
      params.append("RemarkTypeId", "-999");
    }
  }

  const response = await apiClient.get<unknown>(`/CommonRemarkDetails?${params.toString()}`);
  if (!response.success) {
    throw createApiError(response.statusCode, response.error, "Failed to fetch paged common remarks");
  }

  const rawData = response.data as Record<string, unknown> | undefined;
  const items = normalizeApiArray<Record<string, unknown>>(rawData);

  // Map and normalize items
  const mappedItems: CommonRemark[] = items
    .filter(isCommonRemarkShape)
    .map((item) => normalizeCommonRemark(item, categories));

  const totalCount = Number(rawData?.totalCount ?? mappedItems.length);
  const totalPages = Number(rawData?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

  return {
    items: mappedItems,
    totalCount,
    pageNumber: Number(rawData?.pageNumber ?? pageNumber),
    pageSize,
    totalPages,
    hasPrevious: parseBoolean(rawData?.hasPrevious ?? (pageNumber > 1)),
    hasNext: parseBoolean(rawData?.hasNext ?? (pageNumber < totalPages)),
  };
}

/**
 * Fetch a single common remark by ID
 */
export async function getCommonRemarkById(id: number): Promise<CommonRemark | null> {
  if (!validateId(id)) {
    throw new ApiError(400, "Valid Common Remark ID is required", "Invalid ID");
  }

  const response = await apiClient.get<unknown>(`/CommonRemarkDetails/${encodeURIComponent(String(id))}`);
  if (!response.success) {
    throw createApiError(response.statusCode, response.error, `Failed to fetch common remark with ID ${id}`);
  }

  const rawData = response.data as Record<string, unknown> | undefined;
  if (!rawData) return null;

  // Handle nested structures if item is wrapped in 'items' or 'data'
  const wrapped = rawData.items ?? rawData.data ?? rawData;
  const item = Array.isArray(wrapped) ? wrapped[0] : wrapped;
  if (!item || !isCommonRemarkShape(item)) return null;

  const categories = await getCommonRemarkCategories();
  return normalizeCommonRemark(item, categories);
}

/**
 * Create a new category in CommonRemarkType
 */
export async function createRemarkCategory(customRemarkType: string, createdByUserId?: number): Promise<RemarkCategory> {
  const customName = (customRemarkType ?? "").trim();
  if (!customName) {
    throw new ApiError(400, "Custom Remark Type is required", "Validation failed");
  }

  const categories = await getCommonRemarkCategories();
  const matched = categories.find(
    (c) => c.categoryName.trim().toLowerCase() === customName.toLowerCase()
  );
  if (matched) {
    throw new ApiError(409, "This remark type already exists.", "Duplicate category");
  }

  const catPayload = {
    remarkTypeName: customName,
    isActive: true,
    createdBy: createdByUserId ?? 1,
  };

  const response = await apiClient.post<Record<string, unknown>>("/CommonRemarkType", catPayload);
  if (!response.success || !response.data) {
    throw createApiError(response.statusCode, response.error, "Failed to create remark type category");
  }

  const dataObj = response.data;
  const rawItem = (dataObj.items ?? dataObj.data ?? dataObj) as Record<string, unknown> | undefined;
  const resolvedId = Number(rawItem?.id ?? rawItem?.remarkTypeId);

  if (Number.isFinite(resolvedId) && resolvedId > 0) {
    return {
      id: resolvedId,
      categoryCode: String(resolvedId),
      categoryName: customName,
    };
  }

  throw new Error("Failed to extract ID from created remark type category response");
}

/**
 * Helper to resolve or create category in CommonRemarkType
 */
async function resolveOrCreateCategory(remarkType: string, customRemarkType?: string, createdByUserId?: number): Promise<number> {
  if (remarkType !== "Other") {
    const id = Number(remarkType);
    if (Number.isFinite(id) && id > 0) {
      return id;
    }
    const categories = await getCommonRemarkCategories();
    const cat = categories.find((c) => c.categoryName.toLowerCase() === remarkType.toLowerCase());
    if (cat) return cat.id;
    throw new Error(`Invalid category selection: ${remarkType}`);
  }

  const category = await createRemarkCategory(customRemarkType || "", createdByUserId);
  return category.id;
}

/**
 * Helper to check for duplicate remarks
 */
async function checkDuplicateRemark(remarkTypeId: number, remark: string, excludeId?: number): Promise<void> {
  const params = new URLSearchParams();
  params.append("PageSize", "-1");
  params.append("RemarkTypeId", String(remarkTypeId));

  const response = await apiClient.get<unknown>(`/CommonRemarkDetails?${params.toString()}`);
  if (response.success) {
    const rawData = response.data as Record<string, unknown> | undefined;
    const items = normalizeApiArray<Record<string, unknown>>(rawData);
    
    const isDuplicate = items.some((item) => {
      const itemRemark = (item.remark as string || "").trim().toLowerCase();
      const itemId = Number(item.id);
      return itemRemark === remark.trim().toLowerCase() && itemId !== excludeId;
    });

    if (isDuplicate) {
      throw new ApiError(409, "This remark already exists for the selected Remark Type.", "Duplicate remark");
    }
  }
}

/**
 * Create a new common remark
 */
export async function createCommonRemark(data: CommonRemarkFormModel): Promise<void> {
  validateCreateFormData(data);
  const userId = data.createdBy ?? 1;
  const remarkTypeId = await resolveOrCreateCategory(data.remarkType, data.customRemarkType, userId);

  await checkDuplicateRemark(remarkTypeId, data.remark);

  const payload = {
    remarkTypeId,
    remark: data.remark.trim(),
    isActive: data.isActive,
    createdBy: userId,
  };

  const response = await apiClient.post<unknown>("/CommonRemarkDetails", payload);
  if (!response.success) {
    throw createApiError(response.statusCode, response.error, "Failed to create common remark");
  }
}

/**
 * Update an existing common remark
 */
export async function updateCommonRemark(data: CommonRemarkFormModel): Promise<void> {
  validateUpdateFormData(data);
  const userId = data.updatedBy ?? 1;
  const remarkTypeId = await resolveOrCreateCategory(data.remarkType, data.customRemarkType, userId);

  await checkDuplicateRemark(remarkTypeId, data.remark, data.id);

  const payload = {
    id: data.id,
    remarkTypeId,
    remark: data.remark.trim(),
    isActive: data.isActive,
    updatedBy: userId,
  };

  const response = await apiClient.put<unknown>(`/CommonRemarkDetails/${encodeURIComponent(String(data.id))}`, payload);
  if (!response.success) {
    throw createApiError(response.statusCode, response.error, "Failed to update common remark");
  }
}

/**
 * Deletes a common remark by ID (permanent delete/purge)
 */
export async function deleteCommonRemark(id: number): Promise<void> {
  if (!validateId(id)) {
    throw new ApiError(400, "Valid Common Remark ID is required for deletion", "Invalid ID");
  }

  const response = await apiClient.delete<void>(`/CommonRemarkDetails/${encodeURIComponent(String(id))}/purge`);
  if (!response.success) {
    let statusCode = response.statusCode;
    if (!statusCode) {
      statusCode = getDeleteErrorStatusCode(response.error || "");
    }
    throw new ApiError(statusCode, response.error || "Failed to delete common remark", `Delete common remark ${id} failed`);
  }
}
