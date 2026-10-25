import { StateCreator } from 'zustand';
import type { DataSlice } from '@/types/asset-gis.types';

export type { DataSlice };

export const createDataSlice: StateCreator<DataSlice & { setFilters: (filters: Record<string, unknown>) => void }, [], [], DataSlice> = (set, get) => ({
    kpiSummary: {
        totalCount: 0,
        assessedCount: 0,
        unassessedCount: 0,
        geoSequencingCount: 0,
        internalSurveyCount: 0,
        underConstructionCount: 0,
        underConstructionStructured: 0,
        underConstructionUnit: 0,
        residentialCount: 0,
        commercialCount: 0,
        mixCount: 0,
        industryCount: 0,
        governmentPropertyCount: 0,
        totalPaidAmount: 0
    },
    wardSummary: [],
    zones: [],
    blocks: [],
    activeKpiFilter: null,
    propertyStatusMapping: {},
    apiFilteredPropertyIds: [],
    loadingDashboardData: false,
    isFetchingGridData: false,
    fetchError: null,

    setKpiSummary: (kpi) => {
        const current = get().kpiSummary;
        if (JSON.stringify(current) !== JSON.stringify(kpi)) {
            set({ kpiSummary: kpi });
        }
    },
    setWardSummary: (ward) => {
        const current = get().wardSummary;
        if (JSON.stringify(current) !== JSON.stringify(ward)) {
            set({ wardSummary: ward });
        }
    },
    setZones: (zones) => {
        const current = get().zones;
        if (JSON.stringify(current) !== JSON.stringify(zones)) {
            set({ zones });
        }
    },
    setBlocks: (blocks) => {
        const current = get().blocks;
        if (JSON.stringify(current) !== JSON.stringify(blocks)) {
            set({ blocks });
        }
    },

    setActiveKpiFilter: (filter) => {
        set({ activeKpiFilter: filter });
        let statusType: string = 'ALL';
        if (filter) {
            const upper = filter.toUpperCase();
            if (upper === 'SURVEY' || upper === 'INTERNAL_SURVEY') statusType = 'INTERNAL_SURVEY';
            else if (upper === 'GEO' || upper === 'GEO_SEQUENCING') statusType = 'GEO_SEQUENCING';
            else statusType = upper;
        }
        get().setFilters({ statusType });
    },

    setPropertyStatusMapping: (mapping) => set({ propertyStatusMapping: mapping }),
});
