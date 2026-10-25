 
import { apiClient } from '@/services/api.service';
import { assetCategoryService } from '@/lib/api/asset-masters/asset-category-crud.service';
import { ApiError } from '@/lib/utils/api';
import type { PagedResponse } from '@/types/common.types';
import type {
  DashboardStatsResponse,
  AssetCategory,
  AssetType,
  AssetTypeDetailsResponse,
  AssetCategoryTypeStatsResponseDto,
} from '@/types/asset/municipal-Asset/municipal-asset.types';

/** Build URL with optional query params, omitting null/undefined values */
function buildUrl(base: string, params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') sp.append(k, String(v));
  });
  return sp.toString() ? `${base}?${sp.toString()}` : base;
}

/** GET /AssetDashboard/dashboard-stats */
export async function getMunicipalDashboardStats(): Promise<DashboardStatsResponse | null> {
  try {
    const res = await apiClient.get<DashboardStatsResponse>('/AssetDashboard/dashboard-stats', {
      cache: 'no-store',
    });
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error('getMunicipalDashboardStats failed:', err);
    return null;
  }
}

/** GET /AssetCategory master list */
export async function getMunicipalAssetCategories(): Promise<AssetCategory[]> {
  try {
    const res = await assetCategoryService.getAll({ IsActive: 'true', PageSize: 1000 });
    return (res.items ?? []) as unknown as AssetCategory[];
  } catch (err) {
    console.error('getMunicipalAssetCategories failed:', err);
    return [];
  }
}

/** GET /AssetType master list */
export async function getMunicipalAssetTypes(): Promise<AssetType[]> {
  try {
    const res = await apiClient.get<PagedResponse<AssetType> | AssetType[]>('/AssetType?PageSize=1000', {
      next: { revalidate: 3600 },
    });
    if (!res.success || !res.data) return [];

    const rawData: unknown = res.data;
    const items: unknown[] = Array.isArray(rawData)
      ? rawData
      : (rawData && typeof rawData === 'object' && 'items' in rawData && Array.isArray((rawData as Record<string, unknown>).items))
        ? (rawData as Record<string, unknown>).items as unknown[]
        : [];

    return items.map((item) => {
      const raw = item as Record<string, unknown>;
      const rawCatId = raw.categoryId ?? raw.assetCategoryId ?? raw.CategoryId ?? raw.AssetCategoryId ?? raw.category_id ?? raw.group;
      const catId = Number(rawCatId ?? 0);
      const typeId = Number(raw.id ?? raw.Id ?? 0);
      const tName = String(raw.typeName ?? raw.assetTypeName ?? raw.name ?? raw.TypeName ?? raw.AssetTypeName ?? raw.Name ?? '');

      return {
        id: typeId,
        assetTypeName: tName,
        typeName: tName,
        name: tName,
        categoryId: catId,
        assetCategoryId: catId,
        isActive: raw.isActive ?? raw.IsActive ?? true,
      } as AssetType;
    });
  } catch (err) {
    console.error('getMunicipalAssetTypes failed:', err);
    return [];
  }
}

/** GET /AssetDashboard/assets-by-type/details?assetCategoryId={categoryId} */
export async function getAssetCategoryTypeDetails(
  assetCategoryId: number
): Promise<AssetCategoryTypeStatsResponseDto> {
  const url = buildUrl('/AssetDashboard/assets-by-type/details', { assetCategoryId });
  const response = await apiClient.get<AssetCategoryTypeStatsResponseDto>(url, { cache: 'no-store' });
  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch asset category type details',
      'Fetch asset category type details failed'
    );
  }
  const rawData: unknown = response.data;
  if (rawData && typeof rawData === 'object' && 'types' in rawData) {
    return rawData as AssetCategoryTypeStatsResponseDto;
  }
  if (rawData && typeof rawData === 'object' && 'data' in rawData) {
    return (rawData as Record<string, unknown>).data as AssetCategoryTypeStatsResponseDto;
  }
  return response.data;
}

/** GET /AssetDashboard/assets-by-type/details */
export async function getAssetsByTypeDetails(
  assetTypeId: number,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<AssetTypeDetailsResponse> {
  const url = buildUrl('/AssetDashboard/assets-by-type/details', { assetTypeId, pageNumber, pageSize });
  const response = await apiClient.get<AssetTypeDetailsResponse>(url, { cache: 'no-store' });
  if (!response.success || !response.data) {
    throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch asset details', 'Fetch asset details failed');
  }
  return response.data;
}
