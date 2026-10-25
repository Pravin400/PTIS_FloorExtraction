import { StateCreator } from 'zustand';
import { getPropertyDetailAction } from '@/app/[locale]/assets/gismapviewer/actions';
import type { PropertySlice, PropertyStoreContext, GisPropertyDetail } from '@/types/asset-gis.types';

export type { PropertySlice };

const getActiveFilters = (state: PropertyStoreContext) => {
    return {
        zoneId: state.selectedZone === 'all' ? null : state.selectedZone,
        wardNoCsv: state.selectedWard && state.selectedWard.length > 0 && !state.selectedWard.includes('all')
            ? state.selectedWard.filter((w: string) => w && w !== 'all').join(',')
            : '',
        blockIdCsv: state.selectedBlock && state.selectedBlock.length > 0 && !state.selectedBlock.includes('all')
            ? state.selectedBlock.filter((b: string) => b && b !== 'all').join(',')
            : '',
        propertyTypeGroup: state.selectedPropertyTypeGroup || null,
        PropertyTypeID: state.selectedPropertyTypeId || null,
        statusType: state.filters?.statusType || state.activeKpiFilter || 'ALL',
        assessmentSubCategory: state.assessmentSubCategory || null,
        documentSubmittedStatus: state.documentSubmittedStatus || null,
        taxStatus: state.taxStatus && state.taxStatus.length > 0 && state.taxStatus[0] !== 'all' ? state.taxStatus[0] : null,
        searchTerm: state.filters?.searchTerm || ''
    };
};

const getCacheKey = (ownerId: string | number, filters: Record<string, unknown>) => {
    const parts = [
        `grp_${filters.propertyTypeGroup || 'all'}`,
        `type_${filters.PropertyTypeID || 'all'}`,
        `status_${filters.statusType || 'all'}`,
        `tax_${filters.taxStatus || 'all'}`
    ];
    return `${ownerId}_${parts.join('_')}`;
};

export const createPropertySlice: StateCreator<
    PropertyStoreContext & PropertySlice,
    [],
    [],
    PropertySlice
> = (set, get) => ({
    selectedProperty: null,
    propertyDetail: null,
    loadingPropertyDetail: false,
    propertyDetailCache: {},
    selectionSource: null,

    setSelectedProperty: (prop) => {
        const state = get();
        const ownerId = (prop as Record<string, unknown>)?.OwnerID || (prop as Record<string, unknown>)?.ownerID || (prop as Record<string, unknown>)?.AssetNo || (prop as Record<string, unknown>)?.assetNo;
        const filters = getActiveFilters(state);
        const cached = ownerId ? state.propertyDetailCache[getCacheKey(ownerId as string | number, filters)] : null;
        set({ 
            selectedProperty: prop, 
            selectionSource: 'map',
            propertyDetail: cached || null
        });
    },

    setSelectedPropertyWithSource: (prop, source) => {
        const state = get();
        const ownerId = (prop as Record<string, unknown>)?.OwnerID || (prop as Record<string, unknown>)?.ownerID || (prop as Record<string, unknown>)?.AssetNo || (prop as Record<string, unknown>)?.assetNo;
        const filters = getActiveFilters(state);
        const cached = ownerId ? state.propertyDetailCache[getCacheKey(ownerId as string | number, filters)] : null;
        set({ 
            selectedProperty: prop, 
            selectionSource: source,
            propertyDetail: cached || null
        });
    },

    fetchPropertyDetail: async (ownerId) => {
        const state = get();
        const filters = getActiveFilters(state);
        const cacheKey = getCacheKey(ownerId, filters);

        if (state.propertyDetailCache[cacheKey]) {
            set({ propertyDetail: state.propertyDetailCache[cacheKey], loadingPropertyDetail: false });
            return;
        }

        set({ loadingPropertyDetail: true, propertyDetail: null });
        const res = await getPropertyDetailAction(ownerId, filters);
        if (res && res.success && res.data) {
            const rawData = res.data as Record<string, unknown>;
            const detailObj = (rawData.items || rawData.data || rawData) as GisPropertyDetail;
            set((currentState) => ({
                propertyDetail: detailObj,
                propertyDetailCache: { ...currentState.propertyDetailCache, [cacheKey]: detailObj },
                loadingPropertyDetail: false
            }));
        } else {
            set({ loadingPropertyDetail: false });
        }
    },

    prefetchPropertyDetail: async (ownerId) => {
        const state = get();
        const filters = getActiveFilters(state);
        const cacheKey = getCacheKey(ownerId, filters);

        if (state.propertyDetailCache[cacheKey]) return;

        const res = await getPropertyDetailAction(ownerId, filters);
        if (res && res.success && res.data) {
            const rawData = res.data as Record<string, unknown>;
            const detailObj = (rawData.items || rawData.data || rawData) as GisPropertyDetail;
            set((currentState) => ({
                propertyDetailCache: { ...currentState.propertyDetailCache, [cacheKey]: detailObj }
            }));
        }
    }
});
