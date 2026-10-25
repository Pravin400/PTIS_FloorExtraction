"use server";

import * as core from "./actions/asset-detail-core.actions";
import * as docs from "./actions/asset-detail-documents.actions";

// Core Actions
export async function fetchAssetMasterById(...args: Parameters<typeof core.fetchAssetMasterById>) {
  return core.fetchAssetMasterById(...args);
}

export async function fetchAssetById(...args: Parameters<typeof core.fetchAssetById>) {
  return core.fetchAssetById(...args);
}

export async function fetchAssetFieldDefinitionsByCategoryType(...args: Parameters<typeof core.fetchAssetFieldDefinitionsByCategoryType>) {
  return core.fetchAssetFieldDefinitionsByCategoryType(...args);
}

export async function fetchAssetFloorSummaryByAsset(...args: Parameters<typeof core.fetchAssetFloorSummaryByAsset>) {
  return core.fetchAssetFloorSummaryByAsset(...args);
}

export async function fetchChildAssetsByParent(...args: Parameters<typeof core.fetchChildAssetsByParent>) {
  return core.fetchChildAssetsByParent(...args);
}

export async function fetchAssetFloorAndOtherDetails(...args: Parameters<typeof core.fetchAssetFloorAndOtherDetails>) {
  return core.fetchAssetFloorAndOtherDetails(...args);
}

export async function fetchSubUnitDetailsByAssetId(...args: Parameters<typeof core.fetchSubUnitDetailsByAssetId>) {
  return core.fetchSubUnitDetailsByAssetId(...args);
}

// Documents & Media Actions
export async function fetchAssetDocumentsByAsset(...args: Parameters<typeof docs.fetchAssetDocumentsByAsset>) {
  return docs.fetchAssetDocumentsByAsset(...args);
}

export async function fetchAssetPhotosAndPlansByAsset(...args: Parameters<typeof docs.fetchAssetPhotosAndPlansByAsset>) {
  return docs.fetchAssetPhotosAndPlansByAsset(...args);
}

export async function fetchAssetDocumentFile(...args: Parameters<typeof docs.fetchAssetDocumentFile>) {
  return docs.fetchAssetDocumentFile(...args);
}

export async function fetchAssetDocumentFileByGuid(...args: Parameters<typeof docs.fetchAssetDocumentFileByGuid>) {
  return docs.fetchAssetDocumentFileByGuid(...args);
}

export async function fetchGroupedAssetPhotos(...args: Parameters<typeof docs.fetchGroupedAssetPhotos>) {
  return docs.fetchGroupedAssetPhotos(...args);
}
