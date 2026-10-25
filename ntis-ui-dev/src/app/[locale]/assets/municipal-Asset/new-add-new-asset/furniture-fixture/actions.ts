 
// Barrel re-export module for backward compatibility.
//
// The original ~407-line furniture-fixture/actions.ts was split along its
// visible boundary into ./inventory-batch.actions.ts (batch CRUD + movable
// CV calculation) and ./furniture-documents.actions.ts (document upload/
// download) — see those files for the real implementations.
//
// This file intentionally has NO 'use server' directive. It only re-exports
// async functions that are already declared as Server Actions in their own
// '(use server)' modules — a plain re-export here is safe and keeps every
// existing `import { X } from ".../furniture-fixture/actions"` call site
// elsewhere in the codebase working unmodified.

export {
  getInventoryBatchesAction,
  getInventoryBatchByIdAction,
  updateInventoryBatchAction,
  updateInventoryBatchWithFilesAction,
  deleteInventoryBatchAction,
  saveSingleInventoryBatchAction,
  saveInventoryBatchAction,
  calculateMovableCVAction,
} from './inventory-batch.actions';
export type {
  InventoryUnitResponse,
  InventoryBatchDetail,
  InventoryBatchListResponse,
} from './inventory-batch.actions';

export {
  fetchInventoryDocumentTypesAction,
  uploadInventoryDocumentAction,
  deleteInventoryDocumentAction,
  disableInventoryDocumentSlotAction,
  fetchInventoryDocumentsAction,
  fetchDocumentByGuidAction,
} from './furniture-documents.actions';
