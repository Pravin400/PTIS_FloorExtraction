'use server';

import * as assetDashboardService from '@/lib/api/assets/dashboard/master-dashboard/asset-dashboard.service';
import { wardService, zoneService } from '@/lib/api/assets/dashboard/master-dashboard/asset-dashboard.service';
import { mapSummaryToStats } from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import type { DashboardCategoryItem, DashboardDataPayload, AssetSummaryData } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import type { AssetDashboardAssetByType, AssetDashboardTypeByCategory } from '@/types/assets/dashboard/master-dashboard/asset-dashboard-api.types';
import { ApiResponse } from '@/types/common.types';

import { 
  isRecord, 
  normalizeMasterData, 
  normalizeCategoryItem, 
  locationsToAssets, 
  extractIsActive,
  type RawMasterData 
} from '@/lib/utils/asset-utils/asset-dashboard-helpers';

export async function fetchDashboardData(
  zoneId?: number | null,
  wardId?: number | null,
  categoryId?: number | null,
  typeId?: number | null,
  zoneName?: string | null,
  wardName?: string | null,
  assetId?: number | null,
): Promise<ApiResponse<DashboardDataPayload>> {
  try {
    const [zRes, wRes] = await Promise.all([
      zoneService.getZones().catch(() => null),
      wardService.getWards().catch(() => null),
    ]);

    const zMasterRaw: unknown[] = zRes?.success && Array.isArray(zRes.data) ? zRes.data : [];
    const wMasterRaw: unknown[] = wRes?.success && Array.isArray(wRes.data) ? wRes.data : [];

    const zMaster: RawMasterData[] = zMasterRaw.filter(isRecord).map(normalizeMasterData);
    const wMaster: RawMasterData[] = wMasterRaw.filter(isRecord).map(normalizeMasterData);

    let resolvedZoneId = zoneId;
    let resolvedWardId = wardId;

    if (!resolvedZoneId && zoneName) {
      const zoneObj = zMaster.find((z) =>
        String(z.zoneNo || '') === zoneName ||
        String(z.zoneName || z.description || '') === zoneName
      );
      if (zoneObj) resolvedZoneId = Number(zoneObj.id || zoneObj.zoneId);
    }

    if (!resolvedWardId && wardName) {
      const wardObj = wMaster.find((w) =>
        String(w.wardNo || w.name || w.wardName || w.description || '') === wardName
      );
      if (wardObj) resolvedWardId = Number(wardObj.id || wardObj.wardId);
    }

    const [payloadRes, tbc, assetsByTypeRes] = await Promise.all([
      assetDashboardService.getAllDashboardData(resolvedZoneId, resolvedWardId, zoneName, wardName, categoryId).catch(() => null),
      categoryId ? assetDashboardService.getTypesByCategory(categoryId, resolvedZoneId, resolvedWardId, zoneName, wardName) : Promise.resolve(null),
      typeId ? assetDashboardService.getAssetsByType(typeId, resolvedZoneId, resolvedWardId, zoneName, wardName, assetId) : Promise.resolve(null),
    ]);

    if (!payloadRes) {
      return { success: false, statusCode: 500, message: 'Failed to fetch dashboard data payload' };
    }

    const { summary, types, locations } = payloadRes;

    const categoriesRaw = Array.isArray(summary?.assetCountCardDetails) ? summary.assetCountCardDetails : [];
    const categories: DashboardCategoryItem[] = categoriesRaw.filter(isRecord).map(c => normalizeCategoryItem(c as unknown as Record<string, unknown>)).filter(c => c.isActive !== false);
    const stats = summary ? mapSummaryToStats(summary as unknown as AssetSummaryData, categories) : null;

    const filteredAssets = locationsToAssets(locations || []);

    const typesRaw = Array.isArray(types) ? types : [];
    let fetchedTypes: AssetDashboardTypeByCategory[] = typesRaw.filter(isRecord).map((t) => ({
      id: Number(t.id),
      assetType: String(t.assetType || ''),
      count: Number(t.count || 0),
      totalValue: Number(t.totalValue || 0),
      categoryId: Number(t.categoryId),
      isActive: extractIsActive(t),
    })).filter(t => t.isActive !== false);

    if (categoryId && tbc) {
      const otherTypes = fetchedTypes.filter(t => Number(t.categoryId) !== Number(categoryId));
      const mappedTbc = tbc.map(t => ({
        ...t,
        isActive: extractIsActive(t)
      })).filter(t => t.isActive !== false);
      fetchedTypes = [...otherTypes, ...mappedTbc];
    }

    let fetchedAssets: AssetDashboardAssetByType[] = [];
    if (typeId && assetsByTypeRes) {
      fetchedAssets = (assetsByTypeRes || []).map((a: AssetDashboardAssetByType) => {
        let mappedZone = a.zone;
        let mappedZoneName = a.zoneName;
        
        const match = zMaster.find(z => 
          String(z.description || z.zoneName || '') === String(a.zone || a.zoneName || '')
        );
        if (match && match.zoneNo) {
          const zNo = String(match.zoneNo);
          mappedZone = zNo;
          mappedZoneName = zNo;
        }

        return { 
          ...a, 
          __typeId: typeId,
          zone: mappedZone,
          zoneName: mappedZoneName,
        };
      });
    }


    const allZones = Array.from(new Set(
      zMaster.map((z) => String(z.zoneNo || z.zoneName || z.description || '')).filter(Boolean)
    ));

    const allWardsRaw = wMaster.map((w) => ({
      wardNo: String(w.wardNo || w.name || w.wardName || w.description || ''),
      zoneNo: String(zMaster.find((z) => z.id === w.zoneId)?.zoneNo || ''),
    })).filter((w: { wardNo: string; zoneNo: string }) => w.wardNo);

    const allWards = Array.from(new Map(allWardsRaw.map((w: { wardNo: string; zoneNo: string }) => [w.wardNo, w])).values());

    return {
      success: true, statusCode: 200, message: 'Success',
      data: {
        stats: stats || {
          totalAssets: { value: '0', change: '', backInfo: [] },
          totalValue: { value: '0', change: '', backInfo: [] },
          monetized: { value: '0', change: '', backInfo: [] },
          encroachments: { value: '0', change: '', backInfo: [] },
          maintenance: { value: '0', change: '', backInfo: [] },
          auctions: { value: '0', change: '', backInfo: [] },
          acquisitions: { value: '0', change: '', backInfo: [] }
        },
        filteredAssets,
        categories,
        allZones,
        allWards,
        fetchedTypes,
        fetchedAssets,
        fetchedLocations: locations || [],
      },
    };
  } catch (err) {
    return { success: false, statusCode: 500, message: String(err) };
  }
}
