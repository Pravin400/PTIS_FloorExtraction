/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import {
  syncFloorAreaAction,
  calculateUnitCVAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/**
 * Calculates or extracts this unit's Capital Value.
 * If the backend create/update response already calculated and returned CV factors in childRes.data,
 * those factors are adopted immediately for zero-latency UI synchronization.
 * Otherwise, falls back to POST /AssetCapitalValue/unit/calculate-cv via calculateUnitCVAction.
 */
export async function calculateSavedUnitCV(childRes: any, childAssetId: number) {
  let calculatedCV: any = null;

  // Check if factors/floorData were already calculated & returned by the backend
  const floorData = childRes?.data?.floorData;
  const hasDirectFactors =
    floorData ||
    (childRes?.data?.cvFloorFactor !== undefined && childRes?.data?.cvFloorFactor !== null);

  if (hasDirectFactors) {
    calculatedCV = {
      cvFloorFactor: floorData?.cvFloorFactor ?? childRes?.data?.cvFloorFactor,
      cvAgeFactor: floorData?.cvAgeFactor ?? childRes?.data?.cvAgeFactor,
      cvNatureFactor: floorData?.cvNatureFactor ?? childRes?.data?.cvNatureFactor,
      cvUseFactor: floorData?.cvUseFactor ?? childRes?.data?.cvUseFactor,
      cvBaseRate: floorData?.cvBaseRate ?? childRes?.data?.cvBaseRate,
      baseValue: floorData?.baseValue ?? childRes?.data?.baseValue,
      capitalValue: floorData?.capitalValue ?? childRes?.data?.capitalValue,
      isCalculated: true,
    };
    return calculatedCV;
  }

  try {
    const returnedSubUnitsDetailsId =
      childRes.data.subUnitsDetailsId || childRes.data.roomWiseSubmissionDetailsId || undefined;
    const targetAssetId = childRes.data.assetId || childAssetId;
    if (targetAssetId) {
      const cvRes = await calculateUnitCVAction(targetAssetId, returnedSubUnitsDetailsId);
      if (!cvRes.success) {
        console.warn(
          `Floor saved, but capital value calculation failed: ${cvRes.error || 'Unknown error'}`
        );
      } else {
        calculatedCV = cvRes.data?.floorDetails?.[0] || null;
        // The endpoint can return HTTP 200 with isCalculated:false (e.g. missing rate-master
        // data for this year range/use group) — that's a calculation failure too, not just a
        // request-level one, and must surface the same way or it silently renders as ₹0.
        if (calculatedCV && calculatedCV.isCalculated === false) {
          toast.warning(
            `Floor saved, but capital value calculation failed: ${calculatedCV.calculationMessage || 'Unknown error'}`
          );
        }
      }
    }
  } catch (cvErr: any) {
    console.warn(
      `Floor saved, but capital value calculation failed: ${cvErr.message || cvErr}`
    );
  }
  return calculatedCV;
}

/**
 * Aggregates/merges totals across all child assets on this floorDetailsId (the local
 * state + the newly-saved entry) and pushes the merged room details up via
 * syncFloorAreaAction (area only — this unit's own CV was already calculated by
 * calculateSavedUnitCV above).
 */
export async function syncParentFloorTotals(
  floorDetailsId: number,
  floorIdNum: number,
  childAssetId: number,
  __childAssetNo: string | undefined,
  childAssetName: string,
  resolvedRoomDetails: any[] | null,
  formState: any,
  savedFloors: any[],
  formData: any,
  setDbFloors: React.Dispatch<React.SetStateAction<any[]>>
) {
  const remainingFloorsOnThisLevel = savedFloors.filter(
    (f: any) =>
      Number(f.floorDetailsId) === Number(floorDetailsId) &&
      Number(f.id) !== Number(childAssetId)
  );

  const allSubUnits = [
    ...remainingFloorsOnThisLevel,
    {
      id: childAssetId,
      unitNo: formState.unitNo || '',
      shopUnitName: childAssetName,
      carpetAreaSqFt: formState.carpetAreaSqFt || 0,
      totalAreaSqFt: formState.carpetAreaSqFt || 0,
      carpetAreaSqFeet: formState.carpetAreaSqFt || 0,
      roomDetails: resolvedRoomDetails
        ? resolvedRoomDetails.map((r) => ({ ...r, assetId: childAssetId, AssetId: childAssetId }))
        : [],
      roomWiseDetails: resolvedRoomDetails
        ? resolvedRoomDetails.map((r) => ({ ...r, assetId: childAssetId, AssetId: childAssetId }))
        : [],
    },
  ];

  const mergedRoomDetails: any[] = [];
  allSubUnits.forEach((u: any) => {
    const rooms = Array.isArray(u.roomDetails)
      ? u.roomDetails
      : Array.isArray(u.roomWiseDetails)
        ? u.roomWiseDetails
        : [];
    rooms.forEach((r: any) => {
      mergedRoomDetails.push({ ...r, assetId: u.id, AssetId: u.id });
    });
  });

  const syncRes = await syncFloorAreaAction(
    formData.id || 0,
    floorIdNum,
    mergedRoomDetails.length > 0 ? mergedRoomDetails : null
  );
  if (syncRes.success && syncRes.data?.floors) {
    setDbFloors(syncRes.data.floors);
  }
}

