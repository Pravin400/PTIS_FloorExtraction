// Query operations (fetch/read)
export {
  getWardPagedServer,
  getTaxZonePagedServer,
  getTaxZoningRangesPagedServer,
  getTaxZoningRangeByIdServer,
  getTaxZoningCoverageServer,
  getWardAbstractServer,
  getUlbDocumentsServer,
  getPropertiesByWardServer,
} from './taxZoningRange-queries.service';

// Mutation operations (create/update/bulk/upload) — deleting a range is not supported
export {
  createTaxZoningRange,
  updateTaxZoningRange,
  bulkUpsertTaxZoningRanges,
  createUlbDocumentMetadata,
  deleteUlbDocument,
  uploadUlbDocument,
} from './taxZoningRange-mutations.service';
