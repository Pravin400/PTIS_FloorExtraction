/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";

async function fetchAllPagedDataApi(url: string): Promise<any[]> {
  let allItems: any[] = [];
  let page = 1;
  let hasNext = true;
  const separator = url.includes("?") ? "&" : "?";

  while (hasNext) {
    const pagedUrl = `${url}${separator}PageSize=-1&pageSize=-1&PageNumber=${page}&pageNumber=${page}`;
    const res = await apiClient.get<any>(pagedUrl);
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

export const floorLookupService = {
  getSubUseTypes: async (typeOfUseId?: number): Promise<any[]> => {
    const url =
      typeOfUseId && typeOfUseId > 0
        ? `/asset-management/asset-sub-type-of-use?TypeOfUseId=${typeOfUseId}`
        : `/asset-management/asset-sub-type-of-use`;
    return fetchAllPagedDataApi(url);
  },

  getSubFloors: async (floorId?: number): Promise<any[]> => {
    let res = await apiClient.get<any>(
      floorId ? `/SubFloor?floorId=${floorId}&PageSize=-1&pageSize=-1` : `/SubFloor?PageSize=-1&pageSize=-1`
    );
    let items = res.success && res.data ? (res.data.items || res.data) : [];
    if (!Array.isArray(items) || items.length === 0) {
      res = await apiClient.get<any>(`/SubFloor?PageSize=-1&pageSize=-1`);
      items = res.success && res.data ? (res.data.items || res.data) : [];
    }
    return Array.isArray(items) ? items : [];
  },

  getRoomTypes: async (categoryId?: number, typeId?: number): Promise<any[]> => {
    let items: any[] = [];
    if (categoryId && typeId) {
      items = await fetchAllPagedDataApi(
        `/asset-management/asset-room-type?AssetCategoryId=${categoryId}&AssetTypeId=${typeId}`
      );
    }
    if (!items || items.length === 0) {
      if (typeId) {
        items = await fetchAllPagedDataApi(`/AssetRoomTypeMaster?AssetTypeId=${typeId}`);
      }
      if (!items || items.length === 0) {
        items = await fetchAllPagedDataApi(`/RoomTypeMaster`);
      }
    }
    return items || [];
  },

  getRoomWiseMinusData: async (): Promise<any[]> => {
    const minusDataRes = await apiClient.get<any>('/AssetRoomWiseMinusData?PageSize=-1&pageSize=-1');
    if (minusDataRes.success && minusDataRes.data) {
      return minusDataRes.data.items || minusDataRes.data.data || (Array.isArray(minusDataRes.data) ? minusDataRes.data : []);
    }
    return [];
  },

  getAssetLeaseRentDetails: async (assetId: number): Promise<any[]> => {
    const res = await apiClient.get<any>(`/AssetLeaseRentDetails?AssetId=${assetId}&PageSize=-1&pageSize=-1`);
    if (res.success && res.data) {
      return res.data.items ?? res.data.data ?? (Array.isArray(res.data) ? res.data : []);
    }
    return [];
  },
};
