/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { floorDetailsService } from '@/lib/api/asset/municipal-Asset/new-add-new-asset/floor-details.service';
import { logger } from '@/lib/utils/logger';

/** Merges department/area/floor fields from the parent AssetMaster record
 * into the fetched subunit detail (in place), for whichever fields the
 * subunit response itself left blank. */
export function mergeAssetMasterIntoDetail(detail: any, assetMasterRes: any) {
  if (!assetMasterRes.success || !assetMasterRes.data) return;
  const master = assetMasterRes.data as any;
  detail.departmentId = master.departmentId || null;
  detail.departmentName = master.departmentName || null;

  // Merge area details
  detail.totalAreaSqFt =
    detail.totalAreaSqFt ?? master.totalAreaSqFt ?? master.TotalAreaSqFt ?? null;
  detail.carpetAreaSqFeet =
    detail.carpetAreaSqFeet ?? master.carpetAreaSqFeet ?? master.CarpetAreaSqFeet ?? null;
  detail.carpetAreaSqMeter =
    detail.carpetAreaSqMeter ?? master.carpetAreaSqMeter ?? master.CarpetAreaSqMeter ?? null;
  detail.builtUpAreaSqFeet =
    detail.builtUpAreaSqFeet ?? master.builtUpAreaSqFeet ?? master.BuiltUpAreaSqFeet ?? null;
  detail.builtUpAreaSqMeter =
    detail.builtUpAreaSqMeter ?? master.builtUpAreaSqMeter ?? master.BuiltUpAreaSqMeter ?? null;

  // Merge and normalize floorDetailsId/floorId
  const masterFloorDetailsId =
    master.floorDetailsId ?? master.FloorDetailsId ?? master.floorId ?? master.FloorId ?? null;
  detail.floorDetailsId =
    detail.floorDetailsId ??
    detail.FloorDetailsId ??
    detail.floorId ??
    detail.FloorId ??
    masterFloorDetailsId;
}

/** Resolves and normalizes detail.floorDetailsId, then (if present) resolves
 * detail.subFloorId from either the preFetched floors list or a direct
 * getFloorById call. Mutates `detail` in place. */
export async function resolveSubFloorId(detail: any, preFetchedFloors?: any[]) {
  const finalFloorDetailsId =
    detail.floorDetailsId ?? detail.FloorDetailsId ?? detail.floorId ?? detail.FloorId ?? null;
  detail.floorDetailsId = finalFloorDetailsId ? Number(finalFloorDetailsId) : null;

  if (!detail.floorDetailsId) return;

  try {
    let floorData: any = null;
    if (preFetchedFloors && preFetchedFloors.length > 0) {
      floorData = preFetchedFloors.find(
        (f: any) => Number(f.id ?? f.Id) === Number(detail.floorDetailsId)
      );
    }

    if (!floorData) {
      const floorRes = await floorDetailsService.getFloorById(detail.floorDetailsId);
      if (floorRes.success && floorRes.data) {
        floorData = floorRes.data;
      }
    }

    if (floorData) {
      detail.subFloorId = floorData.subFloorId ?? floorData.SubFloorId ?? null;
    }
  } catch (floorErr) {
    logger.error(
      `Failed to fetch floor details for floorDetailsId=${detail.floorDetailsId} to resolve subFloorId:`,
      { error: floorErr as Error }
    );
  }
}
