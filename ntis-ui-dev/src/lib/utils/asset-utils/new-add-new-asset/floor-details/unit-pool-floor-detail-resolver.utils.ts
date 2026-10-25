/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchFloorsByAsset, saveFloorDetail } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/** Resolves the floorDetailsId for a unit being saved from the pool
 * configurator: reuses an already-known id, looks it up from already-loaded
 * parentFloors, re-fetches from the DB if not found locally, and as a last
 * resort creates a placeholder floor-details record so the child asset save
 * that follows always has a valid parent record to attach to. */
export async function resolveOrCreateUnitFloorDetailsId(
  updated: any,
  unit: any,
  parentAssetId: number,
  parentFloors: any[],
  isDuplicateMode?: boolean
): Promise<{ resolvedFloorDetailsId: number | undefined; newFloorId: number | null }> {
  const newFloorId = updated.floorId ? Number(updated.floorId) : unit.selectedFloorId;
  const targetSubFloorId = updated.subFloorId ? Number(updated.subFloorId) : null;

  let resolvedFloorDetailsId = isDuplicateMode
    ? undefined
    : (updated.floorDetailsId ? Number(updated.floorDetailsId) : unit.floorDetailsId);

  if (!resolvedFloorDetailsId && newFloorId) {
    const existingFloor = parentFloors.find(
      (f: any) =>
        Number(f.floorId || f.FloorId) === newFloorId &&
        (targetSubFloorId
          ? Number(f.subFloorId || f.SubFloorId) === targetSubFloorId
          : (!f.subFloorId && !f.SubFloorId))
    );
    if (existingFloor?.id) {
      resolvedFloorDetailsId = existingFloor.id;
    } else {
      const existRes = await fetchFloorsByAsset(parentAssetId);
      if (existRes.success && Array.isArray(existRes.data)) {
        const found = existRes.data.find(
          (f: any) =>
            Number(f.floorId) === newFloorId &&
            (targetSubFloorId ? Number(f.subFloorId) === targetSubFloorId : !f.subFloorId)
        );
        if (found?.id) {
          resolvedFloorDetailsId = found.id;
        }
      }
    }

    if (!resolvedFloorDetailsId && newFloorId) {
      const sampleConYear =
        updated.conYear || unit.conYear || String(new Date().getFullYear());
      const sampleConType = Number(updated.conType || unit.conType || 1);
      const sampleUseType = Number(updated.useType || unit.useType || 1);
      const sampleSubUseTypeRaw = Number(updated.subUseType || unit.subUseType || 0);
      const sampleSubUseType = sampleSubUseTypeRaw > 0 ? sampleSubUseTypeRaw : null;

      const floorPayload = {
        isActive: true,
        assetId: parentAssetId,
        floorId: newFloorId,
        subFloorId: targetSubFloorId || undefined,
        constructionYear: sampleConYear,
        assessmentYear: updated.asstYear || unit.asstYear || String(new Date().getFullYear()),
        constructionTypeId: sampleConType,
        typeOfUseId: sampleUseType,
        subTypeOfUseId: sampleSubUseType,
        carpetAreaSqMeter: 0,
        carpetAreaSqFeet: 0,
        builtUpAreaSqMeter: 0,
        builtUpAreaSqFeet: 0,
        noOfRooms: 0,
        roomDetails: null,
        createdBy: 1,
      };

      const createRes = await saveFloorDetail(floorPayload);
      if (createRes.success && createRes.data) {
        resolvedFloorDetailsId =
          typeof createRes.data === 'object'
            ? Number((createRes.data as any).id || (createRes.data as any).items?.id)
            : Number(createRes.data);
      } else {
        console.warn(
          'Non-fatal: Failed to initialize floor details record, continuing to save subunit directly:',
          createRes.error
        );
      }
    }
  }

  return { resolvedFloorDetailsId, newFloorId };
}
