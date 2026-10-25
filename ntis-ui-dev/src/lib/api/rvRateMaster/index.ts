// Re-export ApiError for compatibility
export { ApiError } from "@/lib/utils/api";

// Single record operations
export {
  getRateMasterColumns,
  getRateMasterTableData,
  getRateMasterById
} from './rvRateMaster.service';

// Bulk operations
export {
  bulkCreateRateMaster,
  bulkUpdateRateMaster,
  bulkPurgeRateMaster
} from './rvRateMaster.bulk.service';

// Complex queries
export {
  getDetailedRates,
  getRateMasterByFilters,
  getRateMasterPaged,
  getTypeOfUseDetails,
  getOpenPlotTypeOfUseDetails
} from './rvRateMaster.query.service';
