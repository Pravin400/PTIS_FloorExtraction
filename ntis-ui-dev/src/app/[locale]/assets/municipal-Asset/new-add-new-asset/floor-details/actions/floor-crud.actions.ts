 
// Barrel re-export module for backward compatibility — the original ~620-line
// file was split into focused modules: fetch actions, mutation actions,
// sub-lookup actions (sub-use-types/sub-floors/departments), and the
// area/CV sync actions (+ their shared recompute helper).
//
// This file intentionally has NO 'use server' directive — see floor-details/actions.ts
// for the identical rationale. Each re-exported function is already declared as a
// Server Action in its own 'use server' module.

export { fetchFloorsByAsset, fetchFloorDropdownOptions, fetchFloorStepData, fetchFloorDetailByIdAction, fetchAssetLeaseRentDetailsAction } from './floor-crud-fetch.actions';
export type { FloorStepData } from './floor-crud-fetch.actions';
export { saveFloorDetail, updateFloorDetail, deleteFloorDetail } from './floor-detail-mutations.actions';
export { fetchSubUseTypesAction, fetchSubFloorAction, fetchDepartmentsAction, fetchRoomTypesAction } from './floor-sub-lookup.actions';
export { syncFloorAreaAction, syncFloorAreaAndCVAction } from './floor-area-sync.actions';
