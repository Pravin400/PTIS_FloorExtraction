/**
 * GIS Global Store (Council Boundary Store)
 * Standard: Clean Architecture - Slice Pattern
 */

import { create } from 'zustand';
import { createFilterSlice } from './asset-gis/filterSlice';
import { createLayerSlice } from './asset-gis/layerSlice';
import { createDataSlice } from './asset-gis/dataSlice';
import { createPropertySlice } from './asset-gis/propertySlice';
import { createMapSlice } from './asset-gis/mapSlice';
import { clearGisTileCache } from '@/lib/utils/asset-gis-utils';
import type { CouncilBoundaryStoreState } from '@/types/asset-gis.types';

export const useCouncilBoundaryStore = create<CouncilBoundaryStoreState>()((...a) => ({
    ...createFilterSlice(...a),
    ...createLayerSlice(...a),
    ...createDataSlice(...a),
    ...createPropertySlice(...a),
    ...createMapSlice(...a),

    mapBBox: null,
    setMapBBox: (mapBBox) => a[0]({ mapBBox }),

    isAlertActive: false,
    setIsAlertActive: (isAlertActive) => a[0]({ isAlertActive }),

    activeModule: 'ASSET',
    setActiveModule: (activeModule) => a[0]({ activeModule }),

    hydrateFromSSR: (data: Record<string, unknown>) => {
        if (!data) return;
        const set = a[0];
        set((state) => ({
            kpiSummary: (data.kpiSummary as typeof state.kpiSummary) || state.kpiSummary,
            wardSummary: (data.wardSummary as typeof state.wardSummary) || state.wardSummary,
            propertyTypeMasterList: (data.propertyTypes as typeof state.propertyTypeMasterList) || state.propertyTypeMasterList,
            propertyTypeGroupOptions: (data.propertyGroups as typeof state.propertyTypeGroupOptions) || state.propertyTypeGroupOptions,
        }));
    },

    logout: () => {
        const set = a[0];
        set({
            selectedProperty: null,
            propertyDetail: null,
            selectedZone: null,
            selectedWard: [],
            selectedBlock: [],
            filters: {}
        });
        clearGisTileCache();
    }
}));

export const useGisFilters = () => useCouncilBoundaryStore((state) => state.filters);
export const useGisLayers = () => useCouncilBoundaryStore((state) => state.layerVisibility);
export const useGisKpis = () => useCouncilBoundaryStore((state) => state.kpiSummary);
