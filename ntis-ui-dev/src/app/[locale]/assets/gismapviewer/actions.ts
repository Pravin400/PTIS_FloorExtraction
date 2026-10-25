'use server';

import * as dashboard from './actions/dashboard.actions';
import * as asset from './actions/asset.actions';
import * as master from './actions/master.actions';

// Dashboard Actions
export async function getGisDashboardStatsAction(...args: Parameters<typeof dashboard.getGisDashboardStatsAction>) {
    return dashboard.getGisDashboardStatsAction(...args);
}
export async function getDashboardInitialData(...args: Parameters<typeof dashboard.getDashboardInitialData>) {
    return dashboard.getDashboardInitialData(...args);
}
export async function getDashboardInitAction(...args: Parameters<typeof dashboard.getDashboardInitAction>) {
    return dashboard.getDashboardInitAction(...args);
}
export async function getKpiSummaryAction(...args: Parameters<typeof dashboard.getKpiSummaryAction>) {
    return dashboard.getKpiSummaryAction(...args);
}
export async function getWardSummaryAction(...args: Parameters<typeof dashboard.getWardSummaryAction>) {
    return dashboard.getWardSummaryAction(...args);
}
export async function getPropertyGroupsAction(...args: Parameters<typeof dashboard.getPropertyGroupsAction>) {
    return dashboard.getPropertyGroupsAction(...args);
}
export async function getPropertyTypeMasterListAction(...args: Parameters<typeof dashboard.getPropertyTypeMasterListAction>) {
    return dashboard.getPropertyTypeMasterListAction(...args);
}
export async function getTopDefaultersAction(...args: Parameters<typeof dashboard.getTopDefaultersAction>) {
    return dashboard.getTopDefaultersAction(...args);
}
export async function exportExcelAction(...args: Parameters<typeof dashboard.exportExcelAction>) {
    return dashboard.exportExcelAction(...args);
}
export async function getUnifiedDataAction(...args: Parameters<typeof dashboard.getUnifiedDataAction>) {
    return dashboard.getUnifiedDataAction(...args);
}
export async function getConfigAction(...args: Parameters<typeof dashboard.getConfigAction>) {
    return dashboard.getConfigAction(...args);
}

// Asset Actions
export async function getAssetGisFiltersAction(...args: Parameters<typeof asset.getAssetGisFiltersAction>) {
    return asset.getAssetGisFiltersAction(...args);
}
export async function getAssetGisKpisAction(...args: Parameters<typeof asset.getAssetGisKpisAction>) {
    return asset.getAssetGisKpisAction(...args);
}
export async function getAssetPopupDetailsAction(...args: Parameters<typeof asset.getAssetPopupDetailsAction>) {
    return asset.getAssetPopupDetailsAction(...args);
}
export async function searchPropertiesAction(...args: Parameters<typeof asset.searchPropertiesAction>) {
    return asset.searchPropertiesAction(...args);
}
export async function getPropertyDetailAction(...args: Parameters<typeof asset.getPropertyDetailAction>) {
    return asset.getPropertyDetailAction(...args);
}
export async function identifyAssetAction(...args: Parameters<typeof asset.identifyAssetAction>) {
    return asset.identifyAssetAction(...args);
}
export async function getAssetGeometryDetailsAction(...args: Parameters<typeof asset.getAssetGeometryDetailsAction>) {
    return asset.getAssetGeometryDetailsAction(...args);
}
export async function getGeometryAction(...args: Parameters<typeof asset.getGeometryAction>) {
    return asset.getGeometryAction(...args);
}
export async function getQcStatusAction(...args: Parameters<typeof asset.getQcStatusAction>) {
    return asset.getQcStatusAction(...args);
}
export async function getTrackingAction(...args: Parameters<typeof asset.getTrackingAction>) {
    return asset.getTrackingAction(...args);
}
export async function exportAssetExcelAction(...args: Parameters<typeof asset.exportAssetExcelAction>) {
    return asset.exportAssetExcelAction(...args);
}
export async function exportAssetGisExcelAction(...args: Parameters<typeof asset.exportAssetGisExcelAction>) {
    return asset.exportAssetGisExcelAction(...args);
}
export async function uploadAssetGeoJsonAction(...args: Parameters<typeof asset.uploadAssetGeoJsonAction>) {
    return asset.uploadAssetGeoJsonAction(...args);
}

// Master Actions
export async function getPropertyDictionaryAction(...args: Parameters<typeof master.getPropertyDictionaryAction>) {
    return master.getPropertyDictionaryAction(...args);
}
export async function getBoundariesAction(...args: Parameters<typeof master.getBoundariesAction>) {
    return master.getBoundariesAction(...args);
}
export async function getEnrichedGeoJsonAction(...args: Parameters<typeof master.getEnrichedGeoJsonAction>) {
    return master.getEnrichedGeoJsonAction(...args);
}
export async function getStatusMappingAction(...args: Parameters<typeof master.getStatusMappingAction>) {
    return master.getStatusMappingAction(...args);
}
export async function getHeaderAction(...args: Parameters<typeof master.getHeaderAction>) {
    return master.getHeaderAction(...args);
}
export async function getBasemapsAction(...args: Parameters<typeof master.getBasemapsAction>) {
    return master.getBasemapsAction(...args);
}
export async function getBoundaryLayersAction(...args: Parameters<typeof master.getBoundaryLayersAction>) {
    return master.getBoundaryLayersAction(...args);
}
export async function getFilteredPropertiesGeoJsonAction(...args: Parameters<typeof master.getFilteredPropertiesGeoJsonAction>) {
    return master.getFilteredPropertiesGeoJsonAction(...args);
}
export async function getGisCorporationConfigAction(...args: Parameters<typeof master.getGisCorporationConfigAction>) {
    return master.getGisCorporationConfigAction(...args);
}
export async function getGisDepartmentKpiMappingsAction(...args: Parameters<typeof master.getGisDepartmentKpiMappingsAction>) {
    return master.getGisDepartmentKpiMappingsAction(...args);
}
export async function getGisDepartmentFilterMappingsAction(...args: Parameters<typeof master.getGisDepartmentFilterMappingsAction>) {
    return master.getGisDepartmentFilterMappingsAction(...args);
}
export async function reloadGisStatusAction(...args: Parameters<typeof master.reloadGisStatusAction>) {
    return master.reloadGisStatusAction(...args);
}
export async function getGisTileDebugAction(...args: Parameters<typeof master.getGisTileDebugAction>) {
    return master.getGisTileDebugAction(...args);
}
export async function getGisLayerMastersAction(...args: Parameters<typeof master.getGisLayerMastersAction>) {
    return master.getGisLayerMastersAction(...args);
}
export async function getGisLayerGeoJsonAction(...args: Parameters<typeof master.getGisLayerGeoJsonAction>) {
    return master.getGisLayerGeoJsonAction(...args);
}
export async function getGisUploadHistoryAction(...args: Parameters<typeof master.getGisUploadHistoryAction>) {
    return master.getGisUploadHistoryAction(...args);
}
export async function uploadGeoJsonAction(...args: Parameters<typeof master.uploadGeoJsonAction>) {
    return master.uploadGeoJsonAction(...args);
}

