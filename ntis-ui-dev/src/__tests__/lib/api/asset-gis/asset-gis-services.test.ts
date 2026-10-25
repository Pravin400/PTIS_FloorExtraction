import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gisMapService, GisMapService } from '@/lib/api/asset-gis/asset-gis-map.service';
import { gisDashboardService, GisDashboardService } from '@/lib/api/asset-gis/asset-gis-dashboard.service';
import { gisPropertyService, GisPropertyService } from '@/lib/api/asset-gis/asset-gis-property.service';
import { gisDashboardStatsService } from '@/lib/api/asset-gis/asset-gis-dashboard-stats.service';
import { buildQueryString } from '@/lib/api/asset-gis/helpers';
import { apiClient } from '@/services/api.service';

vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    fetch: vi.fn(),
  },
}));

describe('Asset GIS Services Full Coverage Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Helper Functions', () => {
    it('builds query strings from params', () => {
      expect(buildQueryString({ zoneId: 1, wardId: 'all', search: 'road' })).toBe('?zoneId=1&wardId=all&search=road');
      expect(buildQueryString({})).toBe('');
      expect(buildQueryString({ empty: '', nullVal: null, undef: undefined })).toBe('');
    });
  });

  describe('GisMapService', () => {
    it('fetches layer masters, boundaries, property dictionary, basemaps, and geojson endpoints', async () => {
      const mockGeoJson = { type: 'FeatureCollection', features: [{ id: 1 }] };
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: mockGeoJson,
      });

      const masters = await gisMapService.getLayerMasters({ forceRefresh: true });
      expect(masters.success).toBe(true);

      const config = await gisMapService.getConfig();
      expect(config.success).toBe(true);

      const boundaries = await GisMapService.getBoundaries('1', { forceRefresh: true });
      expect(boundaries.success).toBe(true);

      const propDict = await gisMapService.getPropertyDictionary();
      expect(propDict.success).toBe(true);

      const header = await gisMapService.getHeader();
      expect(header.success).toBe(true);

      const basemaps = await gisMapService.getBasemaps();
      expect(basemaps.success).toBe(true);

      const boundaryLayers = await gisMapService.getBoundaryLayers();
      expect(boundaryLayers.success).toBe(true);

      const filteredProps = await gisMapService.getFilteredPropertiesGeoJson({ zoneId: '1' });
      expect(filteredProps.success).toBe(true);

      const enriched = await gisMapService.getEnrichedGeoJson({ zoneId: '1' });
      expect(enriched.success).toBe(true);

      const statusMap = await gisMapService.getStatusMapping({ zoneId: '1' });
      expect(statusMap.success).toBe(true);

      const history = await gisMapService.getUploadHistory();
      expect(history.success).toBe(true);
    });

    it('handles map service fetch failures gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Fetch failed'));
      const errRes = await gisMapService.getBoundaries('zone_fail', { forceRefresh: true });
      expect(errRes.success).toBe(false);
    });
  });

  describe('GisDashboardService', () => {
    it('fetches dashboard init, kpi summary, ward summary, unified data, and property types', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: [{ id: '1', name: 'Test' }],
      });
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: { kpis: [] },
      });

      const init = await gisDashboardService.getDashboardInit({ propertyTypeId: 1 });
      expect(init.success).toBe(true);

      const kpi = await GisDashboardService.getKpiSummary({ zoneId: '1' });
      expect(kpi.success).toBe(true);

      const ward = await gisDashboardService.getWardSummary({ zoneId: '1' });
      expect(ward.success).toBe(true);

      const unified = await gisDashboardService.getUnifiedData({ zoneId: '1' });
      expect(unified.success).toBe(true);

      const groups = await gisDashboardService.getPropertyGroups();
      expect(groups.success).toBe(true);

      const types = await gisDashboardService.getPropertyTypeMasterList('commercial');
      expect(types.success).toBe(true);
    });

    it('handles dashboard service API errors', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not Found',
      });

      const res = await gisDashboardService.getDashboardInit();
      expect(res.success).toBe(false);
    });
  });

  describe('GisPropertyService', () => {
    it('retrieves property detail, exports excel, searches properties, and gets defaulters', async () => {
      const mockDetail = { ownerId: '101', ownerName: 'Alice', upic: 'UP-101' };
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: mockDetail,
      });
      vi.mocked(apiClient.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => new Blob(['dummy excel data']),
      } as unknown as Response);

      const detail = await gisPropertyService.getPropertyDetail('101', { zoneId: '1' });
      expect(detail.success).toBe(true);

      const search = await GisPropertyService.searchProperties('Alice', 'OwnerName');
      expect(search.success).toBe(true);

      const defaulters = await gisPropertyService.getTopDefaulters();
      expect(defaulters.success).toBe(true);

      const kpiCounts = await gisPropertyService.getAssetKpiCounts();
      expect(kpiCounts.success).toBe(true);

      const excelBlob = await gisPropertyService.exportExcel({ zoneId: '1' });
      expect(excelBlob.success).toBe(true);

      const assetExcel = await gisPropertyService.exportAssetExcel({ zoneId: '1' });
      expect(assetExcel.success).toBe(true);
    });

    it('handles property service exceptions cleanly', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Connection error'));
      const res = await gisPropertyService.getPropertyDetail('999');
      expect(res.success).toBe(false);
    });
  });

  describe('GisDashboardStatsService', () => {
    it('fetches dashboard stats with query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: { totalCount: 450 },
      });

      const res = await gisDashboardStatsService.getDashboardStats('all', 'all');
      expect(res.success).toBe(true);
    });

    it('handles failure in dashboard stats', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Stats error',
      });

      const res = await gisDashboardStatsService.getDashboardStats('1', '2');
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(500);
    });
  });
});
