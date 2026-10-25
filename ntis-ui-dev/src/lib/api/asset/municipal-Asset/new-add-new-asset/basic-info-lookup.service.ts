 
import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import { assetMasterService } from "./asset-master.service";
import { getSubTypesPagedServer } from "@/lib/api/typeofusesubtype.service";
import { extractItemsArray, filterActiveItems } from "@/lib/utils/asset-utils/new-add-new-asset/basic-info/basic-info-lookups.utils";
import { assetTypeService } from "@/lib/api/asset-masters/asset-type-crud.service";
import { isEntityActive } from "@/lib/utils/asset-utils/new-add-new-asset/active-filter.utils";
import { getZones } from "@/lib/api/zone.services";
import { getWards } from "@/lib/api/ward.services";
import { assetConditionService, type RawConditionMasterItem } from "./asset-condition.service";
import type { ParentAssetLookupItem } from "@/types/asset/municipal-Asset/new-add-new-asset/basic-info-actions.types";
import type { SubZone, Designation, UseTypeItem, SubUseTypeItem } from "@/types/asset/municipal-Asset/new-add-new-asset/master-data.types";
import type { UseSubType } from "@/types/typeOfUse.types";
import type { Ward } from "@/types/asset/municipal-Asset/new-add-new-asset/master-data.types";
import type { AssetType } from "@/types/asset-masters/asset-type.types";
import type { Zone } from "@/types/asset/municipal-Asset/new-add-new-asset";
import type { PaginatedApiResponse, AssetMaster } from "@/types/asset/municipal-Asset/municipal-asset.types";

export class BasicInfoLookupService {
  async getTypesByCategory(categoryId: number): Promise<ApiResponse<AssetType[]>> {
    try {
      const res = await assetTypeService.getAll({ PageSize: -1, IsActive: "true", CategoryId: categoryId });
      const activeItems = (res.items || []).filter(isEntityActive);
      return { success: true, data: activeItems };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch asset types";
      return { success: false, data: [], error: message };
    }
  }

  async getZones(): Promise<ApiResponse<Zone[]>> {
    try {
      const res = await getZones(1, -1);
      const zones: Zone[] = (res.items || []).map((z) => ({
        id: z.id,
        zoneNo: z.zoneNo,
        zoneName: z.zoneNo,
        description: z.description || undefined,
        sequenceNo: z.sequenceNo ?? undefined,
        isActive: z.isActive,
      }));
      return { success: true, data: zones };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch zones";
      return { success: false, data: [], error: message };
    }
  }

  async getWards(zoneId?: number | string | null): Promise<ApiResponse<Ward[]>> {
    try {
      const res = await getWards(1, -1, undefined, zoneId ? Number(zoneId) : undefined);
      const wards: Ward[] = (res.items || []).map((w) => ({
        id: w.id,
        wardName: w.wardNo || `Ward ${w.id}`,
        wardNo: w.wardNo,
        zoneId: w.zoneId,
        description: w.description || undefined,
        isActive: w.isActive,
      }));
      return { success: true, data: wards };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch wards";
      return { success: false, data: [], error: message };
    }
  }

