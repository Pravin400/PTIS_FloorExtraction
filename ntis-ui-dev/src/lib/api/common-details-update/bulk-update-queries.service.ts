import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import {
  BulkUpdateMaster,
  BulkUpdateFieldConfig,
  PropertyPreviewRow,
  WardOption,
  WingOption,
  PropertyFilterParams,
} from "@/types/common-details-update/common-details-update.types";
import { createLogger } from "@/lib/utils/server-logger";
import type { WingItem } from "@/types/wing.types";

const logger = createLogger("BulkUpdateService");

// API response wrapper type
interface ApiWrappedResponse<T> {
  success: boolean;
  message: string;
  items: T;
  errors: unknown;
  correlationId: string | null;
}

export async function getBulkUpdateMenuServer(): Promise<BulkUpdateMaster[]> {
  try {
    const response = await apiClient.get<ApiWrappedResponse<BulkUpdateMaster[]>>(
      `/CommonDetails/master`
    );

    if (response.success && response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      
      // API returns {success, message, items: [...], errors, correlationId}
      if (data.items && Array.isArray(data.items)) {
        return data.items as BulkUpdateMaster[];
      }
      
      // Fallback: data itself is the array
      if (Array.isArray(data)) {
        return data as unknown as BulkUpdateMaster[];
      }
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.fetchMenuFailed"), "");
  } catch (error) {
    throw error;
  }
}

export async function getBulkUpdateFieldConfigServer(
  updateCode: string
): Promise<BulkUpdateFieldConfig[]> {
  try {
    const response = await apiClient.get<ApiWrappedResponse<BulkUpdateFieldConfig[]>>(
      `/CommonDetails/form-fields/${encodeURIComponent(updateCode)}`
    );

    if (response.success && response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      
      // API returns {success, message, items: [...], errors, correlationId}
      if (data.items && Array.isArray(data.items)) {
        return data.items as BulkUpdateFieldConfig[];
      }
      
      // Fallback: data itself is the array
      if (Array.isArray(data)) {
        return data as unknown as BulkUpdateFieldConfig[];
      }
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.fetchFieldConfigFailed"), "");
  } catch (error) {
    logger.error("Failed to fetch field configs", { updateCode, error });
    throw error;
  }
}

/**
 * Flattens the nested `currentValues` object into each row so grid columns
 * can access dynamic fields as top-level properties.
 * Converts PascalCase keys (e.g., AddressEnglish) to camelCase (addressEnglish).
 */
function flattenCurrentValues(items: PropertyPreviewRow[]): PropertyPreviewRow[] {
  try {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => {
      if (!item) return item;
      const raw = item as Record<string, unknown>;
      const cv = raw.currentValues;
      if (cv && typeof cv === "object" && !Array.isArray(cv)) {
        const flat: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(cv as Record<string, unknown>)) {
          if (!k) continue;
          const camelKey = k.charAt(0).toLowerCase() + k.slice(1);
          flat[camelKey] = v;
        }
        const { currentValues: _cv, ...rest } = raw;
        return { ...rest, ...flat } as PropertyPreviewRow;
      }
      return item;
    });
  } catch (err) {
    logger.error("flattenCurrentValues: Error", {}, err);
    return items;
  }
}

export async function getPropertiesForFilterServer(
  params: PropertyFilterParams
): Promise<PagedResponse<PropertyPreviewRow>> {
  // Build query params for GET request
  const queryParams = new URLSearchParams();
  if (params.wardId) {
    queryParams.append("WardId", String(params.wardId));
  }
  if (params.zoneId) {
    queryParams.append("ZoneId", String(params.zoneId));
  }
  if (params.propertyTypeId) {
    queryParams.append("PropertyTypeId", String(params.propertyTypeId));
  }
  if (params.fromPropertyNo) {
    queryParams.append("FromPropertyNo", params.fromPropertyNo);
  }
  if (params.toPropertyNo) {
    queryParams.append("ToPropertyNo", params.toPropertyNo);
  }
  if (params.wingId) {
    queryParams.append("Wing", params.wingId);
  }
  if (params.updateCode) {
    queryParams.append("UpdateCode", params.updateCode);
  }

  const url = `/CommonDetails/filter-properties?${queryParams.toString()}`;

  try {
    const response = await apiClient.get<PagedResponse<PropertyPreviewRow>>(url);

    if (response.data !== undefined) {
      const data = response.data as unknown as Record<string, unknown>;
      
      // API wraps response in {success, message, items, errors, correlationId}
      // where "items" is actually the PagedResponse
      if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        const pagedResponse = data.items as PagedResponse<PropertyPreviewRow>;
        if (pagedResponse.items && Array.isArray(pagedResponse.items)) {
          return {
            ...pagedResponse,
            items: flattenCurrentValues(pagedResponse.items),
          };
        }
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        return {
          items: flattenCurrentValues(data as unknown as PropertyPreviewRow[]),
          totalCount: data.length,
          pageNumber: 1,
          pageSize: data.length,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        };
      }
      
      // Handle standard PagedResponse format
      const typedData = data as unknown as PagedResponse<PropertyPreviewRow>;
      if (typedData.items && Array.isArray(typedData.items)) {
        return {
          ...typedData,
          items: flattenCurrentValues(typedData.items),
        };
      }
      
      logger.warn("getPropertiesForFilterServer: Unexpected data shape", {
        dataKeys: Object.keys(data),
      });
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.fetchPropertiesFailed"),
      "getPropertiesForFilterServer"
    );
  } catch (error) {
    logger.error("getPropertiesForFilterServer: Error", {}, error);
    throw error;
  }
}

