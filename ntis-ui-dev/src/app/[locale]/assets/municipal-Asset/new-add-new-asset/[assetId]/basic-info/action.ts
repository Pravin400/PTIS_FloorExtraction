"use server";

/**
 * [assetId]/basic-info/action.ts — Building Basic Info server actions.
 * Delegates all API communication to dedicated service layer.
 */

import { getBuildingFieldDefinitionsQuery } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info.server.service";
import { basicInfoLookupService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info-lookup.service";
import type {
  FetchFieldDefinitionsResponse,
} from "@/types/asset/municipal-Asset/new-add-new-asset/basic-info-actions.types";

/**
 * Fetches and processes dynamic field definitions for Building Basic Info.
 * Delegates to getBuildingFieldDefinitionsQuery in basic-info.server.service.
 */
export async function fetchBuildingFieldDefinitions(
  categoryId: number,
  typeId: number
): Promise<FetchFieldDefinitionsResponse> {
  return await getBuildingFieldDefinitionsQuery(categoryId, typeId);
}

export async function fetchParentAssetsAction() {
  return await basicInfoLookupService.getParentAssets();
}

export async function fetchSubzonesByMoujaAction(moujaId: number | string) {
  return await basicInfoLookupService.getSubzonesByMouja(moujaId);
}

export async function fetchWardsByZoneAction(zoneId: number | string) {
  return await basicInfoLookupService.getWardsByZone(zoneId);
}

export async function fetchSubTypesByTypeAction(typeOfUseId: number | string) {
  return await basicInfoLookupService.getSubTypesByType(typeOfUseId);
}

export async function fetchDesignationsByDepartmentAction(departmentId: number | string) {
  return await basicInfoLookupService.getDesignationsByDepartment(departmentId);
}

export async function fetchAssetTypeOfUseAction(categoryId: number, typeId: number) {
  return await basicInfoLookupService.getAssetTypeOfUse(categoryId, typeId);
}

export async function fetchAssetSubTypeOfUseAction(typeOfUseId: number | string) {
  return await basicInfoLookupService.getAssetSubTypeOfUse(typeOfUseId);
}
