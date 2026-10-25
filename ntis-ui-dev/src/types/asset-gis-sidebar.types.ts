import type React from 'react';
import type L from 'leaflet';
import type {
    FilterOption,
    KpiItem,
    GisKpiSummary,
    GisPropertyDetail,
    MapFilterConfig,
    ZoneGapData,
    BlockGapData
} from './asset-gis.types';
import type { AssetDocumentItem } from './asset-gis-data.types';

export interface AssetGisTopNavProps {
    ulbData?: { ulbLogo?: string; ulbName?: string };
    user?: Record<string, unknown>;
    logout?: () => void;
    toggleFullscreen?: () => void;
    isFullscreen?: boolean;
    dashboardFilters?: Record<string, unknown>;
    onOpenGapAnalysis?: () => void;
    onOpenConfig?: () => void;
    onRefresh?: () => void;
    onReset?: () => void;
}

export interface AssetGisSidebarProps {
    sidebarTab: 'filters' | 'layers';
    setSidebarTab: (tab: 'filters' | 'layers') => void;
    setShowSidebar: (show: boolean) => void;
    activeDropdown: string | null;
    setActiveDropdown: (id: string | null) => void;
    allWardSummaries: Array<{ zoneNo?: string; newWardNo?: string; wardNo?: string; totalCount?: number }>;
    dashboardFilters?: Record<string, unknown>;
    isLoading?: boolean;
}

