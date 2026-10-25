import type {
    GisPropertyDetail,
    GisDashboardInitData,
    AssetDocumentItem,
} from './asset-gis-data.types';
import type {
    GisAssetPopupDetailsDto
} from './asset-gis-asset.types';

export type PropertyFieldValue = string | number | boolean | null | undefined;
export type AssetFieldValue = string | number | boolean | null | undefined;

export interface AssetAnalysisPanelProps {
    selectedProperty: GisPropertyDetail | GisAssetPopupDetailsDto | Record<string, unknown> | null;
    propertyDetail: GisPropertyDetail | GisAssetPopupDetailsDto | Record<string, unknown> | null;
    onClose: () => void;
    onOpenImageModal: (url: string | null) => void;
    getImageProxyUrl: (path?: string) => string | null;
    realPhotos?: Array<{ url: string; label: string }>;
    realDocuments?: Array<Record<string, unknown>>;
    isLoadingDetail?: boolean;
    isLoadingMedia?: boolean;
    isSingleAssetMode?: boolean;
    onToggleSingleAssetMode?: () => void;
    onNavigateTo360?: () => void;
    onNavigateToDirections?: () => void;
    onOpenAllPhotos?: () => void;
    onOpenAllDocs?: () => void;
    childAssets?: Array<Record<string, unknown>>;
    isLoadingChildAssets?: boolean;
    childAssetPhotoMap?: Record<string, unknown>;
    onOpenChildImageModal?: (photos: Array<{ url: string; label: string }>, url: string) => void;
    onSelectChildAsset?: (assetIdOrNo: string | number) => void;
    isLoadingRealPhotos?: boolean;
    hasRealAssetData?: boolean;
    documents?: AssetDocumentItem[];
    isLoadingDocuments?: boolean;
    onOpenDocModal?: () => void;
}

export interface PropertyAnalysisPanelProps {
    selectedProperty: GisPropertyDetail | Record<string, unknown> | null;
    propertyDetail: GisPropertyDetail | Record<string, unknown> | null;
    tenantIds: string[];
    currentTenantIdx: number;
    onClose: () => void;
    onPrevTenant: () => void;
    onNextTenant: () => void;
    onSelectTenant: (idx: number) => void;
    onOpenImageModal: (url: string) => void;
    getImageProxyUrl: (path: string) => string | null;
}

export interface AssetGisDashboardProps {
    initialData?: {
        initData?: GisDashboardInitData | Record<string, unknown>;
        kpiSummary?: Record<string, unknown>;
        wardSummary?: Array<Record<string, unknown>>;
        deepLinkCoords?: Record<string, unknown> | null;
        propertyDetail?: Record<string, unknown> | null;
        isSingleAssetMode?: boolean;
        ssrSuccess?: boolean;
        ulbData?: Record<string, unknown>;
    };
}

export interface AssetDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetData: {
        Buil_ID?: string;
        PropertyNo?: string;
        OwnerName?: string;
        PropertyDe?: string;
        Ward_No?: string;
        Zone_No?: string;
        DocsUrl?: string;
        docsUrl?: string;
        DOCS?: string;
        docs?: string;
        [key: string]: unknown;
    };
    documents?: AssetDocumentItem[];
    isLoadingDocuments?: boolean;
}

export interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    carouselImages: { url: string; label: string }[];
    carouselIndex: number;
    onPrev: () => void;
    onNext: () => void;
    onSetIndex: (index: number) => void;
    failedImages: Record<string, boolean>;
    onImageError: (url: string) => void;
}

export interface AssetGisConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface GISLocationCardProps {
    assetId?: string | number;
    assetNo?: string;
    src?: string;
}

export interface AssetHeaderSectionProps {
    mpmsId: string;
    owner: string;
    assetTypeName: string;
    categoryName?: string;
    isShoppingComplexType: boolean;
    isMainView: boolean;
    currentShopIdx: number;
    totalUnitsCount: number;
    isExpanded: boolean;
    link360?: string;
    googleMapLink?: string;
    unitLabelSingular?: string;
    unitLabelPlural?: string;
    combinedChildAssets?: Array<Record<string, unknown>>;
    showUnitDrawer?: boolean;
    onToggleUnitDrawer?: () => void;
    onSelectChildAsset?: (id: string | number) => void;
    parentAssetId?: string | number;
    onToggleExpand: () => void;
    onClose: () => void;
    onPrevShop?: () => void;
    onNextShop?: () => void;
}

export interface AssetMediaSectionProps {
    realPhotos: Array<{ url: string; label: string; type?: string }>;
    isLoadingRealPhotos?: boolean;
    documents?: AssetDocumentItem[];
    isLoadingDocuments?: boolean;
    onOpenImageModal: (url: string | null) => void;
    onOpenDocModal: () => void;
}

