/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
  PropertyFilterByCategoryParams,
  FieldRegistrySchema,
  FieldRegistryTable,
  FieldRegistryColumn,
  UpdateHistoryItem,
  UpdateHistoryDetailItem,
  UpdateHistoryFilterParams,
} from "@/types/common-details-update/common-details-update.types";
import { createLogger } from "@/lib/utils/server-logger";
import type { WingItem } from "@/types/wing.types";
import { cookies } from "next/headers";
import { getAppConfig } from "@/config/app.config";

// Re-export WingItem for convenience
export type { WingItem };

export interface ScopeOption {
  id: number;
  name: string;
  displayName: string;
  description: string;
  options: string[];
}

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
        return (data.items as BulkUpdateMaster[]).filter((item) => item.isActive !== false);
      }
      
      // Fallback: data itself is the array
      if (Array.isArray(data)) {
        return (data as unknown as BulkUpdateMaster[]).filter((item) => item.isActive !== false);
      }
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.fetchMenuFailed"), "");
  } catch (error) {
    throw error;
  }
}

export async function getSourceTablesServer(): Promise<{ id: number; tableName: string }[]> {
  try {
    const response = await apiClient.get<ApiWrappedResponse<{ id: number; tableName: string }[]>>(
      `/CommonDetails/source-tables`
    );

    if (response.success && response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      
      if (data.items && Array.isArray(data.items)) {
        return data.items as { id: number; tableName: string }[];
      }
      
      if (Array.isArray(data)) {
        return data as { id: number; tableName: string }[];
      }
    }
    return [];
  } catch (error) {
    logger.error("Failed to fetch source tables", {}, error);
    return [];
  }
}

export async function getSourceTableFieldsServer(sourceTableId: number): Promise<{ id: number; tableFieldName: string }[]> {
  try {
    const response = await apiClient.get<ApiWrappedResponse<{ id: number; tableFieldName: string }[]>>(
      `/CommonDetails/source-table-fields/${sourceTableId}`
    );

    if (response.success && response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      
      if (data.items && Array.isArray(data.items)) {
        return data.items as { id: number; tableFieldName: string }[];
      }
      
      if (Array.isArray(data)) {
        return data as { id: number; tableFieldName: string }[];
      }
    }
    return [];
  } catch (error) {
    logger.error("Failed to fetch source table fields", { sourceTableId }, error);
    return [];
  }
}

const STATIC_SCOPE_OPTIONS: ScopeOption[] = [
  {
    id: 1,
    name: "WardSector",
    displayName: "Ward / Sector",
    description: "Multi ward selection",
    options: ["Zone", "Ward", "Property Type"]
  },
  {
    id: 2,
    name: "BuildingWise",
    displayName: "Building Wise",
    description: "Building level",
    options: ["Zone", "Ward", "Property No"]
  },
  {
    id: 3,
    name: "PropertyRange",
    displayName: "Property Range",
    description: "From-to property range",
    options: ["Ward", "From Property", "To Property"]
  }
];

export async function getScopeOptionsServer(): Promise<ScopeOption[]> {
  try {
    // Returning static options instead of API call as requested
    return STATIC_SCOPE_OPTIONS;
  } catch (error) {
    logger.error("Failed to fetch scope options", { error });
    return [];
  }
}

