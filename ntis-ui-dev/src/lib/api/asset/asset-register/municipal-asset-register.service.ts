import { apiClient } from '@/services/api.service';
import type {
  ApiCategoryItem,
  ApiDepartmentItem,
  ApiOwnershipTypeItem,
  ApiTypeItem,
  AssetRegisterApiRecord,
  ParentAssetSubUnitApiResponse,
  ApiSubUnitRecord,
  Ward,
  Zone,
} from '@/types/asset/asset-register/municipal-asset-service.types';
import type {
  PagedApiResponse,
  WrappedItemsResponse,
  AssetRegisterSubUnitItem,
} from '@/types/asset-types/asset-register.types';
import type { PropertyPhotoGalleryDto } from '@/types/asset/asset-register/media.types';
import type { ApiResponse } from '@/types/common.types';

export type { AssetRegisterSubUnitItem };

function unwrapItems<T>(data: { items?: T[] } | undefined): T[] {
  return Array.isArray(data?.items) ? data.items : [];
}

function getDocumentViewUrl(documentGuid: string): string {
  return `/api/documents/${encodeURIComponent(documentGuid)}/view`;
}

export const municipalAssetRegisterServerService = {
  async getAssetRegisterPage(
    params: {
      pageNumber?: number;
      pageSize?: number;
      ownershipType?: string;
      occupancyStatus?: string;
      encroachmentStatus?: string;
      assetCategoryId?: number | null;
      assetTypeId?: string | number | null;
      zoneId?: number | null;
      wardId?: number | null;
      owningDepartmentId?: number | null;
      searchTerm?: string;
      assetNo?: string;
      assetName?: string;
      address?: string;
      isActive?: boolean;
    } = {}
  ): Promise<ApiResponse<PagedApiResponse<AssetRegisterApiRecord>>> {
    const query = new URLSearchParams();
    query.set('PageNumber', String(params.pageNumber ?? 1));
    query.set('PageSize', String(params.pageSize ?? 10));
    query.set('IsActive', String(params.isActive ?? true));

    if (params.assetCategoryId) query.append('AssetCategoryId', String(params.assetCategoryId));
    if (params.assetTypeId) {
      const types = String(params.assetTypeId).split(',');
      types.forEach(t => {
        if (t.trim()) {
          query.append('AssetTypeId', t.trim());
        }
      });
    }
    if (params.zoneId) query.set('ZoneId', String(params.zoneId));
    if (params.wardId) query.set('WardId', String(params.wardId));
    if (params.owningDepartmentId) query.set('DepartmentId', String(params.owningDepartmentId));
    if (params.ownershipType && params.ownershipType !== 'all') query.set('OwnershipType', params.ownershipType);
    if (params.occupancyStatus && params.occupancyStatus !== 'all') query.set('OccupancyStatus', params.occupancyStatus);
    if (params.encroachmentStatus && params.encroachmentStatus !== 'all') {
      const statuses = params.encroachmentStatus.split(',');
      statuses.forEach((status) => {
        if (status.trim()) query.append('EncroachmentStatus', status.trim());
      });
    }
    if (params.searchTerm?.trim()) query.set('SearchTerm', params.searchTerm.trim());
    if (params.assetNo?.trim()) query.set('AssetNo', params.assetNo.trim());
    if (params.assetName?.trim()) query.set('AssetName', params.assetName.trim());
    if (params.address?.trim()) query.set('Address', params.address.trim());

    return apiClient.get<PagedApiResponse<AssetRegisterApiRecord>>(`/AssetMaster/parent-asset-details?${query.toString()}`);
  },

  async getAssetCategories(): Promise<ApiResponse<ApiCategoryItem[]>> {
    const response = await apiClient.get<{ items?: ApiCategoryItem[] }>('/AssetCategory?IsActive=true&MarkedForDeletion=false&PageSize=-1');
    if (!response.success) {
      return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
    }

    return {
      success: true,
      statusCode: response.statusCode,
      data: unwrapItems(response.data),
      message: response.message,
    };
  },

  async getAssetTypesByCategory(categoryId?: number | null): Promise<ApiResponse<ApiTypeItem[]>> {
    const query = new URLSearchParams();
    query.set('IsActive', 'true');
    query.set('MarkedForDeletion', 'false');
    query.set('PageSize', '-1');
    if (categoryId) query.set('AssetCategoryId', String(categoryId));

    const response = await apiClient.get<{ items?: ApiTypeItem[] }>(`/AssetType?${query.toString()}`);
    if (!response.success) {
      return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
    }

    return {
      success: true,
      statusCode: response.statusCode,
      data: unwrapItems(response.data),
      message: response.message,
    };
  },

  async getZones(): Promise<ApiResponse<Zone[]>> {
    const response = await apiClient.get<{ items?: Zone[] }>('/Zone?PageSize=-1');
    if (!response.success) {
      return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
    }

    return {
      success: true,
      statusCode: response.statusCode,
      data: unwrapItems(response.data),
      message: response.message,
    };
  },

  async getWardsByZone(zoneId?: number | string | null): Promise<ApiResponse<Ward[]>> {
    const query = new URLSearchParams();
    query.set('PageSize', '-1');
    if (zoneId != null && zoneId !== '' && zoneId !== 'all') {
      query.set('ZoneId', String(zoneId));
    }

    const response = await apiClient.get<{ items?: Ward[] }>(`/Ward?${query.toString()}`);
    if (!response.success) {
      return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
    }

    return {
      success: true,
      statusCode: response.statusCode,
      data: unwrapItems(response.data),
      message: response.message,
    };
  },

  async getOwningDepartments(): Promise<ApiResponse<ApiDepartmentItem[]>> {
    const response = await apiClient.get<{ items?: ApiDepartmentItem[] }>('/OwningDepartment?IsActive=true&PageSize=-1');
    if (!response.success) {
      return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
    }

    return {
      success: true,
      statusCode: response.statusCode,
      data: unwrapItems(response.data),
      message: response.message,
    };
  },

  async getOwnershipTypes(): Promise<ApiResponse<ApiOwnershipTypeItem[]>> {
    const response = await apiClient.get<{ items?: ApiOwnershipTypeItem[] }>('/OwnershipType?IsActive=true&MarkedForDeletion=false&PageSize=-1');
    if (!response.success) {
      return { success: false, statusCode: response.statusCode, error: response.error, message: response.message };
    }

    return {
      success: true,
      statusCode: response.statusCode,
      data: unwrapItems(response.data),
      message: response.message,
    };
  },

  async getGroupedAssetPhotos(assetId: number): Promise<ApiResponse<PropertyPhotoGalleryDto>> {
    const response = await apiClient.get<WrappedItemsResponse<PropertyPhotoGalleryDto>>(
      `/asset-photos/asset/${assetId}/grouped`
    );

    if (response.success && response.data?.items) {
      const gallery = response.data.items;
      return {
        success: response.data.success ?? true,
        statusCode: response.statusCode,
        data: {
          ...gallery,
          propertyId: gallery.propertyId ?? assetId,
        },
        message: response.data.message || response.message,
      };
    }

    return {
      success: false,
      statusCode: response.statusCode,
      error: response.error || response.data?.message || 'Failed to fetch grouped asset photos',
      message: response.message,
    };
  },

  async getSubUnitsByAsset(
    assetId: number,
    pageNumber?: number,
    pageSize?: number,
    searchTerm?: string
  ): Promise<ApiResponse<{ items: AssetRegisterSubUnitItem[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }>> {
    const query = new URLSearchParams();
    if (pageNumber != null) query.set('PageNumber', String(pageNumber));
    if (pageSize != null) query.set('PageSize', String(pageSize));
    if (searchTerm?.trim()) query.set('SearchTerm', searchTerm.trim());

    const queryString = query.toString();
    const response = await apiClient.get<ParentAssetSubUnitApiResponse>(
      `/AssetMaster/parent/${assetId}/sub-unit-details${queryString ? `?${queryString}` : ''}`
    );

    if (response.success && response.data) {
      const rawItems: ApiSubUnitRecord[] = Array.isArray(response.data.items)
        ? response.data.items
        : [];

      const mappedItems: AssetRegisterSubUnitItem[] = rawItems.map((item) => {
        const floors = item.floorDetails || [];
        const firstFloor = floors.length > 0 ? floors[0] : null;
        const totalCarpetArea = floors.reduce((sum, f) => sum + (f.carpetAreaSqMeter || 0), 0);
        const totalBuiltUpArea = floors.reduce((sum, f) => sum + (f.builtupAreaSqMeter || 0), 0);
        const totalCarpetAreaSqFeet = floors.reduce((sum, f) => sum + (f.carpetAreaSqFeet || 0), 0);
        const totalBuiltUpAreaSqFeet = floors.reduce((sum, f) => sum + (f.builtupAreaSqFeet || 0), 0);
        const totalCapitalValue = floors.reduce((sum, f) => sum + (f.capitalValue || 0), 0);
        const totalRooms = floors.reduce((sum, f) => sum + (f.noOfRooms || 0), 0);

        const constructionYears = Array.from(new Set(floors.map((f) => f.constructionYear).filter(Boolean)));
        const assessmentYears = Array.from(new Set(floors.map((f) => f.assessmentYear).filter(Boolean)));
        const typeOfUseNames = Array.from(new Set(floors.map((f) => f.typeOfUseName).filter(Boolean)));
        const constructionTypeNames = Array.from(new Set(floors.map((f) => f.constructionTypeName).filter(Boolean)));
        const floorNames = Array.from(new Set(floors.map((f) => f.floorName || f.subFloorName).filter(Boolean)));

        const isAnyRented = floors.some((f) => f.isRented === true) || String(item.occupancyStatus ?? '').trim().toLowerCase() === 'rented';

        return {
          id: item.assetId,
          assetNo: item.assetNo,
          assetName: item.assetName,
          assetRegionalName: item.assetRegionalName,
          status: item.isActive ? 'Active' : 'Inactive',
          occupancy: item.occupancyStatus || undefined,
          occupancyStatus: item.occupancyStatus,
          builtUpAreaSqMeter: totalBuiltUpArea > 0 ? totalBuiltUpArea : (firstFloor?.builtupAreaSqMeter ?? null),
          carpetAreaSqMeter: totalCarpetArea > 0 ? totalCarpetArea : (firstFloor?.carpetAreaSqMeter ?? null),
          builtUpAreaSqFeet: totalBuiltUpAreaSqFeet > 0 ? totalBuiltUpAreaSqFeet : (firstFloor?.builtupAreaSqFeet ?? null),
          carpetAreaSqFeet: totalCarpetAreaSqFeet > 0 ? totalCarpetAreaSqFeet : (firstFloor?.carpetAreaSqFeet ?? null),
          capitalValue: totalCapitalValue > 0 ? totalCapitalValue : (firstFloor?.capitalValue ?? null),
          lastCVDate: null,
          assetLife: null,
          assetCategoryId: item.assetCategoryId,
          assetCategoryName: item.assetCategoryName,
          assetTypeId: item.assetTypeId,
          assetTypeName: item.assetTypeName,
          typeOfUseName: typeOfUseNames.length > 0 ? typeOfUseNames.join(', ') : (firstFloor?.typeOfUseName ?? null),
          constructionTypeName: constructionTypeNames.length > 0 ? constructionTypeNames.join(', ') : (firstFloor?.constructionTypeName ?? null),
          constructionYear: constructionYears.length > 0 ? constructionYears.join(', ') : (firstFloor?.constructionYear ?? null),
          assessmentYear: assessmentYears.length > 0 ? assessmentYears.join(', ') : (firstFloor?.assessmentYear ?? null),
          noOfRooms: totalRooms > 0 ? totalRooms : (firstFloor?.noOfRooms ?? null),
          isRented: isAnyRented,
          photoCount: Array.isArray(item.photos) ? item.photos.length : 0,
          documentCount: Array.isArray(item.documents) ? item.documents.length : 0,
          photos: item.photos || [],
          documents: item.documents || [],
          floorDetails: floors,
          floorName: floorNames.length > 0 ? floorNames.join(', ') : (firstFloor?.floorName ?? null),
          names: {
            category: item.assetCategoryName,
            type: item.assetTypeName,
            useType: typeOfUseNames.length > 0 ? typeOfUseNames.join(', ') : (firstFloor?.typeOfUseName ?? null),
            subUseType: firstFloor?.subTypeOfUseName ?? null,
          },
        };
      });

      const totalCount = response.data.totalCount ?? response.data.totalSubUnits ?? mappedItems.length;
      const currentPageSize = response.data.pageSize ?? pageSize ?? 10;
      const currentPageNumber = response.data.pageNumber ?? pageNumber ?? 1;
      const totalPages = response.data.totalPages ?? Math.max(1, Math.ceil(totalCount / currentPageSize));

      return {
        success: true,
        statusCode: response.statusCode,
        data: {
          items: mappedItems,
          totalCount,
          pageNumber: currentPageNumber,
          pageSize: currentPageSize,
          totalPages,
        },
        message: response.message,
      };
    }

    return {
      success: false,
      statusCode: response.statusCode,
      error: response.error || 'Failed to fetch sub-units',
      message: response.message,
    };
  },

  getDocumentViewUrl,
};
