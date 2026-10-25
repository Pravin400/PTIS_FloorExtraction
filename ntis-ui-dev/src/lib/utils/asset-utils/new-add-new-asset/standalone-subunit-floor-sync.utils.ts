/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchFloorsByAsset, saveFloorDetail } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";

/** Loads existing floor-details records for the parent asset, then
 * auto-creates a placeholder AssetFloorDetails record for any floor level
 * referenced by an unsaved unit that doesn't have one yet. Returns the
 * floorLevelId → floorDetailsId map used to resolve each unit's
 * floorDetailsId during the per-unit save loop. */
export async function resolveStandaloneFloorDetailsMap(pId: number, unsaved: any[]): Promise<Map<number, number>> {
  const floorDetailsMap = new Map<number, number>();
  try {
    const existRes = await fetchFloorsByAsset(pId);
    if (existRes.success && Array.isArray(existRes.data)) {
      existRes.data.forEach((f: any) => {
        if (f.floorId && f.id) floorDetailsMap.set(Number(f.floorId), Number(f.id));
      });
    }
  } catch {
    /* ignore — will create new ones */
  }

  const uniqueFloorLevels = new Set<number>(
    unsaved.map((u: any) => u.floorId as number).filter((id: any): id is number => !!id)
  );
  for (const floorLevelId of uniqueFloorLevels) {
    if (!floorDetailsMap.has(floorLevelId)) {
      const sample = unsaved.find((u: any) => u.floorId === floorLevelId);
      const createRes = await saveFloorDetail({
        isActive: true,
        assetId: pId,
        floorId: floorLevelId,
        constructionYear: sample?.conYear || String(new Date().getFullYear()),
        assessmentYear: null,
        constructionTypeId: Number(sample?.conType) || 1,
        typeOfUseId: Number(sample?.useType) || 1,
        subTypeOfUseId: Number(sample?.subUseType) > 0 ? Number(sample?.subUseType) : null,
        carpetAreaSqMeter: 0,
        carpetAreaSqFeet: 0,
        builtUpAreaSqMeter: 0,
        builtUpAreaSqFeet: 0,
        noOfRooms: 0,
        createdBy: 1,
      });
      if (createRes.success && (createRes.data as any)?.id) {
        floorDetailsMap.set(floorLevelId, Number((createRes.data as any).id));
      }
    }
  }

  return floorDetailsMap;
}
