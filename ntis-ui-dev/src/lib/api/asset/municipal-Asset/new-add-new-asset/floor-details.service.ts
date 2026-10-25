/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse } from "@/types/common.types";
import {
  FloorDetailApiRequest,
  FloorDetailApiResponse,
  SubUnitApiRequest,
  SubUnitApiResponse,
  FloorDropdownOptions,
  BulkGenerateChildAssetsRequest,
  BulkGenerateChildAssetsResponse,
  CreateChildAssetRequest,
  CreateChildAssetResponse,
} from "@/types/asset/floor-details.types";

/**
 * Floor Details API Service
 * Scope: municipal-Asset / add-New-Asset / floor-details screen only.
 * Decoupled and production-ready server-side REST calls.
 */

import { apiClient } from "@/services/api.service";

async function jsonRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<ApiResponse<T>> {
  const options = { headers: extraHeaders };
  if (method === "GET") {
    return apiClient.get<T>(endpoint, options);
  } else if (method === "POST") {
    return apiClient.post<T>(endpoint, body, options);
  } else if (method === "PUT") {
    return apiClient.put<T>(endpoint, body, options);
  } else {
    return apiClient.delete<T>(endpoint, options);
  }
}

export async function fetchAllPagedDataJson(url: string): Promise<any[]> {
  let allItems: any[] = [];
  let page = 1;
  let hasNext = true;
  const separator = url.includes("?") ? "&" : "?";

  while (hasNext) {
    const pagedUrl = `${url}${separator}PageSize=100&pageSize=100&PageNumber=${page}&pageNumber=${page}`;
    const res = await apiClient.get<any>(pagedUrl, { cacheStrategy: 300 } as any);
    if (!res.success || !res.data) {
      break;
    }

    const items = res.data.items || res.data;
    if (Array.isArray(items)) {
      allItems = allItems.concat(items);
    } else {
      break;
    }

    const hasNextVal = res.data.hasNext ?? res.data.HasNext ?? res.data.hasNextPage ?? false;
    const totalCount = Number(res.data.totalCount ?? res.data.TotalCount ?? 0);

    if (!hasNextVal || allItems.length >= totalCount || items.length === 0) {
      hasNext = false;
    } else {
      page++;
    }
  }
  return allItems;
}

