import { StateCreator } from 'zustand';
import { getPropertyTypeMasterListAction } from '@/app/[locale]/assets/gismapviewer/actions';
import type { PropertyTypeMasterItem, RiskZones, FilterSlice } from '@/types/asset-gis.types';

export type { RiskZones, FilterSlice };

export const createFilterSlice: StateCreator<FilterSlice, [], [], FilterSlice> = (set, get) => ({
    selectedZone: 'all',
    selectedZoneNo: null,
    selectedZoneLabel: null,
    selectedWard: [],
    selectedBlock: [],
    selectedWardNo: [],
    selectedBlockLabel: null,
    propertyTypeMasterList: [],
    propertyTypeGroupOptions: [
        { id: 'C', value: 'C', label: 'Commercial', total: 0 },
        { id: 'R', value: 'R', label: 'Residential', total: 0 },
        { id: 'R-C', value: 'R-C', label: 'Mixed', total: 0 },
        { id: 'I', value: 'I', label: 'Industrial', total: 0 },
        { id: 'N', value: 'N', label: 'Government', total: 0 }
    ],
    selectedPropertyTypeGroup: null,
    selectedPropertyTypeId: null,
    activeKpiCode: null,
    setActiveKpiCode: (activeKpiCode) => set({ activeKpiCode }),
    topDefaulters: false,
    taxStatus: ['all'],
    riskZones: {
        flood: false,
        earthquake: false,
        complaints: false
    },
    filters: {
        category: 'all',
        propertyTypeGroup: undefined,
        zoneId: undefined,
        blockId: undefined,
        wardNoCsv: '',
        statusType: 'ALL',
        searchTerm: ''
    },
    assessmentSubCategory: null,
    documentSubmittedStatus: 'all',
    advancedFilters: {},

    setSelectedZone: (zoneId, zoneLabel, zoneNo) => {
        const isAll = !zoneId || zoneId === 'all';
        const zoneList = (get() as unknown as Record<string, unknown>).zones as Array<{ id?: string | number; label?: string; code?: string; zoneNo?: string }> | undefined;
        const zone = zoneList?.find((z) => String(z.id) === String(zoneId));
        const resolvedLabel = isAll ? null : (zoneLabel || (zone ? zone.label : (zoneId || null)));
        const resolvedNo = isAll ? null : (zoneNo || (zone ? (zone.code || zone.zoneNo) : (zoneId || null)));

        set({ 
            selectedZone: isAll ? 'all' : zoneId, 
            selectedZoneNo: resolvedNo,
            selectedZoneLabel: resolvedLabel,
            selectedWard: [], 
            selectedBlock: [],
            selectedWardNo: [],
            selectedBlockLabel: null
        });
        
        get().setFilters({
            zoneId: isAll ? undefined : (zoneId || undefined),
            wardNoCsv: '',
            blockId: undefined,
        });
        
        if (zoneId && zoneId !== 'all') {
            const setLayerVisibility = (get() as unknown as Record<string, unknown>).setLayerVisibility as ((layer: string, visible: boolean) => void) | undefined;
            if (setLayerVisibility) {
                setLayerVisibility('zone', true);
                setLayerVisibility('block', true);
            }
        }

        if (get().selectedPropertyTypeGroup) {
            get().fetchPropertyTypeMasterList(get().selectedPropertyTypeGroup || undefined);
        }
    },

    setSelectedWard: (wards, wardLabel, wardNo) => {
        const isAll = !wards || wards.length === 0 || wards[0] === 'all';
        set({ 
            selectedWard: isAll ? [] : wards,
            selectedWardNo: isAll ? [] : (wardNo || wards),
            selectedBlockLabel: isAll ? null : (wardLabel || null)
        });
        get().setFilters({ wardNoCsv: isAll ? '' : wards.join(',') });
    },

    setSelectedBlock: (blocks, blockLabel, wardNo) => {
        const isAll = !blocks || blocks.length === 0 || blocks[0] === 'all';
        set({ 
            selectedBlock: isAll ? [] : blocks,
            selectedWard: isAll ? [] : blocks,
            selectedWardNo: isAll ? [] : (wardNo || (blockLabel ? [blockLabel.split(' ')[0]] : blocks)),
            selectedBlockLabel: isAll ? null : (blockLabel || null)
        });
        get().setFilters({ 
            blockId: isAll ? undefined : blocks.join(','),
            wardNoCsv: isAll ? '' : blocks.join(',')
        });
        
        if (get().selectedPropertyTypeGroup) {
            get().fetchPropertyTypeMasterList(get().selectedPropertyTypeGroup || undefined);
        }
    },

    setSelectedPropertyTypeGroup: async (group) => {
        set({ selectedPropertyTypeGroup: group, selectedPropertyTypeId: null });
        get().setFilters({ propertyTypeGroup: group || undefined, propertyTypeId: undefined });
        
        if (group && group !== 'all') {
            await get().fetchPropertyTypeMasterList(group);
        } else {
            set({ propertyTypeMasterList: [] });
        }
    },

    setSelectedPropertyTypeId: (id) => {
        set({ selectedPropertyTypeId: id });
        get().setFilters({ propertyTypeId: id || undefined });
    },

    setTopDefaulters: (val) => {
        set({ topDefaulters: val });
    },

    setTaxStatus: (status) => {
        set({ taxStatus: status });
    },

    setRiskZones: (zones) => set((state) => ({
        riskZones: { ...state.riskZones, ...zones }
    })),

    setAdvancedFilters: (filters) => {
        set((state) => ({
            advancedFilters: { ...state.advancedFilters, ...filters }
        }));
    },

    setFilters: (newFilters) => {
        set((state) => {
            const updated = { ...state.filters, ...newFilters };
            if (JSON.stringify(state.filters) === JSON.stringify(updated)) {
                return state;
            }
            return { filters: updated };
        });
    },

    setPropertyTypeGroupOptions: (options) => {
        set({ propertyTypeGroupOptions: options });
    },

    fetchPropertyTypeMasterList: async (group) => {
        const zoneId = get().selectedZone;
        const blockId = get().selectedBlock?.join(',');
        try {
            const res = await getPropertyTypeMasterListAction(group, {
                zoneId: zoneId === 'all' ? undefined : (zoneId || undefined),
                blockId: blockId === 'all' ? undefined : (blockId || undefined),
            });
            if (res?.success && res.data) {
                const list = Array.isArray(res.data) ? res.data : (res.data as { items?: unknown[] }).items || [];
                set({ propertyTypeMasterList: list as PropertyTypeMasterItem[] });
            }
        } catch (e) {
            console.error('[FilterSlice] Error fetching property types:', e);
        }
    },

    setAssessmentSubCategory: (sub: string | null) => {
        set({ assessmentSubCategory: sub === 'all' ? null : sub });
    },

    setDocumentSubmittedStatus: (status: string | null) => {
        set({ documentSubmittedStatus: status === 'all' ? 'all' : status });
    },

    resetFilters: () => {
        set({
            selectedZone: 'all',
            selectedZoneNo: null,
            selectedZoneLabel: null,
            selectedWard: [],
            selectedBlock: [],
            selectedWardNo: [],
            selectedBlockLabel: null,
            selectedPropertyTypeGroup: null,
            selectedPropertyTypeId: null,
            activeKpiCode: null,
            topDefaulters: false,
            taxStatus: ['all'],
            assessmentSubCategory: null,
            documentSubmittedStatus: 'all',
            filters: {
                category: 'all',
                propertyTypeGroup: undefined,
                zoneId: undefined,
                blockId: undefined,
                wardNoCsv: '',
                statusType: 'ALL',
                searchTerm: ''
            }
        });
    }
});
