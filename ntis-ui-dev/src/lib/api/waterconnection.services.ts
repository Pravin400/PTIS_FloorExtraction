import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type {
  WaterConnectionPagedResponse,
  WaterConnection,
  WaterConnectionFormModel,
  WaterConnectionTypeLookup,
  WaterConnectionSizeLookup,
  WaterConnectionStatusLookup,
  WaterRateMasterLookup,
} from "@/types/water-connection.types";

export { ApiError };

/** GET all connections for a property (paged) */
export async function getWaterConnectionsPaged(
  propertyId: number,
  pageNumber: number,
  pageSize: number
): Promise<WaterConnectionPagedResponse<WaterConnection>> {
  const params = new URLSearchParams({
    PropertyId: propertyId.toString(),
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  const response = await apiClient.get<WaterConnectionPagedResponse<WaterConnection>>(
    `/WaterConnection?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Fetch water connections failed"
    );
  }

  return response.data;
}

/** GET ALL connections for a property (unpaged) for stats calculation */
export async function getAllWaterConnections(
  propertyId: number
): Promise<WaterConnection[]> {
  const params = new URLSearchParams({
    PropertyId: propertyId.toString(),
    PageNumber: "1",
    PageSize: "-1", // Fetch all records
  });

  const response = await apiClient.get<WaterConnectionPagedResponse<WaterConnection>>(
    `/WaterConnection?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Fetch all water connections failed"
    );
  }

  return response.data.items ?? response.data.data ?? [];
}

/** GET by id */
export async function getWaterConnectionById(id: number): Promise<WaterConnection> {
  const response = await apiClient.get<WaterConnection>(`/WaterConnection/${id}`);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      `Fetch water connection ${id} failed`
    );
  }

  return response.data;
}

/** CREATE */
export async function createWaterConnection(data: WaterConnectionFormModel): Promise<WaterConnection> {
  const typeId = Number(data.waterConnectionTypeId);
  const sizeId = Number(data.waterConnectionSizeId);
  if (!Number.isInteger(typeId) || typeId <= 0) {
    throw new ApiError(400, "Invalid waterConnectionTypeId", "Create water connection failed");
  }
  if (!Number.isInteger(sizeId) || sizeId <= 0) {
    throw new ApiError(400, "Invalid waterConnectionSizeId", "Create water connection failed");
  }

  const payload = {
    propertyId: data.propertyId,
    waterConnectionTypeId: typeId,
    waterConnectionSizeId: sizeId,
    waterConnectionStatusId: data.waterConnectionStatusId ?? null,
    connectionNo: data.connectionNo.trim(),
    meterNo: data.meterNo?.trim() || null,
    connectionStartDate: data.installDate,
    isActive: data.isActive,
  };

  const response = await apiClient.post<WaterConnection>("/WaterConnection", payload);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Create water connection failed"
    );
  }

  return response.data;
}

/** UPDATE */
export async function updateWaterConnection(id: number, data: WaterConnectionFormModel): Promise<WaterConnection> {
  const typeId = Number(data.waterConnectionTypeId);
  const sizeId = Number(data.waterConnectionSizeId);
  if (!Number.isInteger(typeId) || typeId <= 0) {
    throw new ApiError(400, "Invalid waterConnectionTypeId", "Update water connection failed");
  }
  if (!Number.isInteger(sizeId) || sizeId <= 0) {
    throw new ApiError(400, "Invalid waterConnectionSizeId", "Update water connection failed");
  }

  const payload = {
    id,
    propertyId: data.propertyId,
    waterConnectionTypeId: typeId,
    waterConnectionSizeId: sizeId,
    waterConnectionStatusId: data.waterConnectionStatusId ?? null,
    connectionNo: data.connectionNo.trim(),
    meterNo: data.meterNo?.trim() || null,
    connectionStartDate: data.installDate,
    isActive: data.isActive,
  };

  const response = await apiClient.put<WaterConnection>(`/WaterConnection/${id}`, payload);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Update water connection failed"
    );
  }

  return response.data;
}

/** DELETE */
export async function deleteWaterConnection(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/WaterConnection/${id}`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      `Delete water connection ${id} failed`
    );
  }
}

/** GET connection types for dropdown */
export async function getWaterConnectionTypes(): Promise<WaterConnectionTypeLookup[]> {
  const params = new URLSearchParams({ PageSize: "200", IsActive: "true" });
  const response = await apiClient.get<WaterConnectionPagedResponse<WaterConnectionTypeLookup>>(
    `/WaterConnectionType?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Fetch connection types failed"
    );
  }

  return response.data.items ?? response.data.data ?? [];
}

/** GET connection sizes for dropdown */
export async function getWaterConnectionSizes(): Promise<WaterConnectionSizeLookup[]> {
  const params = new URLSearchParams({ PageSize: "200", IsActive: "true" });
  const response = await apiClient.get<WaterConnectionPagedResponse<WaterConnectionSizeLookup>>(
    `/WaterConnectionSize?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Fetch connection sizes failed"
    );
  }

  return response.data.items ?? response.data.data ?? [];
}

/** GET connection statuses for dropdown */
export async function getWaterConnectionStatuses(): Promise<WaterConnectionStatusLookup[]> {
  const params = new URLSearchParams({ PageSize: "200", IsActive: "true" });
  const response = await apiClient.get<WaterConnectionPagedResponse<WaterConnectionStatusLookup>>(
    `/WaterConnectionStatus?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Fetch connection statuses failed"
    );
  }

  return response.data.items ?? response.data.data ?? [];
}

/** GET water rate masters — optionally filter by typeId / sizeId */
export async function getWaterRateMasters(
  typeId?: number,
  sizeId?: number
): Promise<WaterRateMasterLookup[]> {
  const params = new URLSearchParams({ PageSize: "200", IsActive: "true" });
  if (typeId != null) params.append("WaterConnectionTypeId", typeId.toString());
  if (sizeId != null) params.append("WaterConnectionSizeId", sizeId.toString());

  const response = await apiClient.get<WaterConnectionPagedResponse<WaterRateMasterLookup>>(
    `/WaterRateMaster?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "",
      "Fetch water rate masters failed"
    );
  }

  return response.data.items ?? response.data.data ?? [];
}

/** GET property info by ID - used to display property details on water connection screen */
export async function getPropertyInfoById(propertyId: number): Promise<{
  id: number;
  propertyNo: string;
  displayProperty: string;
  ownerName: string;
  partType: string;
  mobileNo: string;
  emailId: string;
  address: string;
  taxZoneId: number;
  wardId: number;
  propertyTypeId: number;
} | null> {
  const response = await apiClient.get<{ items?: Array<Record<string, unknown>> }>(
    `/Property?Id=${propertyId}`
  );

  if (!response.success || !response.data?.items?.length) {
    return null;
  }

  const item = response.data.items[0];
  return {
    id: (item.id as number) ?? propertyId,
    propertyNo: (item.propertyNo as string) ?? "",
    displayProperty: (item.displayProperty as string) ?? "",
    ownerName: (item.ownerName as string) ?? "",
    partType: (item.partType as string) ?? "individual",
    mobileNo: (item.mobileNo as string) ?? "",
    emailId: (item.emailId as string) ?? "",
    address: (item.address as string) ?? "",
    taxZoneId: (item.taxZoneId as number) ?? 0,
    wardId: (item.wardId as number) ?? 0,
    propertyTypeId: (item.propertyTypeId as number) ?? 0,
  };
}
