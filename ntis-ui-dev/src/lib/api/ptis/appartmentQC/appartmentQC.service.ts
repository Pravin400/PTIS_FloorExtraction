import { apiClient } from '@/services/api.service';
import { ApiError, handleApiResponse } from '@/lib/utils/api';
import { logger } from '@/lib/utils/logger';
import { getDownloadDocumentUrl, getViewDocumentUrl } from '@/lib/utils/document-utils';
import type { ApartmentQCDetail, ApartmentQCResponse, ApartmentQCSearchParams } from '@/types/apartmentQC.types';
import type { PropertyPhotoDto, PropertyPhotoTypeWithStatusDto } from '@/types/photoplan.types';
import type { ApiResponse } from '@/types/common.types';

/* ============================================================
   APARTMENT QC — SERVICE
   Base endpoint: /Property/apartmentQC-details
============================================================ */

/**
 * Configuration for mapping search params to URL query parameters
 */
type ParamConfig = {
  key: keyof ApartmentQCSearchParams;
  queryParam: string;
  shouldTrim?: boolean;
  skipEmptyCheck?: boolean;
};

const PARAM_MAPPINGS: ParamConfig[] = [
  { key: 'wardId', queryParam: 'WardId' },
  { key: 'propertyNo', queryParam: 'PropertyNo' },
  { key: 'partitionNo', queryParam: 'PartitionNo', shouldTrim: true },
  { key: 'propertyDetailsId', queryParam: 'PropertyDetailsId' },
  { key: 'propertyId', queryParam: 'PropertyId' },
  { key: 'partType', queryParam: 'PartType', shouldTrim: true },
  { key: 'type', queryParam: 'Type', shouldTrim: true },
  { key: 'pageNumber', queryParam: 'PageNumber', skipEmptyCheck: true },
  { key: 'pageSize', queryParam: 'PageSize', skipEmptyCheck: true },
  { key: 'searchTerm', queryParam: 'SearchTerm', shouldTrim: true },
  { key: 'sortBy', queryParam: 'SortBy', shouldTrim: true },
  { key: 'sortOrder', queryParam: 'SortOrder', shouldTrim: true },
  { key: 'filterLogic', queryParam: 'FilterLogic', skipEmptyCheck: true },
  // Column filter parameters
  { key: 'wing', queryParam: 'Wing', shouldTrim: true },
  { key: 'flatOrShopNo', queryParam: 'FlatOrShopNo', shouldTrim: true },
  { key: 'apartmentType', queryParam: 'ApartmentType', shouldTrim: true },
  { key: 'propertyType', queryParam: 'PropertyType', shouldTrim: true },
];

/**
 * Build a URLSearchParams object from the supplied search params.
 * Only non-empty / non-undefined values are included.
 * Uses configuration-driven approach for maintainability.
 */
function buildQueryParams(params: ApartmentQCSearchParams): URLSearchParams {
  const qs = new URLSearchParams();

  PARAM_MAPPINGS.forEach(({ key, queryParam, shouldTrim, skipEmptyCheck }) => {
    const value = params[key];

    if (value === undefined) return;

    // Skip empty string checks for numeric parameters
    if (!skipEmptyCheck && value === '') return;

    // Handle string trimming
    if (shouldTrim && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        qs.append(queryParam, trimmed);
      }
    } else {
      qs.append(queryParam, String(value));
    }
  });

  return qs;
}

/**
 * Fetch apartment QC details.
 */
export async function getApartmentQCDetails(
  params: ApartmentQCSearchParams = {}
): Promise<ApiResponse<ApartmentQCResponse>> {
  try {
    const qs = buildQueryParams(params);
    const endpoint = qs.toString()
      ? `/ApartmentQC?${qs.toString()}`
      : '/ApartmentQC';

    const response = apiClient.get<ApartmentQCResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment QC details', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch apartment QC details with error handling and user-friendly messages.
 */
export async function getApartmentQCDetailsLocalized(
  params: ApartmentQCSearchParams = {}
): Promise<ApartmentQCResponse> {
  try {
    const res = await getApartmentQCDetails(params);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch apartment QC details",
        "Get apartment QC details failed"
      );
    }
    if (!res.data) {
      throw new ApiError(500, "No data received from server", "Invalid response format");
    }
    return handleApiResponse(res, "Failed to fetch apartment QC details");
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment QC details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch apartment QC details"
    );
  }
}

/**
 * Convenience wrapper that returns the flat `items[]` array directly,
 * or an empty array on failure.
 */
