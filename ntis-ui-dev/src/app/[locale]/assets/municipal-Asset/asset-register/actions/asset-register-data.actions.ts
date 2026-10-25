import { assetMasterService } from "@/lib/api/asset/asset-master.service";
import { getAssetLeaseRentDetailsList } from "@/lib/api/asset/asset-lease-rent-details.service";
import { manageSubUnitsService } from "@/lib/api/asset/manage-subunits.service";

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
  sortBy?: string,
  sortOrder?: string,
  encroachmentStatus?: string | null
) {
  if (assetTypeId === '__none__') {
    return {
      items: [],
      totalCount: 0,
      totalPurchaseValue: 0,
      totalCurrentValue: 0,
      totalAreaSqMtr: 0,
    };
  }

  try {
    const response = await assetMasterService.getAllAssetsPaginated({
      pageNumber: page,
      pageSize,
      assetCategoryId: categoryId || null,
      assetTypeId: assetTypeId && assetTypeId !== "all" ? String(assetTypeId) : null,
      zoneId: zoneId && zoneId !== "all" ? Number(zoneId) : null,
      wardId: wardId && wardId !== "all" ? Number(wardId) : null,
      owningDepartmentId: owningDepartmentId && owningDepartmentId !== "all" ? Number(owningDepartmentId) : null,
      searchTerm: search || undefined,
      assetNo: assetNo || undefined,
      assetName: assetName || undefined,
      address: address || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
      encroachmentStatus: encroachmentStatus && encroachmentStatus !== 'all' ? encroachmentStatus : null,
    });

    if (response.success && response.data) {
      const data = response.data;
      let items = Array.isArray(data) ? data : (data.items || []);

      // Enrich asset items with records from ams.AssetLeaseRentDetails table
      try {
        const leaseRentRes = await getAssetLeaseRentDetailsList({ pageSize: 100 });
        if (leaseRentRes && Array.isArray(leaseRentRes.items)) {
          const leaseMap = new Map<number, Record<string, unknown>>();
          leaseRentRes.items.forEach((lr: unknown) => {
            const lrRecord = lr as Record<string, unknown>;
            if (lrRecord?.assetId) leaseMap.set(Number(lrRecord.assetId), lrRecord);
          });

          items = ((items as Array<Record<string, unknown>>).map((itemRecord) => {
            const lr = leaseMap.get(Number(itemRecord.id));
            if (lr) {
              return {
                ...itemRecord,
                leaseRentDetails: lr,
                rentAmount: lr.rentAmount ?? itemRecord.rentAmount,
                paymentFrequency: lr.paymentFrequency ?? itemRecord.paymentFrequency,
                leaseStartDate: lr.leaseStartDate ?? itemRecord.leaseStartDate,
                leaseEndDate: lr.leaseEndDate ?? itemRecord.leaseEndDate,
                startDate: lr.leaseStartDate ?? itemRecord.startDate,
                endDate: lr.leaseEndDate ?? itemRecord.endDate,
                tenantName: lr.tenantName ?? itemRecord.tenantName,
                occupancyStatus: itemRecord.occupancyStatus || (lr.tenantName ? 'Leased/Rented' : 'Occupied'),
              };
            }
            return itemRecord;
          }) as unknown) as typeof items;
        }
      } catch (_e) {
        // Fallback silently if lease rent service call fails
      }

      const rawData = (data as unknown) as Record<string, unknown>;
      return {
        items,
        totalCount: (rawData.totalCount as number) || items.length,
        totalPurchaseValue: (rawData.totalPurchaseValue as number) || 0,
        totalMarketValue: (rawData.totalMarketValue as number) || 0,
        totalDepreciation: (rawData.totalDepreciation as number) || 0,
        totalOutstanding: (rawData.totalOutstanding as number) ?? (rawData.totalOutstandingAmount as number) ?? (rawData.netBookValue as number) ?? 0,
        netBookValue: (rawData.netBookValue as number) || 0,
        totalCapitalValue: (rawData.totalCapitalValue as number) || 0,
        totalAnnualRevenue: (rawData.totalAnnualRevenue as number) || 0,
        activeAssetsCount: (rawData.activeAssetsCount as number) || 0,
        encroachmentsCount: (rawData.encroachmentsCount as number) ?? (rawData.totalEncroachments as number) ?? 0,
        avgHealthScore: (rawData.avgHealthScore as number | null) ?? null,
        error: null,
      };
    }
  } catch (_err) {
    // Empty catch
  }

  return { items: [], totalCount: 0, totalPurchaseValue: 0, totalMarketValue: 0, totalDepreciation: 0, netBookValue: 0, totalCapitalValue: 0, activeAssetsCount: 0, avgHealthScore: null, error: null };
}

