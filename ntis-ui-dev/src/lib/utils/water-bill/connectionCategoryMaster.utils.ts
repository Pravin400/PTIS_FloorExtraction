import type { ConnectionCategory } from "@/types/waterBill/connectionCategoryMaster.types";

/**
 * Validates that an unknown object resembles a connection category payload from the API.
 */
export function isConnectionCategoryShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasId = "id" in obj || "Id" in obj;
  const hasCategory =
    "connectionCategory" in obj ||
    "ConnectionCategory" in obj ||
    "connectionCategoryCode" in obj ||
    "ConnectionCategoryCode" in obj ||
    "code" in obj ||
    "Code" in obj;
  return hasId && hasCategory;
}

/**
 * Normalizes incoming data into the standard ConnectionCategory structure.
 */
export function normalizeConnectionCategory(data: Record<string, unknown>): ConnectionCategory {
  const id = Number(data.id ?? data.Id ?? 0);
  const code = String(
    data.connectionCategoryCode ??
      data.ConnectionCategoryCode ??
      data.code ??
      data.Code ??
      ""
  ).trim();
  const connCategory = String(data.connectionCategory ?? data.ConnectionCategory ?? "").trim();
  const desc = data.description ?? data.Description;

  const rawFreqId = data.billingFrequencyId ?? data.BillingFrequencyId;
  const billingFrequencyId = rawFreqId != null && rawFreqId !== "" ? Number(rawFreqId) : null;

  const billingFrequencyCode = data.billingFrequencyCode ?? data.BillingFrequencyCode;
  const billingFrequency = data.billingFrequency ?? data.BillingFrequency;

  const isMeteredVal = data.isMetered ?? data.IsMetered;
  const isMetered = isMeteredVal !== undefined ? Boolean(isMeteredVal) : true;

  const billingMethod = String(data.billingMethod ?? data.BillingMethod ?? (isMetered ? "Metered" : "Flat")).trim();

  return {
    id: Number.isFinite(id) ? id : 0,
    connectionCategoryCode: code || (connCategory ? connCategory.substring(0, 5).toUpperCase() : ""),
    connectionCategory: connCategory,
    billingFrequencyId: Number.isFinite(billingFrequencyId) ? billingFrequencyId : null,
    billingFrequencyCode: billingFrequencyCode != null ? String(billingFrequencyCode).trim() : null,
    billingFrequency: billingFrequency != null ? String(billingFrequency).trim() : null,
    isMetered,
    billingMethod,
    description: desc != null ? String(desc).trim() : "",
    isActive: Boolean(data.isActive ?? data.IsActive ?? false),
    createdBy: data.createdBy !== undefined ? Number(data.createdBy) : (data.CreatedBy !== undefined ? Number(data.CreatedBy) : null),
    createdDate: data.createdDate !== undefined ? String(data.createdDate) : (data.CreatedDate !== undefined ? String(data.CreatedDate) : null),
    updatedBy: data.updatedBy !== undefined ? Number(data.updatedBy) : (data.UpdatedBy !== undefined ? Number(data.UpdatedBy) : null),
    updatedDate: data.updatedDate !== undefined ? String(data.updatedDate) : (data.UpdatedDate !== undefined ? String(data.UpdatedDate) : null),
  };
}

/**
 * Safely extracts items array from various API response shapes (camelCase, PascalCase, nested).
 */
export function extractRawItems(rawData: Record<string, unknown> | unknown[] | undefined): unknown[] {
  if (Array.isArray(rawData)) return rawData;
  if (!rawData || typeof rawData !== "object") return [];
  if (Array.isArray(rawData.items)) return rawData.items;
  if (Array.isArray(rawData.Items)) return rawData.Items;
  if (Array.isArray(rawData.data)) return rawData.data;
  const nestedData = rawData.data as Record<string, unknown> | undefined;
  if (Array.isArray(nestedData?.items)) return nestedData.items;
  return [];
}

/**
 * Client-side search and status filter fallback.
 */
export function filterConnectionCategories(
  items: ConnectionCategory[],
  searchTerm?: string,
  statusFilter?: string,
  meteredFilter?: string
): ConnectionCategory[] {
  let result = items;

  if (searchTerm?.trim()) {
    const term = searchTerm.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.connectionCategoryCode.toLowerCase().includes(term) ||
        item.connectionCategory.toLowerCase().includes(term) ||
        (item.billingFrequency && item.billingFrequency.toLowerCase().includes(term)) ||
        (item.billingMethod && item.billingMethod.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
  }

  if (statusFilter === "active") {
    result = result.filter((item) => item.isActive);
  } else if (statusFilter === "inactive") {
    result = result.filter((item) => !item.isActive);
  }

  if (meteredFilter === "metered") {
    result = result.filter((item) => item.isMetered);
  } else if (meteredFilter === "non-metered") {
    result = result.filter((item) => !item.isMetered);
  }

  return result;
}

/**
 * Prepares the payload for create and update operations.
 */
export function createPayload(
  data: {
    connectionCategoryCode?: string;
    connectionCategory: string;
    billingFrequencyId?: number | null;
    isMetered: boolean;
    billingMethod: string;
    description?: string | null;
    isActive: boolean;
  },
  userId?: number,
  id?: number
) {
  const base = data.connectionCategory.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const code = (data.connectionCategoryCode?.trim() || base.substring(0, 10) || "CAT").slice(0, 30);

  const payload: Record<string, unknown> = {
    ConnectionCategoryCode: code,
    connectionCategoryCode: code,
    ConnectionCategory: data.connectionCategory.trim(),
    connectionCategory: data.connectionCategory.trim(),
    BillingFrequencyId: data.billingFrequencyId ?? null,
    billingFrequencyId: data.billingFrequencyId ?? null,
    IsMetered: data.isMetered,
    isMetered: data.isMetered,
    BillingMethod: data.billingMethod.trim(),
    billingMethod: data.billingMethod.trim(),
    Description: data.description?.trim() || null,
    description: data.description?.trim() || null,
    IsActive: data.isActive,
    isActive: data.isActive,
  };

  if (id !== undefined) {
    payload.Id = id;
    payload.id = id;
    payload.UpdatedBy = userId;
  } else {
    payload.CreatedBy = userId;
  }

  return { code, payload };
}