export async function getApartmentQCDetailsSafe(
  params: ApartmentQCSearchParams = {}
): Promise<ApartmentQCDetail[]> {
  try {
    const data = await getApartmentQCDetailsLocalized(params);
    // data.items is PagedResponse<ApartmentQCDetail>, so access .items for the flat array
    return data.items?.items ?? [];
  } catch (err) {
    logger.error('[appartmentQC.service] Failed to fetch apartment QC details', {
      error: err instanceof Error ? err : new Error(String(err)),
      params,
    });
    return [];
  }
}

/**
 * Update apartment QC property details.
 */
export async function updateApartmentQCDetails(
  propertyDetailsId: number | string,
  payload: Partial<ApartmentQCDetail>
): Promise<ApiResponse<ApartmentQCDetail>> {
  try {
    const endpoint = `/ApartmentQC/${propertyDetailsId}`;
    const response = await apiClient.put<ApartmentQCDetail>(endpoint, payload);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error updating apartment QC details', { error: error as Error });
    throw error;
  }
}

/**
 * Update apartment QC property details with error handling and user-friendly messages.
 */
export async function updateApartmentQCDetailsLocalized(
  propertyDetailsId: number | string,
  payload: Partial<ApartmentQCDetail>
): Promise<ApartmentQCDetail> {
  try {
    const res = await updateApartmentQCDetails(propertyDetailsId, payload);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to update apartment QC details",
        "Update apartment QC details failed"
      );
    }
    return handleApiResponse(res, "Failed to update apartment QC details");
  } catch (error) {
    logger.error('[appartmentQC.service] Error updating apartment QC details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to update apartment QC details"
    );
  }
}

/* ============================================================
   FLOOR QC — NEW API ENDPOINT
   Endpoint: GET /Property/apartmentQC-details/{propertyId}?type={type}
   Returns all floor records for a property filtered by type (rateable, capital, dual)
============================================================ */

/**
 * Fetch Floor QC details by propertyId and type.
 * Uses the new endpoint pattern: /Property/apartmentQC-details/{propertyId}?type={type}
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param type - The type filter: 'rateable', 'capital', or 'dual'
 * @returns API response with floor QC details
 */
export async function getFloorQCByPropertyId(
  id: number | string,
  type: 'rateable' | 'capital' | 'dual' | string
): Promise<ApiResponse<ApartmentQCResponse>> {
  try {
    const typeParam = type ? `?type=${encodeURIComponent(type)}` : '';
    const endpoint = `/ApartmentQC/${id}${typeParam}`;
    const response = await apiClient.get<ApartmentQCResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching floor QC by property ID', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch Floor QC details by propertyId and type with error handling.
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param type - The type filter: 'rateable', 'capital', or 'dual'
 * @returns Apartment QC response with floor details
 */
export async function getFloorQCByPropertyIdLocalized(
  propertyId: number | string,
  type: 'rateable' | 'capital' | 'dual' | string
): Promise<ApartmentQCResponse> {
  try {
    const res = await getFloorQCByPropertyId(propertyId, type);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch floor QC details",
        "Get floor QC details failed"
      );
    }
    return handleApiResponse(res, "Failed to fetch floor QC details");
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching floor QC details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch floor QC details"
    );
  }
}

/**
 * Safe wrapper - Fetch Floor QC details by propertyId and type.
 * Returns the flat items array directly, or empty array on failure.
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param type - The type filter: 'rateable', 'capital', or 'dual'
 * @returns Array of ApartmentQCDetail items (floor records)
 */
export async function getFloorQCByPropertyIdSafe(
  propertyId: number | string,
  type: 'rateable' | 'capital' | 'dual' | string
): Promise<ApartmentQCDetail[]> {
  try {
    const data = await getFloorQCByPropertyIdLocalized(propertyId, type);
    // data.items is PagedResponse<ApartmentQCDetail>, extract the flat items array
    return data.items?.items ?? [];
  } catch (err) {
    logger.error('[appartmentQC.service] Failed to fetch floor QC details by propertyId', {
      error: err instanceof Error ? err : new Error(String(err)),
      propertyId,
      type,
    });
    return [];
  }
}

/* ============================================================
   FLOOR QC — UPDATE API ENDPOINT (PATCH)
   Endpoint: PATCH /Property/apartmentQC-details/{propertyId}/detail/{detailId}
   Updates a specific floor detail record
============================================================ */

/**
 * Payload for updating a floor QC detail record
 */
