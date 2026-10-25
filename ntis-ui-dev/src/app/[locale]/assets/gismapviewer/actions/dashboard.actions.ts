'use server';

import { gisDashboardService } from '@/lib/api/asset-gis/asset-gis-dashboard.service';
import { gisDashboardApi } from '@/lib/api/asset-gis/asset-gis-dashboard-stats.service';
import type { GisSearchParams, PropertyGroup, PropertyTypeMasterItem, GisDashboardInitialDataResult } from '@/types/asset-gis.types';
import type { ApiResponse } from '@/types/common.types';
import { logger, getErrorMessage } from './action-utils';
import { getAssetPopupDetailsAction, getAssetGeometryDetailsAction } from './asset.actions';

export async function getGisDashboardStatsAction(
    zoneId?: string | number,
    wardId?: string | number
): Promise<ApiResponse<Record<string, unknown>>> {
    try {
        const res = await gisDashboardApi.getDashboardStats(zoneId, wardId);
        return res as ApiResponse<Record<string, unknown>>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getDashboardInitialData(
    searchParams: { [key: string]: string | undefined }
): Promise<GisDashboardInitialDataResult> {
    const params: GisSearchParams = {
        propertyTypeId: searchParams.propertyTypeId,
        wardNo: searchParams.wardNo,
        ownerIdListCsv: searchParams.ownerIdListCsv,
        category: searchParams.category,
        propertyTypeGroup: searchParams.propertyTypeGroup,
    };

    try {
        const urlOwnerId = searchParams.assetId || searchParams.ownerId || searchParams.propertyId;

        // When urlOwnerId is provided (e.g. redirected from Asset Register), call dedicated Asset Popup Details & Geometry
        const [result, detailRes, geomRes] = await Promise.all([
            urlOwnerId
                ? Promise.resolve({ success: true, data: {} as Record<string, unknown> })
                : gisDashboardService.getUnifiedData(params).catch((err: unknown) => ({ success: false, error: getErrorMessage(err), data: null })),
            urlOwnerId
                ? getAssetPopupDetailsAction(urlOwnerId).catch(() => ({ success: false, data: null }))
                : Promise.resolve({ success: false, data: null }),
            urlOwnerId
                ? getAssetGeometryDetailsAction(urlOwnerId).catch(() => ({ success: false, data: null }))
                : Promise.resolve({ success: false, data: null })
        ]);

        let deepLinkCoords = null;
        let propertyDetailData = null;
        if (detailRes && detailRes.success && detailRes.data) {
            const detailObj = detailRes.data as Record<string, unknown>;
            let item = (detailObj.items || detailObj.data || detailObj) as Record<string, unknown> | Array<Record<string, unknown>>;
            if (Array.isArray(item)) item = item[0] || {};
            propertyDetailData = item;

            let geomData: Record<string, unknown> | null = null;
            if (geomRes && geomRes.success && 'data' in geomRes && geomRes.data) {
                const rawGeom = geomRes.data as unknown as Record<string, unknown>;
                geomData = (rawGeom.items || rawGeom.data || rawGeom) as Record<string, unknown>;
            }

            const itemObj = item as Record<string, unknown>;
            const lat = Number(geomData?.centroidY || itemObj.latitude || itemObj.Latitude || itemObj.ASS_Latitude || itemObj.assLatitude || itemObj.lat || 0);
            const lng = Number(geomData?.centroidX || itemObj.longitude || itemObj.Longitude || itemObj.ASS_Longitude || itemObj.assLongitude || itemObj.lng || 0);

            deepLinkCoords = {
                OwnerID: urlOwnerId,
                ownerID: urlOwnerId,
                assetId: itemObj.assetId || urlOwnerId,
                assetNo: itemObj.assetNo || itemObj.mpmsid || urlOwnerId,
                MPMS_ID: itemObj.mpmsid || itemObj.assetNo || urlOwnerId,
                latitude: lat,
                longitude: lng,
                ASS_Latitude: lat,
                ASS_Longitude: lng,
                centroidY: lat,
                centroidX: lng,
                geometry: geomData?.geoJson || geomData?.geometry || null,
                geoJson: geomData?.geoJson || null,
                ...itemObj
            };
        }

        if (!urlOwnerId && (!result || !result.success)) return { success: false, error: (result as { error?: string })?.error || 'Failed to fetch GIS data' };

        const data = (result?.data || {}) as Record<string, unknown>;
        return {
            initData: (data.initData as Record<string, unknown>) || {},
            kpiSummary: data.kpiSummary as Record<string, unknown> | undefined,
            wardSummary: data.wardSummary as Array<Record<string, unknown>> | undefined,
            blockSummary: data.blockSummary as Array<Record<string, unknown>> | undefined,
            deepLinkCoords,
            propertyDetail: propertyDetailData,
            isSingleAssetMode: !!urlOwnerId,
            success: true
        };
    } catch (error: unknown) {
        logger.error('[SSR Fetch] getDashboardInitialData failed', { operation: 'getDashboardInitialData' }, error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getDashboardInitAction(params: Record<string, unknown> = {}): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisDashboardService.getDashboardInit(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getKpiSummaryAction(params: Record<string, unknown> = {}): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisDashboardService.getKpiSummary(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getWardSummaryAction(params: Record<string, unknown> = {}): Promise<ApiResponse<unknown[]>> {
    try {
        const res = await gisDashboardService.getWardSummary(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPropertyGroupsAction(): Promise<ApiResponse<PropertyGroup[]>> {
    try {
        const res = await gisDashboardService.getPropertyGroups();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPropertyTypeMasterListAction(
    type?: string,
    filters?: { zoneId?: string; blockId?: string }
): Promise<ApiResponse<PropertyTypeMasterItem[]>> {
    try {
        const res = await gisDashboardService.getPropertyTypeMasterList(type, filters);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}


export async function getTopDefaultersAction(): Promise<ApiResponse<unknown[]>> {
    try {
        const res = await gisDashboardService.getTopDefaulters();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function exportExcelAction(params: Record<string, unknown>): Promise<ApiResponse<string>> {
    try {
        const res = await gisDashboardService.exportExcel(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getUnifiedDataAction(params: Record<string, unknown> = {}): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisDashboardService.getUnifiedData(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getConfigAction(): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisDashboardService.getConfig();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}
