"use server";

import { basicInfoLookupService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info-lookup.service";
import { AssetFieldDefinition, assetFieldDefinitionService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-definition.service";
import { ApiResponse } from "@/types/common.types";
import type { AssetType } from "@/types/asset-masters/asset-type.types";
import type { Zone, Ward, RawConditionMasterItem, ErrorWithDigest } from "@/types/asset/municipal-Asset/new-add-new-asset";

const isRedirectError = (err: ErrorWithDigest | null | undefined): boolean =>
  Boolean(err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT"));

/**
 * Server action to fetch asset types filtered by category ID (active only)
 */
export async function fetchTypesByCategoryAction(categoryId: number): Promise<ApiResponse<AssetType[]>> {
  return await basicInfoLookupService.getTypesByCategory(categoryId);
}

/**
 * Server action to fetch all active zones
 */
export async function fetchZonesAction(): Promise<ApiResponse<Zone[]>> {
  return await basicInfoLookupService.getZones();
}

/**
 * Server action to fetch all active wards
 */
export async function fetchWardsAction(zoneId?: number | string | null): Promise<ApiResponse<Ward[]>> {
  return await basicInfoLookupService.getWards(zoneId);
}

/**
 * Fetches field definitions based on selected category and type
 */
export const fetchFieldDefinitions = async (categoryId: number, typeId: number): Promise<AssetFieldDefinition[]> => {
  try {
    const response = await assetFieldDefinitionService.getFieldDefinitions(categoryId, typeId);
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch {
    return [];
  }
};

export const fetchAssetConditionMasterAction = async (
  _conditionCategory?: string,
  categoryId?: number
): Promise<ApiResponse<RawConditionMasterItem[]>> => {
  try {
    return await basicInfoLookupService.getAssetConditions(categoryId);
  } catch (err) {
    if (isRedirectError(err as ErrorWithDigest)) throw err;
    const message = err instanceof Error ? err.message : "Failed to fetch asset conditions";
    return { success: false, error: message };
  }
};

/**
 * Fetch assets for "Use Existing Asset" flow — filter by zone/ward/search.
 * API: GET /AssetMaster?search=...&zoneId=...&wardId=...&pageSize=...&pageNumber=...
 */
export async function fetchAssetsByFilter(params: {
  zoneId?: number;
  wardId?: number;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}) {
  return await basicInfoLookupService.filterAssets(params);
}

/**
 * Fetch a single asset master record by ID for parent asset selection
 */
export async function fetchAssetMasterById(assetId: number | string) {
  return await basicInfoLookupService.getAssetMasterById(assetId);
}