export interface FloorQCUpdatePayload {
  id?: number;
  pdnId?: number;
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
 * @returns API response
 */
export async function updateFloorQCDetail(
  _propertyId: number | string,
  detailId: number | string,
  payload: FloorQCUpdatePayload
): Promise<ApiResponse<unknown>> {
  try {
    // Using the PATCH bulk endpoint for a single record update
    const endpoint = `/ApartmentQC/${_propertyId}`;
    const response = await apiClient.patch<unknown>(endpoint, [
      { ...payload, detailId: Number(detailId) }
    ]);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error updating floor QC detail', { error: error as Error });
    throw error;
  }
}

/**
 * Update a Floor QC detail record with error handling.
 * 
 * @param propertyId - The property ID (e.g., 550299)
 * @param detailId - The detail ID / pdnId (e.g., 206147)
 * @param payload - The fields to update
 * @returns Updated data or throws error
 */
export async function updateFloorQCDetailLocalized(
  propertyId: number | string,
  detailId: number | string,
  payload: FloorQCUpdatePayload
): Promise<unknown> {
  try {
    const res = await updateFloorQCDetail(propertyId, detailId, payload);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to update floor QC detail",
        "Update floor QC detail failed"
      );
    }
    return handleApiResponse(res, "Failed to update floor QC detail");
  } catch (error) {
    logger.error('[appartmentQC.service] Error updating floor QC detail', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to update floor QC detail"
    );
  }
}

/* ============================================================
   FLOOR QC — BULK UPDATE API ENDPOINT (PATCH)
   Endpoint: PATCH /Property/apartmentQC-details/{propertyId}/details
   Updates multiple floor detail records at once
============================================================ */

/**
 * Payload for bulk updating floor QC detail records
 */
export interface FloorQCBulkUpdateItem extends FloorQCUpdatePayload {
  detailId: number; // The pdnId of the floor detail to update
}

/**
 * Bulk update Floor QC detail records by propertyId.
 * Uses the PATCH endpoint: /Property/apartmentQC-details/{propertyId}
 * 
 * @param propertyId - The property ID (e.g., 550516)
 * @param items - Array of floor detail updates
 * @returns API response
 */
export async function updateFloorQCDetailsBulk(
  propertyId: number | string,
  items: FloorQCBulkUpdateItem[]
): Promise<ApiResponse<unknown>> {
  try {
    const endpoint = `/ApartmentQC/${propertyId}`;
    const response = await apiClient.patch<unknown>(endpoint, items);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error bulk updating floor QC details', { error: error as Error });
    throw error;
  }
}

/**
 * Bulk update Floor QC detail records with error handling.
 * 
 * @param propertyId - The property ID (e.g., 550516)
 * @param items - Array of floor detail updates
 * @returns Updated data or throws error
 */
export async function updateFloorQCDetailsBulkLocalized(
  propertyId: number | string,
  items: FloorQCBulkUpdateItem[]
): Promise<unknown> {
  try {
    const res = await updateFloorQCDetailsBulk(propertyId, items);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to update floor QC details",
        "Bulk update floor QC details failed"
      );
    }
    return handleApiResponse(res, "Failed to update floor QC details");
  } catch (error) {
    logger.error('[appartmentQC.service] Error bulk updating floor QC details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to update floor QC details"
    );
  }
}

/* ============================================================
   BASIC DETAILS — UPDATE API ENDPOINT (PATCH)
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
 * @returns API response
 */
export async function updateBasicDetails(
  propertyId: number | string,
  payload: BasicDetailsUpdatePayload
): Promise<ApiResponse<unknown>> {
  try {
    const endpoint = `/ApartmentQC/${propertyId}/basic-details`;
    const response = await apiClient.patch<unknown>(endpoint, payload);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error updating basic details', { error: error as Error });
    throw error;
  }
}

/**
 * Update basic details with error handling.
 * 
 * @param propertyId - The property ID (e.g., 549357)
 * @param payload - The fields to update
 * @returns Updated data or throws error
 */
export async function updateBasicDetailsLocalized(
  propertyId: number | string,
  payload: BasicDetailsUpdatePayload
): Promise<unknown> {
  try {
    const res = await updateBasicDetails(propertyId, payload);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to update basic details",
        "Update basic details failed"
      );
    }
    return handleApiResponse(res, "Failed to update basic details");
  } catch (error) {
    logger.error('[appartmentQC.service] Error updating basic details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to update basic details"
    );
  }
}

/* ============================================================
   OLD PROPERTY DATA — FETCH API ENDPOINT
   Endpoint: GET /ApartmentQC/old-property?oldPropertyNo={oldPropertyNo}
   Fetches historical data for an old property number
============================================================ */

/**
 * Response structure for old property data
 */
export interface OldPropertyData {
  oldPropertyNo: string;
  oldConstructionArea: number | null;
  oldRV: number | null;
  oldTotalTax: number | null;
  oldUseType: string | null;
  oldConstructionYear: string | null;
  oldConstructionType: string | null;
  oldCSN: string | null;
}

