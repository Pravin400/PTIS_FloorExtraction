import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCouncilBoundaryStore, useGisFilters, useGisLayers, useGisKpis } from '@/hooks/store/useCouncilBoundaryStore';
import * as actions from '@/app/[locale]/assets/gismapviewer/actions';

vi.mock('@/app/[locale]/assets/gismapviewer/actions', () => ({
  getPropertyDetailAction: vi.fn(),
  getBoundariesAction: vi.fn(),
  getGisLayerMastersAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getPropertyTypeMasterListAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe('CouncilBoundaryStore Full Coverage Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCouncilBoundaryStore.getState().resetFilters();
    useCouncilBoundaryStore.getState().logout();
  });

  describe('Root Store Methods & Selectors', () => {
    it('sets map bounding box, alert state, and active module', () => {
      const store = useCouncilBoundaryStore.getState();
      store.setMapBBox([10, 20, 30, 40]);
      expect(useCouncilBoundaryStore.getState().mapBBox).toEqual([10, 20, 30, 40]);

      store.setIsAlertActive(true);
      expect(useCouncilBoundaryStore.getState().isAlertActive).toBe(true);

      store.setActiveModule('GIS_ADVANCED');
      expect(useCouncilBoundaryStore.getState().activeModule).toBe('GIS_ADVANCED');
    });

    it('hydrates state from SSR data', () => {
      const store = useCouncilBoundaryStore.getState();
      const mockSSR = {
        kpiSummary: { totalProperties: 5000 },
        wardSummary: [{ wardNo: '01', count: 120 }],
        propertyTypes: [{ id: 1, name: 'Commercial' }],
        propertyGroups: [{ id: 1, name: 'Group A' }],
      };
      store.hydrateFromSSR(mockSSR);
      const state = useCouncilBoundaryStore.getState();
      expect(state.kpiSummary).toEqual({ totalProperties: 5000 });
      expect(state.propertyTypeMasterList).toEqual([{ id: 1, name: 'Commercial' }]);
      

      store.hydrateFromSSR(null as unknown as Record<string, unknown>);
      
    });

    it('clears state on logout', () => {
      const store = useCouncilBoundaryStore.getState();
      store.setSelectedZone('Zone-1');
      store.setSelectedWard(['W-1']);
      store.setSelectedProperty({ ownerId: '123' });
      store.logout();
      const state = useCouncilBoundaryStore.getState();
      expect(state.selectedProperty).toBeNull();
      expect(state.propertyDetail).toBeNull();
      expect(state.selectedZone).toBeNull();
      expect(state.selectedWard).toEqual([]);
    });

    it('tests exported selector hooks with renderHook', () => {
      const { result: filtersRes } = renderHook(() => useGisFilters());
      const { result: layersRes } = renderHook(() => useGisLayers());
      const { result: kpisRes } = renderHook(() => useGisKpis());
      expect(filtersRes.current).toBeDefined();
      expect(layersRes.current).toBeDefined();
      expect(kpisRes.current).toBeDefined();
    });
  });

  describe('Filter Slice', () => {
    it('handles hierarchy selection and filter updates', () => {
      const store = useCouncilBoundaryStore.getState();
      
      store.setSelectedZone('Zone-A', 'Zone A', '01');
      expect(useCouncilBoundaryStore.getState().selectedZone).toBe('Zone-A');
      expect(useCouncilBoundaryStore.getState().selectedWard).toEqual([]);
      expect(useCouncilBoundaryStore.getState().selectedBlock).toEqual([]);

      store.setSelectedWard(['W-1', 'W-2'], 'Ward 1', ['01', '02']);
      expect(useCouncilBoundaryStore.getState().selectedWard).toEqual(['W-1', 'W-2']);
      expect(useCouncilBoundaryStore.getState().selectedBlock).toEqual([]);

      store.setSelectedBlock(['B-1'], 'Block 1', ['01']);
      expect(useCouncilBoundaryStore.getState().selectedBlock).toEqual(['B-1']);

      store.setSelectedPropertyTypeGroup('Residential');
      expect(useCouncilBoundaryStore.getState().selectedPropertyTypeGroup).toBe('Residential');

      store.setSelectedPropertyTypeId(10);
      expect(useCouncilBoundaryStore.getState().selectedPropertyTypeId).toBe(10);

      store.setTaxStatus(['paid', 'unpaid']);
      expect(useCouncilBoundaryStore.getState().taxStatus).toEqual(['paid', 'unpaid']);

      store.setActiveKpiCode('TAX_PENDING');
      expect(useCouncilBoundaryStore.getState().activeKpiCode).toBe('TAX_PENDING');

      store.setTopDefaulters(true);
      expect(useCouncilBoundaryStore.getState().topDefaulters).toBe(true);

      store.setRiskZones({ flood: true, earthquake: false, complaints: true });
      expect(useCouncilBoundaryStore.getState().riskZones.flood).toBe(true);

      store.setAssessmentSubCategory('SubCatA');
      expect(useCouncilBoundaryStore.getState().assessmentSubCategory).toBe('SubCatA');

      store.setDocumentSubmittedStatus('Submitted');
      expect(useCouncilBoundaryStore.getState().documentSubmittedStatus).toBe('Submitted');

      store.setAdvancedFilters({ maxTax: 50000 });
      expect(useCouncilBoundaryStore.getState().advancedFilters).toEqual({ maxTax: 50000 });

      store.setFilters({ statusType: 'VERIFIED' });
      expect(useCouncilBoundaryStore.getState().filters.statusType).toBe('VERIFIED');

      store.resetFilters();
      const resetState = useCouncilBoundaryStore.getState();
      expect(resetState.selectedZone).toBe('all');
      expect(resetState.selectedWard).toEqual([]);
      expect(resetState.selectedBlock).toEqual([]);
    });
  });

  describe('Layer Slice', () => {
    it('sets layer visibility, base layer, performance mode, and heatmap properties', () => {
      const store = useCouncilBoundaryStore.getState();
      
      store.setLayerVisibility('zone', false);
      expect(useCouncilBoundaryStore.getState().layerVisibility.zone).toBe(false);

      store.setLayerVisibility('ward', true);
      expect(useCouncilBoundaryStore.getState().layerVisibility.ward).toBe(true);

      store.setBaseLayer('google_satellite');
      expect(useCouncilBoundaryStore.getState().baseLayer).toBe('google_satellite');

      store.setPerformanceMode(true);
      expect(useCouncilBoundaryStore.getState().performanceMode).toBe(true);

      store.setHeatMapType('tax_density');
      expect(useCouncilBoundaryStore.getState().heatMapType).toBe('tax_density');

      store.setHeatMapIntensity(0.8);
      expect(useCouncilBoundaryStore.getState().heatMapIntensity).toBe(0.8);

      store.setGeoJsonLayers({ customLayer: { type: 'FeatureCollection', features: [] } });
      expect(useCouncilBoundaryStore.getState().geoJsonLayers.customLayer).toBeDefined();
    });
  });

  describe('Data Slice', () => {
    it('sets kpi summary, ward summary, zones, blocks, and property status mappings', () => {
      const store = useCouncilBoundaryStore.getState();

      store.setKpiSummary({ totalCount: 1500, assessedCount: 1200 });
      expect(useCouncilBoundaryStore.getState().kpiSummary.totalCount).toBe(1500);

      store.setWardSummary([{ wardNo: '01', totalCount: 200 }]);
      expect(useCouncilBoundaryStore.getState().wardSummary.length).toBe(1);

      store.setZones([{ id: 1, name: 'Zone 1' }]);
      expect(useCouncilBoundaryStore.getState().zones.length).toBe(1);

      store.setBlocks([{ id: 101, name: 'Block 101' }]);
      expect(useCouncilBoundaryStore.getState().blocks.length).toBe(1);

      store.setPropertyStatusMapping({ 'UPIC-001': 'Assessed' });
      expect(useCouncilBoundaryStore.getState().propertyStatusMapping['UPIC-001']).toBe('Assessed');
    });
  });

  describe('Property Slice', () => {
    it('sets and retrieves selected properties and caches property details', async () => {
      const store = useCouncilBoundaryStore.getState();

      store.setSelectedProperty({ ownerId: 'P-101', ownerName: 'Alice' });
      expect(useCouncilBoundaryStore.getState().selectedProperty).toEqual({ ownerId: 'P-101', ownerName: 'Alice' });
      expect(useCouncilBoundaryStore.getState().selectionSource).toBe('map');

      store.setSelectedPropertyWithSource({ ownerId: 'P-102', ownerName: 'Bob' }, 'search');
      expect(useCouncilBoundaryStore.getState().selectedProperty).toEqual({ ownerId: 'P-102', ownerName: 'Bob' });
      expect(useCouncilBoundaryStore.getState().selectionSource).toBe('search');

      store.setSelectedProperty(null);
      expect(useCouncilBoundaryStore.getState().selectedProperty).toBeNull();
      expect(useCouncilBoundaryStore.getState().propertyDetail).toBeNull();

      // Fetch property detail
      const mockDetail = { ownerId: 'P-101', address: '123 Main St' };
      vi.mocked(actions.getPropertyDetailAction).mockResolvedValueOnce({
        success: true,
        data: mockDetail
      } as unknown as Awaited<ReturnType<typeof actions.getPropertyDetailAction>>);

      await store.fetchPropertyDetail('P-101');
      expect(useCouncilBoundaryStore.getState().propertyDetail).toEqual(mockDetail);

      // Cached fetch
      await store.fetchPropertyDetail('P-101');
      expect(useCouncilBoundaryStore.getState().propertyDetail).toEqual(mockDetail);

      // Prefetch property detail
      vi.mocked(actions.getPropertyDetailAction).mockResolvedValueOnce({
        success: true,
        data: { ownerId: 'P-103', address: '456 Elm St' }
      } as unknown as Awaited<ReturnType<typeof actions.getPropertyDetailAction>>);
      await store.prefetchPropertyDetail('P-103');
      expect(Object.keys(useCouncilBoundaryStore.getState().propertyDetailCache).length).toBeGreaterThan(0);
    });
  });

  describe('Map Slice', () => {
    it('updates zoom, intro video status, map refresh, and loads layers', async () => {
      const store = useCouncilBoundaryStore.getState();

      store.setZoom(15);
      expect(useCouncilBoundaryStore.getState().zoom).toBe(15);

      store.setIntroVideoStatus('ended');
      expect(useCouncilBoundaryStore.getState().introVideoStatus).toBe('ended');

      const initialRefreshKey = useCouncilBoundaryStore.getState().refreshKey;
      store.triggerMapRefresh();
      expect(useCouncilBoundaryStore.getState().refreshKey).toBe(initialRefreshKey + 1);

      vi.mocked(actions.getBoundariesAction).mockResolvedValue({
        success: true,
        data: { type: 'FeatureCollection', features: [] }
      } as unknown as Awaited<ReturnType<typeof actions.getBoundariesAction>>);

      await store.ensureGeoJsonLayerLoaded('zone');
      expect(useCouncilBoundaryStore.getState().geoJsonLoaded).toBe(true);

      // Error handling
      vi.mocked(actions.getBoundariesAction).mockRejectedValueOnce(new Error('Layer load failed'));
      await store.ensureGeoJsonLayerLoaded('unknown_layer');
      expect(useCouncilBoundaryStore.getState().geoJsonError).toBeDefined();
    });
  });
});
