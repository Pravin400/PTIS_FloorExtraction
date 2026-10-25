/**
 * Map Layers Component
 * Standard: Clean Architecture - handles all map layer logic.
 */

'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoJsonObject, Feature } from 'geojson';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { TurboTileLayer, type TurboTileLayerOptions, type TurboFeature } from './LeafletTurboLayer';
import { useQueryClient } from '@tanstack/react-query';

import { getApiBaseUrl } from '@/lib/utils/asset-gis-utils';
import type { MapFilterConfig, MapLayersProps, TurboLayerInstance } from '@/types/asset-gis.types';

export type { MapFilterConfig, MapLayersProps, TurboLayerInstance };

export const MapLayers = ({
    mapRef,
    turboLayerRef,
    layersRef,
    tileLayerRef,
    getFeatureStyle,
    filterConfig,
}: MapLayersProps) => {
    const {
        baseLayer,
        geoJsonLayers,
        layerVisibility,
        performanceMode,
        refreshKey,
        activeKpiFilter,
        activeModule,
    } = useCouncilBoundaryStore();
    const queryClient = useQueryClient();


    // Track previous filters to detect if we need a server-side tile refresh
    const prevFiltersRef = useRef<string>('');

    // 1. Create Boundary & Zone Panes
    const zoneTooltipsRef = useRef<L.Tooltip[]>([]);
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        if (!map.getPane('boundaries')) {
            const pane = map.createPane('boundaries');
            pane.style.zIndex = '650';
            pane.style.pointerEvents = 'none';
        }
        if (!map.getPane('zones')) {
            const pane = map.createPane('zones');
            pane.style.zIndex = '670';
            pane.style.pointerEvents = 'none';
        }
    }, [mapRef]);

    // 2. Zoom Listener (Legacy/Reference)
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;
        const handleZoom = () => {
            // setCurrentZoom(map.getZoom()); // Disabled for performance
        };
        map.on('zoomend', handleZoom);
        return () => {
            map.off('zoomend', handleZoom);
        };
    }, [mapRef]);

    // 3. Base Layer Management
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        // Remove existing tile layers (except TurboTileLayer)
        map.eachLayer((layer: L.Layer) => {
            if (layer instanceof L.TileLayer && !(layer instanceof (TurboTileLayer as unknown as typeof L.Layer))) {
                map.removeLayer(layer);
            }
        });

        if (baseLayer === 'google_satellite') {
            // Restored Google Satellite Hybrid (with landmarks/roads). 
            // Added subdomains (mt0, mt1, mt2, mt3) to distribute traffic and prevent the white screen rate-limiting.
            // maxNativeZoom is 19 to prevent requesting non-existent satellite tiles and avoid white backgrounds.
            tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 24,
                maxNativeZoom: 19,
                subdomains: ['0', '1', '2', '3'],
                attribution: 'Google Satellite Hybrid',
            }).addTo(map);
        } else if (baseLayer === 'google_street') {
            tileLayerRef.current = L.tileLayer(
                'https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}',
                {
                    maxZoom: 24,
                    maxNativeZoom: 20,
                    subdomains: ['0', '1', '2', '3'],
                    attribution: 'Google Maps',
                }
            ).addTo(map);
        } else if (baseLayer === 'street') {
            tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 24,
                maxNativeZoom: 19,
                attribution: 'OpenStreetMap',
            }).addTo(map);
        } else if (baseLayer === 'none') {
            tileLayerRef.current = null;
        }
    }, [baseLayer, mapRef, tileLayerRef]);

    // 4. Vector & Turbo Layers
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        if (!map.getPane('boundaries')) {
            const pane = map.createPane('boundaries');
            pane.style.zIndex = '650';
            pane.style.pointerEvents = 'none';
        }
        if (!map.getPane('zones')) {
            const pane = map.createPane('zones');
            pane.style.zIndex = '670';
            pane.style.pointerEvents = 'none';
        }

        // --- 2A. Manage Footprints (TurboTileLayer) ---
        const footprintsVisible = layerVisibility['footprints'];
        if (footprintsVisible) {
            if (performanceMode) {
                if (layersRef.current['footprints']) {
                    map.removeLayer(layersRef.current['footprints']!);
                    layersRef.current['footprints'] = null;
                }

                const apiBase = getApiBaseUrl();
                const q = new URLSearchParams();
                if (filterConfig.selectedPropertyTypeId || filterConfig.PropertyTypeID) {
                    const typeId = String(filterConfig.selectedPropertyTypeId || filterConfig.PropertyTypeID);
                    q.set('assetTypeId', typeId);
                    q.set('AssetTypeId', typeId);
                }
                if (filterConfig.selectedZone && filterConfig.selectedZone !== 'all') {
                    q.set('zoneId', String(filterConfig.selectedZone));
                    q.set('ZoneId', String(filterConfig.selectedZone));
                }
                const selectedWardArray = (filterConfig.selectedBlock && filterConfig.selectedBlock.length > 0 && filterConfig.selectedBlock[0] !== 'all')
                    ? filterConfig.selectedBlock
                    : (filterConfig.selectedWard && filterConfig.selectedWard.length > 0 && filterConfig.selectedWard[0] !== 'all')
                        ? filterConfig.selectedWard
                        : [];
                if (selectedWardArray.length > 0) {
                    const wardVal = String(selectedWardArray[0]);
                    q.set('wardId', wardVal);
                    q.set('WardId', wardVal);
                    q.set('WardNo', selectedWardArray.join(','));
                }
                if (filterConfig.documentSubmittedStatus && filterConfig.documentSubmittedStatus !== 'all') {
                    q.set('assetCategoryId', String(filterConfig.documentSubmittedStatus));
                    q.set('AssetCategoryId', String(filterConfig.documentSubmittedStatus));
                }
                if (activeKpiFilter) {
                    q.set('kpiCode', activeKpiFilter);
                }
                if (filterConfig.searchTerm) {
                    q.set('searchTerm', filterConfig.searchTerm);
                }
                const queryString = q.toString() ? `?${q.toString()}` : '';

                const targetTileUrl = activeModule === 'ASSET'
                    ? `${apiBase}/gis/asset/tiles/{z}/{x}/{y}.mvt${queryString}`
                    : `${apiBase}/GisTile/{z}/{x}/{y}.mvt${queryString}`;

                if (!turboLayerRef.current) {
                    const turboCtor = TurboTileLayer as unknown as new (options: TurboTileLayerOptions) => L.Layer;
                    turboLayerRef.current = new turboCtor({
                        baseUrl: targetTileUrl,
                        minZoom: 12,         // Enable building polygon rendering from zoom 12+ so zone views render footprints
                        maxZoom: 24,
                        maxNativeZoom: 24,
                        filterConfig: filterConfig,
                        activeModule: activeModule,
                        getFeatureStyle: (feat: TurboFeature) => getFeatureStyle(feat, 'footprints'),
                        zIndex: 1000,
                        queryClient: queryClient as unknown as TurboTileLayerOptions['queryClient']
                    }).addTo(map);
                    const serializeFilters = (cfg: MapFilterConfig) => {
                        const set = cfg.apiMatchedIdsSet;
                        let sample = '';
                        if (set && set.size > 0) {
                            const arr = Array.from(set);
                            sample = `${arr[0]}_${arr[Math.floor(arr.length / 2)]}_${arr[arr.length - 1]}`;
                        }
                        return JSON.stringify({
                            m: activeModule,
                            z: cfg.selectedZone,
                            w: cfg.selectedWard,
                            b: cfg.selectedBlock,
                            g: cfg.propertyTypeGroup || cfg.selectedPropertyTypeGroup,
                            t: cfg.PropertyTypeID || cfg.selectedPropertyTypeId,
                            k: activeKpiFilter,
                            a: cfg.assessmentSubCategory,
                            doc: cfg.documentSubmittedStatus,
                            s: cfg.searchTerm,
                            tax: cfg.taxStatus,
                            idsCount: set?.size || 0,
                            idsSample: sample,
                            r: refreshKey
                        });
                    };

                    prevFiltersRef.current = serializeFilters(filterConfig);
                } else {
                    const layer = turboLayerRef.current as unknown as TurboLayerInstance;
                    const urlChanged = layer.options.baseUrl !== targetTileUrl;
                    if (urlChanged) {
                        layer.options.baseUrl = targetTileUrl;
                    }
                    layer.options.getFeatureStyle = (feat: TurboFeature) => getFeatureStyle(feat, 'footprints');
                    layer.options.filterConfig = filterConfig;

                    const serializeFilters = (cfg: MapFilterConfig) => {
                        const set = cfg.apiMatchedIdsSet;
                        let sample = '';
                        if (set && set.size > 0) {
                            const arr = Array.from(set);
                            sample = `${arr[0]}_${arr[Math.floor(arr.length / 2)]}_${arr[arr.length - 1]}`;
                        }
                        return JSON.stringify({
                            m: activeModule,
                            z: cfg.selectedZone,
                            w: cfg.selectedWard,
                            b: cfg.selectedBlock,
                            g: cfg.propertyTypeGroup || cfg.selectedPropertyTypeGroup,
                            t: cfg.PropertyTypeID || cfg.selectedPropertyTypeId,
                            k: activeKpiFilter,
                            a: cfg.assessmentSubCategory,
                            doc: cfg.documentSubmittedStatus,
                            s: cfg.searchTerm,
                            tax: cfg.taxStatus,
                            idsCount: set?.size || 0,
                            idsSample: sample,
                            r: refreshKey
                        });
                    };

                    const currentFilterStr = serializeFilters(filterConfig);
                    if (currentFilterStr !== prevFiltersRef.current || urlChanged) {
                        if (layer.forceRefresh) {
                            layer.forceRefresh();
                        } else {
                            layer.redraw();
                        }
                        prevFiltersRef.current = currentFilterStr;
                    }
                }
            } else {
                if (turboLayerRef.current) {
                    map.removeLayer(turboLayerRef.current);
                    turboLayerRef.current = null;
                }
                const fpData = (geoJsonLayers as Record<string, unknown> | null)?.['footprints'] as GeoJsonObject | undefined;
                if (fpData) {
                    if (!layersRef.current['footprints'] || !map.hasLayer(layersRef.current['footprints']!)) {
                        layersRef.current['footprints'] = L.geoJSON(fpData, {
                            style: (feat) => getFeatureStyle(feat, 'footprints'),
                        }).addTo(map);
                    } else {
                        const geoJsonLayer = layersRef.current['footprints'] as L.GeoJSON;
                        geoJsonLayer.setStyle((feat) => getFeatureStyle(feat, 'footprints'));
                    }
                }
            }
        } else {
            if (turboLayerRef.current) {
                map.removeLayer(turboLayerRef.current);
                turboLayerRef.current = null;
            }
            if (layersRef.current['footprints']) {
                map.removeLayer(layersRef.current['footprints']!);
                layersRef.current['footprints'] = null;
            }
        }

        // --- 2B. Manage All Dynamic Boundary Layers from DB ---
        const canonicalLayers = [
            {
                key: 'zone',
                data: (geoJsonLayers?.zone || geoJsonLayers?.['ZONE_BOUNDARY_LAYER'] || geoJsonLayers?.['1']) as GeoJsonObject | undefined,
                isVisible: !!(layerVisibility['zone'] || layerVisibility['1'] || layerVisibility['ZONE_BOUNDARY_LAYER'] || layerVisibility['Zone']),
                isZone: true,
                isWard: false,
                isCitySurvey: false,
                isNazul: false,
            },
            {
                key: 'ward',
                data: (geoJsonLayers?.ward || geoJsonLayers?.['WARD_BOUNDARY_LAYER'] || geoJsonLayers?.['6'] || geoJsonLayers?.['5'] || geoJsonLayers?.['2'] || geoJsonLayers?.block) as GeoJsonObject | undefined,
                isVisible: !!(layerVisibility['ward'] || layerVisibility['6'] || layerVisibility['5'] || layerVisibility['2'] || layerVisibility['WARD_BOUNDARY_LAYER'] || layerVisibility['Ward']),
                isZone: false,
                isWard: true,
                isCitySurvey: false,
                isNazul: false,
            },
            {
                key: 'citysurvey',
                data: (geoJsonLayers?.citysurvey || geoJsonLayers?.['CITY_SURVEY_BOUNDARY_LAYER'] || geoJsonLayers?.['3']) as GeoJsonObject | undefined,
                isVisible: !!(layerVisibility['citysurvey'] || layerVisibility['3'] || layerVisibility['CITY_SURVEY_BOUNDARY_LAYER'] || layerVisibility['CitySurvey']),
                isZone: false,
                isWard: false,
                isCitySurvey: true,
                isNazul: false,
            },
            {
                key: 'nazulsheet',
                data: (geoJsonLayers?.nazulsheet || geoJsonLayers?.['NAZUL_SHEET_LAYER'] || geoJsonLayers?.['4']) as GeoJsonObject | undefined,
                isVisible: !!(layerVisibility['nazulsheet'] || layerVisibility['4'] || layerVisibility['NAZUL_SHEET_LAYER'] || layerVisibility['NazulSheet']),
                isZone: false,
                isWard: false,
                isCitySurvey: false,
                isNazul: true,
            }
        ];

        canonicalLayers.forEach(({ key, data, isVisible, isZone, isWard, isCitySurvey, isNazul }) => {
            if (isVisible && data) {
                // Remove previous instance before re-creating to ensure fresh styles and accurate tooltips
                if (layersRef.current[key]) {
                    map.removeLayer(layersRef.current[key]!);
                    layersRef.current[key] = null;
                }
                if (isZone) {
                    zoneTooltipsRef.current.forEach(t => t.remove());
                    zoneTooltipsRef.current = [];
                }

                layersRef.current[key] = L.geoJSON(data, {
                    pane: isZone ? 'zones' : 'boundaries',
                    style: (feat) => getFeatureStyle(feat, key),
                    onEachFeature: (feature: Feature, layer: L.Layer) => {
                        const style = getFeatureStyle(feature, key);
                        if (style && (style.opacity === 0 || style.stroke === false)) {
                            return;
                        }
                        const props = (feature.properties || {}) as Record<string, unknown>;

                        // TOOLTIP: ZONE NAMES
                        if (isZone) {
                            let label = String(props.ZONE || props.ZONE_NO_ || props.Zone || props.Name || props.ZoneName || '');
                            if (typeof label === 'string' && (label.toLowerCase() === 'null' || label.trim() === '')) {
                                label = String(props.ZONE_NO_ || props.ZONE || '');
                            }
                            if (!label && props.OBJECTID === 9) label = 'ZONE D';
                            if (label) {
                                label = String(label).trim().toUpperCase();
                                const lat = parseFloat(String(props.LAT || props.lat || ''));
                                const lng = parseFloat(String(props.LONG || props.long || props.lng || ''));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    const tooltip = L.tooltip({ permanent: true, direction: 'center', className: 'zone-label-tooltip', opacity: 0.9, pane: 'zones' })
                                        .setContent(label).setLatLng([lat, lng]);
                                    tooltip.addTo(map);
                                    zoneTooltipsRef.current.push(tooltip);
                                    layer.on('remove', () => tooltip.remove());
                                } else {
                                    layer.bindTooltip(label, { permanent: true, direction: 'center', className: 'zone-label-tooltip', opacity: 0.9 });
                                }
                            }
                        }

                        // TOOLTIP: WARD NAMES
                        if (isWard) {
                            const label = String(props.WARD_NO || props.WardNo || props.WardName || props.Ward_No || props.NewWardNo || props.Short_ID || '');
                            if (label) layer.bindTooltip(`Ward ${label}`, { permanent: true, direction: 'center', className: 'ward-label-tooltip', opacity: 0.8 });
                        }

                        // TOOLTIP: CITY SURVEY
                        if (isCitySurvey) {
                            const label = String(props.Survey_Num || props.SurveyNo || props.Survey_No || '');
                            if (label) layer.bindTooltip(`Survey ${label}`, { sticky: true, direction: 'top', className: 'survey-label-tooltip', opacity: 0.8 });
                        }

                        // TOOLTIP: NAZUL SHEET
                        if (isNazul) {
                            const label = String(props.NAZUL_SHEE || props.SheetNo || props.Sheet_No || '');
                            if (label) layer.bindTooltip(`Sheet ${label}`, { sticky: true, direction: 'top', className: 'sheet-label-tooltip', opacity: 0.8 });
                        }
                    },
                }).addTo(map);

            } else if (layersRef.current[key] && (!isVisible || !data)) {
                map.removeLayer(layersRef.current[key]!);
                layersRef.current[key] = null;
                if (isZone) {
                    zoneTooltipsRef.current.forEach(t => t.remove());
                    zoneTooltipsRef.current = [];
                }
            }
        });
    }, [
        geoJsonLayers,
        layerVisibility,
        performanceMode,
        refreshKey,
        getFeatureStyle,
        filterConfig,
        activeKpiFilter,
        activeModule,
        layersRef,
        mapRef,
        queryClient,
        turboLayerRef,
    ]);

    return null;
};

