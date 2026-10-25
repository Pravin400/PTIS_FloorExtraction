"use server";

import { municipalAssetRegisterServerService } from "@/lib/api/asset/asset-register/municipal-asset-register.service";
import type { AssetRegisterPageResult } from "@/types/asset/asset-register/municipal-asset-service.types";
import type { ApiResponse } from "@/types/common.types";
import type { PropertyPhotoGalleryDto } from "@/types/asset/asset-register/media.types";

export async function fetchAssetRegisterPage(
  categoryId?: number | null,
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  assetTypeId?: number | string | null,
  zoneId?: number | string | null,
  wardId?: number | string | null,
  owningDepartmentId?: number | string | null,
  assetNo: string = "",
  assetName: string = "",
  address: string = "",
  ownershipType?: string,
  encroachmentStatus?: string
): Promise<AssetRegisterPageResult> {
  const response = await municipalAssetRegisterServerService.getAssetRegisterPage({
    pageNumber: page,
    pageSize,
    assetCategoryId: categoryId || null,
    assetTypeId: assetTypeId && assetTypeId !== "all" ? String(assetTypeId) : null,
    zoneId: zoneId && zoneId !== "all" ? Number(zoneId) : null,
    wardId: wardId && wardId !== "all" ? Number(wardId) : null,
    owningDepartmentId: owningDepartmentId && owningDepartmentId !== "all" ? Number(owningDepartmentId) : null,
    ownershipType: ownershipType && ownershipType !== "all" ? ownershipType : undefined,
    encroachmentStatus: encroachmentStatus && encroachmentStatus !== "all" ? encroachmentStatus : undefined,
    searchTerm: search || undefined,
    assetNo: assetNo || undefined,
    assetName: assetName || undefined,
    address: address || undefined,
    isActive: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch asset register data');
  }

  const data = response.data;
  const items = Array.isArray(data) ? data : (data.items || []);
  const summary = Array.isArray(data) ? undefined : data.summary;

  return {
    items,
    totalCount: data.totalCount ?? items.length,
    totalPurchaseValue: data.totalPurchaseValue ?? 0,
    totalMarketValue: data.totalMarketValue ?? 0,
    totalDepreciation: data.totalDepreciation ?? 0,
    netBookValue: data.netBookValue ?? 0,
    totalCapitalValue: data.totalCapitalValue ?? summary?.totalCapitalValue ?? 0,
    activeAssetsCount: data.activeAssetsCount ?? summary?.activeParentAssets ?? 0,
    summary: {
      totalParentAssets: summary?.totalParentAssets ?? (Array.isArray(data) ? items.length : data.totalCount ?? items.length),
      activeParentAssets: summary?.activeParentAssets ?? (Array.isArray(data) ? 0 : data.activeAssetsCount ?? 0),
      totalSubUnits: summary?.totalSubUnits ?? 0,
      activeSubUnits: summary?.activeSubUnits ?? 0,
      totalCapitalValue: summary?.totalCapitalValue ?? (Array.isArray(data) ? 0 : data.totalCapitalValue ?? 0),
      totalAnnualRevenue: summary?.totalAnnualRevenue ?? 0,
      totalOutstanding: summary?.totalOutstanding ?? 0,
      encroachedAssets: summary?.encroachedAssets ?? 0,
    },
    error: null,
  };
}

export async function fetchAssetTypesByCategory(categoryId?: number | null) {
  const response = await municipalAssetRegisterServerService.getAssetTypesByCategory(categoryId ?? null);
  if (!response.success) {
    throw new Error("Failed to fetch asset types");
  }
  return (response.data || [])
    .filter((type) => type && type.id != null)
    .map((type) => ({
      id: type.id,
      label: type.typeName || "",
    }));
}

export async function fetchZones() {
  const response = await municipalAssetRegisterServerService.getZones();
  if (!response.success) {
    throw new Error("Failed to fetch zones");
  }
  return (response.data || [])
    .filter((zone) => zone && zone.id != null)
    .map((zone) => ({
      id: Number(zone.id),
      label: `${zone.description || ''} (${zone.zoneNo})`,
    }));
}

export async function fetchWards(zoneId?: number | string | null) {
  const response = await municipalAssetRegisterServerService.getWardsByZone(zoneId);
  if (!response.success) {
    throw new Error("Failed to fetch wards");
  }
  return (response.data || [])
    .filter((ward) => ward && ward.id != null)
    .map((ward) => ({
      id: Number(ward.id),
      zoneId: ward.zoneId == null ? null : Number(ward.zoneId),
      label: `${ward.description || ''} (${ward.wardNo || ''})`,
    }));
}

/**
 * Fetch category name by ID - wraps categoryTypeService so pages do not import services directly
 */
export async function fetchCategoryNameById(categoryId: number): Promise<string | null> {
  const response = await municipalAssetRegisterServerService.getAssetCategories();
  if (!response.success) {
    throw new Error("Failed to fetch category name");
  }
  const match = (response.data || []).find((item) => Number(item.id) === categoryId);
  return match?.categoryName || null;
}

export async function fetchDepartments() {
  const response = await municipalAssetRegisterServerService.getOwningDepartments();
  if (!response.success) {
    throw new Error(response.error || "Failed to fetch departments");
  }

  return (response.data || [])
    .filter((dept) => dept && dept.id != null)
    .map((dept) => ({
      id: Number(dept.id),
      label: dept.owningDepartmentName || "",
    }));
}

export async function fetchCategories() {
  const response = await municipalAssetRegisterServerService.getAssetCategories();
  if (!response.success) {
    throw new Error("Failed to fetch categories");
  }
  return (response.data || [])
    .filter((cat) => cat && cat.id != null)
    .map((cat) => ({
      id: cat.id,
      label: cat.categoryName || "",
    }));
}

export async function fetchOwnershipTypes() {
  const response = await municipalAssetRegisterServerService.getOwnershipTypes();
  if (!response.success) {
    throw new Error(response.error || "Failed to fetch ownership types");
  }
  return (response.data || [])
    .filter((item) => item && item.id != null)
    .map((item) => ({
      id: Number(item.id),
      label: item.ownershipTypeName || "",
      value: item.ownershipTypeName || "",
    }));
}

export async function fetchGroupedAssetPhotosAction(assetId: number): Promise<ApiResponse<PropertyPhotoGalleryDto>> {
  const response = await municipalAssetRegisterServerService.getGroupedAssetPhotos(assetId);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch grouped asset photos');
  }
  return response;
}

export async function fetchSubUnitsByAsset(
  assetId: number,
  page: number = 1,
  pageSize: number = 10,
  search: string = ""
) {
  const response = await municipalAssetRegisterServerService.getSubUnitsByAsset(
    assetId,
    page,
    pageSize,
    search
  );
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch sub-units');
  }

  return {
    success: true,
    items: response.data.items,
    totalCount: response.data.totalCount,
    pageNumber: response.data.pageNumber,
    pageSize: response.data.pageSize,
    totalPages: response.data.totalPages,
    message: response.message || "",
  };
}