export const floorDetailsService = {
  /**
   * Get all floor details for a given asset
   */
  getFloorsByAsset: async (
    assetId: number
  ): Promise<ApiResponse<FloorDetailApiResponse[]>> => {
    return jsonRequest<FloorDetailApiResponse[]>("GET", `/AssetFloorDetails/by-asset/${assetId}`);
  },

  /**
   * Get a single floor detail record by ID
   */
  getFloorById: async (
    id: number
  ): Promise<ApiResponse<FloorDetailApiResponse>> => {
    return jsonRequest<FloorDetailApiResponse>("GET", `/AssetFloorDetails/${id}`);
  },

  /**
   * Create a new floor detail record
   */
  createFloor: async (
    data: FloorDetailApiRequest
  ): Promise<ApiResponse<FloorDetailApiResponse>> => {
    return jsonRequest<FloorDetailApiResponse>("POST", "/AssetFloorDetails", data);
  },

  /**
   * Update an existing floor detail record
   */
  updateFloor: async (
    id: number,
    data: Partial<FloorDetailApiRequest>
  ): Promise<ApiResponse<FloorDetailApiResponse>> => {
    return jsonRequest<FloorDetailApiResponse>("PUT", `/AssetFloorDetails/${id}`, data);
  },

  /**
   * Delete a floor detail record
   */
  deleteFloor: async (id: number): Promise<ApiResponse<void>> => {
    return jsonRequest<void>("DELETE", `/AssetFloorDetails/${id}`);
  },

  /**
   * Get all sub-units for a given floor detail
   */
  getSubUnitsByFloor: async (
    floorDetailId: number
  ): Promise<ApiResponse<SubUnitApiResponse[]>> => {
    return jsonRequest<SubUnitApiResponse[]>("GET", `/SubUnits?floorDetailId=${floorDetailId}`);
  },

  /**
   * Create a new sub-unit under a floor
   */
  createSubUnit: async (
    data: SubUnitApiRequest
  ): Promise<ApiResponse<SubUnitApiResponse>> => {
    return jsonRequest<SubUnitApiResponse>("POST", "/SubUnits", data);
  },

  /**
   * Update an existing sub-unit
   */
  updateSubUnit: async (
    id: number,
    data: Partial<SubUnitApiRequest>
  ): Promise<ApiResponse<SubUnitApiResponse>> => {
    return jsonRequest<SubUnitApiResponse>("PUT", `/SubUnits/${id}`, data);
  },

  /**
   * Delete a sub-unit
   */
  deleteSubUnit: async (id: number): Promise<ApiResponse<void>> => {
    return jsonRequest<void>("DELETE", `/SubUnits/${id}`);
  },

  /**
   * Fetch all dropdown options dynamically, fetching dynamic floors from `/Floor`
   */
  getFloorDropdownOptions: async (assetTypeId?: number): Promise<ApiResponse<FloorDropdownOptions>> => {
    // Fetch all options in parallel with cacheStrategy to avoid redundant DB reads on navigation
    const [floorRes, conRes, useRes, roomTypeRes] = await Promise.all([
      apiClient.get<any>("/Floor?PageSize=10000&pageSize=10000", { cacheStrategy: 300 } as any),
      apiClient.get<any>("/ConstructionType?PageSize=10000&pageSize=10000", { cacheStrategy: 300 } as any),
      apiClient.get<any>(assetTypeId ? `/asset-management/asset-type-of-use?AssetTypeId=${assetTypeId}&PageSize=10000&pageSize=10000` : "/asset-management/asset-type-of-use?PageSize=10000&pageSize=10000", { cacheStrategy: 300 } as any),
      apiClient.get<any>(assetTypeId ? `/AssetRoomTypeMaster?AssetTypeId=${assetTypeId}&PageSize=10000&pageSize=10000` : "/AssetRoomTypeMaster?PageSize=10000&pageSize=10000", { cacheStrategy: 300 } as any),
    ]);


    const extractItems = (res: ApiResponse<any>): any[] => {
      if (!res.success || !res.data) return [];
      let items = [];
      if (Array.isArray(res.data.items)) items = res.data.items;
      else if (Array.isArray(res.data)) items = res.data;
      else return [];

      return items.filter((item: any) =>
        item.isActive !== false && item.isActive !== 0 &&
        item.IsActive !== false && item.IsActive !== 0 &&
        item.status?.toLowerCase() !== 'inactive'
      );
    };

    const floorList = extractItems(floorRes);
    const sortedFloorList = [...floorList].sort((a: any, b: any) => {
      const seqA = Number(a.sequenceNo ?? a.SequenceNo ?? 0);
      const seqB = Number(b.sequenceNo ?? b.SequenceNo ?? 0);
      
      // If sequenceNo is not provided or same, sort by logical floor weight
      if (seqA === seqB || (seqA === 0 && seqB === 0)) {
        const getFloorWeight = (f: any) => {
          const label = String(f.description ?? f.floorName ?? f.floorNo ?? f.floorCode ?? '').toLowerCase();
          if (label.includes('basement 4') || label.includes('b4')) return -40;
          if (label.includes('basement 3') || label.includes('b3')) return -30;
          if (label.includes('basement 2') || label.includes('b2')) return -20;
          if (label.includes('basement 1') || label.includes('b1')) return -10;
          if (label.includes('basement')) return -10;
          if (label.includes('lower ground')) return -5;
          if (label.includes('ground') || label.includes('gf')) return 0;
          if (label.includes('upper ground')) return 5;
          if (label.includes('mezzanine')) return 8;
          
          const match = label.match(/(\d+)(st|nd|rd|th)?\s*floor/);
          if (match) return parseInt(match[1]) * 10;
          const numMatch = label.match(/^(\d+)$/);
          if (numMatch) return parseInt(numMatch[1]) * 10;
          
          // Fallback parsing for just the number in strings like "1 - 1st Floor"
          const fallbackMatch = label.match(/\b(\d+)\b/);
          if (fallbackMatch) return parseInt(fallbackMatch[1]) * 10;
          
          return 999;
        };
        return getFloorWeight(a) - getFloorWeight(b);
      }

      return seqA - seqB;
    });

    const conList = extractItems(conRes);
    const useList = extractItems(useRes);
    const roomTypeList = extractItems(roomTypeRes);

    const floorLevels = sortedFloorList.map((f: any) => {
      const code = f.floorNo ?? f.floorCode ?? f.id;
      const desc = f.description ?? f.floorName ?? "";
      return {
        label: desc ? `${code} - ${desc}` : String(code),
        value: String(f.id),
        sequenceNo: Number(f.sequenceNo ?? f.SequenceNo ?? 0)
      };
    });

    const constructionTypes = conList.map((c: any) => {
      const code = c.constructionCode ?? c.code ?? c.id;
      const desc = c.description ?? c.constructionName ?? "";
      return { label: desc ? `${code} - ${desc}` : String(code), value: String(c.id) };
    });

    const useTypes = useList.map((u: any) => {
      const code = u.typeOfUseCode ?? u.typeCode ?? u.code ?? u.typeOfUseId ?? u.id;
      const desc = u.description ?? u.typeName ?? "";
      return { label: desc ? `${code} - ${desc}` : String(code), value: String(u.id ?? u.typeOfUseId) };
    });

    const subUseTypes: any[] = [];

    let finalRoomTypeList = roomTypeList;
    if (finalRoomTypeList.length === 0) {
      try {
        const globalRoomTypeRes = await apiClient.get<any>("/RoomTypeMaster?PageSize=10000&pageSize=10000", { cacheStrategy: 300 } as any);
        const globalItems = extractItems(globalRoomTypeRes);
        if (globalItems.length > 0) {
          finalRoomTypeList = globalItems;
        }
      } catch (err) {
        console.warn("Failed to fetch global RoomTypeMaster:", err);
      }
    }

    const roomTypes = finalRoomTypeList.map((r: any) => {
      const code = r.roomTypeCode ?? r.code ?? "";
      const desc = r.roomTypeName ?? r.description ?? r.roomTypeDescription ?? "";
      const label = desc || code || `Room Type ${r.id ?? r.roomTypeId}`;
      return {
        label: code && desc && code !== desc ? `${code} - ${desc}` : label,
        value: label
      };
    });

    return {
      success: true,
      data: {
        floorLevels,
        constructionTypes,
        useTypes,
        subUseTypes,
        roomTypes,
        unitTypes: [
          { label: "Flat", value: "Flat" },
          { label: "Shop", value: "Shop" },
          { label: "Office", value: "Office" },
          { label: "Room", value: "Room" }
        ]
      }
    };
  },

  /**
   * Bulk generate child assets under a parent building
   */
  bulkGenerateSubUnits: async (
    data: BulkGenerateChildAssetsRequest
  ): Promise<ApiResponse<BulkGenerateChildAssetsResponse>> => {
    return jsonRequest<BulkGenerateChildAssetsResponse>("POST", "/ManageSubUnits/bulk-generate", data);
  },

  /**
   * Bulk generate floor details and subunits across multiple floors
   */
  bulkGenerateAcrossFloors: async (
    data: any
  ): Promise<ApiResponse<any>> => {
    return jsonRequest<any>("POST", "/ManageSubUnits/bulk-generate-across-floors", data);
  },

  /**
   * Create a single child asset with rooms and rent information
   */
  createChildAsset: async (
    data: CreateChildAssetRequest
  ): Promise<ApiResponse<CreateChildAssetResponse>> => {
    return jsonRequest<CreateChildAssetResponse>("POST", "/ManageSubUnits/create", data);
  },

  /**
   * Trigger CV (Capital Value) calculation for a specific floor detail record.
   * Updates AssetFloorDetails.CapitalValue and propagates to all sub-units on the floor.
   */
  calculateFloorCV: async (floorDetailId: number): Promise<ApiResponse<any>> => {
    return jsonRequest<any>("POST", `/AssetFloorDetails/${floorDetailId}/calculate-capital-value`);
  }
};
