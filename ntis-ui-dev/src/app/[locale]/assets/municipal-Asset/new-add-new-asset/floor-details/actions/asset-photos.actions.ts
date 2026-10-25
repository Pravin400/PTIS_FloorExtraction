/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { assetPhotosServerService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-photos.service";
import { ApiResponse } from "@/types/common.types";

/**
 * Server action to fetch asset photo types with status
 */
export const fetchAssetPhotoTypesAction = async (
  assetId: number,
  assetTypeId?: number,
  assetCategoryId?: number
): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.getAssetPhotoTypesWithStatus(assetId, assetTypeId, assetCategoryId);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch asset photo types" };
  }
};

/**
 * Server action to fetch asset photos
 */
export const fetchAssetPhotosAction = async (assetId: number): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.getAssetPhotos(assetId);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch asset photos" };
  }
};

/**
 * Server action to upload an asset photo
 */
export const uploadAssetPhotoAction = async (formData: FormData): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.uploadAssetPhoto(formData);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload asset photo" };
  }
};

/**
 * Server action to replace an asset photo
 */
export const replaceAssetPhotoAction = async (photoId: number, formData: FormData): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.replaceAssetPhoto(photoId, formData);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to replace asset photo" };
  }
};

/**
 * Server action to delete an asset photo
 */
export const deleteAssetPhotoAction = async (photoId: number): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.deleteAssetPhoto(photoId);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete asset photo" };
  }
};

/**
 * Server action to bulk save asset photos
 */
export const bulkSaveAssetPhotosAction = async (payload: any): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.bulkSaveAssetPhotos(payload);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to bulk save asset photos" };
  }
};

/**
 * Server action to bulk upload asset photos offline
 */
export const bulkUploadAssetPhotosAction = async (formData: FormData): Promise<ApiResponse<any>> => {
  try {
    return await assetPhotosServerService.bulkUploadAssetPhotos(formData);
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to bulk upload asset photos" };
  }
};