export interface OldPropertyResponse {
  success: boolean;
  message: string;
  items: OldPropertyData;
  errors: string[] | null;
  correlationId: string | null;
}

/**
 * Fetch old property data by old property number.
 * 
 * @param oldPropertyNo - The old property number (e.g., "22")
 * @returns API response with old property data
 */
export async function getOldPropertyData(
  oldPropertyNo: string
): Promise<ApiResponse<OldPropertyResponse>> {
  try {
    const endpoint = `/ApartmentQC/old-property?oldPropertyNo=${encodeURIComponent(oldPropertyNo)}`;
    const response = await apiClient.get<OldPropertyResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching old property data', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch old property data with error handling.
 *
 * @param oldPropertyNo - The old property number (e.g., "22")
 * @returns Old property data or throws error
 */
export async function getOldPropertyDataLocalized(
  oldPropertyNo: string
): Promise<OldPropertyData> {
  try {
    const response = await getOldPropertyData(oldPropertyNo);
    if (!response.success || !response.data) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || 'Failed to fetch old property data',
        'Get old property data failed'
      );
    }
    return response.data.items;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching old property data', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      'Failed to fetch old property data'
    );
  }
}

/* ============================================================
   SYNC ROOMS — POST /ApartmentQC/{propertyId}/{propertyDetailsId}/sync-rooms
   Recomputes/aggregates rooms after a RoomWiseSubmission PUT.
   No request body; path params only.
============================================================ */

export async function syncRoomsForPropertyDetails(
  propertyId: number | string,
  propertyDetailsId: number | string
): Promise<ApiResponse<unknown>> {
  try {
    const endpoint = `/ApartmentQC/${propertyId}/${propertyDetailsId}/sync-rooms`;
    const response = await apiClient.post<unknown>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error syncing rooms', { error: error as Error });
    throw error;
  }
}

export async function syncRoomsForPropertyDetailsLocalized(
  propertyId: number | string,
  propertyDetailsId: number | string
): Promise<unknown> {
  try {
    const res = await syncRoomsForPropertyDetails(propertyId, propertyDetailsId);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.message || res.error || "Failed to sync rooms",
        "Sync rooms failed"
      );
    }
    return handleApiResponse(res, "Failed to sync rooms");
  } catch (error) {
    logger.error('[appartmentQC.service] Error syncing rooms', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to sync rooms"
    );
  }
}

/* ============================================================
   FILTER OPTIONS — GET /ApartmentQC/filter-options
   Fetches distinct filter options for column filters.
============================================================ */

export type FilterField = 'wing' | 'flatOrShopNo' | 'apartmentType' | 'propertyType';

export interface FilterOptionsResponse {
  success: boolean;
  message: string;
  items: {
    wings: string[];
    apartmentTypes: string[];
    flatOrShopNos: string[];
    propertyTypes: number[];
  };
  errors: unknown;
  correlationId: string | null;
}

/**
 * Fetch filter options for a specific field.
 * 
 * @param wardId - The ward ID
 * @param propertyNo - The property number
 * @param field - The field to get filter options for: 'wing', 'flatOrShopNo', 'apartmentType', 'propertyType'
 * @returns FilterOptionsResponse
 */
export async function getFilterOptions(
  wardId: number | string,
  propertyNo: string,
  field: FilterField,
  partType?: string
): Promise<ApiResponse<FilterOptionsResponse>> {
  try {
    const params = new URLSearchParams();
    params.append('WardId', String(wardId));
    params.append('PropertyNo', propertyNo);
    params.append('field', field);
    if (partType) {
      params.append('PartType', partType);
    }

    const endpoint = `/ApartmentQC/filter-options?${params.toString()}`;
    const response = await apiClient.get<FilterOptionsResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching filter options', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch filter options with error handling.
 */
export async function getFilterOptionsLocalized(
  wardId: number | string,
  propertyNo: string,
  field: FilterField,
  partType?: string
): Promise<FilterOptionsResponse> {
  try {
    const res = await getFilterOptions(wardId, propertyNo, field, partType);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch filter options",
        "Fetch filter options failed"
      );
    }
    return handleApiResponse(res, "Failed to fetch filter options") as FilterOptionsResponse;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching filter options', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch filter options"
    );
  }
}

/* ============================================================
   EXCEL EXPORT (Client-side)
   Endpoint: GET /ApartmentQC/export-excel?WardId={wardId}&PropertyNo={propertyNo}
   Returns Excel file as blob
   Note: This function runs client-side for direct file download
============================================================ */

