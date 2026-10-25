 
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type {
  AssetCounterPaymentSearchItem,
  AssetCounterPaymentSearchApiResponse,
  AssetCounterPaymentSearchData,
} from '@/types/asset/revenue/payment/leaseRentPayment.types';

export interface SearchAssetParams {
  searchText: string;
  assetCategoryId?: number | string;
  assetTypeId?: number | string;
  zoneId?: number | string;
  wardId?: number | string;
  parentAssetId?: number | string;
  assetId?: number | string;
}

export const assetCounterPaymentService = {
  /**
   * Search assets using /api/AssetCounterPayment/search endpoint.
   */
  async search(params: SearchAssetParams): Promise<AssetCounterPaymentSearchItem[]> {
    const q = new URLSearchParams();
    if (params.searchText) q.set('SearchText', params.searchText);
    if (params.assetCategoryId) q.set('AssetCategoryId', String(params.assetCategoryId));
    if (params.assetTypeId) q.set('AssetTypeId', String(params.assetTypeId));
    if (params.zoneId) q.set('ZoneId', String(params.zoneId));
    if (params.wardId) q.set('WardId', String(params.wardId));
    if (params.parentAssetId) q.set('ParentAssetId', String(params.parentAssetId));
    if (params.assetId) q.set('AssetId', String(params.assetId));

    const queryString = q.toString();
    const endpoint = queryString ? `/AssetCounterPayment/search?${queryString}` : '/AssetCounterPayment/search';

    const res = await apiClient.get<AssetCounterPaymentSearchApiResponse>(endpoint, {
      cache: 'no-store',
    });

    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || 'Failed to search assets',
        'Asset counter payment search failed'
      );
    }

    const rawData = res.data;
    if (!rawData) return [];

    // Handle nested API response: res.data.items -> { results: [...] } OR res.data.items -> [...]
    if (rawData.items) {
      if (Array.isArray(rawData.items)) {
        return rawData.items;
      }
      if (typeof rawData.items === 'object' && 'results' in rawData.items && Array.isArray((rawData.items as AssetCounterPaymentSearchData).results)) {
        return (rawData.items as AssetCounterPaymentSearchData).results;
      }
    }

    // Direct results array fallback
    if (Array.isArray(rawData)) {
      return rawData as unknown as AssetCounterPaymentSearchItem[];
    }

    return [];
  },

  /**
   * Get Parent Asset Details (Buildings) by Zone, Ward, Category, Type
   * GET /api/AssetMaster/parent-asset-details
   */
  async getParentAssetDetails(params: {
    zoneId: number | string;
    wardId: number | string;
    assetCategoryId?: number | string;
    assetTypeId?: number | string;
  }) {
    const q = new URLSearchParams();
    q.set('IsActive', 'true');
    q.set('PageSize', '-1');
    if (params.zoneId) q.set('ZoneId', String(params.zoneId));
    if (params.wardId) q.set('WardId', String(params.wardId));
    if (params.assetCategoryId) q.set('AssetCategoryId', String(params.assetCategoryId));
    if (params.assetTypeId) q.set('AssetTypeId', String(params.assetTypeId));

    const res = await apiClient.get<Record<string, unknown>>(`/AssetMaster/parent-asset-details?${q.toString()}`, {
      cache: 'no-store',
    });

    if (!res.success || !res.data) return [];
    const rawData = res.data;

    let items: Record<string, unknown>[] = [];
    if (rawData.items && Array.isArray(rawData.items)) {
      items = rawData.items as Record<string, unknown>[];
    } else if (Array.isArray(rawData)) {
      items = rawData as Record<string, unknown>[];
    }

    return items;
  },

  /**
   * Get Sub-Asset (Shop) Details by ParentAssetId
   * GET /api/AssetLeaseRentDetails?ParentAssetId={parentAssetId}&WorkflowStatus=approved&IsActive=true&PageSize=-1
   */
  async getSubAssetDetails(params: {
    parentAssetId: number | string;
    workflowStatus?: string;
    isActive?: boolean;
    pageSize?: number;
  }) {
    const q = new URLSearchParams();
    q.set('ParentAssetId', String(params.parentAssetId));
    q.set('WorkflowStatus', params.workflowStatus || 'approved');
    q.set('IsActive', String(params.isActive ?? true));
    q.set('PageSize', String(params.pageSize ?? -1));

    const res = await apiClient.get<Record<string, unknown>>(`/AssetLeaseRentDetails?${q.toString()}`, {
      cache: 'no-store',
    });

    if (!res.success || !res.data) return [];
    const rawData = res.data;

    let items: Record<string, unknown>[] = [];
    if (rawData.items && Array.isArray(rawData.items)) {
      items = rawData.items as Record<string, unknown>[];
    } else if (Array.isArray(rawData)) {
      items = rawData as Record<string, unknown>[];
    }

    return items;
  },

  /**
   * Get Lease Rent Details by LeaseRentDetailsId
   * GET /api/AssetLeaseRentDetails/{id}
   */
  async getLeaseRentDetailsById(id: number | string) {
    const res = await apiClient.get<Record<string, unknown>>(`/AssetLeaseRentDetails/${id}`, {
      cache: 'no-store',
    });
    if (!res.success || !res.data) return null;
    return res.data;
  },

  /**
   * Get Demand Details by Asset ID
   * GET /api/AssetCounterPayment/by-asset/{assetId}/demand-details
   */
  async getDemandDetailsByAssetId(assetId: number | string) {
    const res = await apiClient.get<Record<string, unknown>>(`/AssetCounterPayment/by-asset/${assetId}/demand-details`, {
      cache: 'no-store',
    });
    if (!res.success || !res.data) return null;
    return res.data;
  },

  /**
   * Post Counter Payment
   * POST /api/AssetCounterPayment/{recordId}
   */
  async processPayment(recordId: number | string, payload: Record<string, unknown>) {
    const res = await apiClient.post<Record<string, unknown>>(`/AssetCounterPayment/${recordId}`, payload);
    if (!res.success) {
      throw new ApiError(
        res.statusCode ?? 500,
        res.error || 'Failed to process payment',
        'Asset counter payment processing failed'
      );
    }
    const rawData = res.data;
    if (rawData && typeof rawData === 'object' && 'items' in rawData && rawData.items) {
      return rawData.items;
    }
    return rawData;
  },

  /**
   * Get Receipt details by UUID
   * GET /api/LeaseRentBill/receipt/uuid/{uuid}
   */
  async getReceiptByUuid(uuid: string) {
    const res = await apiClient.get<Record<string, unknown>>(`/LeaseRentBill/receipt/uuid/${uuid}`, {
      cache: 'no-store',
    });
    if (!res.success || !res.data) return null;
    const rawData = res.data;
    if (rawData && typeof rawData === 'object' && 'items' in rawData) {
      const items = rawData.items;
      if (Array.isArray(items)) return (items[0] as Record<string, unknown> | undefined) ?? null;
      if (typeof items === 'object' && items !== null) return items as Record<string, unknown>;
      return null;
    }
    return rawData as Record<string, unknown>;
  },
};