export async function getScopeCategoryOptionsServer(categoryId: number): Promise<ScopeOption | null> {
  try {
    // Returning from static options instead of API call
    const option = STATIC_SCOPE_OPTIONS.find(opt => opt.id === Number(categoryId));
    return option || null;
  } catch (error) {
    logger.error("Failed to fetch scope category options", { error, categoryId });
    return null;
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
  if (params.page) {
    queryParams.append("PageNumber", String(params.page));
  }
  if (params.pageSize) {
    queryParams.append("PageSize", String(params.pageSize));
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

export async function getPreviewListByCategoryServer(
  params: PropertyFilterByCategoryParams
): Promise<PagedResponse<PropertyPreviewRow>> {
  const queryParams = new URLSearchParams();
  if (Array.isArray(params.UpdateCode)) {
    params.UpdateCode.forEach(code => queryParams.append("UpdateCode", code));
  } else {
    queryParams.append("UpdateCode", params.UpdateCode);
  }
  queryParams.append("SearchCategory", String(params.SearchCategory));
  queryParams.append("WardId", String(params.WardId));
  if (params.SearchTerm !== undefined) {
    queryParams.append("SearchTerm", String(params.SearchTerm));
  }
  if (params.PropertyNo !== undefined) {
    queryParams.append("PropertyNo", String(params.PropertyNo));
  }
  if (params.PartitionNo !== undefined) {
    queryParams.append("PartitionNo", String(params.PartitionNo));
  }
  if (params.PropertyFrom !== undefined) {
    queryParams.append("PropertyFrom", String(params.PropertyFrom));
  }
  if (params.PropertyTo !== undefined) {
    queryParams.append("PropertyTo", String(params.PropertyTo));
  }
  if (params.PageNumber !== undefined) {
    queryParams.append("PageNumber", String(params.PageNumber));
  }
  if (params.PageSize !== undefined) {
    queryParams.append("PageSize", String(params.PageSize));
  }

  const url = `/CommonDetails/filter-properties-by-category?${queryParams.toString()}`;

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
      
      logger.warn("getPreviewListByCategoryServer: Unexpected data shape", {
        dataKeys: Object.keys(data),
      });
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.fetchPropertiesFailed"), "");
  } catch (error) {
    logger.error("getPreviewListByCategoryServer: Error", {}, error);
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
      `/Wing?wardId=${wardId}`
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

export interface SearchByCategoryPropertyItem {
  propertyId: number;
  taxZoneId?: number;
  zoneId?: number;
  zoneNo?: string;
  wardId?: number;
  wardNo?: string;
  propertyNo: string;
  partitionNo?: string;
  mobileNo?: string;
  upicId?: string;
  propertyTypeId?: number;
  partType?: string;
  categoryId?: number;
  propertyCategoryName?: string;
  isWing?: boolean;
  propertyAssessmentStatusId?: number;
}

/**
 * Fetches properties by category, zone, ward and page size/number.
 * Uses GET /Property/search-by-category
 */
export async function getPropertiesByCategoryServer(
  searchCategory: number,
  zoneId: number | undefined,
  wardId: number,
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  propertyFrom?: string
): Promise<PagedResponse<SearchByCategoryPropertyItem>> {
  const params = new URLSearchParams({
    SearchCategory: searchCategory.toString(),
    WardId: wardId.toString(),
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  });

  if (zoneId && zoneId > 0) {
    params.set("ZoneId", zoneId.toString());
  }

  if (propertyFrom && propertyFrom.trim() !== "") {
    params.set("PropertyFrom", propertyFrom.trim());
  }

  if (searchTerm && searchTerm.trim() !== "") {
    params.set("SearchTerm", searchTerm.trim());
    params.set("PropertyNo", searchTerm.trim());
    params.set("q", searchTerm.trim());
  }

  try {
    logger.info("getPropertiesByCategoryServer: Fetching properties", { searchCategory, zoneId, wardId, pageNumber, pageSize, searchTerm, propertyFrom });
    const response = await apiClient.get<unknown>(`/Property/search-by-category?${params.toString()}`);
    
    if (response.success && response.data) {
      const data = response.data as Record<string, unknown>;
      let itemsArray: SearchByCategoryPropertyItem[] = [];
      let totalCount = 0;
      let pageNum = pageNumber;
      let pSize = pageSize;
      let totalP = 1;
      let hasPrev = false;
      let hasNxt = false;

      if (Array.isArray(data.items)) {
        itemsArray = data.items as SearchByCategoryPropertyItem[];
        totalCount = (data.totalCount as number) || itemsArray.length;
        pageNum = (data.pageNumber as number) || pageNumber;
        pSize = (data.pageSize as number) || pageSize;
        totalP = (data.totalPages as number) || 1;
        hasPrev = Boolean(data.hasPrevious);
        hasNxt = Boolean(data.hasNext);
      } else if (data.items && typeof data.items === 'object') {
        const nestedData = data.items as Record<string, unknown>;
        if (Array.isArray(nestedData.items)) {
          itemsArray = nestedData.items as SearchByCategoryPropertyItem[];
          totalCount = (nestedData.totalCount as number) || itemsArray.length;
          pageNum = (nestedData.pageNumber as number) || pageNumber;
          pSize = (nestedData.pageSize as number) || pageSize;
          totalP = (nestedData.totalPages as number) || 1;
          hasPrev = Boolean(nestedData.hasPrevious);
          hasNxt = Boolean(nestedData.hasNext);
        }
      } else if (Array.isArray(response.data)) {
        itemsArray = response.data as SearchByCategoryPropertyItem[];
        totalCount = itemsArray.length;
      }

      return {
        items: itemsArray,
        totalCount,
        pageNumber: pageNum,
        pageSize: pSize,
        totalPages: totalP,
        hasPrevious: hasPrev,
        hasNext: hasNxt,
      };
    }
    
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
    logger.error("Failed to fetch properties by category", { searchCategory, zoneId, wardId, pageNumber, pageSize, error });
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

export async function getFieldRegistriesServer(
  pageNumber?: number,
  pageSize?: number,
  updateCode?: string,
  searchTerm?: string
): Promise<PagedResponse<BulkUpdateMaster> | BulkUpdateMaster[]> {
  try {
    const params = new URLSearchParams();
    if (pageNumber != null) params.append("PageNumber", String(pageNumber));
    if (pageSize != null) params.append("PageSize", String(pageSize));
    if (updateCode) params.append("UpdateCode", updateCode);
    if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());

    const response = await apiClient.get<PagedResponse<BulkUpdateMaster> | ApiWrappedResponse<BulkUpdateMaster[]>>(
      `/FieldRegistry/GetFieldRegistries?${params.toString()}`
    );

    if (response.success && response.data) {
      const data = response.data;
      if (data && typeof data === "object" && "items" in data) {
        return data as PagedResponse<BulkUpdateMaster>;
      }
      if (Array.isArray(data)) {
        return data as unknown as BulkUpdateMaster[];
      }
    }

    const responseFallback = await apiClient.get<PagedResponse<BulkUpdateMaster> | ApiWrappedResponse<BulkUpdateMaster[]>>(
      `/FieldRegistry/GetFieldRegistries`
    );

    if (responseFallback.success && responseFallback.data) {
      const data = responseFallback.data;
      if (data && typeof data === "object" && "items" in data) {
        return data as PagedResponse<BulkUpdateMaster>;
      }
      if (Array.isArray(data)) {
        return data as unknown as BulkUpdateMaster[];
      }
    }
    
    return [];
  } catch (error) {
    logger.error("Failed to fetch field registries", { error });
    return [];
  }
}

export async function getFieldRegistrySchemasServer(): Promise<FieldRegistrySchema[]> {
  try {
    const response = await apiClient.get<FieldRegistrySchema[] | { items: FieldRegistrySchema[] }>(
      `/FieldRegistry`
    );

    if (response.success && response.data) {
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
        return data.items;
      }
    }

    return [];
  } catch (error) {
    logger.error("Failed to fetch field registry schemas", { error });
    return [];
  }
}

export async function getFieldRegistryTablesServer(schemaName: string): Promise<FieldRegistryTable[]> {
  try {
    const response = await apiClient.get<{ items: FieldRegistryTable[] } | FieldRegistryTable[]>(
      `/FieldRegistry/GetDetailsBySchema?SchemaName=${encodeURIComponent(schemaName)}&PageSize=-1`
    );

    if (response.success && response.data) {
      const data = response.data;
      if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
        return data.items;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }

    return [];
  } catch (error) {
    logger.error("Failed to fetch field registry tables", { schemaName, error });
    return [];
  }
}

export async function getFieldRegistryColumnsServer(
  schemaName: string,
  tableName: string
): Promise<FieldRegistryColumn[]> {
  try {
    const response = await apiClient.get<{ items: FieldRegistryColumn[] } | FieldRegistryColumn[]>(
      `/FieldRegistry/GetDetailsByTable?SchemaName=${encodeURIComponent(
        schemaName
      )}&TableName=${encodeURIComponent(tableName)}&PageSize=-1`
    );

    if (response.success && response.data) {
      const data = response.data;
      if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
        return data.items;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }

    return [];
  } catch (error) {
    logger.error("Failed to fetch field registry columns", { schemaName, tableName, error });
    return [];
  }
}

export async function exportExcelServer(params: {
  updateCode?: string;
  wardId?: string;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  withData?: boolean | string;
  [key: string]: any;
}): Promise<string> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(401, t("messages.unauthorized") || "Unauthorized", "");
  }

  const config = getAppConfig();
  const queryParams = new URLSearchParams();

  const updateCode = params.updateCode || params.UpdateCode || params.fieldCode || params.field;
  if (updateCode) queryParams.append("UpdateCode", String(updateCode));

  const wardId = params.wardId || params.WardId;
  if (wardId) queryParams.append("WardId", String(wardId));

  const fromPropertyNo = params.fromPropertyNo || params.FromPropertyNo || params.fromProperty || params.FromProperty;
  if (fromPropertyNo) queryParams.append("FromPropertyNo", String(fromPropertyNo));

  const toPropertyNo = params.toPropertyNo || params.ToPropertyNo || params.toProperty || params.ToProperty;
  if (toPropertyNo) queryParams.append("ToPropertyNo", String(toPropertyNo));

  const propertyNo = params.propertyNo || params.PropertyNo;
  if (propertyNo) queryParams.append("PropertyNo", String(propertyNo));

  const partitionNo = params.partitionNo || params.PartitionNo;
  if (partitionNo) queryParams.append("PartitionNo", String(partitionNo));

  const withData = params.withData ?? params.WithData;
  if (withData !== undefined && withData !== null && withData !== "") {
    queryParams.append("WithData", String(withData));
  }

  const backendUrl = `${config.api.baseUrl.replace(/\/$/, "")}/CommonDetails/export-excel?${queryParams.toString()}`;

  logger.info("exportExcelServer: Proxying request", { backendUrl });

  const response = await fetch(backendUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    let errorMsg = `Backend API error: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && (errorJson.message || errorJson.error)) {
        errorMsg = errorJson.message || errorJson.error;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(response.status, errorMsg, "");
  }

  const fileBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(fileBuffer).toString("base64");
  return base64;
}


export async function getUpdateHistoryServer(
  params: UpdateHistoryFilterParams
): Promise<PagedResponse<UpdateHistoryItem>> {
  try {
    const { apiClient } = await import("@/services/api.service");

    const urlParams = new URLSearchParams();
    if (params.Id !== undefined) urlParams.append("Id", params.Id.toString());
    if (params.ActivityId) urlParams.append("ActivityId", params.ActivityId);
    if (params.ActivityType) urlParams.append("ActivityType", params.ActivityType);
    if (params.ActivityStatus) urlParams.append("ActivityStatus", params.ActivityStatus);
    if (params.CreatedDateFrom) urlParams.append("CreatedDateFrom", params.CreatedDateFrom);
    if (params.CreatedDateTo) urlParams.append("CreatedDateTo", params.CreatedDateTo);
    if (params.DoneBy) urlParams.append("DoneBy", params.DoneBy);
    if (params.Remarks) urlParams.append("Remarks", params.Remarks);
    if (params.PageNumber) urlParams.append("PageNumber", params.PageNumber.toString());
    if (params.PageSize) urlParams.append("PageSize", params.PageSize.toString());
    if (params.SearchTerm) urlParams.append("SearchTerm", params.SearchTerm);
    if (params.SortBy) urlParams.append("SortBy", params.SortBy);
    if (params.SortOrder) urlParams.append("SortOrder", params.SortOrder);
    if (params.FilterLogic) urlParams.append("FilterLogic", params.FilterLogic);

    const queryString = urlParams.toString();
    const url = `/CommonDetails/update-activity${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<ApiWrappedResponse<PagedResponse<UpdateHistoryItem>>>(url);

    if (response.success && response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      let normalized: PagedResponse<UpdateHistoryItem>;
      if (data.items && typeof data.items === 'object' && Array.isArray((data.items as any).items)) {
        normalized = normalizePagedResponse(data.items as PagedResponse<UpdateHistoryItem>);
      } else {
        normalized = normalizePagedResponse(response.data as unknown as PagedResponse<UpdateHistoryItem>);
      }

      // If SearchTerm is provided, ALSO query /CommonDetails/update-history to support PropertyNo (WardNo + PropertyNo + PartitionNo) search
      const searchTerm = params.SearchTerm?.trim();
      if (searchTerm) {
        try {
          const normalizePropertySearchStr = (str: string): string => {
            if (!str) return "";
            return str
              .toLowerCase()
              .replace(/\s*-\s*/g, "-") // Normalize " - ", " -", "- " to "-"
              .replace(/\s+/g, " ")     // Collapse multiple spaces
              .trim();
          };

          const normalizedSearch = normalizePropertySearchStr(searchTerm);

          const historyUrl = `/CommonDetails/update-history?PageSize=100&PageNumber=1&SearchTerm=${encodeURIComponent(searchTerm)}`;
          const historyResponse = await apiClient.get<ApiWrappedResponse<PagedResponse<UpdateHistoryDetailItem>>>(historyUrl);

          let historyItems: UpdateHistoryDetailItem[] = [];

          const extractItems = (respData: unknown): UpdateHistoryDetailItem[] => {
            if (!respData) return [];
            const historyDataRaw = respData as Record<string, unknown>;
            if (historyDataRaw.items && typeof historyDataRaw.items === 'object' && Array.isArray((historyDataRaw.items as any).items)) {
              return (historyDataRaw.items as any).items;
            } else if (Array.isArray(historyDataRaw.items)) {
              return historyDataRaw.items as any;
            }
            return [];
          };

          if (historyResponse.success && historyResponse.data) {
            historyItems = extractItems(historyResponse.data);
          }

          // Fallback: If raw search term yielded no history items and normalizedSearch is different (e.g. spaces around hyphens)
          if (historyItems.length === 0 && normalizedSearch && normalizedSearch !== searchTerm.toLowerCase()) {
            const fallbackUrl = `/CommonDetails/update-history?PageSize=100&PageNumber=1&SearchTerm=${encodeURIComponent(normalizedSearch)}`;
            const fallbackResponse = await apiClient.get<ApiWrappedResponse<PagedResponse<UpdateHistoryDetailItem>>>(fallbackUrl);
            if (fallbackResponse.success && fallbackResponse.data) {
              historyItems = extractItems(fallbackResponse.data);
            }
          }

          if (historyItems.length > 0) {
            const matchingActivityIds = new Set<string>();
            const activityMapFromHistory = new Map<string, UpdateHistoryItem>();

            historyItems.forEach((detail) => {
              const actId = detail.activityId != null ? String(detail.activityId) : "";
              if (actId) {
                const detailProp = normalizePropertySearchStr(
                  detail.property || `${detail.wardNo || ""}-${detail.propertyNo || ""}-${detail.partitionNo || ""}`
                );
                const detailPropNo = normalizePropertySearchStr(detail.propertyNo || "");
                const detailWardNo = normalizePropertySearchStr(detail.wardNo || "");
                const detailPartitionNo = normalizePropertySearchStr(detail.partitionNo || "");
                const detailCombinedSpace = `${detailWardNo} ${detailPropNo} ${detailPartitionNo}`.trim();

                if (
                  !normalizedSearch ||
                  detailProp.includes(normalizedSearch) ||
                  detailPropNo.includes(normalizedSearch) ||
                  detailWardNo.includes(normalizedSearch) ||
                  detailPartitionNo.includes(normalizedSearch) ||
                  detailCombinedSpace.includes(normalizedSearch) ||
                  String(detail.propertyId) === normalizedSearch
                ) {
                  matchingActivityIds.add(actId);
                  if (!activityMapFromHistory.has(actId)) {
                    activityMapFromHistory.set(actId, {
                      id: Number(actId) || detail.id,
                      activityId: actId,
                      activityType: detail.activityType || "Screen",
                      activityStatus: detail.activityStatus || "Success",
                      createdDate: detail.createdDate || "",
                      records: detail.records || 1,
                      ipAddress: detail.ipAddress || "",
                      remarks: detail.remarks || null,
                      updateName: detail.updateName || "",
                      doneBy: detail.activityDoneBy || detail.doneBy || "",
                      startTime: detail.startTime || "",
                      endTime: detail.endTime || "",
                      duration: detail.duration || 0,
                      activityRemark: detail.activityRemark || null,
                    });
                  }
                }
              }
            });

            if (matchingActivityIds.size > 0) {
              const existingIds = new Set(normalized.items.map((item) => String(item.id || item.activityId)));
              const combinedItems = [...normalized.items];

              matchingActivityIds.forEach((actId) => {
                if (!existingIds.has(actId)) {
                  const constructed = activityMapFromHistory.get(actId);
                  if (constructed) {
                    combinedItems.push(constructed);
                    existingIds.add(actId);
                  }
                }
              });

              const filteredItems = combinedItems.filter((item) => {
                const itemActId = String(item.id || item.activityId);
                return (
                  matchingActivityIds.has(itemActId) ||
                  normalized.items.some((orig) => String(orig.id || orig.activityId) === itemActId)
                );
              });

              return {
                ...normalized,
                items: filteredItems,
                totalCount: filteredItems.length,
                totalPages: Math.ceil(filteredItems.length / (params.PageSize || 10)) || 1,
              };
            }
          }
        } catch (historyErr) {
          logger.error("Error fetching update-history for property search fallback", { searchTerm } as any, historyErr);
        }
      }

      return normalized;
    }

    throw new ApiError(500, response.message || "Failed to fetch update history", "");
  } catch (error) {
    logger.error("Error fetching update history", { params } as any, error);
    throw error;
  }
}

export async function getUpdateHistoryDetailServer(
  activityId: string,
  pageNumber?: number,
  pageSize?: number,
  searchTerm?: string
): Promise<PagedResponse<UpdateHistoryDetailItem>> {
  try {
    const { apiClient } = await import("@/services/api.service");

    const cleanSearchTerm = searchTerm?.trim() || "";
    const normalizedSearchTerm = cleanSearchTerm
      .replace(/\s*-\s*/g, "-")
      .replace(/\s+/g, " ")
      .trim();

    const buildUrl = (term: string) => {
      const urlParams = new URLSearchParams();
      if (activityId) {
        urlParams.append("activityid", activityId);
      }
      urlParams.append("PageSize", String(pageSize ?? 10));
      urlParams.append("PageNumber", String(pageNumber ?? 1));
      if (term) {
        urlParams.append("SearchTerm", term);
      }
      return `/CommonDetails/update-history?${urlParams.toString()}`;
    };

    const targetTerm = normalizedSearchTerm || cleanSearchTerm;
    const url = buildUrl(targetTerm);

    let response = await apiClient.get<ApiWrappedResponse<PagedResponse<UpdateHistoryDetailItem>>>(url);

    // Fallback: If normalized query returned no results and clean raw search term is different, retry with raw term
    if (
      (!response.success ||
        !response.data ||
        (response.data as any)?.items?.length === 0 ||
        (response.data as any)?.items?.items?.length === 0) &&
      cleanSearchTerm &&
      cleanSearchTerm !== targetTerm
    ) {
      const rawUrl = buildUrl(cleanSearchTerm);
      const fallbackResponse = await apiClient.get<ApiWrappedResponse<PagedResponse<UpdateHistoryDetailItem>>>(rawUrl);
      if (fallbackResponse.success && fallbackResponse.data) {
        response = fallbackResponse;
      }
    }

    if (response.success && response.data) {
      const data = response.data as unknown as Record<string, unknown>;
      if (data.items && typeof data.items === 'object' && Array.isArray((data.items as any).items)) {
        return normalizePagedResponse(data.items as PagedResponse<UpdateHistoryDetailItem>);
      }
      return normalizePagedResponse(response.data as unknown as PagedResponse<UpdateHistoryDetailItem>);
    }

    throw new ApiError(500, response.message || "Failed to fetch update history details", "");
  } catch (error) {
    logger.error("Error fetching update history details", { activityId, pageNumber, pageSize, searchTerm } as any, error);
    throw error;
  }
}

export async function exportUpdateHistoryServer(
  params: UpdateHistoryFilterParams
): Promise<string> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(401, t("messages.unauthorized") || "Unauthorized", "");
  }

  try {
    const { apiClient } = await import("@/services/api.service");

    const urlParams = new URLSearchParams();
    const actId = params.ActivityId || (params as Record<string, unknown>).activityId || (params as Record<string, unknown>).activityid;

    if (actId) {
      urlParams.append("activityId", String(actId));
      urlParams.append("ActivityId", String(actId));
    } else {
      if (params.Id !== undefined) urlParams.append("Id", params.Id.toString());
      if (params.ActivityType) urlParams.append("ActivityType", params.ActivityType);
      if (params.ActivityStatus) urlParams.append("ActivityStatus", params.ActivityStatus);
      if (params.CreatedDateFrom) urlParams.append("CreatedDateFrom", params.CreatedDateFrom);
      if (params.CreatedDateTo) urlParams.append("CreatedDateTo", params.CreatedDateTo);
      if (params.DoneBy) urlParams.append("DoneBy", params.DoneBy);
      if (params.Remarks) urlParams.append("Remarks", params.Remarks);
      if (params.SearchTerm) urlParams.append("SearchTerm", params.SearchTerm);
    }

    const queryString = urlParams.toString();
    const endpointCandidates = actId
      ? [
          `/CommonDetails/update-history/export-excel${queryString ? `?${queryString}` : ""}`,
          `/CommonDetails/update-activity/export-excel${queryString ? `?${queryString}` : ""}`,
        ]
      : [
          `/CommonDetails/update-activity/export-excel${queryString ? `?${queryString}` : ""}`,
          `/CommonDetails/update-history/export-excel${queryString ? `?${queryString}` : ""}`,
        ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const url of endpointCandidates) {
      try {
        const res = await apiClient.fetch(url, { method: "GET" }, true);
        if (res.ok) {
          response = res;
          break;
        } else {
          lastError = new ApiError(res.status, `HTTP error ${res.status}`, "");
        }
      } catch (err) {
        lastError = err as Error;
      }
    }

    if (!response || !response.ok) {
      let errorMsg = "Failed to export update history";
      if (response) {
        try {
          const errBody = await response.json();
          errorMsg = errBody.message || errBody.error || errorMsg;
        } catch (e) {
          const errText = await response.text().catch(() => "");
          if (errText) errorMsg = errText;
        }
      }
      throw lastError || new ApiError(response?.status || 500, errorMsg, "");
    }

    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        if (data && data.data) return data.data;
        if (typeof data === "string") return data;
        throw new ApiError(500, data.message || "Failed to export update history", "");
      } catch (e) {
        // If it throws SyntaxError, it's not actually JSON!
        // Ignore the error and fall through to reading the arrayBuffer from the original response.
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    logger.error("Error exporting update history", { params } as any, error);
    throw error;
  }
}