/**
 * Export apartment QC data to Excel (client-side).
 * Downloads the Excel file directly in the browser.
 * 
 * @param baseUrl - The API base URL
 * @param authToken - The auth token for authorization
 * @param wardId - The ward ID
 * @param propertyNo - The property number
 * @param filename - Optional filename for the download (defaults to 'apartment-qc-export.xlsx')
 */
export async function exportApartmentQCToExcel(
  baseUrl: string,
  authToken: string,
  wardId: number | string,
  propertyNo: string,
  filename: string = 'apartment-qc-export.xlsx'
): Promise<void> {
  const params = new URLSearchParams();
  params.append('WardId', String(wardId));
  params.append('PropertyNo', propertyNo);

  const endpoint = `${baseUrl}/ApartmentQC/export-excel?${params.toString()}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Failed to export Excel: ${response.statusText}`,
      "Export Excel failed"
    );
  }

  const blob = await response.blob();

  // Create download link and trigger download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS — GET
   Endpoint: GET /Property/apartment-property-tax-details-rv
   Fetches aggregated tax details for apartment properties by type
   ============================================================ */

import type {
  ApartmentPropertyTaxDetailsResponse,
  ApartmentPropertyTaxDetailsParams,
  ApartmentTaxDetailsItems,
  ApartmentPartType,
} from '@/types/apartmentQC.types';

/**
  * Fetch apartment property tax details for a specific part type.
 * 
* @param params - WardId, PropertyNo, and PartType (Amenity=Amenities, C=Commercial, R=Residential)
 * @returns API response with tax amounts
 */
export async function getApartmentPropertyTaxDetails(
  params: ApartmentPropertyTaxDetailsParams
): Promise<ApiResponse<ApartmentPropertyTaxDetailsResponse>> {
  try {
    const qs = new URLSearchParams();
    qs.append('WardId', String(params.wardId));
    qs.append('PropertyNo', params.propertyNo);
    qs.append('PartType', params.partType);
    if (params.partitionNo) {
      qs.append('PartitionNo', params.partitionNo);
    }

    const endpoint = `/Property/apartment-property-tax-details-rv?${qs.toString()}`;
    const response = await apiClient.get<ApartmentPropertyTaxDetailsResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property tax details', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch apartment property tax details with error handling.
 * 
 * @param params - WardId, PropertyNo, and Type
 * @returns Tax details items or throws error
 */
export async function getApartmentPropertyTaxDetailsLocalized(
  params: ApartmentPropertyTaxDetailsParams
): Promise<ApartmentTaxDetailsItems> {
  try {
    const res = await getApartmentPropertyTaxDetails(params);
    if (!res.success || !res.data) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch apartment property tax details",
        "Get apartment property tax details failed"
      );
    }
    if (!res.data.items) {
      throw new ApiError(500, "No tax details data received", "Invalid response format");
    }
    return res.data.items;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property tax details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch apartment property tax details"
    );
  }
}

/**
 * Fetch apartment property tax details with safe fallback (returns null on error).
 * 
 * @param params - WardId, PropertyNo, and PartType
 * @returns Tax details items or null on failure
 */
export async function getApartmentPropertyTaxDetailsSafe(
  params: ApartmentPropertyTaxDetailsParams
): Promise<ApartmentTaxDetailsItems | null> {
  try {
    return await getApartmentPropertyTaxDetailsLocalized(params);
  } catch (err) {
    logger.error('[appartmentQC.service] Failed to fetch apartment property tax details', {
      error: err instanceof Error ? err : new Error(String(err)),
      params,
    });
    return null;
  }
}

/**
 * Convert main tab value to PartType for API call.
 * @param mainTab - The main tab value: 'amenities', 'commercial', or 'residential'
 * @returns The corresponding PartType value
 */
