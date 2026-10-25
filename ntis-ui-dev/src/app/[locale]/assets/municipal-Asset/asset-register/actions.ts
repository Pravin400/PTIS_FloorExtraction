"use server";

import * as data from "./actions/asset-register-data.actions";
import * as media from "./actions/asset-register-media.actions";
import * as masters from "./actions/asset-register-masters.actions";

// Data Actions
export async function fetchAssetRegisterPage(...args: Parameters<typeof data.fetchAssetRegisterPage>) {
  return data.fetchAssetRegisterPage(...args);
}

export async function fetchAssetDetailsAction(...args: Parameters<typeof data.fetchAssetDetailsAction>) {
  return data.fetchAssetDetailsAction(...args);
}

export async function deleteAssetAction(...args: Parameters<typeof data.deleteAssetAction>) {
  return data.deleteAssetAction(...args);
}

export async function fetchBatchAssetHealthScoresAction(...args: Parameters<typeof data.fetchBatchAssetHealthScoresAction>) {
  return data.fetchBatchAssetHealthScoresAction(...args);
}

// Media Actions
export async function fetchAssetPhotoGalleryAction(...args: Parameters<typeof media.fetchAssetPhotoGalleryAction>) {
  return media.fetchAssetPhotoGalleryAction(...args);
}

export async function findUploadsPhotosForUpic(...args: Parameters<typeof media.findUploadsPhotosForUpic>) {
  return media.findUploadsPhotosForUpic(...args);
}

export async function fetchBatchAssetPhotosAction(...args: Parameters<typeof media.fetchBatchAssetPhotosAction>) {
  return media.fetchBatchAssetPhotosAction(...args);
}

export async function fetchGroupedAssetPhotosAction(...args: Parameters<typeof media.fetchGroupedAssetPhotosAction>) {
  return media.fetchGroupedAssetPhotosAction(...args);
}

export async function fetchAssetDocumentsAction(...args: Parameters<typeof media.fetchAssetDocumentsAction>) {
  return media.fetchAssetDocumentsAction(...args);
}

export async function fetchBatchAssetDocumentCountsAction(...args: Parameters<typeof media.fetchBatchAssetDocumentCountsAction>) {
  return media.fetchBatchAssetDocumentCountsAction(...args);
}

export async function isPlanPhotoType(...args: Parameters<typeof media.isPlanPhotoType>) {
  return media.isPlanPhotoType(...args);
}

// Masters Actions
export async function fetchAssetTypesByCategory(...args: Parameters<typeof masters.fetchAssetTypesByCategory>) {
  return masters.fetchAssetTypesByCategory(...args);
}

export async function fetchAssetTypesByCategoryAction(...args: Parameters<typeof masters.fetchAssetTypesByCategoryAction>) {
  return masters.fetchAssetTypesByCategoryAction(...args);
}

export async function fetchZones(...args: Parameters<typeof masters.fetchZones>) {
  return masters.fetchZones(...args);
}

export async function fetchWards(...args: Parameters<typeof masters.fetchWards>) {
  return masters.fetchWards(...args);
}

export async function fetchCategoriesAction(...args: Parameters<typeof masters.fetchCategoriesAction>) {
  return masters.fetchCategoriesAction(...args);
}

export async function fetchDepartmentsAction(...args: Parameters<typeof masters.fetchDepartmentsAction>) {
  return masters.fetchDepartmentsAction(...args);
}

export async function fetchCategoryNameById(...args: Parameters<typeof masters.fetchCategoryNameById>) {
  return masters.fetchCategoryNameById(...args);
}