export interface AssetSpecsSectionProps {
    occupier: string;
    mobile: string;
    address?: string;
    plotNo: string;
    citySurveyNo: string;
    carpetAreaSqFt?: string | number;
    builtUpArea: string | number;
    constYear?: string;
    totalFloors?: number | string;
    encroachmentStatus?: string;
}

export interface AssetAdminCardProps {
    mpmsId: string;
    assetTypeName: string;
    departmentName: string;
    occupier: string;
    tenantNameVal?: string;
    encroachmentStatus: string;
    mobile: string;
    isExpanded: boolean;
    hasChildUnits: boolean;
    isMainView: boolean;
    isShoppingComplexType: boolean;
    combinedChildAssetsCount: number;
    resolvedParentName?: string;
    resolvedChildUnitName?: string;
    displayThumbUrl?: string;
    hasRealPhotos: boolean;
    realPhotoCount: number;
    isLoadingRealPhotos?: boolean;
    hasRealAssetData?: boolean;
    realPhotos?: Array<{ url: string }>;
    documents?: unknown[];
    onOpenImageModal?: (url: string) => void;
    onOpenDocModal?: () => void;
}

export interface AssetActionsSectionProps {
    hasChildUnits: boolean;
    isShoppingComplexType: boolean;
    unitLabelPlural: string;
    googleMapLink: string;
    lat: string;
    lng: string;
    link360: string;
    onOpenDocModal: () => void;
    onOpenUnitDrawer: () => void;
}

export interface AssetFinancialsSectionProps {
    capitalValueVal: number;
    annualRevenueVal: number;
    monthlyRentVal?: string | number | null;
    isMainView?: boolean;
}

export interface AssetMeasurementsSectionProps {
    plotNo: string;
    plotArea: unknown;
    citySurveyNo: string;
    carpetAreaVal: unknown;
    carpetAreaSqFt: unknown;
    builtUpAreaVal: unknown;
    builtUpArea: unknown;
    conYear: string;
    floor: string;
    parentAssetId?: string | number;
    noOfRoomsVal: number;
    combinedChildAssetsCount: number;
    marathiOwnerPatta: string;
    lat: string;
    lng: string;
    formatArea: (val: unknown) => string;
}

export interface AssetChildUnitsSectionProps {
    childAssets: Array<Record<string, unknown>>;
    isShoppingComplexType: boolean;
    onOpenUnitDrawer: () => void;
    onSelectChildAsset?: (id: string | number) => void;
}

export interface AssetInventorySectionProps {
    inventoryItems: Array<Record<string, unknown>>;
    showInventory: boolean;
    onToggleShowInventory: () => void;
}

export interface AssetTenantsSectionProps {
    tenants: Array<Record<string, unknown>>;
    showTenants: boolean;
    onToggleShowTenants: () => void;
}

export interface PropertyHeaderSectionProps {
    builId: string;
    isAssessed: boolean;
    isSurveyDone: boolean;
    hasMultipleUnits: boolean;
    currentTenantIdx: number;
    totalTenantsCount: number;
    isAlertActive: boolean;
    isUnlinked: boolean;
    isExpanded: boolean;
    headerBackground?: string;
    onPrevTenant: () => void;
    onNextTenant: () => void;
    onOpenQc: () => void;
    onToggleExpand: () => void;
    onClose: () => void;
}

export interface PropertyKpiBadgesSectionProps {
    hasMultipleUnits: boolean;
    tenantIds: string[];
    currentTenantIdx: number;
    tenantsList?: Array<{ newPartitionNo?: string; tenantName?: string }>;
    isAssessed: boolean;
    isSurveyDone: boolean;
    onSelectTenant: (idx: number) => void;
    onViewTracking: () => void;
}

export interface PropertyMediaSectionProps {
    imageUrl?: string | null;
    getImageProxyUrl: (path: string) => string | null;
    onOpenImageModal: (url: string) => void;
    unicodeAddress?: string;
    ownerName?: string;
    mobileNo?: string;
    propertyNo?: string;
    isExpanded: boolean;
}

export interface PropertySpecsSectionProps {
    data: Record<string, PropertyFieldValue>;
    isExpanded: boolean;
}

export interface PropertyActionButtonsProps {
    googleMapUrl: string;
    link360Url: string;
    earthUrl: string;
    hasCoords: boolean;
    tenantIds: string[];
    currentTenantIdx: number;
    tenantsList?: Array<{ newPartitionNo?: string; tenantName?: string }>;
    isExpanded: boolean;
    onSelectTenant: (idx: number) => void;
}