export function getPartTypeFromMainTab(mainTab: string): ApartmentPartType {
  switch (mainTab) {
    case 'commercial':
      return 'C';
    case 'residential':
      return 'R';
    case 'amenities':
    default:
      return 'Amenity';
  }
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS — CAPITAL VALUE (CV)
   Endpoint: GET /Property/apartment-property-tax-details-cv
   Fetches capital value tax details for apartment properties by PartType

/**
 * Fetch apartment property tax details for Capital Value (CV).
 * 
* @param params - WardId, PropertyNo, and PartType (Amenity=Amenities, C=Commercial, R=Residential)
 * @returns API response with tax amounts
 */
export async function getApartmentPropertyTaxDetailsCv(
  params: ApartmentPropertyTaxDetailsParams
): Promise<ApiResponse<ApartmentPropertyTaxDetailsResponse>> {
  try {
    const qs = new URLSearchParams();
    qs.append('WardId', String(params.wardId));
    qs.append('PropertyNo', params.propertyNo);
    qs.append('PartType', params.partType);
    if (params.partitionNo) {
      qs.append('PartitionNo', params.partitionNo);
    }

    const endpoint = `/Property/apartment-property-tax-details-cv?${qs.toString()}`;
    const response = await apiClient.get<ApartmentPropertyTaxDetailsResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property CV tax details', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch apartment property CV tax details with error handling.
 * 
 * @param params - WardId, PropertyNo, and PartType
 * @returns Tax details items or throws error
 */
export async function getApartmentPropertyTaxDetailsCvLocalized(
  params: ApartmentPropertyTaxDetailsParams
): Promise<ApartmentTaxDetailsItems> {
  try {
    const res = await getApartmentPropertyTaxDetailsCv(params);
    if (!res.success || !res.data) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch apartment property CV tax details",
        "Get apartment property CV tax details failed"
      );
    }
    if (!res.data.items) {
      throw new ApiError(500, "No CV tax details data received", "Invalid response format");
    }
    return res.data.items;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property CV tax details', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch apartment property CV tax details"
    );
  }
}

/**
 * Fetch apartment property CV tax details with safe fallback (returns null on error).
 * 
 * @param params - WardId, PropertyNo, and PartType
 * @returns Tax details items or null on failure
 */
export async function getApartmentPropertyTaxDetailsCvSafe(
  params: ApartmentPropertyTaxDetailsParams
): Promise<ApartmentTaxDetailsItems | null> {
  try {
    return await getApartmentPropertyTaxDetailsCvLocalized(params);
  } catch (err) {
    logger.error('[appartmentQC.service] Failed to fetch apartment property CV tax details', {
      error: err instanceof Error ? err : new Error(String(err)),
      params,
    });
    return null;
  }
}

/* ============================================================
   DUAL METHOD TAX DETAILS
   Fetches both RV and CV tax details for dual method display
============================================================ */

// Re-export the shared type from types file to avoid duplication
export type { DualMethodTaxDetails } from '@/types/apartmentQC.types';
import type { DualMethodTaxDetails } from '@/types/apartmentQC.types';

/**
 * Fetch both Rateable Value and Capital Value tax details for dual method.
 * Makes parallel API calls for both methods.
 * 
 * @param wardId - The ward ID
 * @param propertyNo - The property number
* @param partType - The part type (Amenity, C, or R)
 * @param partitionNo - (Optional) The partition number
 * @returns Object containing both RV and CV tax details
 */
export async function getDualMethodTaxDetails(
  wardId: string | number,
  propertyNo: string,
  partType: ApartmentPartType,
  partitionNo?: string
): Promise<DualMethodTaxDetails> {
  const params = { wardId, propertyNo, partType, partitionNo };

  const [rateable, capital] = await Promise.all([
    getApartmentPropertyTaxDetailsSafe(params),
    getApartmentPropertyTaxDetailsCvSafe(params),
  ]);

  return {
    rateable,
    capital,
  };
}

/* ============================================================
   PROPERTY PHOTOS — FETCH API
   Endpoint: GET /property-photos/types-with-status/{propertyId}
   Fetches photo slots and normalizes the items that already have documents
 ============================================================ */

interface PropertyPhotoApiWrapper<T> {
  success: boolean;
  message?: string;
  items?: T[];
  errors?: string[] | null;
  correlationId?: string | null;
}

function normalizePropertyPhoto(
  item: Partial<PropertyPhotoDto & PropertyPhotoTypeWithStatusDto>,
  propertyId: number
): PropertyPhotoDto | null {
  const documentGuid = typeof item.documentGuid === 'string' ? item.documentGuid.trim() : '';
  if (!documentGuid) {
    return null;
  }

  return {
    propertyPhotoId: item.propertyPhotoId ?? item.photoTypeId ?? 0,
    propertyId: item.propertyId ?? propertyId,
    photoTypeId: item.photoTypeId ?? 0,
    photoTypeCode: item.photoTypeCode ?? '',
    photoTypeName: item.photoTypeName ?? item.photoTypeCode ?? '',
    displayOrder: item.displayOrder,
    remarks: item.remarks,
    documentGuid,
    fileName: item.fileName,
    mimeType: item.mimeType,
    viewUrl: item.viewUrl || getViewDocumentUrl(documentGuid),
    downloadUrl: item.downloadUrl || getDownloadDocumentUrl(documentGuid),
  };
}

function sortPropertyPhotos<T extends { displayOrder?: number; propertyPhotoId?: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const displayOrderDiff = (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER);
    if (displayOrderDiff !== 0) {
      return displayOrderDiff;
    }

    return (a.propertyPhotoId ?? 0) - (b.propertyPhotoId ?? 0);
  });
}

