/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  saveFloorDetail,
  fetchFloorsByAsset,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

export async function resolveOrCreateFloorDetailsRecord(
  floorIdNum: number,
  subFloorIdNum: number | null,
  roomDetails: any[] | null,
  ctx: {
    formState: any;
    dbFloors: any[];
    setDbFloors: React.Dispatch<React.SetStateAction<any[]>>;
    formData: any;
  }
): Promise<number> {
  const { formState, dbFloors, setDbFloors, formData } = ctx;

  // 1. Find matching floor level record locally from our state dbFloors
  const matchedFloor = dbFloors.find((f: any) => {
    const fId = f.floorId !== undefined ? f.floorId : f.FloorId;
    const sfId = f.subFloorId !== undefined ? f.subFloorId : f.SubFloorId;
    return Number(fId) === floorIdNum && (sfId ? Number(sfId) : null) === subFloorIdNum;
  });

  if (matchedFloor) {
    return Number(matchedFloor.id);
  }

  // Create the floor detail record first with initial entry's values
  const floorPayload: any = {
    isActive: true,
    assetId: formData.id || 0,
    floorId: floorIdNum,
    subFloorId: subFloorIdNum || undefined,
    constructionYear: formState.submissionType === 'Open Space' ? null : formState.conYear,
    assessmentYear: formState.asstYear,
    constructionTypeId:
      formState.submissionType === 'Open Space'
        ? 11
        : formState.conType
          ? Number(formState.conType)
          : null,
    typeOfUseId: Number(formState.useType),
    subTypeOfUseId:
      formState.subUseType && Number(formState.subUseType) > 0
        ? Number(formState.subUseType)
        : null,
    carpetAreaSqMeter: (formState.carpetAreaSqFt || 0) / 10.7639,
    carpetAreaSqFeet: formState.carpetAreaSqFt || 0,
    builtUpAreaSqMeter:
      formState.submissionType === 'Open Space'
        ? 0
        : (formState.builtUpAreaSqFt || 0) / 10.7639,
    builtUpAreaSqFeet:
      formState.submissionType === 'Open Space' ? 0 : formState.builtUpAreaSqFt || 0,
    noOfRooms: formState.rooms || 0,
    roomDetails: roomDetails,
    createdBy: 1,
  };
  const createRes = await saveFloorDetail(floorPayload);
  if (!createRes.success || !createRes.data) {
    throw new Error(createRes.error || 'Failed to create parent floor details record.');
  }
  const createdRecord = createRes.data as any;
  let floorDetailsId = Number(createdRecord.id ?? createdRecord.Id ?? 0);

  if (Number.isNaN(floorDetailsId)) {
    // A genuine parsing failure (not the id=0 placeholder case below) — re-fetch the
    // floors from the server and recover the real id by floor/sub-floor match instead of
    // threading NaN into the child-asset payload.
    const refetched = await fetchFloorsByAsset(formData.id || 0);
    const realFloors = refetched.success && Array.isArray(refetched.data) ? refetched.data : [];
    const recovered = realFloors.find((f: any) => {
      const fId = f.floorId ?? f.FloorId;
      const sfId = f.subFloorId ?? f.SubFloorId ?? null;
      return Number(fId) === floorIdNum && (sfId ? Number(sfId) : null) === subFloorIdNum;
    });
    if (recovered) {
      floorDetailsId = Number((recovered as any).id ?? (recovered as any).Id);
      setDbFloors(realFloors);
    }
    if (!floorDetailsId || Number.isNaN(floorDetailsId)) {
      throw new Error(
        'Floor details were saved but the record could not be located. Please try again.'
      );
    }
  } else if (floorDetailsId > 0) {
    setDbFloors((prev) => [...prev, createdRecord]);
  }
  // floorDetailsId === 0 is a legitimate backend placeholder (SubUnitsDetailsService.CreateAsync):
  // for a building that already has children, a floor with no child on it yet returns Id=0
  // rather than inserting a row — the real row is created moments later, keyed by the new
  // child unit's own asset id, inside createChildAssetAction. Don't cache it into dbFloors
  // (it isn't a real record) and let 0 flow through to the child payload as-is.

  return floorDetailsId;
}
