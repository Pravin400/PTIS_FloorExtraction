 

import { apiClient } from '@/services/api.service';
import { ActionResult } from '@/types/common.types';
import {
  ApiFloorResponse,
  ApiAssetMasterResponse,
} from '@/types/asset/municipal-Asset/asset-detail-api.types';
import { 
  mapFloorDetailsToUI, 
  mapUnitDetailsToUI 
} from '@/lib/api/asset/municipal-Asset/floor.mapper';
import { 
  mapAssetMasterToUI, 
  mapDocumentsToUI, 
  mapPhotosToUI 
} from '@/lib/api/asset/municipal-Asset/master.mapper';
import { 
  isApiFloorMasterItemShape, 
  isApiSubUnitItemShape 
} from '@/lib/api/asset/municipal-Asset/asset-detail-types-guard';
import { FloorSubmission, ShopUnit, AssetDetailData, InventoryItem, DetailedInventoryItem } from '@/types/asset/municipal-Asset/asset-detail.types';
import { mapInventoryToUI } from '@/lib/api/asset/municipal-Asset/inventory.mapper';

export interface AssetDetailDataPayload {
  basicDetails: Partial<AssetDetailData>;
  floorSubmissions: FloorSubmission[];
  shopUnits: ShopUnit[];
  inventory?: { inventoryItems: InventoryItem[]; detailedInventoryItems: DetailedInventoryItem[] };
}

/**
 * Helper to safely extract an array of items from a varied API response structure.
 * Handles cases where items are nested under `data.items`, `data.floorDetails`, etc.
 */
function extractArrayFromResponse(response: unknown): unknown[] {
  if (!response) return [];
  
  // Extract the inner data object if wrapped in an axios-like response
  const safeResponse = response as Record<string, unknown>;
  const payload = safeResponse.data ?? response;
  if (!payload) return [];
  
  // Check common paths for array items in our API responses
  const safePayload = payload as Record<string, unknown>;
  const nestedPayload = safePayload.data ?? payload;
  
  const safeNested = nestedPayload as Record<string, unknown>;
  const items = safeNested?.items as Record<string, unknown> | undefined;
  
  if (items && Array.isArray(items.floorDetails)) return items.floorDetails;
  if (Array.isArray(safeNested?.items)) return safeNested.items;
  if (Array.isArray(safeNested?.floorDetails)) return safeNested.floorDetails;
  if (Array.isArray(nestedPayload)) return nestedPayload;
  
  return [];
}

/**
 * Helper to safely extract a single object from a varied API response structure.
 */
function extractDataFromResponse(response: unknown): unknown {
  return (response as Record<string, unknown>)?.data ?? response ?? null;
}

/**
 * Service to fetch and map data for the new Asset Detail View.
 * Fully decoupled from old Asset Detail View code.
 */
