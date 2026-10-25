
// Query operations (fetch/read)
export {
  getUseFactorCVMaster,
  getUseFactorCVMasterWithParams,
  getUseFactorCVMasterById,
  getTypeOfUseWithParams,
  getTypeOfUseById,
  getSubTypeOfUseWithParams,
  getSubTypeOfUseById,
} from './useCategoryCvFactor-queries.service';

// Mutation operations (create/update)
export {
  createUseFactorCVMaster,
  updateUseFactorCVMaster,
  createTypeOfUse,
  updateTypeOfUse,
  deleteTypeOfUse,
  createSubTypeOfUse,
  updateSubTypeOfUse,
  deleteSubTypeOfUse,
} from './useCategoryCvFactor-mutations.service';

// Bulk operations
export {
  bulkCreateUseFactorCVMaster,
  bulkUpdateUseFactorCVMaster,
} from './useCategoryCvFactor-bulk.service';