  async getAssetConditions(categoryId?: number): Promise<ApiResponse<RawConditionMasterItem[]>> {
    return await assetConditionService.getAssetConditions(categoryId);
  }
  async getParentAssets(): Promise<ApiResponse<ParentAssetLookupItem[]>> {
    try {
      const response = await assetMasterService.getAllAssets();
      if (response.success && response.data) {
        const list = filterActiveItems(Array.isArray(response.data) ? response.data : []);
        const mapped: ParentAssetLookupItem[] = list.map((item) => {
          return {
            id: Number(item.id ?? 0),
            assetName: String(item.assetName ?? `Asset ${item.id ?? ""}`),
            assetNo: String(item.assetNo ?? ""),
          };
        });
        return { success: true, data: mapped };
      }
      return { success: false, data: [], error: response.error || "Failed to fetch parent assets" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch parent assets";
      return { success: false, data: [], error: message };
    }
  }

  async getSubzonesByMouja(moujaId: number | string): Promise<ApiResponse<SubZone[]>> {
    try {
      const response = await apiClient.get<SubZone[] | { items?: SubZone[] }>(
        `/asset-management/sub-zone-details-cv?moujaId=${moujaId}&pageSize=-1`
      );
      if (response.success && response.data) {
        return { success: true, data: filterActiveItems(extractItemsArray<SubZone>(response.data)) };
      }
      return { success: false, data: [], error: response.error || "Failed to fetch subzones" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch subzones";
      return { success: false, data: [], error: message };
    }
  }

  async getWardsByZone(zoneId: number | string): Promise<ApiResponse<Ward[]>> {
    try {
      const response = await apiClient.get<Ward[] | { items?: Ward[] }>(
        `/Ward?pageSize=-1&ZoneId=${zoneId}`
      );
      if (response.success && response.data) {
        return { success: true, data: filterActiveItems(extractItemsArray<Ward>(response.data)) };
      }
      return { success: false, data: [], error: response.error || "Failed to fetch wards" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch wards";
      return { success: false, data: [], error: message };
    }
  }

  async getSubTypesByType(typeOfUseId: number | string): Promise<ApiResponse<UseSubType[]>> {
    try {
      const response = await getSubTypesPagedServer({
        pageNumber: 1,
        pageSize: -1,
        typeOfUseId: Number(typeOfUseId),
      });
      if (response && Array.isArray(response.items)) {
        return { success: true, data: filterActiveItems(response.items) };
      }
      return { success: false, data: [], error: "Failed to fetch use subtypes" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch use subtypes";
      return { success: false, data: [], error: message };
    }
  }

  async getDesignationsByDepartment(departmentId: number | string): Promise<ApiResponse<Designation[]>> {
    try {
      const response = await apiClient.get<Designation[] | { items?: Designation[] }>(
        `/AmsDesignation?OwningDepartmentId=${departmentId}&PageSize=1000&IsActive=true`
      );
      if (response.success && response.data) {
        return { success: true, data: extractItemsArray<Designation>(response.data) };
      }
      return { success: false, data: [], error: response.error || "Failed to fetch designations" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch designations";
      return { success: false, data: [], error: message };
    }
  }

  async getAssetTypeOfUse(categoryId: number, typeId: number): Promise<ApiResponse<UseTypeItem[]>> {
    try {
      const response = await apiClient.get<UseTypeItem[] | { items?: UseTypeItem[] }>(
        `/asset-management/asset-type-of-use?AssetCategoryId=${categoryId}&AssetTypeId=${typeId}`
      );
      if (response.success && response.data) {
        return { success: true, data: filterActiveItems(extractItemsArray<UseTypeItem>(response.data)) };
      }
      return { success: false, data: [], error: response.error || "Failed to fetch asset type of use" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch asset type of use";
      return { success: false, data: [], error: message };
    }
  }

  async getAssetSubTypeOfUse(typeOfUseId: number | string): Promise<ApiResponse<SubUseTypeItem[]>> {
    try {
      const response = await apiClient.get<SubUseTypeItem[] | { items?: SubUseTypeItem[] }>(
        `/asset-management/asset-sub-type-of-use?TypeOfUseId=${typeOfUseId}`
      );
      if (response.success && response.data) {
        return { success: true, data: extractItemsArray<SubUseTypeItem>(response.data) };
      }
      return { success: false, data: [], error: response.error || "Failed to fetch asset sub type of use" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch asset sub type of use";
      return { success: false, data: [], error: message };
    }
  }

  async filterAssets(params: {
    zoneId?: number;
    wardId?: number;
    search?: string;
    pageSize?: number;
    pageNumber?: number;
  }) {
    try {
      const query = new URLSearchParams();
      if (params.zoneId) query.set("zoneId", String(params.zoneId));
      if (params.wardId) query.set("wardId", String(params.wardId));
      if (params.search) query.set("search", params.search.trim());
      query.set("pageSize", String(params.pageSize ?? 50));
      query.set("pageNumber", String(params.pageNumber ?? 1));

      const response = await apiClient.get<PaginatedApiResponse<AssetMaster> | AssetMaster[]>(
        `/AssetMaster?${query.toString()}`
      );

      if (response.success && response.data) {
        const raw = response.data;
        const isPagedResponse =
          !Array.isArray(raw) && (raw as PaginatedApiResponse<AssetMaster>).items !== undefined;
        const pagedRaw = raw as PaginatedApiResponse<AssetMaster>;

        const items: AssetMaster[] = isPagedResponse
          ? (pagedRaw.items ?? [])
          : Array.isArray(raw)
            ? raw
            : (pagedRaw.data ?? []);

        const totalCount: number = isPagedResponse
          ? (pagedRaw.totalCount ?? items.length)
          : items.length;

        return { success: true as const, data: items, totalCount };
      }

      return { success: false as const, data: [], totalCount: 0, error: "Failed to fetch assets" };
    } catch (err) {
      console.error("filterAssets failed:", err);
      return { success: false as const, data: [], totalCount: 0, error: "Failed to fetch assets" };
    }
  }

  async getAssetMasterById(assetId: number | string) {
    try {
      const numericId = Number(assetId);
      let response = (!isNaN(numericId) && numericId > 0)
        ? await assetMasterService.getAssetById(numericId)
        : null;

      if (!response || !response.success || !response.data) {
        const strId = String(assetId).trim();
        if (strId && strId !== "undefined" && strId !== "null") {
          const paginatedRes = await assetMasterService.getAllAssetsPaginated({
            searchTerm: strId,
            pageSize: 10,
          });
          if (paginatedRes.success && paginatedRes.data?.items?.length) {
            const exactMatch = paginatedRes.data.items.find(
              (item: { assetNo?: string; upic?: string; code?: string; id?: number | string }) =>
                item.assetNo === strId ||
                item.upic === strId ||
                item.code === strId ||
                String(item.id) === strId
            ) || paginatedRes.data.items[0];

            if (exactMatch && exactMatch.id) {
              response = await assetMasterService.getAssetById(Number(exactMatch.id));
            }
          }
        }
      }

      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.error("getAssetMasterById failed:", err);
    }
    return null;
  }
}

export const basicInfoLookupService = new BasicInfoLookupService();
