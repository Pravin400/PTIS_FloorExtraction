
// Query operations (fetch/read)
export {
  getUseFactorCVMaster,
  getUseFactorCVMasterWithParams,
  getUseFactorCVMasterById,
  getTypeOfUseWithParams,
} from './useCategoryCvFactor-queries.service';

// Mutation operations (create/update)
export {
  createUseFactorCVMaster,
  updateUseFactorCVMaster,
} from './useCategoryCvFactor-mutations.service';

// Bulk operations
export {
  bulkCreateUseFactorCVMaster,
  bulkUpdateUseFactorCVMaster,
} from './useCategoryCvFactor-bulk.service';