function selectApartmentQcViewerPhotos(
  items: Array<Partial<PropertyPhotoDto & PropertyPhotoTypeWithStatusDto>>,
  propertyId: number
): PropertyPhotoDto[] {
  const selectedPhotos = new Map<string, PropertyPhotoDto>();

  for (const item of sortPropertyPhotos(items)) {
    const normalizedPhoto = normalizePropertyPhoto(item, propertyId);
    if (!normalizedPhoto) {
      continue;
    }

    const uniqueKey =
      normalizedPhoto.propertyPhotoId > 0
        ? `photo:${normalizedPhoto.propertyPhotoId}`
        : `document:${normalizedPhoto.documentGuid}`;

    if (!selectedPhotos.has(uniqueKey)) {
      selectedPhotos.set(uniqueKey, normalizedPhoto);
    }
  }

  return Array.from(selectedPhotos.values());
}

export async function getPropertyPhotos(
  propertyId: number
): Promise<ApiResponse<PropertyPhotoDto[]>> {
  try {
    const [slotResult, photoResult] = await Promise.allSettled([
      apiClient.get<PropertyPhotoApiWrapper<PropertyPhotoTypeWithStatusDto>>(
        `/property-photos/types-with-status/${propertyId}`,
        { cache: 'no-store' }
      ),
      apiClient.get<PropertyPhotoApiWrapper<PropertyPhotoDto>>(
        `/property-photos/property/${propertyId}`,
        { cache: 'no-store' }
      ),
    ]);

    const slotResponse = slotResult.status === 'fulfilled' ? slotResult.value : null;
    const photoResponse = photoResult.status === 'fulfilled' ? photoResult.value : null;

    const slotPhotos =
      slotResponse?.success && slotResponse.data?.success
        ? (slotResponse.data.items ?? []).filter((item) => item.hasPhoto && !!item.documentGuid)
        : [];

    const propertyPhotos =
      photoResponse?.success && photoResponse.data?.success ? (photoResponse.data.items ?? []) : [];

    const allPhotos = selectApartmentQcViewerPhotos(
      [...propertyPhotos, ...slotPhotos],
      propertyId
    );

    if (allPhotos.length > 0) {
      return {
        success: true,
        statusCode: photoResponse?.statusCode ?? slotResponse?.statusCode,
        data: allPhotos,
        message:
          photoResponse?.data?.message ||
          slotResponse?.data?.message ||
          photoResponse?.message ||
          slotResponse?.message,
      };
    }

    return {
      success: false,
      statusCode: slotResponse?.statusCode || photoResponse?.statusCode || 500,
      error:
        slotResponse?.error ||
        photoResponse?.error ||
        'Failed to fetch property photos',
      message:
        slotResponse?.message ||
        photoResponse?.message ||
        'Failed to fetch property photos',
    };
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching property photos', { error: error as Error });
    return { success: false, statusCode: 500, error: error instanceof Error ? error.message : 'Failed to fetch property photos' };
  }
}

/**
 * Fetch property photos with error handling.
 * 
 * @param propertyId - The property ID
 * @returns Array of PropertyPhotoDto or throws error
 */
export async function getPropertyPhotosLocalized(
  propertyId: number
): Promise<PropertyPhotoDto[]> {
  try {
    const res = await getPropertyPhotos(propertyId);
    if (!res.success || !res.data) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch property photos",
        "Get property photos failed"
      );
    }
    return res.data;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching property photos', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch property photos"
    );
  }
}

/**
 * Safe wrapper - Fetch property photos. Returns empty array on failure.
 * 
 * @param propertyId - The property ID
 * @returns Array of PropertyPhotoDto or empty array on failure
 */
export async function getPropertyPhotosSafe(
  propertyId: number
): Promise<PropertyPhotoDto[]> {
  try {
    return await getPropertyPhotosLocalized(propertyId);
  } catch {
    return [];
  }
}

/* ============================================================
   APARTMENT PROPERTY TAX DETAILS BY PROPERTY ID
   These functions use `Id` parameter instead of WardId/PropertyNo
   Used by PropertyDetailsEditScreen drawer
 ============================================================ */

import type { ApartmentPropertyTaxDetailsByIdParams } from '@/types/apartmentQC.types';

/**
 * Fetch apartment property tax details (Rateable Value) by property ID.
 * API: GET /Property/apartment-property-tax-details-rv?Id={propertyId}&PartType={partType}
 * 
 * @param params - propertyId and PartType
 * @returns API response with tax amounts
 */
