import { createLogger } from "@/lib/utils/server-logger";
import { assetMasterService } from "@/lib/api/asset/asset-master.service";
import { zoneService } from "@/lib/api/asset/zone.service";
import { apiClient } from "@/services/api.service";
import type { ApiResponse } from '@/types/common.types';
import type {
  AssetChildAssetItem,
  AssetFieldDefinitionItem,
  AssetFloorDetailItem,
  AssetFloorSummary,
} from "@/types/municipal-asset/detail-tabs.types";
import {
  unwrapApiPayload,
  unwrapList,
  pickFirstNumber,
  normalizeAssetFieldDefinition,
  normalizeAssetFloorDetail,
  normalizeChildAssetItem,
} from "./asset-detail-normalizers";

const logger = createLogger("AssetDetailCoreActions");

export async function fetchAssetMasterById(assetId: number | string) {
  try {
    const numericId = Number(assetId);
    let response: ApiResponse<unknown>;

    if (!Number.isNaN(numericId) && numericId > 0) {
      response = await assetMasterService.getAssetById(numericId);
      if (!response.success || !response.data) {
        const searchRes = await apiClient.get<Record<string, unknown>>(`/AssetMaster?SearchTerm=${encodeURIComponent(String(assetId))}&PageSize=10`);
        const list = unwrapList(searchRes.data);
        if (list.length > 0) {
          const found = list.find((item) => {
            const a = item as Record<string, unknown>;
            return Number(a.id || a.Id) === numericId ||
              String(a.assetNo || a.upicId || a.upic || a.id).toLowerCase() === String(assetId).toLowerCase();
          }) || list[0];
          response = { success: true, data: found };
        }
      }
    } else {
      const searchRes = await apiClient.get<Record<string, unknown>>(`/AssetMaster?SearchTerm=${encodeURIComponent(String(assetId))}&PageSize=10`);
      const list = unwrapList(searchRes.data);
      if (list.length > 0) {
        const found = list.find((item) => {
          const a = item as Record<string, unknown>;
          return String(a.assetNo || a.upicId || a.upic || a.id).toLowerCase() === String(assetId).toLowerCase();
        }) || list[0];
        response = { success: true, data: found };
      } else {
        response = { success: false, error: 'Asset not found' };
      }
    }

    if (response.success && response.data) {
      const asset = response.data as unknown as Record<string, unknown>;

      if (asset.zoneId && !asset.zoneNo) {
        const zonesRes = await zoneService.getZones();
        if (zonesRes.success && zonesRes.data) {
          const zone = zonesRes.data.find((z) => z.id === asset.zoneId) as Record<string, unknown> | undefined;
          if (zone) {
            asset.zoneNo = zone.zoneNo || zone.ZoneNo;
          }
        }
      }

      if (asset.subZoneId && !asset.subZoneName) {
        const subZonesRes = await zoneService.getSubZones((asset.moujaId as string | number) || "all");
        if (subZonesRes.success && subZonesRes.data) {
          const subZone = ((subZonesRes.data || []) as { id?: number | string }[]).find((sz) => sz.id === asset.subZoneId) as Record<string, unknown> | undefined;
          if (subZone) {
            asset.subZoneName = subZone.subZoneNo || subZone.SubZoneNo || subZone.subZoneName || subZone.SubZoneName || subZone.name || `Subzone ${subZone.id}`;
          }
        }
      }

      if (asset.details && typeof asset.details === 'object') {
        const details = asset.details as Record<string, unknown>;
        for (const [key, val] of Object.entries(details)) {
          if (val !== undefined && val !== null && val !== '') {
            if (asset[key] === undefined || asset[key] === null || asset[key] === '') {
              asset[key] = val;
            }
          }
        }
        asset.address = asset.address ?? details.address ?? details.Address;
        asset.csn = asset.csn ?? details.csn ?? details.CSN;
        asset.propertyNo = asset.propertyNo ?? details.propertyNo ?? details.PropertyNo;
        asset.partitionNo = asset.partitionNo ?? details.partitionNo ?? details.PartitionNo;
        asset.upicId = asset.upicId ?? details.upicId ?? details.UpicId;
        asset.plotNo = asset.plotNo ?? details.plotNo ?? details.PlotNo;
        asset.plotNumber = asset.plotNumber ?? details.plotNo ?? details.PlotNo;
        asset.assetWardNo = asset.assetWardNo ?? details.assetWardNo ?? details.AssetWardNo;
        asset.moujaName = asset.moujaName ?? details.moujaName ?? details.MoujaName;
        asset.subZoneName = asset.subZoneName ?? details.subZoneName ?? details.SubZoneName;
        asset.nearestLandmark = asset.nearestLandmark ?? details.nearestLandmark ?? details.NearestLandmark;
        asset.pinCode = asset.pinCode ?? details.pinCode ?? details.PinCode;
        asset.latitude = asset.latitude ?? details.latitude ?? details.Latitude;
        asset.longitude = asset.longitude ?? details.longitude ?? details.Longitude;
      }

      if (asset.names && typeof asset.names === 'object') {
        const names = asset.names as Record<string, unknown>;
        for (const [key, val] of Object.entries(names)) {
          if (val !== undefined && val !== null && val !== '') {
            if (asset[key] === undefined || asset[key] === null || asset[key] === '') {
              asset[key] = val;
            }
          }
        }
      }

      return asset;
    }
  } catch (err) {
    logger.error(`Failed to fetch asset master by ID (assetId: ${assetId}): ${err instanceof Error ? err.message : String(err)}`);
  }
  return null;
}

