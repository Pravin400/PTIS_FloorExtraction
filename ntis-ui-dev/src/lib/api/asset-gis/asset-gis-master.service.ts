import 'server-only';

import { apiClient } from '@/services/api.service';
import type {
  ApiResponse,
  GisCorporationConfigDto,
  GisDepartmentKpiMappingDto,
  GisDepartmentFilterMappingDto,
  GisLayerMasterDto,
} from '@/types/asset-gis-asset.types';

export const gisMasterService = {
  /**
   * Fetch Corporation & GIS Configuration
   * GET /api/GisCorporationConfig
   */
  async getCorporationConfig(): Promise<ApiResponse<GisCorporationConfigDto>> {
    const res = await apiClient.get<GisCorporationConfigDto>('/GisCorporationConfig', { cache: 'no-store' });
    return res;
  },

  /**
   * Fetch Dynamic Master KPI Card Mappings for a Department
   * GET /api/GisDepartmentKpiMapping?DepartmentId={departmentId}
   */
  async getDepartmentKpiMappings(departmentId?: number | string): Promise<ApiResponse<GisDepartmentKpiMappingDto[]>> {
    const q = departmentId ? `?DepartmentId=${encodeURIComponent(String(departmentId))}` : '';
    const res = await apiClient.get<GisDepartmentKpiMappingDto[]>(`/GisDepartmentKpiMapping${q}`, { cache: 'no-store' });
    return res;
  },

  /**
   * Fetch Dynamic Master Filter Mappings for a Department
   * GET /api/GisDepartmentFilterMapping?DepartmentId={departmentId}
   */
  async getDepartmentFilterMappings(departmentId?: number | string): Promise<ApiResponse<GisDepartmentFilterMappingDto[]>> {
    const q = departmentId ? `?DepartmentId=${encodeURIComponent(String(departmentId))}` : '';
    const res = await apiClient.get<GisDepartmentFilterMappingDto[]>(`/GisDepartmentFilterMapping${q}`, { cache: 'no-store' });
    return res;
  },

  /**
   * Fetch Master GIS Layers Definition
   * GET /api/GisLayerMaster
   */
  async getLayerMasters(): Promise<ApiResponse<GisLayerMasterDto[]>> {
    const res = await apiClient.get<GisLayerMasterDto[]>('/GisLayerMaster', { next: { revalidate: 3600 } } as RequestInit);
    return res;
  },

  /**
   * Fetch GeoJSON Boundary Data for a Layer from GIS.GisLayerJson table
   * GET /api/GisLayerMaster/{id}/geojson
   */
  async getLayerGeoJson(layerMasterId: number | string): Promise<ApiResponse<unknown>> {
    const res = await apiClient.get<unknown>(`/GisLayerMaster/${encodeURIComponent(String(layerMasterId))}/geojson`, { next: { revalidate: 86400 } } as RequestInit);
    return res;
  },
};

export const GisMasterService = gisMasterService;