export async function getApartmentPropertyTaxDetailsById(
  params: ApartmentPropertyTaxDetailsByIdParams
): Promise<ApiResponse<ApartmentPropertyTaxDetailsResponse>> {
  try {
    const qs = new URLSearchParams();
    qs.append('Id', String(params.propertyId));
    qs.append('PartType', params.partType);

    const endpoint = `/Property/apartment-property-tax-details-rv?${qs.toString()}`;
    const response = await apiClient.get<ApartmentPropertyTaxDetailsResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property tax details by ID', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch apartment property tax details by ID with error handling.
 * 
 * @param params - propertyId and PartType
 * @returns Tax details items or throws error
 */
export async function getApartmentPropertyTaxDetailsByIdLocalized(
  params: ApartmentPropertyTaxDetailsByIdParams
): Promise<ApartmentTaxDetailsItems | null> {
  try {
    const res = await getApartmentPropertyTaxDetailsById(params);

    if (!res.success || !res.data) {
      if (res.statusCode === 404) {
        return null;
      }
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch apartment property tax details",
        "Get apartment property tax details failed"
      );
    }
    if (!res.data.items) {
      throw new ApiError(500, "No tax details data received", "Invalid response format");
    }
    return res.data.items;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property tax details by ID', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch apartment property tax details"
    );
  }
}

/**
 * Safe wrapper that returns null instead of throwing.
 */
export async function getApartmentPropertyTaxDetailsByIdSafe(
  params: ApartmentPropertyTaxDetailsByIdParams
): Promise<ApartmentTaxDetailsItems | null> {
  try {
    return await getApartmentPropertyTaxDetailsByIdLocalized(params);
  } catch {
    return null;
  }
}

/**
 * Fetch apartment property Capital Value (CV) tax details by property ID.
 * API: GET /Property/apartment-property-tax-details-cv?Id={propertyId}&PartType={partType}
 * 
 * @param params - propertyId and PartType
 * @returns API response with CV tax amounts
 */
export async function getApartmentPropertyTaxDetailsCvById(
  params: ApartmentPropertyTaxDetailsByIdParams
): Promise<ApiResponse<ApartmentPropertyTaxDetailsResponse>> {
  try {
    const qs = new URLSearchParams();
    qs.append('Id', String(params.propertyId));
    qs.append('PartType', params.partType);

    const endpoint = `/Property/apartment-property-tax-details-cv?${qs.toString()}`;
    const response = await apiClient.get<ApartmentPropertyTaxDetailsResponse>(endpoint);
    return response;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property CV tax details by ID', { error: error as Error });
    throw error;
  }
}

/**
 * Fetch apartment property CV tax details by ID with error handling.
 * 
 * @param params - propertyId and PartType
 * @returns CV tax details items or throws error
 */
export async function getApartmentPropertyTaxDetailsCvByIdLocalized(
  params: ApartmentPropertyTaxDetailsByIdParams
): Promise<ApartmentTaxDetailsItems | null> {
  try {
    const res = await getApartmentPropertyTaxDetailsCvById(params);
    if (!res.success || !res.data) {
      if (res.statusCode === 404) {
        return null;
      }
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || "Failed to fetch apartment property CV tax details",
        "Get apartment property CV tax details failed"
      );
    }
    if (!res.data.items) {
      throw new ApiError(500, "No CV tax details data received", "Invalid response format");
    }
    return res.data.items;
  } catch (error) {
    logger.error('[appartmentQC.service] Error fetching apartment property CV tax details by ID', { error: error as Error });
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      error instanceof Error ? error.message : String(error),
      "Failed to fetch apartment property CV tax details"
    );
  }
}

/**
 * Safe wrapper for CV that returns null instead of throwing.
 */
export async function getApartmentPropertyTaxDetailsCvByIdSafe(
  params: ApartmentPropertyTaxDetailsByIdParams
): Promise<ApartmentTaxDetailsItems | null> {
  try {
    return await getApartmentPropertyTaxDetailsCvByIdLocalized(params);
  } catch {
    return null;
  }
}

/**
 * Fetch both Rateable Value and Capital Value tax details for dual method by property ID.
 * Makes parallel API calls for both methods.
 * 
 * @param propertyId - The property ID
 * @param partType - The part type (Aminity, C, or R)
 * @returns Object containing both RV and CV tax details
 */
export async function getDualMethodTaxDetailsById(
  propertyId: string | number,
  partType: ApartmentPartType
): Promise<DualMethodTaxDetails> {
  const params = { propertyId, partType };

  const [rateable, capital] = await Promise.all([
    getApartmentPropertyTaxDetailsByIdSafe(params),
    getApartmentPropertyTaxDetailsCvByIdSafe(params),
  ]);

  return {
    rateable,
    capital,
  };
}
