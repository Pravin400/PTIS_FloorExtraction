import type {
    PropertyTypeMasterItem,
    GisDropdownItem,
    GisFilters,
    RiskZones,
    GisKpiSummary,
    GisWardSummaryItem,
    GisPropertyListItem,
    GisPropertyDetail
} from './asset-gis.types';

export interface PropertyStoreContext {
    selectedZone?: string | null;
    selectedWard?: string[];
    selectedBlock?: string[];
    selectedPropertyTypeGroup?: string | null;
    selectedPropertyTypeId?: number | null;
    filters?: {
        statusType?: string;
        searchTerm?: string;
    };
    activeKpiFilter?: string | null;
    assessmentSubCategory?: string | null;
    documentSubmittedStatus?: string | null;
    taxStatus?: string[];
    apiFilteredPropertyIds?: string[];
    selectedProperty?: GisPropertyListItem | Record<string, unknown> | null;
}

export interface PropertySlice {
    selectedProperty: GisPropertyListItem | Record<string, unknown> | null;
    propertyDetail: GisPropertyDetail | Record<string, unknown> | null;
    loadingPropertyDetail: boolean;
    propertyDetailCache: Record<string, GisPropertyDetail | Record<string, unknown>>;
    selectionSource: 'map' | 'search' | null;
    
    setSelectedProperty: (prop: GisPropertyListItem | Record<string, unknown> | null) => void;
    setSelectedPropertyWithSource: (prop: GisPropertyListItem | Record<string, unknown> | null, source: 'map' | 'search') => void;
    fetchPropertyDetail: (ownerId: string | number) => Promise<void>;
    prefetchPropertyDetail: (ownerId: string | number) => Promise<void>;
}

export interface MapSlice {
    center: [number, number];
    zoom: number;
    introVideoStatus: 'playing' | 'ended' | 'idle';
    refreshKey: number;
    loadingGeoJson: boolean;
    geoJsonLoaded: boolean;
    geoJsonError: string | null;
    geoJsonLayers: {
        zone: unknown;
        ward: unknown;
        citysurvey: unknown;
        nazulsheet: unknown;
        footprints: unknown;
        [key: string]: unknown;
    };
    polygonReady: boolean;

    setZoom: (zoom: number) => void;
    setIntroVideoStatus: (status: 'playing' | 'ended' | 'idle') => void;
    triggerMapRefresh: () => void;
    loadAllGeoJsonLayers: () => Promise<void>;
    ensureGeoJsonLayerLoaded: (layerIdOrKey: string | number) => Promise<void>;
    setPolygonReady: (ready: boolean) => void;
    setCenter?: (center: [number, number]) => void;
}

export interface LayerSlice {
    layerVisibility: {
        zone: boolean;
        ward: boolean;
        block: boolean;
        footprints: boolean;
        mpms: boolean;
        citysurvey: boolean;
        nazulsheet: boolean;
        municipal_boundary: boolean;
        [key: string]: boolean;
    };
    baseLayer: 'none' | 'street' | 'google_street' | 'google_satellite';
    performanceMode: boolean;
    heatMapType: string;
    heatMapIntensity: number;
    geoJsonLayers: Record<string, unknown>;
    geoJsonLoaded: boolean;
    loadingGeoJson: boolean;

    setLayerVisibility: (layer: string, visible: boolean) => void;
    setBaseLayer: (layer: 'none' | 'street' | 'google_street' | 'google_satellite') => void;
    setPerformanceMode: (mode: boolean) => void;
    setHeatMapType: (type: string) => void;
    setHeatMapIntensity: (intensity: number) => void;
    setGeoJsonLayers: (layers: Record<string, unknown>) => void;
}

export interface FilterSlice {
    selectedZone: string | null;
    selectedZoneNo: string | null;
    selectedZoneLabel: string | null;
    selectedWard: string[];
    selectedBlock: string[];
    selectedWardNo: string[];
    selectedBlockLabel: string | null;
    propertyTypeMasterList: PropertyTypeMasterItem[];
    propertyTypeGroupOptions: GisDropdownItem[];
    selectedPropertyTypeGroup: string | null;
    selectedPropertyTypeId: number | null;
    topDefaulters: boolean;
    taxStatus: string[];
    riskZones: RiskZones;
    assessmentSubCategory: string | null;
    documentSubmittedStatus: string | null;
    activeKpiCode: string | null;
    filters: GisFilters;
    advancedFilters: Record<string, unknown>;

    setSelectedZone: (zone: string | null, zoneLabel?: string | null, zoneNo?: string | null) => void;
    setSelectedWard: (wards: string[], wardLabel?: string | null, wardNo?: string[] | null) => void;
    setSelectedBlock: (blocks: string[], blockLabel?: string | null, wardNo?: string[] | null) => void;
    setFilters: (filters: Partial<GisFilters>) => void;
    setSelectedPropertyTypeGroup: (group: string | null) => void;
    setSelectedPropertyTypeId: (id: number | null) => void;
    setActiveKpiCode: (code: string | null) => void;
    setTopDefaulters: (val: boolean) => void;
    setTaxStatus: (status: string[]) => void;
    setRiskZones: (zones: Partial<RiskZones>) => void;
    setAdvancedFilters: (filters: Record<string, unknown>) => void;
    setPropertyTypeGroupOptions: (options: GisDropdownItem[]) => void;
    fetchPropertyTypeMasterList: (group?: string) => Promise<void>;
    setAssessmentSubCategory: (sub: string | null) => void;
    setDocumentSubmittedStatus: (status: string | null) => void;
    resetFilters: () => void;
}

export interface DataSlice {
    kpiSummary: GisKpiSummary | Record<string, unknown>;
    wardSummary: GisWardSummaryItem[] | Array<Record<string, unknown>>;
    activeKpiFilter: string | null;
    propertyStatusMapping: Record<string, unknown>;
    apiFilteredPropertyIds: string[];
    zones: Array<Record<string, unknown>>;
    blocks: Array<Record<string, unknown>>;
    loadingDashboardData: boolean;
    isFetchingGridData: boolean;
    fetchError: string | null;

    setKpiSummary: (kpi: GisKpiSummary | Record<string, unknown>) => void;
    setWardSummary: (ward: GisWardSummaryItem[] | Array<Record<string, unknown>>) => void;
    setZones: (zones: Array<Record<string, unknown>>) => void;
    setBlocks: (blocks: Array<Record<string, unknown>>) => void;
    setActiveKpiFilter: (filter: string | null) => void;
    setPropertyStatusMapping: (mapping: Record<string, unknown>) => void;
}

export type CouncilBoundaryStoreState = FilterSlice & LayerSlice & DataSlice & PropertySlice & MapSlice & {
    hydrateFromSSR: (data: Record<string, unknown>) => void;
    logout: () => void;
    mapBBox: [number, number, number, number] | null;
    setMapBBox: (bbox: [number, number, number, number] | null) => void;
    isAlertActive: boolean;
    setIsAlertActive: (active: boolean) => void;
    activeModule: string;
    setActiveModule: (activeModule: string) => void;
};
