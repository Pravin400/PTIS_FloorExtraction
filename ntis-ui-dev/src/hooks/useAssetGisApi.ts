'use client';

// Central query keys & interfaces
export * from './asset-gis-api/query-keys';

// Core Dashboard queries
export * from './asset-gis-api/useAssetGisDashboardQueries';

// Map & Layer queries
export * from './asset-gis-api/useAssetGisMapQueries';

// Property queries
export * from './asset-gis-api/useAssetGisPropertyQueries';

// Combined master hooks
export * from './asset-gis-api/useAssetGisDashboard';

// Backward compatibility key alias
import { gisQueryKeys } from './asset-gis-api/query-keys';
export { gisQueryKeys as queryKeys };
