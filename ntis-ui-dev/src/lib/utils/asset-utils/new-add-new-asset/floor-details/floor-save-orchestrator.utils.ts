/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveOrCreateFloorDetailsRecord } from './floor-detail-record.utils';
import { persistFloorSubmission } from './floor-submission-persistence.utils';
import { calculateSavedUnitCV, syncParentFloorTotals } from './floor-save-reconcile.utils';

/**
 * Composes the full "+ ADD FLOOR" save sequence for the Floor Submission path.
 *
 * CHANGED from the old flow:
 *   OLD: resolveOrCreateFloorDetailsRecord → bulkGenerateSubUnitsAction (creates AssetMaster child)
 *        → createChildAssetAction (updates AssetMaster + inserts SubUnitsDetails)
 *
 *   NEW: resolveOrCreateFloorDetailsRecord (placeholder only, not used as FK for new records)
 *        → persistFloorSubmission (inserts SubUnitsDetails with AssetId = parentAssetId,
 *          NO child AssetMaster created)
 *
 * Unit Management Pool (bulkGenerateSubUnitsAction, createChildAssetAction) — UNTOUCHED.
 */
export async function saveFloorEntry(
  built: { combinedData: any[]; roomDetails: any[] | null; floorIdNum: number; subFloorIdNum: number | null },
  ctx: {
    formState: any;
    editingId: number | null;
    dbFloors: any[];
    setDbFloors: React.Dispatch<React.SetStateAction<any[]>>;
    savedFloors: any[];
    formData: any;
    subFloorOptions: any[];
    subUseTypeOptions: any[];
    dropdownOptions: any;
  }
) {
  const { floorIdNum, subFloorIdNum } = built;
  const { formState, editingId, dbFloors, setDbFloors, savedFloors, formData, subFloorOptions, subUseTypeOptions, dropdownOptions } = ctx;

  // resolveOrCreateFloorDetailsRecord is still called so dbFloors state stays in sync
  // (it tracks the parent's floor-level rows for the unit pool), but its returned
  // floorDetailsId is NO LONGER used as the FK for the new Floor Submission record.
  const floorDetailsId = await resolveOrCreateFloorDetailsRecord(floorIdNum, subFloorIdNum, built.roomDetails, {
    formState,
    dbFloors,
    setDbFloors,
    formData,
  });

  const parentDeptId =
    formData.owningDepartmentId ||
    formData.departmentId ||
    formData.DepartmentId ||
    formData.OwningDepartmentId ||
    null;

  // When editing, resolve the subUnitsDetailsId from savedFloors.
  // The saved entry now carries subUnitsDetailsId as its stable identity.
  let editingSubUnitsDetailsId: number | null = null;
  if (editingId) {
    const existingEntry = savedFloors.find((f) => f.id === editingId);
    editingSubUnitsDetailsId =
      existingEntry?.subUnitsDetailsId && Number(existingEntry.subUnitsDetailsId) > 0
        ? Number(existingEntry.subUnitsDetailsId)
        : null;

    // Fallback: if the saved entry is an old-style entry (id = child AssetId,
    // no subUnitsDetailsId), fall back to the old editingId directly.
    // This keeps backward compat for previously saved floors.
    if (!editingSubUnitsDetailsId && existingEntry?.isDirectFloorSubmission) {
      editingSubUnitsDetailsId = editingId;
    }
  }

  const { childRes, identity, childPayload, resolvedRoomDetails } = await persistFloorSubmission(
    formState,
    built,
    floorDetailsId,
    parentDeptId,
    editingSubUnitsDetailsId,
    savedFloors,
    formData
  );

  // CV is calculated using the parentAssetId (=assetId stored in SubUnitsDetails)
  // and the returned subUnitsDetailsId.
  const calculatedCV = await calculateSavedUnitCV(childRes, identity.parentAssetId);

  // syncParentFloorTotals aggregates areas across all floor entries for this floorLevel
  // and syncs the merged total back to the parent SubUnitsDetails row via syncFloorAreaAction.
  await syncParentFloorTotals(
    floorDetailsId,
    floorIdNum,
    identity.subUnitsDetailsId,          // use subUnitsDetailsId as the stable id
    identity.childAssetNo,
    identity.childAssetName,
    resolvedRoomDetails,
    formState,
    savedFloors,
    formData,
    setDbFloors
  );

  const subFloorLabel = subFloorOptions.find((o) => o.value === String(childPayload.subFloorId))?.label;
  const subUseTypeLabel = subUseTypeOptions.find((o) => o.value === String(childPayload.subTypeOfUseId))?.label;
  const deptName = parentDeptId
    ? dropdownOptions?.departments?.find((d: any) => String(d.value) === String(parentDeptId))?.label || ''
    : '';

  return {
    floorDetailsId,
    childAssetId: identity.subUnitsDetailsId,     // ← subUnitsDetailsId acts as the floor entry's id now
    childAssetNo: identity.childAssetNo,
    childAssetName: identity.childAssetName,
    determinedType: identity.determinedType,
    calculatedCV,
    resolvedRoomDetails,
    childPayload,
    subFloorLabel,
    subUseTypeLabel,
    deptName,
    parentDeptId,
    // Extra fields for downstream use (reconcileFloorSave, delete handler)
    subUnitsDetailsId: identity.subUnitsDetailsId,
    isDirectFloorSubmission: true,
  };
}
