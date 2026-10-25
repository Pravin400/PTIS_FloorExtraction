import type { ConnectionType } from "@/types/waterBill/connectionTypeMaster.types";

/**
 * Validates that an unknown object resembles a connection type payload from the API.
 */
export function isConnectionTypeShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasId = "id" in obj || "Id" in obj;
  const hasType =
    "connectionType" in obj ||
    "ConnectionType" in obj ||
    "connectionTypeCode" in obj ||
    "ConnectionTypeCode" in obj ||
    "code" in obj ||
    "Code" in obj;
  return hasId && hasType;
}

/**
 * Normalizes incoming data into the standard ConnectionType structure.
 */
export function normalizeConnectionType(data: Record<string, unknown>): ConnectionType {
  const id = Number(data.id ?? data.Id ?? 0);
  const code = String(
    data.connectionTypeCode ??
      data.ConnectionTypeCode ??
      data.code ??
      data.Code ??
      ""
  ).trim();
  const connType = String(data.connectionType ?? data.ConnectionType ?? "").trim();
  const desc = data.description ?? data.Description;

  return {
    id: Number.isFinite(id) ? id : 0,
    connectionTypeCode: code || (connType ? connType.substring(0, 5).toUpperCase() : ""),
    connectionType: connType,
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
  const nestedData = rawData.data as Record<string, unknown> | undefined;
  if (Array.isArray(nestedData?.items)) return nestedData.items;
  return [];
}

/**
 * Client-side search and status filter fallback.
 */
export function filterConnectionTypes(
  items: ConnectionType[],
  searchTerm?: string,
  statusFilter?: string
): ConnectionType[] {
  let result = items;

  if (searchTerm?.trim()) {
    const term = searchTerm.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.connectionTypeCode.toLowerCase().includes(term) ||
        item.connectionType.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
  }

  if (statusFilter === "active") {
    result = result.filter((item) => item.isActive);
  } else if (statusFilter === "inactive") {
    result = result.filter((item) => !item.isActive);
  }

  return result;
}

/**
 * Prepares the payload for create and update operations.
 */
export function createPayload(
  data: { connectionTypeCode?: string; connectionType: string; description?: string | null; isActive: boolean },
  userId?: number,
  id?: number
) {
  const base = data.connectionType.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const code = (data.connectionTypeCode?.trim() || base.substring(0, 10) || "CONN").slice(0, 30);

  const payload: Record<string, unknown> = {
    ConnectionTypeCode: code,
    Code: code,
    ConnectionType: data.connectionType.trim(),
    connectionType: data.connectionType.trim(),
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
