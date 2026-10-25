/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveFloorDetail, updateFloorDetail } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import type { PoolUnit } from '@/types/asset/floor-details.types';
import { mapFloorLevelOpenSpaces, mapFloorLevelAmenities } from './unit-pool-floor-space-payload.utils';

/** Auto-creates/updates the AssetFloorDetails record for every floor level
 * that has unsaved/modified units, configured open spaces, or configured
 * amenities. Mutates `floorDetailsMap` (floorLevelId → floorDetailsId) with
 * newly-created ids so callers can resolve them for the per-unit save that
 * follows. Returns any per-floor error messages collected along the way. */
export async function syncFloorLevelDetails(
  uniqueFloorLevels: Set<number>,
  floorOpenSpaces: Record<string, any[]>,
  floorAmenities: Record<string, any[]>,
  parentFloors: any[],
  pool: PoolUnit[],
  parentAssetId: number,
  floorDetailsMap: Map<number, number>
): Promise<string[]> {
  const errors: string[] = [];

  for (const floorLevelId of uniqueFloorLevels) {
    const spaces = floorOpenSpaces[String(floorLevelId)] || [];
    const amenities = floorAmenities[String(floorLevelId)] || [];

    const mappedSpaces = mapFloorLevelOpenSpaces(spaces);
    const mappedAmenities = mapFloorLevelAmenities(amenities);
    const roomDetails = [...mappedSpaces, ...mappedAmenities];

    // If there are no floor-level open spaces or amenities to sync for this floor level,
    // do not touch, create, or overwrite any floor record (e.g. existing floor submissions).
    if (roomDetails.length === 0) {
      continue;
    }

    const totalCarpetSqM =
      spaces.reduce((acc: number, os: any) => acc + os.netAreaSqM * os.count, 0) +
      amenities.reduce((acc: number, am: any) => acc + am.netAreaSqM * am.count, 0);
    const totalCarpetSqFt = totalCarpetSqM * 10.7639;
    const totalBuiltUpSqM = totalCarpetSqM * 1.2;
    const totalBuiltUpSqFt = totalBuiltUpSqM * 10.7639;

    const existingFloor = parentFloors.find(
      (f: any) => Number(f.floorId || f.FloorId) === Number(floorLevelId)
    );
    const sample = pool.find((u: PoolUnit) => u.selectedFloorId === floorLevelId);

    const subFloorId = (sample?.subFloorId && Number(sample.subFloorId) > 0)
      ? Number(sample.subFloorId)
      : undefined;
    const constructionYear =
      sample?.conYear || existingFloor?.constructionYear || String(new Date().getFullYear());
    const constructionTypeId = Number(
      sample?.conType || existingFloor?.constructionTypeId || 1
    );
    const typeOfUseId = Number(sample?.useType || existingFloor?.typeOfUseId || 1);
    const subTypeOfUseIdRaw = Number(sample?.subUseType || 0);
    const subTypeOfUseId = subTypeOfUseIdRaw > 0 ? subTypeOfUseIdRaw : null;

    const floorPayload: any = {
      isActive: true,
      assetId: parentAssetId,
      floorId: floorLevelId,
      subFloorId: subFloorId ? Number(subFloorId) : undefined,
      constructionYear,
      assessmentYear: '2026',
      constructionTypeId,
      typeOfUseId,
      subTypeOfUseId,
      carpetAreaSqMeter: totalCarpetSqM,
      carpetAreaSqFeet: totalCarpetSqFt,
      builtUpAreaSqMeter: totalBuiltUpSqM,
      builtUpAreaSqFeet: totalBuiltUpSqFt,
      noOfRooms:
        spaces.reduce((acc: number, os: any) => acc + (os.count || 1), 0) +
        amenities.reduce((acc: number, am: any) => acc + (am.count || 1), 0),
      roomDetails: roomDetails.length > 0 ? roomDetails : null,
      createdBy: 1,
    };

    const existingDbId = floorDetailsMap.get(floorLevelId as number);
    if (existingDbId) {
      const updateRes = await updateFloorDetail(existingDbId, floorPayload);
      if (!updateRes.success) {
        errors.push(
          `Floor ${floorLevelId}: ${updateRes.error || 'Failed to update floor details'}`
        );
      }
    } else {
      const createRes = await saveFloorDetail(floorPayload);
      if (createRes.success && createRes.data) {
        const returnedId =
          typeof createRes.data === 'object'
            ? Number((createRes.data as any).id || (createRes.data as any).items?.id)
            : Number(createRes.data);
        if (returnedId) {
          floorDetailsMap.set(floorLevelId as number, returnedId);
        }
      } else {
        errors.push(
          `Floor ${floorLevelId}: ${createRes.error || 'Failed to create floor details'}`
        );
      }
    }
  }

  return errors;
}