export async function fetchBatchAssetHealthScoresAction(
  assetIds: number[]
): Promise<Record<number, { healthScore: number; healthScoreRating: string }>> {
  if (!assetIds || assetIds.length === 0) return {};
  try {
    const res = await assetMasterService.getHealthScoresBatch(assetIds);
    if (!res.success || !res.data) return {};
    const map: Record<number, { healthScore: number; healthScoreRating: string }> = {};
    for (const row of res.data) {
      map[row.assetId] = { healthScore: row.healthScore, healthScoreRating: row.healthScoreRating };
    }
    return map;
  } catch (err) {
    console.error('Batch fetch child asset health scores error:', err);
    return {};
  }
}

export async function deleteAssetAction(id: number) {
  try {
    const res = await assetMasterService.deleteAsset(id);
    return res;
  } catch (error) {
    console.error('Failed to delete asset in server action:', error);
    return {
      success: false,
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Failed to delete asset',
    };
  }
}

export async function fetchAssetDetailsAction(assetId: number) {
  try {
    let childUnits: Array<Record<string, unknown>> = [];

    // Try fetching sub-units from ManageSubUnits API endpoints
    try {
      const subRes = await manageSubUnitsService.getAllDetailsByParentId(assetId);
      if (subRes.success && Array.isArray(subRes.data) && subRes.data.length > 0) {
        childUnits = subRes.data as Array<Record<string, unknown>>;
      } else {
        const subRes2 = await manageSubUnitsService.getCompleteDetailsByParentId(assetId);
        if (subRes2.success && Array.isArray(subRes2.data) && subRes2.data.length > 0) {
          childUnits = subRes2.data as Array<Record<string, unknown>>;
        } else {
          const subRes3 = await manageSubUnitsService.getByAssetId(assetId);
          if (subRes3.success && Array.isArray(subRes3.data) && subRes3.data.length > 0) {
            childUnits = (subRes3.data as unknown) as Array<Record<string, unknown>>;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch sub-units from manageSubUnitsService:', e);
    }

    const res = await assetMasterService.getAssetById(assetId);
    const rawData = (res.success && res.data ? res.data : {}) as Record<string, unknown>;

    if (childUnits.length === 0) {
      childUnits = ((rawData.childUnits || rawData.subUnits || rawData.units || rawData.rooms || rawData.childAssets || rawData.subAssets || rawData.subAssetDetails || []) as Array<Record<string, unknown>>);
    }

    // Enrich child units with records from ams.AssetLeaseRentDetails table for this parent asset
    try {
      const leaseRentRes = await getAssetLeaseRentDetailsList({ parentAssetId: assetId, pageSize: 200 } as { parentAssetId?: number; pageSize?: number });
      if (leaseRentRes && Array.isArray(leaseRentRes.items) && leaseRentRes.items.length > 0) {
        const leaseMap = new Map<number, Record<string, unknown>>();
        const leaseBySubUnitIdMap = new Map<number, Record<string, unknown>>();
        const leaseByShopNoMap = new Map<string, Record<string, unknown>>();
        leaseRentRes.items.forEach((lr: unknown) => {
          const lrRecord = lr as Record<string, unknown>;
          if (lrRecord?.assetId) leaseMap.set(Number(lrRecord.assetId), lrRecord);
          if (lrRecord?.subUnitDetailsId) leaseBySubUnitIdMap.set(Number(lrRecord.subUnitDetailsId), lrRecord);
          if (lrRecord?.shopNo) leaseByShopNoMap.set(String(lrRecord.shopNo).trim().toLowerCase(), lrRecord);
        });

        childUnits = childUnits.map((unit) => {
          const uId = Number(unit.assetId ?? unit.AssetId ?? unit.id ?? unit.Id ?? unit.subUnitId);
          const subUnitDetailId = Number(unit.subUnitDetailsId ?? unit.floorDetailsId ?? unit.id);
          const shopIdentifier = String(unit.unitNo || unit.shopNo || unit.subUnitNo || unit.name || unit.subUnitName || '').trim().toLowerCase();

          const lr = leaseMap.get(uId) ||
            leaseBySubUnitIdMap.get(subUnitDetailId) ||
            (shopIdentifier ? leaseByShopNoMap.get(shopIdentifier) : undefined);
          if (lr) {
            return {
              ...unit,
              leaseRentDetails: lr,
              isRented: true,
              rentAmount: lr.rentAmount ?? unit.rentAmount,
              monthlyRent: lr.monthlyRent ?? lr.rentAmount ?? unit.monthlyRent,
              paymentFrequency: lr.paymentFrequency ?? unit.paymentFrequency,
              leaseStartDate: lr.leaseStartDate ?? unit.leaseStartDate,
              leaseEndDate: lr.leaseEndDate ?? unit.leaseEndDate,
              startDate: lr.leaseStartDate ?? unit.startDate,
              endDate: lr.leaseEndDate ?? unit.endDate,
              tenantName: lr.tenantName ?? unit.tenantName,
              occupancyStatus: lr.workflowStatus || unit.occupancyStatus || 'Rented',
              status: lr.workflowStatus || unit.status || 'Rented',
              shopNo: lr.shopNo || unit.shopNo,
              shopName: lr.shopName || unit.shopName,
            };
          }
          return unit;
        });
      }
    } catch (e) {
      console.error('Error enriching child units with lease details:', e);
    }

    childUnits = (childUnits || []).map((unit) => {
      const floorsArr = (Array.isArray(unit.floorDetails)
        ? unit.floorDetails
        : (Array.isArray(unit.FloorDetails) ? unit.FloorDetails : [])) as Array<Record<string, unknown>>;

      const floorCapValSum = floorsArr.reduce((sum: number, f) => sum + (Number(f.capitalValue ?? f.CapitalValue ?? f.baseValue ?? f.BaseValue) || 0), 0);
      const floorBuiltUpSum = floorsArr.reduce((sum: number, f) => sum + (Number(f.builtUpAreaSqMeter ?? f.builtupAreaSqMeter ?? f.BuiltUpAreaSqMeter ?? f.BuiltupAreaSqMeter) || 0), 0);
      const floorCarpetSum = floorsArr.reduce((sum: number, f) => sum + (Number(f.carpetAreaSqMeter ?? f.CarpetAreaSqMeter) || 0), 0);
      const firstFloor = floorsArr[0] || {};

      const detailsObj = unit.details as Record<string, unknown> | undefined;
      const capitalValue = unit.capitalValue ?? unit.CapitalValue ?? (floorCapValSum > 0 ? floorCapValSum : null) ?? unit.subUnitCapitalValue ?? unit.subUnitValue ?? unit.calculatedCapitalValue ?? unit.value ?? detailsObj?.capitalValue;
      const builtUpAreaSqMeter = unit.builtUpAreaSqMeter ?? unit.builtupAreaSqMeter ?? unit.BuiltUpAreaSqMeter ?? (floorBuiltUpSum > 0 ? floorBuiltUpSum : null) ?? detailsObj?.builtUpAreaSqMeter;
      const carpetAreaSqMeter = unit.carpetAreaSqMeter ?? unit.CarpetAreaSqMeter ?? (floorCarpetSum > 0 ? floorCarpetSum : null) ?? detailsObj?.carpetAreaSqMeter;
      const constructionYear = unit.constructionYear ?? firstFloor.constructionYear ?? detailsObj?.constructionYear;

      return {
        ...unit,
        capitalValue,
        builtUpAreaSqMeter,
        carpetAreaSqMeter,
        constructionYear,
      };
    });

    return {
      success: true,
      data: {
        ...rawData,
        childUnits: childUnits || [],
      },
      error: null,
    };
  } catch (err: unknown) {
    console.error('Failed to fetch asset details in server action:', err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch asset details',
    };
  }
}