export const assetDetailService = {
  /**
   * Fetches floor details and subunit (shop) details, along with necessary master data
   * to resolve IDs to names.
   *
   * @param assetId The parent asset ID.
   * @returns Mapped data ready for UI consumption.
   */
  fetchFloorAndUnitDetails: async (
    assetId: number
  ): Promise<ActionResult<AssetDetailDataPayload>> => {
    try {
      if (!assetId || isNaN(Number(assetId))) {
        return { success: false, error: 'Invalid Asset ID provided to service.' };
      }

      const [
        masterRes,
        floorsRes,
        unitsRes,
        inventoryRes,
        documentsRes,
        photosRes
      ] = await Promise.all([
        apiClient.get<ApiAssetMasterResponse>(`/AssetMaster/${assetId}`).catch(() => null),
        apiClient.get<ApiFloorResponse>(`/AssetFloorDetails/by-asset/${assetId}`).catch(() => null),
        apiClient.get<Record<string, unknown>>(`/ManageSubUnits/parent/${assetId}/all-details`).catch(() => null),
        apiClient.get<Record<string, unknown>>(`/asset-management/AssetInventory/summary/${assetId}`).catch(() => null),
        apiClient.get<Record<string, unknown>>(`/asset-documents/asset/${assetId}`).catch(() => null),
        apiClient.get<Record<string, unknown>>(`/asset-photos/asset/${assetId}`).catch(() => null),
      ]);

      const apiFloors = extractArrayFromResponse(floorsRes).filter(isApiFloorMasterItemShape);
      const apiUnits = extractArrayFromResponse(unitsRes).filter(isApiSubUnitItemShape);
      const rawDocuments = extractArrayFromResponse(documentsRes);
      const rawPhotos = extractArrayFromResponse(photosRes);

      const mappedMaster = masterRes?.data ? mapAssetMasterToUI(masterRes.data) : {};
      const mappedFloors = mapFloorDetailsToUI(apiFloors);
      const mappedUnits = mapUnitDetailsToUI(apiUnits);
      const mappedDocuments = mapDocumentsToUI(rawDocuments);
      const mappedPhotos = mapPhotosToUI(rawPhotos);
      
      if (mappedMaster) {
        mappedMaster.documents = mappedDocuments;
        mappedMaster.photos = mappedPhotos;
      }
      
      if (String(mappedMaster.totalFloors) === '0' && apiFloors.length > 0) {
        mappedMaster.totalFloors = String(apiFloors.length);
      }

      if (mappedMaster.kpiMetrics) {
        const rawMaster = (mappedMaster.raw || {}) as Record<string, number | null | undefined>;
        const totalUnits = mappedUnits.length;
        
        let totalMonthlyRent = 0;
        let totalArrears = 0;
        let occupiedCount = 0;
        
        mappedUnits.forEach(unit => {
          totalMonthlyRent += parseFloat(String(unit.monthlyRent || '0').replace(/[^0-9.-]+/g, '')) || 0;
          totalArrears += parseFloat(String(unit.arrears || '0').replace(/[^0-9.-]+/g, '')) || 0;
          
          const statusStr = unit.occupancyStatus?.toLowerCase() || '';
          if (['occupied', 'rented', 'lease', 'leased'].includes(statusStr)) {
            occupiedCount++;
          }
        });

        if (totalUnits > 0) {
          const occPercent = Math.round((occupiedCount / totalUnits) * 100);
          const annualRev = totalMonthlyRent * 12;
          
          mappedMaster.kpiMetrics.annualRevenue = rawMaster.annualRevenue != null 
            ? `₹ ${rawMaster.annualRevenue.toLocaleString('en-IN')}` 
            : `₹ ${annualRev.toLocaleString('en-IN')}`;
            
          mappedMaster.kpiMetrics.occupancy = `${occPercent}%`;
          mappedMaster.kpiMetrics.occupancyDetails = `${occupiedCount} / ${totalUnits} Units`;
          
          if (rawMaster.totalArrears == null) {
            mappedMaster.kpiMetrics.arrears = `₹ ${totalArrears.toLocaleString('en-IN')}`;
          }
        } else {
          mappedMaster.kpiMetrics.annualRevenue = rawMaster.annualRevenue != null 
            ? `₹ ${rawMaster.annualRevenue.toLocaleString('en-IN')}` 
            : '₹ 0';
            
          mappedMaster.kpiMetrics.occupancy = '0%';
          mappedMaster.kpiMetrics.occupancyDetails = '0 Units';
          
          if (rawMaster.totalArrears == null) {
            mappedMaster.kpiMetrics.arrears = '₹ 0';
          }
        }
      }

      if (!masterRes?.success || !masterRes.data) {
        return { success: false, error: 'Failed to fetch asset master details.' };
      }

      return {
        success: true,
        data: {
          basicDetails: mappedMaster,
          floorSubmissions: mappedFloors,
          shopUnits: mappedUnits,
          inventory: inventoryRes ? mapInventoryToUI(extractDataFromResponse(inventoryRes)) : { inventoryItems: [], detailedInventoryItems: [] },
        },
      };
    } catch (err: unknown) {
      console.error('[assetDetailService] Error fetching details:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch new asset details',
      };
    }
  },
};


