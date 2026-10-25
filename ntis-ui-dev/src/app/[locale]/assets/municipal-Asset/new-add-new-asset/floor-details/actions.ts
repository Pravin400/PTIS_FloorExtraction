 
// Barrel re-export for new-add-new-asset floor-details actions.
// Mirrors add-New-Asset/floor-details/actions.ts but using copies
// under ./actions/ so NewAddNewAsset has no dependency on old feature files.

export {
  fetchFloorsByAsset,
  saveFloorDetail,
  updateFloorDetail,
  deleteFloorDetail,
  fetchFloorDropdownOptions,
  fetchFloorDetailByIdAction,
  fetchAssetLeaseRentDetailsAction,
  fetchSubUseTypesAction,
  fetchSubFloorAction,
  fetchFloorStepData,
  fetchDepartmentsAction,
  syncFloorAreaAction,
  syncFloorAreaAndCVAction,
  fetchRoomTypesAction,
} from './actions/floor-crud.actions';
export type { FloorStepData } from './actions/floor-crud.actions';

export {
  fetchSubUnitsByFloor,
  saveSubUnit,
  deleteSubUnit,
  updateSubUnitAction,
  bulkGenerateSubUnitsAction,
  bulkGenerateAcrossFloorsAction,
} from './actions/sub-unit-crud.actions';

export { createChildAssetAction } from './actions/child-asset/create.action';
export { getChildAssetByIdAction } from './actions/child-asset/get-by-id.action';
export { getSubUnitsByAssetAction } from './actions/child-asset/get-sub-units.action';
export { deleteChildAssetAction } from './actions/child-asset/delete.action';

export {
  calculateFloorCVAction,
  calculateBuildingCVAction,
  calculateUnitCVAction,
  calculateMovableCVAction,
} from './actions/cv-calculation.actions';

export {
  uploadDocumentAction,
  uploadBulkDocumentsAction,
  deleteUploadedDocAction,
  fetchUploadedDocumentsAction,
} from './actions/documents.actions';

// ── Floor Submission direct-persistence actions ──────────────────────────────
// These actions call endpoints that write directly to AMS.SubUnitsDetails.
// NO child AssetMaster row is created.
export { createFloorSubmissionAction } from './actions/floor-submission/create.action';
export { updateFloorSubmissionAction } from './actions/floor-submission/update.action';
export { deleteFloorSubmissionAction } from './actions/floor-submission/delete.action';
export { getFloorSubmissionsByParentAction } from './actions/floor-submission/get-by-parent.action';
export { getFloorSubmissionByIdAction } from './actions/floor-submission/get-by-id.action';
export { syncUnitFloorAction } from './actions/sub-unit-crud.actions';

