import type React from 'react';
import type L from 'leaflet';
import type {
  GisFilters,
  PropertyTypeMasterItem,
  GisDropdownItem,
  RiskZones,
  GisKpiSummary,
  GisWardSummaryItem,
  GisPropertyListItem,
  GisPropertyDetail
} from './asset-gis-data.types';

export interface FilterOption {
  id: string | number;
  label: string;
  count?: number | null;
  color?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  value?: string | number;
  [key: string]: unknown;
}

export interface KpiItem {
  id: string;
  title?: string;
  label?: string;
  value?: string | number;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  color?: string;
  unit?: string | number;
  structured?: string | number;
  isClickable?: boolean;
  onClick?: () => void;
}

export interface AssetTypeColorConfig {
  id?: number | string;
  mpmsCode?: string;
  label: string;
  color: string;
  border: string;
  stroke?: string;
  fill?: string;
  opacity?: number;
  weight?: number;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: number[][][] | number[][][][];
}

export interface TurboFeature {
  type?: string;
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown> & {
    OwnerID?: unknown;
    ownerid?: unknown;
    ownerID?: unknown;
    Buil_ID?: unknown;
    buil_id?: unknown;
    _id?: unknown;
    NewZoneNo?: unknown;
    newZoneNo?: unknown;
    Zone?: unknown;
    zone?: unknown;
    ZoneName?: unknown;
    zoneName?: unknown;
    WARD_NO?: unknown;
    ward_no?: unknown;
    WardNo?: unknown;
    wardNo?: unknown;
    NewWardNo?: unknown;
    newWardNo?: unknown;
    Ward?: unknown;
    ward?: unknown;
    BlockNo?: unknown;
    Short_ID?: unknown;
    Ward_No?: unknown;
    WardName?: unknown;
    MPMS_ID?: unknown;
    mpms_id?: unknown;
    mpmsId?: unknown;
    AssetNo?: unknown;
    assetNo?: unknown;
    AssetName?: unknown;
    assetName?: unknown;
    MarathiOwn?: unknown;
    marathiOwn?: unknown;
    MarathiOwnerPatta?: unknown;
    marathiOwnerPatta?: unknown;
    MarathiSocietyName?: unknown;
    marathiSocietyName?: unknown;
    PropertyDe?: unknown;
    propertyDe?: unknown;
    PropertyDescription?: unknown;
    Address?: unknown;
    address?: unknown;
    TypeName?: unknown;
    typeName?: unknown;
    SocietyName?: unknown;
    AssetTypeId?: unknown;
    assetTypeId?: unknown;
    PropertyTypeID?: unknown;
    PropertyTypeId?: unknown;
    typeId?: unknown;
    TypeId?: unknown;
    _normalizedOwnerId?: string;
    _normalizedZone?: string;
    _normalizedWard?: string;
  };
  _centroid?: L.LatLng | null;
  _nativeCoords?: { x: number; y: number; z: number };
}

export interface TurboTileLayerOptions extends L.GridLayerOptions {
  baseUrl?: string;
  filterConfig?: Record<string, unknown>;
  activeModule?: string;
  queryClient?: {
    fetchQuery: (options: {
      queryKey: unknown[];
      queryFn: (context: { signal?: AbortSignal }) => Promise<unknown>;
      staleTime?: number;
    }) => Promise<unknown>;
  };
  getFeatureStyle?: (feature: TurboFeature, layerName?: string) => L.PathOptions;
  onFeatureClick?: (feature: TurboFeature) => void;
  highlightedOwnerId?: string | number | null;
  highlightedAssetId?: string | number | null;
  selectedAssetData?: unknown;
  currentZoom?: number;
  highlightPolygonReady?: boolean;
  minZoom?: number;
  maxZoom?: number;
  keepBuffer?: number;
  [key: string]: unknown;
}

export interface RenderableGeometry {
  type: 'Polygon' | 'MultiPolygon' | string;
  coordinates: number[][][] | number[][][][];
  _bbox?: [number, number, number, number];
}

export type RingPointArray = number[][];
export type RingPixelCache = { [key: string]: { x: number; y: number }[] };

export interface MapStylingFilterConfig {
  selectedZone?: string | null;
  selectedZoneNo?: string | null;
  selectedZoneLabel?: string | null;
  selectedBlock?: string[];
  selectedWardNo?: string[];
  PropertyTypeID?: number | string | null;
  propertyTypeGroup?: string | null;
  selectedMainType?: string | null;
  statusType?: string | null;
  taxStatus?: string[];
  searchTerm?: string;
  assessmentSubCategory?: string | null;
  documentSubmittedStatus?: string | null;
  apiMatchedIdsSet?: Set<string>;
  loadingDashboardData?: boolean;
  isFetchingGridData?: boolean;
  selectionSource?: string | null;
}

export interface MapFilterConfig {
  selectedPropertyTypeId?: string | number;
  PropertyTypeID?: string | number;
  selectedZone?: string | number;
  selectedBlock?: Array<string | number>;
  selectedWard?: Array<string | number>;
  documentSubmittedStatus?: string;
  searchTerm?: string;
  propertyTypeGroup?: string;
  selectedPropertyTypeGroup?: string;
  assessmentSubCategory?: string;
  taxStatus?: string;
  apiMatchedIdsSet?: Set<string | number>;
  [key: string]: unknown;
}

export interface TurboLayerInstance extends L.Layer {
  options: TurboTileLayerOptions;
  forceRefresh?: () => void;
  redraw: () => void;
}

export type PatchedFunction = ((...args: unknown[]) => unknown) & { __patched?: boolean };

export interface CanvasInternalProto {
  [key: string]: unknown;
  _ctx?: CanvasRenderingContext2D | null;
  _updateStyle?: PatchedFunction;
}

export interface MapInternal {
  _container?: HTMLElement | null;
}

export interface GeoJsonFeature {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
}

export interface GeoJsonObject {
  type?: string;
  features?: GeoJsonFeature[];
  data?: unknown;
  [key: string]: unknown;
}

export interface GisState {
  selectedZone: string | null;
  selectedWard: string[];
  selectedBlock: string[];
  filters: GisFilters;
  propertyTypeMasterList: PropertyTypeMasterItem[];
  propertyTypeGroupOptions: GisDropdownItem[];
  taxStatus: string[];
  riskZones: RiskZones;
  topDefaulters: boolean;
  kpiSummary: GisKpiSummary | null;
  wardSummary: GisWardSummaryItem[];
  propertyList: GisPropertyListItem[];
  apiFilteredPropertyIds: string[];
  selectedProperty: GisPropertyListItem | GisPropertyDetail | Record<string, unknown> | null;
  propertyDetail: GisPropertyDetail | null;
  loadingPropertyDetail: boolean;
  loadingDashboardData: boolean;
  isFetchingGridData: boolean;
  layerVisibility: {
    zone: boolean;
    ward: boolean;
    block: boolean;
    footprints: boolean;
  };
  baseLayer: 'none' | 'street' | 'google' | 'satellite' | 'google_street' | 'google_satellite';
  performanceMode: boolean;
  center: [number, number];
  zoom: number;
  isInitialLoad: boolean;
  geoJsonLayers: Record<string, unknown>;
  geoJsonLoaded: boolean;
}