export async function fetchAssetById(id: number) {
  try {
    const response = await assetMasterService.getAssetById(id);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch asset"
    };
  }
}

export async function fetchAssetFieldDefinitionsByCategoryType(
  categoryId?: number | string | null,
  typeId?: number | string | null
): Promise<ApiResponse<AssetFieldDefinitionItem[]>> {
  if (!categoryId || !typeId) {
    return { success: true, data: [] };
  }

  const response = await apiClient.get<unknown>(`/AssetFieldDefinition?AssetCategoryId=${categoryId}&AssetTypeId=${typeId}&pageSize=1000`);
  if (!response.success) {
    return { success: false, error: response.error || "Failed to load field definitions." };
  }

  return {
    success: true,
    data: unwrapList(response.data).map(normalizeAssetFieldDefinition).filter(Boolean) as AssetFieldDefinitionItem[],
  };
}

export async function fetchAssetFloorSummaryByAsset(assetId: number | string): Promise<{
  floorSummary: AssetFloorSummary | null;
  error: string | null;
}> {
  const response = await apiClient.get<unknown>(`/AssetFloorDetails/by-asset/${encodeURIComponent(String(assetId))}`);
  if (!response.success) {
    return { floorSummary: null, error: response.error || "Failed to load floor details." };
  }

  const payload = unwrapApiPayload(response.data) as Record<string, unknown>;
  const floorDetails = unwrapList(payload.floorDetails ?? payload.FloorDetails)
    .map(normalizeAssetFloorDetail)
    .filter(Boolean) as AssetFloorDetailItem[];

  return {
    floorSummary: {
      floorDetails,
      totalBaseValue: pickFirstNumber(payload, ["totalBaseValue", "TotalBaseValue"]),
      totalCapitalValue: pickFirstNumber(payload, ["totalCapitalValue", "TotalCapitalValue"]),
      totalMarketValue: pickFirstNumber(payload, ["totalMarketValue", "TotalMarketValue"]),
      totalFloors: pickFirstNumber(payload, ["totalFloors", "TotalFloors"]),
    },
    error: null,
  };
}

export async function fetchChildAssetsByParent(assetId: number | string): Promise<{
  childAssets: AssetChildAssetItem[];
  totalSubAssets: number;
  error: string | null;
}> {
  const response = await apiClient.get<unknown>(`/AssetMaster/parent/${encodeURIComponent(String(assetId))}/sub-assets`);
  if (!response.success) {
    return { childAssets: [], totalSubAssets: 0, error: response.error || "Failed to load sub-units." };
  }

  const payload = (response.data ?? {}) as Record<string, unknown>;
  const totalSubAssets =
    typeof payload.totalSubAssets === "number"
      ? payload.totalSubAssets
      : typeof payload.TotalSubAssets === "number"
        ? payload.TotalSubAssets
        : 0;

  const rawSubAssets = unwrapList(payload.subAssets ?? payload.SubAssets ?? payload);
  const mapped = rawSubAssets.map((entry, idx) => normalizeChildAssetItem(entry, idx)).filter(Boolean) as AssetChildAssetItem[];

  return {
    childAssets: mapped,
    totalSubAssets,
    error: null,
  };
}

