import { useMemo, useEffect } from 'react';
import type L from 'leaflet';
import { normalizeId } from '@/lib/utils/asset-gis-utils';
import { logger } from '@/lib/utils/logger';

const getLeaflet = (): typeof import('leaflet') | null => {
    if (typeof window === 'undefined') return null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return (window as unknown as { L?: typeof import('leaflet') }).L || require('leaflet');
    } catch {
        return null;
    }
};

export const useMapNavigation = (
    geoJsonLayers: Record<string, GeoJSON.FeatureCollection | null | undefined> | null | undefined,
    selectedBlock: string[],
    selectedZone: string | null,
    mapRef: React.MutableRefObject<L.Map | null>,
    blocksMetadata: Array<{ id: string | number; label?: string }> = [],
    selectedWardNo?: string[],
    selectedZoneNo?: string | null,
    selectedZoneLabel?: string | null
) => {
    const blockBoundsLookup = useMemo(() => {
        const lookup: Record<string, L.LatLngBounds> = {};
        const blockData = (geoJsonLayers?.ward || geoJsonLayers?.block || geoJsonLayers?.['WARD_BOUNDARY_LAYER'] || geoJsonLayers?.['6'] || geoJsonLayers?.['5'] || geoJsonLayers?.['2']) as GeoJSON.FeatureCollection | undefined;
        if (!blockData || typeof window === 'undefined') return lookup;
        const LInstance = getLeaflet();
        if (!LInstance) return lookup;

        try {
            blockData.features?.forEach((feature: GeoJSON.Feature) => {
                const props = (feature.properties || {}) as Record<string, unknown>;

                // 1. Extract alphanumeric labels (e.g., "B2", "B13", "A1")
                const rawLabel = String(
                    props.WARD_NO ||
                    props.WardNo ||
                    props.Ward_No ||
                    props.NewWardNo ||
                    props.Short_ID ||
                    props.ShortID ||
                    props.name ||
                    props.WardName ||
                    props.New_Block1 ||
                    props.New_Block ||
                    ''
                ).trim();
                const labelId = normalizeId(rawLabel);
                const strippedLabel = labelId.replace(/^ward/i, '');

                // 2. Extract numeric database ID (e.g. 13, 24)
                const rawDbId = String(
                    props.id ||
                    props.ID ||
                    props.OBJECTID ||
                    props.WardID ||
                    props.Ward_Id ||
                    props.NewWardId ||
                    props.nodeId ||
                    props.BlockID ||
                    ''
                ).trim();
                const dbId = normalizeId(rawDbId);

                try {
                    const tempLayer = LInstance.geoJSON(feature);
                    const bounds = tempLayer.getBounds();

                    if (bounds.isValid()) {
                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();
                        // Verify coordinates are valid Earth coordinates
                        if (
                            !isNaN(sw.lat) && !isNaN(sw.lng) &&
                            !isNaN(ne.lat) && !isNaN(ne.lng) &&
                            sw.lat >= -85 && sw.lat <= 85 &&
                            ne.lat >= -85 && ne.lat <= 85 &&
                            sw.lng >= -180 && sw.lng <= 180 &&
                            ne.lng >= -180 && ne.lng <= 180
                        ) {
                            const leafletBounds = LInstance.latLngBounds(sw, ne);

                            // Tokenize raw label (e.g., "A1 - A1" -> ["A1", "A1"])
                            const labelParts = rawLabel.split(/[\s\-_/]+/).filter(Boolean);

                            // Index under all variations
                            const keys = [
                                labelId,
                                strippedLabel,
                                'ward' + strippedLabel,
                                dbId,
                                rawLabel,
                                ...labelParts,
                                ...labelParts.map(p => normalizeId(p)),
                                props.WARD_NO,
                                props.WardNo,
                                props.Short_ID,
                                props.ShortID,
                                props.name
                            ].filter(Boolean);

                            keys.forEach(k => {
                                const key = normalizeId(String(k));
                                if (!lookup[key]) {
                                    lookup[key] = leafletBounds;
                                } else {
                                    lookup[key].extend(leafletBounds);
                                }
                            });
                        }
                    }
                } catch (_err) { }
            });
        } catch (e) {
            logger.error('[Navigation] Error building lookup:', { error: e as Error });
        }
        return lookup;
    }, [geoJsonLayers]);

    useEffect(() => {
        if (!mapRef.current || typeof window === 'undefined') return;
        const LInstance = getLeaflet();
        if (!LInstance) return;
        const map = mapRef.current;

        const hasWardFilter = (selectedWardNo && selectedWardNo.length > 0 && selectedWardNo[0] !== 'all') ||
                              (selectedBlock && selectedBlock.length > 0 && selectedBlock[0] !== 'all');

        if (hasWardFilter) {
            // Determine the ward identifier (prefer explicit WardNo / WardCode like "B2", "B13")
            const explicitWardNo = selectedWardNo && selectedWardNo.length > 0 && selectedWardNo[0] !== 'all' ? selectedWardNo[0] : null;
            const blockId = selectedBlock && selectedBlock.length > 0 && selectedBlock[0] !== 'all' ? selectedBlock[0] : null;

            let targetCode = explicitWardNo;
            if (!targetCode && blockId) {
                const blockMeta = (blocksMetadata || []).find(b => normalizeId(b.id) === normalizeId(blockId) || normalizeId(b.label) === normalizeId(blockId));
                targetCode = blockMeta?.label || blockId;
            }

            const rawTargetStr = String(targetCode || '').trim();
            const normTarget = normalizeId(rawTargetStr);
            const strippedTarget = normTarget.replace(/^ward/i, '');
            const targetParts = rawTargetStr.split(/[\s\-_/]+/).filter(Boolean).map(p => normalizeId(p));

            const targetBounds = blockBoundsLookup[normTarget] ||
                               blockBoundsLookup[strippedTarget] ||
                               blockBoundsLookup['ward' + strippedTarget] ||
                               targetParts.map(p => blockBoundsLookup[p]).find(Boolean) ||
                               (blockId ? blockBoundsLookup[normalizeId(blockId)] : null);

            if (targetBounds && targetBounds.isValid && targetBounds.isValid()) {
                map.fitBounds(targetBounds, { padding: [80, 80], maxZoom: 17, animate: true });
            } else {
                // Fuzzy fallback over all features
                let fuzzyBounds: L.LatLngBounds | null = null;
                const blockData = (geoJsonLayers?.ward || geoJsonLayers?.block || geoJsonLayers?.['WARD_BOUNDARY_LAYER'] || geoJsonLayers?.['6'] || geoJsonLayers?.['5'] || geoJsonLayers?.['2']) as GeoJSON.FeatureCollection | undefined;
                
                if (blockData?.features) {
                    for (const feature of blockData.features) {
                        const props = (feature.properties || {}) as Record<string, unknown>;
                        const rawWardVal = String(props.WARD_NO || props.WardNo || props.Ward_No || props.NewWardNo || props.Short_ID || props.ShortID || props.WardName || props.name || '').trim();
                        const pWard = normalizeId(rawWardVal);
                        const pStripped = pWard.replace(/^ward/i, '');
                        const pId = normalizeId(String(props.id || props.ID || props.OBJECTID || props.WardID || props.Ward_Id || ''));
                        const pParts = rawWardVal.split(/[\s\-_/]+/).filter(Boolean).map(p => normalizeId(p));

                        const isMatch = pWard === normTarget ||
                            pStripped === strippedTarget ||
                            pWard === strippedTarget ||
                            pStripped === normTarget ||
                            targetParts.some(tp => pWard === tp || pStripped === tp || pParts.includes(tp)) ||
                            (blockId && pId === normalizeId(blockId));

                        if (isMatch) {
                            try {
                                const tempLayer = LInstance.geoJSON(feature);
                                const bounds = tempLayer.getBounds();
                                if (bounds.isValid()) {
                                    fuzzyBounds = bounds;
                                    break;
                                }
                            } catch (_e) { }
                        }
                    }
                }

                if (fuzzyBounds && fuzzyBounds.isValid && fuzzyBounds.isValid()) {
                    map.fitBounds(fuzzyBounds, { padding: [80, 80], maxZoom: 17, animate: true });
                } else {
                    logger.warn(`[Navigation] Ward boundary for ${targetCode || blockId} not found in current GeoJSON.`);
                }
            }
        } else if (selectedZone && selectedZone !== 'all') {
            // Only handle zone zoom if NO ward is selected
            const targetZone = normalizeId(selectedZone);
            const targetZoneNo = normalizeId(selectedZoneNo || '');
            const targetZoneLabel = normalizeId(selectedZoneLabel || '');
            const zoneData = (geoJsonLayers?.zone || geoJsonLayers?.['ZONE_BOUNDARY_LAYER'] || geoJsonLayers?.['1']) as GeoJSON.FeatureCollection | undefined;

            if (zoneData && zoneData.features) {
                const feature = zoneData.features.find((f: GeoJSON.Feature) => {
                    const props = (f.properties || {}) as Record<string, unknown>;
                    const rawName = String(props.ZONE || props.ZONE_NO_ || props.Zone || props.ZoneName || props.Name || props.label || '').trim();
                    const fName = normalizeId(rawName);
                    const fCode = normalizeId(String(props.ZoneCode || props.zone_code || ''));
                    const fId = normalizeId(String(props.ZoneID || props.id || props.OBJECTID || ''));
                    const fLetter = rawName.match(/ZONE\s+([A-D0-9]+)/i)?.[1]?.toLowerCase() || '';

                    return (
                        (targetZoneNo && (fName === targetZoneNo || fCode === targetZoneNo || fLetter === targetZoneNo || fName.includes(targetZoneNo))) ||
                        (targetZoneLabel && (fName === targetZoneLabel || fName.includes(targetZoneLabel))) ||
                        (targetZone && (fName === targetZone || fCode === targetZone || fId === targetZone))
                    );
                });

                if (feature) {
                    try {
                        const tempLayer = LInstance.geoJSON(feature);
                        const bounds = tempLayer.getBounds();
                        if (bounds.isValid()) {
                            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 16 });
                        }
                    } catch (_e) { }
                }
            }
        }
    }, [
        selectedBlock,
        selectedZone,
        selectedWardNo,
        selectedZoneNo,
        selectedZoneLabel,
        geoJsonLayers,
        blockBoundsLookup,
        blocksMetadata,
        mapRef
    ]);

    return { blockBoundsLookup };
};