export interface AssetGisDashboardLayoutProps {
    user?: Record<string, unknown>;
    logout: () => void;
    toggleFullscreen: () => void;
    isFullscreen: boolean;
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    sidebarProps: AssetGisSidebarProps | Record<string, unknown>;
    kpis: KpiItem[];
    activeKpiFilter: string | null;
    setActiveKpiFilter: (filter: string | null) => void;
    kpiSummary: Record<string, unknown> | GisKpiSummary | null;
    fetchError: string | null;
    showLoadingIndicator: boolean;
    selectedProperty: Record<string, unknown> | GisPropertyDetail | null;
    propertyDetail: Record<string, unknown> | GisPropertyDetail | null;
    onClosePanel: () => void;
    tenantIds: string[];
    currentTenantIdx: number;
    setCurrentTenantIdx: (idx: number | ((prev: number) => number)) => void;
    getImageProxyUrl: (path?: string) => string | null;
    imageModalUrl: string | null;
    setImageModalUrl: (url: string | null) => void;
    carouselImages: Array<{ url: string; label?: string }>;
    carouselIndex: number;
    setCarouselIndex: (idx: number | ((prev: number) => number)) => void;
    failedImages: Record<string, boolean>;
    setFailedImages: (images: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    realAssetPhotos?: Array<{ url: string; label: string }>;
    isLoadingRealPhotos?: boolean;
    hasRealAssetData?: boolean;
    realAssetDocuments?: Array<Record<string, unknown>> | AssetDocumentItem[];
    isLoadingRealDocuments?: boolean;
    childAssets?: Array<Record<string, unknown>>;
    isLoadingChildAssets?: boolean;
    childAssetPhotoMap?: Record<number, { photoUrl?: string; planUrl?: string; photoCount?: number; planCount?: number }>;
    onOpenChildImageModal?: (photos: Array<{ url: string; label: string }>, url: string) => void;
    onSelectChildAsset?: (assetIdOrNo: number | string) => void;
    ulbData?: Record<string, unknown>;
}

export interface AssetGisSearchSectionProps {
    onSelectProperty?: (item: Record<string, unknown>) => void;
}

export interface AssetGisKpiHeaderProps {
    kpis: KpiItem[];
    activeKpiFilter: string | null;
    setActiveKpiFilter: (filter: string | null) => void;
    isLoading?: boolean;
}

export interface AssetGisFilterListProps {
    allWardSummaries: Array<{ zoneNo?: string; newWardNo?: string; wardNo?: string; totalCount?: number }>;
    activeDropdown: string | null;
    setActiveDropdown: (id: string | null) => void;
    isLoading?: boolean;
}

export interface SidebarFilterDropdownProps {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    options: FilterOption[];
    selectedValue: string | string[];
    onSelect: (id: string | number) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    searchable?: boolean;
    placeholder?: string;
    isLoading?: boolean;
}

export interface KpiFilterDropdownProps {
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    options: FilterOption[];
    selectedValue: string | null;
    onSelect: (id: string | number) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    colors: { accent?: string; text?: string };
}

export interface FilterSectionProps {
    label: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    children: React.ReactNode;
    theme: { textPrimary?: string; [key: string]: unknown };
}

export interface FilterToggleGridProps {
    options: string[] | { id: string; label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    theme: { primary?: string; textSecondary?: string; border?: string; [key: string]: unknown };
}

export interface FilterRangeSliderProps {
    min: number;
    max: number;
    step: number;
    value: number[];
    onValueChange: (value: number[]) => void;
    minLabel: string;
    maxLabel: string;
    theme: { textSecondary?: string; border?: string; [key: string]: unknown };
}

export interface AssetFilterDropdownProps {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    options: FilterOption[] | Array<{ id: string | number; label?: string; [key: string]: unknown }>;
    selectedValue: string | string[];
    onSelect: (id: string | number) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    theme: { primary: string; border?: string; background?: string; textSecondary?: string };
    id?: string;
    name?: string;
    searchable?: boolean;
    placeholder?: string;
}

export interface AssetKpisProps {
    isLoading?: boolean;
}

export interface AssetFiltersProps {
    isLoading?: boolean;
}

export interface MapCoreProps {
    mapContainerRef: React.RefObject<HTMLDivElement | null>;
    mapRef: React.MutableRefObject<L.Map | null>;
    markersLayerRef: React.MutableRefObject<L.LayerGroup | null>;
    highlightLayerRef: React.MutableRefObject<L.LayerGroup | null>;
    isMounted?: React.MutableRefObject<boolean>;
    setBounds: (bounds: [number, number, number, number]) => void;
    onMapReady?: () => void;
}

export interface MapInteractionsProps {
    mapRef: React.MutableRefObject<L.Map | null>;
    turboLayerRef: React.MutableRefObject<L.Layer | null>;
    isMounted?: React.MutableRefObject<boolean>;
}

export interface MapAssetBeaconLayerProps {
    mapRef: React.MutableRefObject<L.Map | null>;
    markersLayerRef?: React.MutableRefObject<L.LayerGroup | null>;
}

export interface MapPopupCoordinatorProps {
    mapRef: React.MutableRefObject<L.Map | null>;
    highlightLayerRef: React.MutableRefObject<L.LayerGroup | null>;
}

export interface MapLayersProps {
    mapRef: React.MutableRefObject<L.Map | null>;
    turboLayerRef: React.MutableRefObject<L.Layer | null>;
    layersRef: React.MutableRefObject<{ [key: string]: L.Layer | null }>;
    tileLayerRef: React.MutableRefObject<L.TileLayer | null>;
    getFeatureStyle: (feature: unknown, layerKey: string) => L.PathOptions;
    filterConfig: MapFilterConfig;
}

export interface QcItem {
    id: string;
    label: string;
    val: unknown;
    status: 'complete' | 'missing' | 'invalid';
    category: string;
}

export interface PropertyQcViewProps {
    onReturn: () => void;
    builId: string;
    isQcPassed: boolean;
    isQcDone: boolean;
    qcFilter: 'total' | 'complete' | 'missing' | 'invalid';
    setQcFilter: (f: 'total' | 'complete' | 'missing' | 'invalid') => void;
    totalFields: number;
    completeFields: number;
    missingFields: number;
    invalidFields: number;
    qcItems: QcItem[];
    isPlaceholderValue: (str: string) => boolean;
}

export interface TrackingStep {
    id: number;
    title: string;
    description: string;
    status: string;
    date?: string | null | unknown;
    by?: string | null | unknown;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
}

export interface PropertyTrackingViewProps {
    onReturn: () => void;
    steps: TrackingStep[];
    completedStages: number;
    progressPercent: number;
    loadingTracking: boolean;
    trackingError: string | null;
    onRetry: () => void;
    formatTrackingDate: (dateStr: string) => string;
}

export interface AssetSubUnitsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    isShoppingComplexType: boolean;
    combinedChildAssets: Array<Record<string, unknown>>;
    unitLabelPlural: string;
    childSearchQuery: string;
    setChildSearchQuery: (query: string) => void;
    statusFilter: 'ALL' | 'RENTED' | 'VACANT';
    setStatusFilter: (status: 'ALL' | 'RENTED' | 'VACANT') => void;
    rentedCount: number;
    vacantCount: number;
    availableFloors: string[];
    floorFilter: string;
    setFloorFilter: (floor: string) => void;
    isMainView: boolean;
    parentAssetId?: string | number;
    departmentName: string;
    owner: string;
    filteredChildAssets: Array<Record<string, unknown>>;
    prop: Record<string, unknown>;
    onSelectChildAsset?: (id: string | number) => void;
    formatArea: (sqft: number) => string;
}

export type GapTabId = 'photoPlan' | 'mobileNo' | 'ownerName' | 'address' | 'occupierName' | 'shopName' | 'registeredProperty';

export interface GapZoneCardProps {
    zone: ZoneGapData;
    activeTab: string;
    exportingRowId: string | null;
    exportSuccessRowId: string | null;
    onSelectZone: (zone: ZoneGapData) => void;
    onExportRow: (rowId: string, zoneId?: string) => void;
}

export interface GapWardTableProps {
    selectedZone: { id: string; name: string };
    blocks: BlockGapData[];
    activeTab: string;
    currentPage: number;
    itemsPerPage: number;
    exportingRowId: string | null;
    exportSuccessRowId: string | null;
    onExportRow: (rowId: string, zoneId?: string, blockId?: string) => void;
}

export interface GapRegisteredPropertyTableProps {
    selectedZone: { id: string; name: string } | null;
    zones: ZoneGapData[];
    blocks: Array<{ id: string; totalOldCount: number; mergeOldCount: number; missingOldCount: number }>;
    currentPage: number;
    itemsPerPage: number;
    exportingRowId: string | null;
    exportSuccessRowId: string | null;
    onSelectZone: (zone: ZoneGapData) => void;
    onExportRow: (rowId: string, zoneId?: string, blockId?: string) => void;
}

export interface GapAnalysisTabsProps {
    activeTab: GapTabId;
    onTabChange: (tab: GapTabId) => void;
    getTabCount: (tabId: GapTabId) => number;
}

export interface GisPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

export interface GisErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export interface AssetKpiCardProps {
    id: string;
    title: string;
    iconName: string;
    color: string;
    displayValue: { num: string; sub?: string };
    isActive: boolean;
    onCardClick: () => void;
    index: number;
}