export async function getWardsPagedServer(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<WardOption>> {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  try {
    const response = await apiClient.get<
      PagedResponse<WardOption> | { items: PagedResponse<WardOption> }
    >(`/Ward?${params.toString()}`);

    if (response.success && response.data) {
      return normalizePagedResponse<WardOption>(response.data);
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.fetchWardsFailed"),
      "getWardsPagedServer"
    );
  } catch (error) {
    throw error;
  }
}

export async function getWingsForWardServer(wardId: number): Promise<WingOption[]> {
  try {
    const response = await apiClient.get<{ items: WingOption[] } | WingOption[]>(
      `/Wing?WardId=${wardId}`
    );

    if (response.success && response.data) {
      // Handle both response formats: { items: [...] } or direct array
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if ('items' in data && Array.isArray(data.items)) {
        return data.items;
      }
    }

    return [];
  } catch (_error) {
    return [];
  }
}

export async function getDropdownOptionsServer(
  bindApi: string
): Promise<{ label: string; value: string }[]> {
  try {
    const response = await apiClient.get<
      { id: number | string; name: string; nameMarathi?: string }[]
    >(bindApi);

    if (response.success && response.data) {
      return Array.isArray(response.data)
        ? response.data.map((item) => ({
            label: item.name || String(item.id),
            value: String(item.id),
          }))
        : [];
    }

    return [];
  } catch (_error) {
    return [];
  }
}

/**
 * Property item returned from /Property endpoint for dropdown population
 */
export interface PropertyItem {
  id: number;
  wardId: number;
  propertyNo: string;
  partitionNo: string;
  displayProperty?: string;
  ownerName?: string;
  address?: string;
}

/**
 * Fetches properties by ward ID for populating From/To Property dropdowns.
 * Uses GET /Property?WardId={wardId}&PageSize=-1&PageNumber=1 to get all properties.
 */
export async function getPropertiesByWardServer(
  wardId: number
): Promise<PagedResponse<PropertyItem>> {
  const params = new URLSearchParams({
    WardId: wardId.toString(),
    PageSize: "-1", // Get all properties for the ward
    PageNumber: "1", // Start from page 1
  });

  try {
    logger.info("getPropertiesByWardServer: Fetching properties", { wardId, url: `/Property?${params.toString()}` });
    const response = await apiClient.get<unknown>(`/Property?${params.toString()}`);
    logger.info("getPropertiesByWardServer: Response received", { 
      success: response.success, 
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data as object) : []
    });

    if (response.success && response.data) {
      const data = response.data as Record<string, unknown>;
      
      // API wraps response in {success, message, items: PagedResponse, errors, correlationId}
      if (data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        const nestedData = data.items as Record<string, unknown>;
        // Check if it's a PagedResponse (has items array inside)
        if (nestedData.items && Array.isArray(nestedData.items)) {
          logger.info("getPropertiesByWardServer: Found nested PagedResponse", { itemCount: (nestedData.items as unknown[]).length });
          return {
            items: nestedData.items as PropertyItem[],
            totalCount: (nestedData.totalCount as number) || (nestedData.items as unknown[]).length,
            pageNumber: (nestedData.pageNumber as number) || 1,
            pageSize: (nestedData.pageSize as number) || (nestedData.items as unknown[]).length,
            totalPages: (nestedData.totalPages as number) || 1,
            hasPrevious: (nestedData.hasPrevious as boolean) || false,
            hasNext: (nestedData.hasNext as boolean) || false,
          };
        }
      }
      
      // Handle direct PagedResponse format
      if (data.items && Array.isArray(data.items)) {
        logger.info("getPropertiesByWardServer: Found direct items array", { itemCount: (data.items as unknown[]).length });
        return {
          items: data.items as PropertyItem[],
          totalCount: (data.totalCount as number) || (data.items as unknown[]).length,
          pageNumber: (data.pageNumber as number) || 1,
          pageSize: (data.pageSize as number) || (data.items as unknown[]).length,
          totalPages: (data.totalPages as number) || 1,
          hasPrevious: (data.hasPrevious as boolean) || false,
          hasNext: (data.hasNext as boolean) || false,
        };
      }
      
      logger.warn("getPropertiesByWardServer: Unexpected response format", { dataKeys: Object.keys(data) });
    }

    // Fallback to empty response
    logger.warn("No properties found for ward", { wardId });
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  } catch (error) {
    logger.error("Failed to fetch properties by ward", { wardId, error });
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }
}

// Re-export WingItem for convenience
export type { WingItem };

/**
 * Fetches all wings using GET /Wing?PageSize=-1.
 * Returns all wings for the Wing dropdown.
 */
export async function getAllWingsServer(): Promise<PagedResponse<WingItem>> {
  const params = new URLSearchParams({
    PageSize: "-1", // Get all wings
  });

  try {
    const response = await apiClient.get<
      PagedResponse<WingItem> | { items: WingItem[] }
    >(`/Wing?${params.toString()}`);

    if (response.success && response.data) {
      const data = response.data;
      // Handle nested response format
      if ('items' in data && Array.isArray(data.items)) {
        // Check if it's PagedResponse or just { items: [...] }
        if ('totalCount' in data) {
          return data as PagedResponse<WingItem>;
        }
        // Wrap array in PagedResponse format
        return {
          items: data.items,
          totalCount: data.items.length,
          pageNumber: 1,
          pageSize: data.items.length,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        };
      }
    }

    // Fallback to empty response
    logger.warn("No wings found");
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  } catch (error) {
    logger.error("Failed to fetch all wings", { error });
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }
}