export async function fetchAssetFloorAndOtherDetails(assetId: number | string): Promise<{
  floorSummary: AssetFloorSummary | null;
  childAssets: AssetChildAssetItem[];
  inventoryData: unknown;
  error: string | null;
}> {
  const [response, dedicatedFloorRes] = await Promise.all([
    apiClient.get<unknown>(`/AssetMaster/parent/${encodeURIComponent(String(assetId))}/floor-and-other-details`),
    fetchAssetFloorSummaryByAsset(assetId).catch(() => ({ floorSummary: null, error: null })),
  ]);

  if (!response.success && !dedicatedFloorRes.floorSummary) {
    return { floorSummary: null, childAssets: [], inventoryData: null, error: response.error || dedicatedFloorRes.error || "Failed to load details." };
  }

  const payload = (response.success ? unwrapApiPayload(response.data) : {}) as Record<string, unknown>;
  const floorSummaryRaw = payload.floorSummary ?? payload.FloorSummary ?? {};
  const floorDetailsRaw = (floorSummaryRaw as Record<string, unknown>).floorDetails ?? (floorSummaryRaw as Record<string, unknown>).FloorDetails;

  const rawDetailsList = unwrapList(floorDetailsRaw)
    .map((raw, idx) => normalizeAssetFloorDetail(raw, idx))
    .filter(Boolean) as AssetFloorDetailItem[];

  const mergedFloorDetails = (dedicatedFloorRes.floorSummary?.floorDetails && dedicatedFloorRes.floorSummary.floorDetails.length > 0)
    ? dedicatedFloorRes.floorSummary.floorDetails
    : rawDetailsList;

  const floorSummary: AssetFloorSummary = {
    floorDetails: mergedFloorDetails,
    totalBaseValue: dedicatedFloorRes.floorSummary?.totalBaseValue ?? pickFirstNumber(floorSummaryRaw as Record<string, unknown>, ["totalBaseValue", "TotalBaseValue"]),
    totalCapitalValue: dedicatedFloorRes.floorSummary?.totalCapitalValue ?? pickFirstNumber(floorSummaryRaw as Record<string, unknown>, ["totalCapitalValue", "TotalCapitalValue"]),
    totalMarketValue: dedicatedFloorRes.floorSummary?.totalMarketValue ?? pickFirstNumber(floorSummaryRaw as Record<string, unknown>, ["totalMarketValue", "TotalMarketValue"]),
    totalFloors: dedicatedFloorRes.floorSummary?.totalFloors ?? pickFirstNumber(floorSummaryRaw as Record<string, unknown>, ["totalFloors", "TotalFloors"]) ?? mergedFloorDetails.length,
  };

  const childAssetsRaw = payload.childAssets ?? payload.ChildAssets ?? [];
  const childAssets = unwrapList(childAssetsRaw)
    .map((entry, idx) => normalizeChildAssetItem(entry, idx))
    .filter(Boolean) as AssetChildAssetItem[];

  const inventoryDataRaw = payload.inventoryData ?? payload.InventoryData ?? null;
  let inventoryData = null;
  if (inventoryDataRaw && typeof inventoryDataRaw === "object") {
    const rawBatches = (inventoryDataRaw as Record<string, unknown>).batches ?? (inventoryDataRaw as Record<string, unknown>).Batches ?? [];
    const batches = unwrapList(rawBatches).map((b, idx) => {
      const batch = b as Record<string, unknown>;
      return {
        ...batch,
        batchId: (batch.batchId ?? batch.BatchId ?? batch.inventoryBatchId ?? batch.InventoryBatchId ?? idx + 1) as number
      };
    });
    inventoryData = {
      ...inventoryDataRaw,
      batches
    };
  }

  return {
    floorSummary,
    childAssets,
    inventoryData,
    error: null,
  };
}

export async function fetchSubUnitDetailsByAssetId(assetId: number | string) {
  try {
    const response = await apiClient.get<Record<string, unknown>>(`/ManageSubUnits/by-asset/${assetId}/lease-rent-details`);
    if (response.success && response.data) {
      const resData = response.data as Record<string, unknown>;
      const payload = resData?.items ?? resData?.Items ?? resData?.data ?? resData?.Data ?? response.data;
      return { success: true, data: payload };
    }
    return { success: false, error: response.error || "Failed to load sub-unit details." };
  } catch (err) {
    logger.error(`Failed to fetch subunit details for assetId ${assetId}:`, { assetId }, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
