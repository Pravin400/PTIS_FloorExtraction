import type {
  TapType,
  TapTypeFormModel,
  TapSize,
  TapSizeFormModel,
  PagedResponse,
} from "@/types/water-connection.types";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

function isTapTypeShape(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "id" in value && "connectionTypeName" in value;
}

function normalizeTapType(data: Record<string, unknown>): TapType {
  const id = Number(data.id ?? data.waterConnectionTypeId ?? data.typeId ?? 0);
  return {
    waterConnectionTypeId: Number.isFinite(id) ? id : 0,
    typeCode: String(data.connectionTypeCode ?? data.typeCode ?? "").trim(),
    typeName: String(data.connectionTypeName ?? data.typeName ?? "").trim(),
    isActive: Boolean(data.isActive),
  };
}

function isTapSizeShape(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "id" in value && "connectionSize" in value;
}

function normalizeTapSize(data: Record<string, unknown>): TapSize {
  const id = Number(data.id ?? data.waterConnectionSizeId ?? data.sizeId ?? 0);
  const sizeName = String(data.connectionSize ?? data.sizeName ?? "").trim();
  const unit = String(data.connectionSizeUnit ?? data.unit ?? "").trim();
  return {
    waterConnectionSizeId: Number.isFinite(id) ? id : 0,
    sizeName,
    unit,
    displayLabel: String(data.displayLabel ?? (sizeName && unit ? `${sizeName} ${unit}` : sizeName)).trim(),
    isActive: Boolean(data.isActive),
  };
}

export async function getTapTypePaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TapType>> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const response = await apiClient.get<PagedResponse<TapType>>(
    `/WaterConnectionType?${params.toString()}`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to fetch tap type", "getTapTypePaged");
  }
  if (!response.data) {
    throw new ApiError(500, "No data returned from server", "getTapTypePaged");
  }
  return {
    ...response.data,
    items: response.data.items.filter(isTapTypeShape).map(normalizeTapType),
  };
}

export async function getTapTypeById(id: number): Promise<TapType> {
  const response = await apiClient.get<TapType>(
    `/WaterConnectionType/${encodeURIComponent(String(id))}`
  );
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Not found", "getTapTypeById");
  }
  return normalizeTapType(response.data as unknown as Record<string, unknown>);
}

export async function createTapType(
  data: TapTypeFormModel,
  userId: number
): Promise<TapType> {
  const response = await apiClient.post<TapType>("/WaterConnectionType", {
    connectionTypeCode: data.typeCode,
    connectionTypeName: data.typeName,
    isActive: data.isActive,
    createdBy: userId,
  });
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to create", "createTapType");
  }
  if (!response.data) {
    return { waterConnectionTypeId: 0, typeCode: data.typeCode, typeName: data.typeName, isActive: data.isActive };
  }
  return normalizeTapType(response.data as unknown as Record<string, unknown>);
}

export async function updateTapType(
  id: number,
  data: TapTypeFormModel,
  userId: number
): Promise<TapType> {
  const response = await apiClient.put<TapType>(
    `/WaterConnectionType/${encodeURIComponent(String(id))}`,
    {
      connectionTypeCode: data.typeCode,
      connectionTypeName: data.typeName,
      isActive: data.isActive,
      updatedBy: userId,
    }
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to update", "updateTapType");
  }
  if (!response.data) {
    return { waterConnectionTypeId: id, typeCode: data.typeCode, typeName: data.typeName, isActive: data.isActive };
  }
  return normalizeTapType(response.data as unknown as Record<string, unknown>);
}

export async function deleteTapType(id: number, _userId: number): Promise<void> {
  const response = await apiClient.delete(
    `/WaterConnectionType/${encodeURIComponent(String(id))}/purge`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to delete", "deleteTapType");
  }
}

export async function getTapSizePaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<PagedResponse<TapSize>> {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

  const response = await apiClient.get<PagedResponse<TapSize>>(
    `/WaterConnectionSize?${params.toString()}`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to fetch tap size", "getTapSizePaged");
  }
  if (!response.data) {
    throw new ApiError(500, "No data returned from server", "getTapSizePaged");
  }
  return {
    ...response.data,
    items: response.data.items.filter(isTapSizeShape).map(normalizeTapSize),
  };
}

export async function getTapSizeById(id: number): Promise<TapSize> {
  const response = await apiClient.get<TapSize>(
    `/WaterConnectionSize/${encodeURIComponent(String(id))}`
  );
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Not found", "getTapSizeById");
  }
  return normalizeTapSize(response.data as unknown as Record<string, unknown>);
}

export async function createTapSize(
  data: TapSizeFormModel,
  userId: number
): Promise<TapSize> {
  const response = await apiClient.post<TapSize>("/WaterConnectionSize", {
    ConnectionSize: data.sizeName,
    ConnectionSizeUnit: data.unit,
    IsActive: data.isActive,
    createdBy: userId,
  });
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to create", "createTapSize");
  }
  if (!response.data) {
    return { waterConnectionSizeId: 0, sizeName: data.sizeName, unit: data.unit, displayLabel: `${data.sizeName} ${data.unit}`.trim(), isActive: data.isActive };
  }
  return normalizeTapSize(response.data as unknown as Record<string, unknown>);
}

export async function updateTapSize(
  id: number,
  data: TapSizeFormModel,
  userId: number
): Promise<TapSize> {
  const response = await apiClient.put<TapSize>(
    `/WaterConnectionSize/${encodeURIComponent(String(id))}`,
    {
      ConnectionSize: data.sizeName,
      ConnectionSizeUnit: data.unit,
      IsActive: data.isActive,
      updatedBy: userId,
    }
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to update", "updateTapSize");
  }
  if (!response.data) {
    return { waterConnectionSizeId: id, sizeName: data.sizeName, unit: data.unit, displayLabel: `${data.sizeName} ${data.unit}`.trim(), isActive: data.isActive };
  }
  return normalizeTapSize(response.data as unknown as Record<string, unknown>);
}

export async function deleteTapSize(id: number, _userId: number): Promise<void> {
  const response = await apiClient.delete(
    `/WaterConnectionSize/${encodeURIComponent(String(id))}/purge`
  );
  if (!response.success) {
    throw new ApiError(response.statusCode ?? 500, response.error ?? "Failed to delete", "deleteTapSize");
  }
}
