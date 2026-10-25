'use server';

import { cookies } from 'next/headers';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { gisMasterService } from '@/lib/api/asset-gis/asset-gis-master.service';
import { gisMapService } from '@/lib/api/asset-gis/asset-gis-map.service';
import { assetGisService } from '@/lib/api/asset-gis/asset-gis.service';
import type {
    GisCorporationConfigDto,
    GisDepartmentKpiMappingDto,
    GisDepartmentFilterMappingDto,
    GisLayerMasterDto,
} from '@/types/asset-gis-asset.types';
import type { ApiResponse } from '@/types/common.types';
import { logger, getErrorMessage, revalidateAllLocales } from './action-utils';

export async function getBoundariesAction(type: string | number): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMasterService.getLayerGeoJson(type);
        if (res && res.success && res.data) {
            return res;
        }
        const fallbackRes = await gisMapService.getBoundaries(String(type));
        return fallbackRes;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getEnrichedGeoJsonAction(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMapService.getEnrichedGeoJson(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getStatusMappingAction(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMapService.getStatusMapping(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getHeaderAction(): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMapService.getHeader();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBasemapsAction(): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMapService.getBasemaps();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getBoundaryLayersAction(): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMapService.getBoundaryLayers();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getFilteredPropertiesGeoJsonAction(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMapService.getFilteredPropertiesGeoJson(params);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisCorporationConfigAction(): Promise<ApiResponse<GisCorporationConfigDto>> {
    try {
        const res = await gisMasterService.getCorporationConfig();
        return res as ApiResponse<GisCorporationConfigDto>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisDepartmentKpiMappingsAction(
    departmentId?: number | string
): Promise<ApiResponse<GisDepartmentKpiMappingDto[]>> {
    try {
        const res = await gisMasterService.getDepartmentKpiMappings(departmentId);
        return res as ApiResponse<GisDepartmentKpiMappingDto[]>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisDepartmentFilterMappingsAction(
    departmentId?: number | string
): Promise<ApiResponse<GisDepartmentFilterMappingDto[]>> {
    try {
        const res = await gisMasterService.getDepartmentFilterMappings(departmentId);
        return res as ApiResponse<GisDepartmentFilterMappingDto[]>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function reloadGisStatusAction(): Promise<ApiResponse<string>> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, error: 'Unauthorized: User session expired', statusCode: 401 };
        }
        const res = await assetGisService.reloadStatus();
        if (res.success) {
            revalidateAllLocales('/assets/gismapviewer');
        }
        return res;
    } catch (error: unknown) {
        logger.error('reloadGisStatusAction failed', { operation: 'reloadGisStatusAction' }, error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisTileDebugAction(): Promise<ApiResponse<unknown>> {
    try {
        const res = await assetGisService.getTileDebugInfo();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisLayerMastersAction(): Promise<ApiResponse<GisLayerMasterDto[]>> {
    try {
        const res = await gisMasterService.getLayerMasters();
        return res as ApiResponse<GisLayerMasterDto[]>;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisLayerGeoJsonAction(layerMasterId: number | string): Promise<ApiResponse<unknown>> {
    try {
        const res = await gisMasterService.getLayerGeoJson(layerMasterId);
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getGisUploadHistoryAction(): Promise<ApiResponse<unknown[]>> {
    try {
        const res = await gisMapService.getUploadHistory();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function uploadGeoJsonAction(formData: FormData): Promise<ApiResponse<unknown>> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);
        if (!userId) {
            return { success: false, error: 'Unauthorized: User session expired', statusCode: 401 };
        }
        const res = await gisMapService.uploadGeoJson(formData);
        if (res.success) {
            revalidateAllLocales('/assets/gismapviewer');
        }
        return res;
    } catch (error: unknown) {
        logger.error('uploadGeoJsonAction failed', { operation: 'uploadGeoJsonAction' }, error);
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getPropertyDictionaryAction(): Promise<ApiResponse<Record<string, string>>> {
    try {
        const res = await gisMapService.getPropertyDictionary();
        return res;
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}

