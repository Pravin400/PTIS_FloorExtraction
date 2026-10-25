 
import { apiClient } from '@/services/api.service';
import { mapSubAssetToUI } from '@/lib/api/asset/municipal-Asset/sub-asset-detail.mapper';
import { mapDocumentsToUI, mapPhotosToUI } from '@/lib/api/asset/municipal-Asset/master.mapper';
import type { SubAssetDetailData } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import type { SubAssetApiResponse, HistoryItem } from '@/types/asset/municipal-Asset/sub-asset-detail-api.types';
import { ActionResult } from '@/types/common.types';
import { isSubAssetShape, isHistoryItemShape } from './sub-asset-types-guard';

/**
 * Standard API response wrapper
 */
interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  error?: string;
  data: T;
}

interface HistoryApiResponse {
  data: {
    items: HistoryItem[];
    totals: Record<string, number> | null;
  };
}

/**
 * Normalizes an object's keys to camelCase.
 */
function toCamelCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCaseKeys(v));
  } else if (obj !== null && typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    return Object.keys(record).reduce((result, key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = toCamelCaseKeys(record[key]);
      return result;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

/**
 * Service to fetch and map data for the new Sub-Asset Detail View.
 * Fully decoupled from old Asset Detail View code.
 */
export const subAssetDetailNewService = {
  /**
   * Fetches sub-asset details, along with necessary master data, documents, and photos
   * to resolve IDs and names for the UI.
   *
   * @param subAssetId The sub-asset ID.
   * @returns Mapped data ready for UI consumption.
   */
  fetchSubAssetDetails: async (
    subAssetId: number
  ): Promise<ActionResult<SubAssetDetailData>> => {
    try {
      if (!subAssetId || isNaN(subAssetId)) {
        return { success: false, error: 'Invalid Sub-Asset ID provided to service.' };
      }

      // Fetch the sub-asset details, documents, and photos in parallel
      const [rawRes, docsRes, photosRes] = await Promise.all([
        apiClient.get<ApiResponse<SubAssetApiResponse>>(`/ManageSubUnits/${subAssetId}`).catch(() => null),
        apiClient.get<ApiResponse<unknown[]>>(`/asset-documents/asset/${subAssetId}`).catch(() => null),
        apiClient.get<ApiResponse<unknown[]>>(`/asset-photos/asset/${subAssetId}`).catch(() => null)
      ]);

      const httpBody = (rawRes as unknown as Record<string, unknown>)?.data ?? rawRes;
      const httpBodyRecord = httpBody as Record<string, unknown>;
      const rawData = toCamelCaseKeys(httpBodyRecord?.items ?? httpBodyRecord?.data ?? httpBody);
      
      if (httpBodyRecord && httpBodyRecord.success === false) {
        return {
          success: false,
          error: String(httpBodyRecord.error || httpBodyRecord.message || 'Failed to fetch sub-asset details')
        };
      }

      if (!rawData || !isSubAssetShape(rawData)) {
        return {
          success: false,
          error: 'Invalid sub-asset data format received from server.'
        };
      }

      const subAssetData = rawData as SubAssetApiResponse;

      const docsBody = (docsRes as unknown as Record<string, unknown>)?.data ?? docsRes;
      const docsBodyRecord = docsBody as Record<string, unknown>;
      const docsData = docsBodyRecord?.items ?? docsBodyRecord?.data ?? docsBody;
      const rawDocuments = Array.isArray(docsData) ? docsData : [];

      const photosBody = (photosRes as unknown as Record<string, unknown>)?.data ?? photosRes;
      const photosBodyRecord = photosBody as Record<string, unknown>;
      const photosData = photosBodyRecord?.items ?? photosBodyRecord?.data ?? photosBody;
      const rawPhotos = Array.isArray(photosData) ? photosData : [];

      const mappedDocuments = mapDocumentsToUI(rawDocuments);
      const mappedPhotos = mapPhotosToUI(rawPhotos);

      // Map the API data to the UI format
      const uiData = mapSubAssetToUI(subAssetData);
      
      // Inject independently mapped documents & photos
      uiData.documents = mappedDocuments;
      uiData.subAssetPhotos = mappedPhotos;

      return {
        success: true,
        data: uiData
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch sub-asset details',
      };
    }
  },

  /**
   * Fetches the rent collection history for a specific sub-asset.
   *
   * @param subAssetId The sub-asset ID (maps to AssetId in RentCollectionReport).
   * @returns Array of collection history items.
   */
  fetchCollectionHistory: async (
    subAssetId: number
  ): Promise<ActionResult<{ items: unknown[]; totals: Record<string, number> | null }>> => {
    try {
      if (!subAssetId || isNaN(subAssetId)) {
        return { success: false, error: 'Invalid Sub-Asset ID provided to service.' };
      }

      // We call the newly created dedicated endpoint for a specific asset's history
      const res = await apiClient.get<HistoryApiResponse>(`/RentCollectionReport/Asset/${subAssetId}`);
      if (!res.success || !res.data) {
        return {
          success: false,
          error: res.error ?? 'Failed to fetch collection history',
        };
      }
      const payload = toCamelCaseKeys(res.data) as Record<string, unknown>;
      
      let rawItems: unknown[] = [];
      if (Array.isArray(payload)) rawItems = payload;
      else if (Array.isArray(payload?.items)) rawItems = payload.items;
      else if (Array.isArray(payload?.data)) rawItems = payload.data;
      else if (payload?.data && Array.isArray((payload.data as Record<string, unknown>).items)) rawItems = (payload.data as Record<string, unknown>).items as unknown[];

      const nestedPayload = 
        payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
          ? payload.data as Record<string, unknown>
          : undefined;
      const rawTotals = payload.totals ?? nestedPayload?.totals;
      const totals = rawTotals && typeof rawTotals === 'object'
        ? rawTotals as Record<string, number>
        : null;
      
      const safeItems = rawItems.filter(isHistoryItemShape).map(item => {
        let dateStr = String(item.paymentDate || item.transactionDate || '-');
        if (dateStr && dateStr !== '-') {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            // Format as DD/MM/YYYY to match mockup
            dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          }
        }
        
        const periodStr = String(item.financialYear || item.month || '-');
        
        return {
          month: periodStr,
          demand: item.totalDemand ?? item.currentDemand ?? item.demand ?? 0,
          collection: item.collection ?? 0,
          adjustment: item.adjustmentAmount ?? 0,
          receiptNo: item.receiptNo || '-',
          transactionDate: dateStr,
          mode: item.paymentMode || item.mode || '-',
          status: item.paymentStatus || item.status || '-'
        };
      });
      
      return {
        success: true,
        data: {
          items: safeItems,
          totals,
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch collection history',
      };
    }
  }
};
