import 'server-only';

/**
 * Server-side API service for Grievance GIS.
 * Interacts directly with GisGrievanceDashboardController backend endpoints.
 * Standard: Clean Architecture / ntis-ui
 */

import { apiClient } from '@/services/api.service';
import type { ApiResponse } from '@/types/common.types';
import type {
  GisGrievanceKpiSummaryResponseDto,
  GisGrievanceFilterGroupDto,
  GisGrievancePopupDetailsDto,
  GisGrievanceQueryParameters,
  GisCorporationConfigDto,
  GisLayerItemDto,
} from '@/types/grievance/grievance-gis.types';

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export const grievanceGisServerService = {
  /**
   * Fetches calculated dynamic KPI cards for Grievance GIS dashboard.
   * Endpoint: GET /api/gis/grievance/kpis
   */
  async getKpis(filters?: GisGrievanceQueryParameters): Promise<ApiResponse<GisGrievanceKpiSummaryResponseDto>> {
    const qs = buildQueryString(filters as Record<string, unknown>);
    return await apiClient.get<GisGrievanceKpiSummaryResponseDto>(`/gis/grievance/kpis${qs}`);
  },

  /**
   * Fetches dynamic cascading filter groups (Zone, Ward, Department, Grievance Type, Status).
   * Endpoint: GET /api/gis/grievance/filters
   */
  async getFilters(zoneId?: number, departmentId?: number): Promise<ApiResponse<GisGrievanceFilterGroupDto[]>> {
    const qs = buildQueryString({ zoneId, departmentId });
    return await apiClient.get<GisGrievanceFilterGroupDto[]>(`/gis/grievance/filters${qs}`);
  },

  /**
   * Fetches full structured grievance popup attributes, before/after photos, and activity timeline.
   * Endpoint: GET /api/gis/grievance/GrievancePopupDetails?grievanceId={id}
   */
  async getPopupDetails(grievanceId: number): Promise<ApiResponse<GisGrievancePopupDetailsDto>> {
    return await apiClient.get<GisGrievancePopupDetailsDto>(`/gis/grievance/GrievancePopupDetails?grievanceId=${grievanceId}`);
  },

  /**
   * Performs point spatial identify at Latitude/Longitude.
   * Endpoint: GET /api/gis/grievance/identify?lat={lat}&lng={lng}&toleranceMeters={meters}
   */
  async identifyAtPoint(lat: number, lng: number, toleranceMeters: number = 50.0): Promise<ApiResponse<unknown>> {
    const qs = buildQueryString({ lat, lng, toleranceMeters });
    return await apiClient.get<unknown>(`/gis/grievance/identify${qs}`);
  },

  /**
   * Fetches GeoJSON point geometry for a specific grievance.
   * Endpoint: GET /api/gis/grievance/geometry/{grievanceId}
   */
  async getGrievanceGeometry(grievanceId: number): Promise<ApiResponse<unknown>> {
    return await apiClient.get<unknown>(`/gis/grievance/geometry/${grievanceId}`);
  },

  /**
   * Fetches corporation GIS viewport & bounds configuration.
   * Endpoint: GET /api/GisCorporationConfig
   */
  async getCorporationConfig(): Promise<ApiResponse<GisCorporationConfigDto | null>> {
    return await apiClient.get<GisCorporationConfigDto | null>('/GisCorporationConfig');
  },

  /**
   * Fetches GIS layer catalog master definitions.
   * Endpoint: GET /api/GisLayerMaster?departmentId={departmentId}
   */
  async getLayers(departmentId?: number): Promise<ApiResponse<GisLayerItemDto[]>> {
    const qs = departmentId !== undefined ? `?departmentId=${departmentId}` : '';
    return await apiClient.get<GisLayerItemDto[]>(`/GisLayerMaster${qs}`);
  },

  /**
   * Fetches GeoJSON data for a specific boundary layer.
   * Endpoint: GET /api/GisLayerMaster/{id}/geojson
   */
  async getLayerGeoJson(layerId: number): Promise<string> {
    const res = await apiClient.get<string>(`/GisLayerMaster/${layerId}/geojson`);
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  },
};
