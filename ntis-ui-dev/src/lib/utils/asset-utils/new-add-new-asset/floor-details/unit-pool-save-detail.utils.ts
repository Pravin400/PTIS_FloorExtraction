/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchFloorDropdownOptions, getSubUnitsByAssetAction, fetchFloorsByAsset } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';
import { mapSubUnitsToFloors } from './direct-room-mapper.utils';

/**
 * Refreshes the floor snapshot in context formData so NAFloorTable updates immediately.
 */
export async function syncFloorSnapshotAfterSave(
  parentAssetId: number,
  typeId: number,
  updateFormData: (data: any) => void
) {
  try {
    if (parentAssetId <= 0 || typeId <= 0) return;
    const [dropdownsRes, subUnitsRes, floorsRes] = await Promise.all([
      fetchFloorDropdownOptions(typeId),
      getSubUnitsByAssetAction(parentAssetId),
      fetchFloorsByAsset(parentAssetId),
    ]);
    if (dropdownsRes.success && subUnitsRes.success && floorsRes.success) {
      const mapped = mapSubUnitsToFloors(
        (subUnitsRes.data as any[]) || [],
        (floorsRes.data as any[]) || [],
        dropdownsRes.data
      );
      updateFormData({ floors: mapped });
    }
  } catch (syncErr) {
    console.error('Failed to sync floor snapshot after unit detail save:', syncErr);
  }
}

/**
 * Parses and formats potential duplicate MPMS or database error messages.
 */
export function formatUnitSaveErrorMessage(unit: any, rawError: string): string {
  const isDuplicateMpms = /mpms|ux_assetdetails_mpmsno|duplicate key.*mpms/i.test(rawError);
  let mpmsVal = unit.mpmsNo || (unit as any).MpmsNo || (unit as any).MPMSNo || (unit as any).details?.mpmsNo || '';
  if (!mpmsVal) {
    const match = rawError.match(/duplicate key value is \(([^)]+)\)/i);
    if (match && match[1]) {
      mpmsVal = match[1];
    }
  }
  return isDuplicateMpms
    ? `Don't Enter Duplicate MPMSNo "${mpmsVal}" (A record with the same details already exists.)`
    : rawError;
}
