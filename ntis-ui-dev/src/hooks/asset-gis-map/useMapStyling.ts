import type { MapStylingFilterConfig } from '@/types/asset-gis.types';
import { useMemo, useCallback } from 'react';
import { normalizeId, normalizeOwnerId } from '@/lib/utils/asset-gis-utils';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { getAssetCategoryColor } from './mapColorUtils';
import { isPointInGeometry } from './mapGeometryUtils';
import { getHeatmapColor, getKpiFillColor, getStatusFillColor } from './mapStylingConstants';
import { resolveTargetWardNos, findSelectedZoneFeature, findSelectedWardFeature } from './mapStylingUtils';

export { MUNICIPAL_ASSET_TYPE_COLORS, getAssetCategoryColor } from './mapColorUtils';
export { isPointInPolygon, isPointInGeometry } from './mapGeometryUtils';
export type { MapStylingFilterConfig };

export const useMapStyling = (
    filterConfig: MapStylingFilterConfig,
    selectedProperty: { ownerId?: string; OwnerID?: string; Buil_ID?: string } | null | undefined,
    activeKpiFilter: string | null | undefined,
    heatMapType: string = 'none',
    heatMapIntensity: number = 60,
    blocksMetadata: Array<{ id: string | number; label?: string }> = [],
    geoJsonLayers: Record<string, GeoJSON.FeatureCollection | null | undefined> | null | undefined = null
) => {
    const activeModule = useCouncilBoundaryStore(s => s.activeModule);
    const propertyTypeMasterList = useCouncilBoundaryStore(s => s.propertyTypeMasterList);

    const memoizedFilterContext = useMemo(() => {
        const selectedZone = filterConfig.selectedZone;
        const selectedZoneNo = filterConfig.selectedZoneNo;
        const selectedZoneLabel = filterConfig.selectedZoneLabel;
        const isAllZone = !selectedZone || selectedZone === 'all';
        const targetZone = isAllZone ? '' : normalizeId(selectedZone);
        const targetZoneNo = isAllZone ? '' : normalizeId(selectedZoneNo || '');
        const targetZoneLabel = isAllZone ? '' : normalizeId(selectedZoneLabel || '');

        const selectedBlock = filterConfig.selectedBlock || [];
        const selectedWardNo = filterConfig.selectedWardNo || [];
        const isAllBlock = (!selectedBlock || selectedBlock.length === 0 || selectedBlock[0] === 'all') &&
                           (!selectedWardNo || selectedWardNo.length === 0 || selectedWardNo[0] === 'all');

        const targetWardNos = resolveTargetWardNos(selectedWardNo, selectedBlock, blocksMetadata, isAllBlock);

        const zoneData = (geoJsonLayers?.zone || geoJsonLayers?.['ZONE_BOUNDARY_LAYER'] || geoJsonLayers?.['1']) as GeoJSON.FeatureCollection | undefined;
        const selectedZoneFeature = findSelectedZoneFeature(zoneData, isAllZone, targetZone, targetZoneNo, targetZoneLabel);

        const wardData = (geoJsonLayers?.ward || geoJsonLayers?.block || geoJsonLayers?.['WARD_BOUNDARY_LAYER'] || geoJsonLayers?.['6'] || geoJsonLayers?.['5'] || geoJsonLayers?.['2']) as GeoJSON.FeatureCollection | undefined;
        const selectedWardFeature = findSelectedWardFeature(wardData, isAllBlock, targetWardNos);

        const selectedPropertyTypeId = filterConfig.PropertyTypeID;
        const hasPropertyTypeIdFilter = !!(selectedPropertyTypeId && Number(selectedPropertyTypeId) > 0);
        const propertyTypeGroup = String(filterConfig.propertyTypeGroup || '').toUpperCase();

        const hasTaxStatusFilter = !!(filterConfig.taxStatus && filterConfig.taxStatus.length > 0 && filterConfig.taxStatus[0] !== 'all');
        const hasAssessmentSubCategoryFilter = !!(filterConfig.assessmentSubCategory && filterConfig.assessmentSubCategory !== 'all');
        const hasDocumentSubmittedStatusFilter = !!(filterConfig.documentSubmittedStatus && filterConfig.documentSubmittedStatus !== 'all');
        const hasSearchFilter = !!(filterConfig.searchTerm && filterConfig.searchTerm.trim() !== '');

        const hasActiveDataFilter = !!(
            activeKpiFilter ||
            hasPropertyTypeIdFilter ||
            (propertyTypeGroup && propertyTypeGroup !== 'ALL') ||
            (filterConfig.selectedMainType && filterConfig.selectedMainType !== 'all') ||
            hasTaxStatusFilter ||
            hasAssessmentSubCategoryFilter ||
            hasDocumentSubmittedStatusFilter ||
            hasSearchFilter
        );

        const hasAnyActiveFilter = hasActiveDataFilter || !isAllBlock;
        const hasStrictDataFilter = hasActiveDataFilter;

        return {
            taxStatuses: (filterConfig.taxStatus || []).map((s: string) => s.toLowerCase()),
            selId: selectedProperty ? normalizeId(selectedProperty.ownerId || selectedProperty.OwnerID || selectedProperty.Buil_ID || '') : null,
            activeKpi: activeKpiFilter || null,
            apiFilteredPropertyIds: filterConfig.apiMatchedIdsSet,
            isFetchingGridData: filterConfig.isFetchingGridData,
            isAllZone,
            targetZone,
            targetZoneNo,
            targetZoneLabel,
            isAllBlock,
            targetWardNos,
            hasPropertyTypeIdFilter,
            selectedPropertyTypeId,
            propertyTypeMasterList,
            propertyTypeGroup,
            hasAnyActiveFilter,
            hasActiveDataFilter,
            hasStrictDataFilter,
            hasTargetedFilter: hasAssessmentSubCategoryFilter || hasDocumentSubmittedStatusFilter,
            selectedZoneFeature,
            selectedWardFeature
        };
    }, [
        filterConfig.taxStatus,
        selectedProperty,
        activeKpiFilter,
        filterConfig.apiMatchedIdsSet,
        filterConfig.isFetchingGridData,
        filterConfig.selectedZone,
        filterConfig.selectedZoneNo,
        filterConfig.selectedZoneLabel,
        filterConfig.selectedBlock,
        filterConfig.selectedWardNo,
        filterConfig.PropertyTypeID,
        filterConfig.propertyTypeGroup,
        filterConfig.selectedMainType,
        filterConfig.searchTerm,
        filterConfig.assessmentSubCategory,
        filterConfig.documentSubmittedStatus,
        blocksMetadata,
        geoJsonLayers,
        propertyTypeMasterList
    ]);

    const getZoneColor = (_name: string) => '#3b82f6';

    const getFeatureStyle = useCallback((feature: GeoJSON.Feature, layerKey: string) => {
        const props = (feature.properties || {}) as Record<string, unknown>;
        const {
            apiFilteredPropertyIds, activeKpi, selId,
            isAllZone, targetZone, targetZoneNo, targetZoneLabel, isAllBlock, targetWardNos,
            hasPropertyTypeIdFilter, selectedPropertyTypeId, propertyTypeGroup, hasActiveDataFilter,
            hasStrictDataFilter, taxStatuses, hasTargetedFilter
        } = memoizedFilterContext;

        if (layerKey === 'footprints') {
            const rawOwnerId = String(props.OwnerID || props.ownerid || '');
            const rawId = (!rawOwnerId || rawOwnerId === '0' || rawOwnerId === 'null')
                ? String(props.Buil_ID || props.buil_id || props._id || '')
                : rawOwnerId;
            const featId = String(props._normalizedOwnerId || normalizeOwnerId(rawId));
            const cleanFeatId = featId ? featId.toLowerCase().trim() : '';
            const isUnlinked = !cleanFeatId || cleanFeatId === '0' || cleanFeatId === 'null' || cleanFeatId === 'na' || cleanFeatId === 'n/a' || cleanFeatId.startsWith('-') || props.StatusType === 'UNLINKED';

            if (activeModule === 'ASSET') {
                const catStyle = getAssetCategoryColor(props);
                const isSelected = !!selId && (
                    selId === featId ||
                    (props.MPMS_ID && normalizeId(String(props.MPMS_ID)) === selId) ||
                    (props.CON && normalizeId(String(props.CON)) === selId)
                );

                return {
                    color: isSelected ? '#3B82F6' : (catStyle.border || '#FFFFFF'),
                    weight: isSelected ? 4 : 1.5,
                    opacity: isSelected ? 1 : 0.95,
                    fillColor: catStyle.color,
                    fillOpacity: isSelected ? 0.95 : 0.72,
                    interactive: true,
                    stroke: true,
                    fill: true
                };
            }

            const featZone = String(props._normalizedZone || normalizeId(String(props.NewZoneNo || props.Zone || props.ZoneName || props.ZoneCode || '')));
            const featWard = String(props._normalizedWard || normalizeId(String(props.NewWardNo || props.Ward || props.BlockNo || props.WardNo || props.Short_ID || props.Ward_No || props.WardName || '')));

            if (isAllBlock && !isAllZone) {
                const isMatch =
                    (targetZoneNo && (featZone === targetZoneNo || featZone.includes(targetZoneNo) || featWard.startsWith(targetZoneNo))) ||
                    (targetZoneLabel && (featZone === targetZoneLabel || featWard.startsWith(targetZoneLabel))) ||
                    (targetZone && (featZone === targetZone || featWard.startsWith(targetZone)));

                if (!isMatch) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
            }

            if (!isAllBlock) {
                const normFeatWard = normalizeId(featWard);
                const strippedFeatWard = normFeatWard.replace(/^ward/i, '');
                const isMatch = targetWardNos.some(t => {
                    const strippedT = t.replace(/^ward/i, '');
                    return normFeatWard === t || strippedFeatWard === strippedT || normFeatWard === strippedT || strippedFeatWard === t;
                });

                if (!isMatch) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
            }

            if (isUnlinked) {
                if (hasActiveDataFilter) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
                return {
                    fillColor: '#333336',
                    fillOpacity: 0.6,
                    color: '#ffffff',
                    weight: 1,
                    opacity: 0.8,
                    stroke: true,
                    fill: true,
                    interactive: false
                };
            }

            const isApiMatched = !!(featId && apiFilteredPropertyIds?.has(featId));
            const isStrictHidingActive = hasStrictDataFilter &&
                !activeKpi &&
                apiFilteredPropertyIds != null &&
                apiFilteredPropertyIds.size > 0 &&
                !isApiMatched &&
                !hasTargetedFilter &&
                !filterConfig.loadingDashboardData &&
                !filterConfig.isFetchingGridData;
            if (isStrictHidingActive) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };

            if (propertyTypeGroup && propertyTypeGroup !== 'ALL' && !isApiMatched) {
                const featGroup = normalizeOwnerId(String(props.PropertyTypeGroup || props.PropertyType || props.Type || props.PropertyGroup || ''));
                const targetGroup = normalizeOwnerId(propertyTypeGroup);
                let groupMatch = (featGroup === targetGroup);
                if (!groupMatch) {
                    if (targetGroup === 'COMMERCIAL' || targetGroup === 'C') groupMatch = (featGroup === 'C' || featGroup === 'COMMERCIAL');
                    else if (targetGroup === 'RESIDENTIAL' || targetGroup === 'R') groupMatch = (featGroup === 'R' || featGroup === 'RESIDENTIAL');
                    else if (targetGroup === 'INDUSTRIAL' || targetGroup === 'I') groupMatch = (featGroup === 'I' || featGroup === 'INDUSTRIAL');
                    else if (targetGroup === 'GOVERNMENT' || targetGroup === 'N') groupMatch = (featGroup === 'N' || featGroup === 'GOVERNMENT');
                    else if (targetGroup === 'MIXED' || targetGroup === 'RC' || targetGroup === 'MIX') groupMatch = (featGroup === 'RC' || featGroup === 'M' || featGroup === 'RCC' || featGroup === 'MIXED');
                }
                if (!groupMatch) return { stroke: false, fill: false, opacity: 0, interactive: false, fillOpacity: 0 };
            }

            if (hasPropertyTypeIdFilter && !isApiMatched) {
                const tilePropId = Number(props.PropertyTypeID || props.PropertyTypeId || props.nTypeId || 0);
                if (tilePropId !== Number(selectedPropertyTypeId)) return { stroke: false, fill: false, opacity: 0, interactive: false, fillOpacity: 0 };
            }

            if (hasTargetedFilter && !isApiMatched) {
                return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
            }

            let fillColor = '#94A3B8';
            const status = String(props.StatusType || props.statusType || 'BACKGROUND').toUpperCase();
            const oldId = String(props.OldPropertyNo || props.OldPropNo || '');
            const hasOldId = !!(oldId.trim() && oldId.toUpperCase() !== 'NEW' && oldId.toUpperCase() !== 'NULL');

            const tilePropId = Number(props.PropertyTypeID || props.PropertyTypeId || props.nTypeId || 0);
            const isGovernment = status === 'GOVERNMENT' || String(props.PropertyTypeGroup || '').toUpperCase() === 'N';
            const isConstruction = status === 'UNDER_CONSTRUCTION' || tilePropId === 33 || String(props.PropertyDescription || '').trim() === 'चालू बांधकाम';
            const isAssessed = !!props.IsAssessed || status === 'ASSESSED' || hasOldId;
            const isSurvey = !!props.IsSurvey || status === 'SURVEY' || status === 'INTERNAL_SURVEY';
            const isNumbering = !!props.IsNumbering || status === 'GEO_SEQUENCING' || status === 'NUMBERING';
            const isInProcess = status === 'IN_PROCESS';

            if (activeKpi) {
                const k = activeKpi.toUpperCase();
                let kpiMatch = false;
                if (k === 'ASSESSED' && isAssessed && !isConstruction && !isGovernment) kpiMatch = true;
                else if (k.includes('UNASSESSED') && !isAssessed && !isConstruction && !isGovernment) kpiMatch = true;
                else if ((k === 'SURVEY' || k === 'INTERNAL_SURVEY') && isSurvey) kpiMatch = true;
                else if (k === 'GEO_SEQUENCING' && isNumbering && !isConstruction && !isGovernment) kpiMatch = true;
                else if (k === 'UNDER_CONSTRUCTION' && isConstruction) kpiMatch = true;
                else if (k === 'GOVERNMENT' && isGovernment) kpiMatch = true;
                else if (k === 'IN_PROCESS' && isInProcess) kpiMatch = true;

                if (kpiMatch || isApiMatched) {
                    fillColor = getKpiFillColor(k);
                } else {
                    return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
                }
            } else {
                fillColor = getStatusFillColor(status, isConstruction, isGovernment, isAssessed, isSurvey, isNumbering, isInProcess, hasOldId);
            }

            if (heatMapType !== 'none') {
                const demand = Number(props.CORRENT_TA || props.corrent_ta || 0);
                const paid = Number(props.CURRENT_RE || props.current_re || 0);
                fillColor = getHeatmapColor(heatMapType, demand, paid, String(props.PropertyTypeGroup || props.PropertyGroup || ''));
            }

            if (taxStatuses && taxStatuses.length > 0) {
                if (taxStatuses.includes('unpaid')) fillColor = '#EF4444';
                else if (taxStatuses.includes('paid')) fillColor = '#22C55E';
                else if (taxStatuses.includes('partiallypaid')) fillColor = '#F59E0B';
            }

            const isSelected = selId === featId;
            const isSearchSource = filterConfig.selectionSource === 'search';

            return {
                fillColor,
                fillOpacity: isSelected ? 0.95 : (heatMapType !== 'none' ? (heatMapIntensity / 100) * 0.95 : 0.65),
                color: isSelected ? '#1e3a8a' : '#ffffff',
                weight: isSelected ? 4 : 1,
                opacity: isSelected ? 1 : 0.8,
                stroke: true,
                fill: true,
                className: isSelected && isSearchSource ? 'selected-property-blink' : ''
            };
        }

        const cleanLayer = String(layerKey).toLowerCase().replace(/[^a-z0-9]/g, '');
        const isZoneLayer = cleanLayer === 'zone' || cleanLayer === '1' || cleanLayer.includes('zone') || cleanLayer === 'zoneboundarylayer';
        const isWardLayer = cleanLayer === 'ward' || cleanLayer === '2' || cleanLayer === '5' || cleanLayer === '6' || cleanLayer.includes('ward') || cleanLayer === 'wardboundarylayer';
        const isCitySurveyLayer = cleanLayer === 'citysurvey' || cleanLayer === '3' || cleanLayer.includes('survey') || cleanLayer.includes('city');

        if (isZoneLayer) {
            const name = String(props.ZONE || props.ZONE_NO_ || props.Zone || props.Name || props.ZoneName || props.label || '').trim();
            const featZoneId = normalizeId(String(props.ZoneID || props.id || props.ZoneId || props.zone_id || props.OBJECTID || ''));
            const featZoneCode = normalizeId(String(props.ZoneCode || props.zone_code || props.Code || ''));
            const featZoneLetter = name.match(/ZONE\s+([A-D0-9]+)/i)?.[1]?.toLowerCase() || '';
            const normName = normalizeId(name);

            const isMatch =
                (targetZoneNo && (featZoneCode === targetZoneNo || featZoneLetter === targetZoneNo || normName === targetZoneNo || normName.includes(targetZoneNo) || normName.startsWith(targetZoneNo))) ||
                (targetZoneLabel && (normName === targetZoneLabel || normName.includes(targetZoneLabel))) ||
                (targetZone && (featZoneId === targetZone || featZoneCode === targetZone || normName === targetZone));

            if (!isAllZone) {
                if (!isMatch) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
                return {
                    color: '#0284c7',
                    weight: 4.5,
                    opacity: 1,
                    fillOpacity: 0,
                    fillColor: 'transparent',
                    dashArray: 'none',
                    interactive: true
                };
            }

            return {
                color: '#3b82f6',
                weight: 3.5,
                opacity: 0.75,
                fillOpacity: 0,
                fillColor: 'transparent',
                dashArray: '8, 6',
                interactive: true
            };
        }

        if (isWardLayer) {
            const rawWard = String(props.WARD_NO || props.WardNo || props.Ward_No || props.NewWardNo || props.Short_ID || props.ShortID || props.WardName || props.name || '').trim();
            const normWardNo = normalizeId(rawWard);
            const strippedWardNo = normWardNo.replace(/^ward/i, '');
            const wardDbId = normalizeId(String(props.id || props.ID || props.OBJECTID || props.WardID || props.Ward_Id || ''));
            const wardZoneId = normalizeId(String(props.ZoneID || props.Zone_Id || props.Zone || props.ZoneCode || props.NewZoneNo || ''));

            const isSelectedWard = !isAllBlock && targetWardNos.some(t => {
                const strippedT = t.replace(/^ward/i, '');
                return normWardNo === t || strippedWardNo === strippedT || normWardNo === strippedT || strippedWardNo === t || (wardDbId && wardDbId === t);
            });

            if (!isAllBlock) {
                if (!isSelectedWard) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
                return {
                    color: '#f59e0b',
                    weight: 4.5,
                    opacity: 1,
                    fillOpacity: 0,
                    fillColor: 'transparent',
                    interactive: true,
                    stroke: true
                };
            }

            if (!isAllZone) {
                let isWardInSelectedZone = false;
                if (targetZoneNo) {
                    if (wardZoneId && (wardZoneId === targetZoneNo || wardZoneId.includes(targetZoneNo))) {
                        isWardInSelectedZone = true;
                    } else if (normWardNo.startsWith(targetZoneNo) || strippedWardNo.startsWith(targetZoneNo)) {
                        isWardInSelectedZone = true;
                    }
                }
                if (!isWardInSelectedZone && targetZone) {
                    if (wardZoneId && wardZoneId === targetZone) {
                        isWardInSelectedZone = true;
                    } else if (normWardNo.startsWith(targetZone) || strippedWardNo.startsWith(targetZone)) {
                        isWardInSelectedZone = true;
                    }
                }
                if (!isWardInSelectedZone && targetZoneLabel) {
                    if (normWardNo.startsWith(targetZoneLabel) || strippedWardNo.startsWith(targetZoneLabel)) {
                        isWardInSelectedZone = true;
                    }
                }

                if (!isWardInSelectedZone) return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };

                return {
                    color: '#f59e0b',
                    weight: 2.2,
                    opacity: 0.9,
                    fillOpacity: 0,
                    fillColor: 'transparent',
                    interactive: true,
                    stroke: true
                };
            }

            return {
                color: '#ff9900',
                weight: 1.8,
                opacity: 0.7,
                fillOpacity: 0,
                fillColor: 'transparent',
                interactive: true,
                stroke: true
            };
        }

        if (isCitySurveyLayer || layerKey === 'nazulsheet') {
            const { selectedZoneFeature, selectedWardFeature } = memoizedFilterContext;
            const lat = parseFloat(String(props.LAT || props.lat || props.Latitude || ''));
            const lng = parseFloat(String(props.LONG || props.long || props.Longitude || props.Lng || ''));

            if (!isNaN(lat) && !isNaN(lng)) {
                const point: [number, number] = [lng, lat];
                if (selectedWardFeature) {
                    if (!isPointInGeometry(point, selectedWardFeature.geometry)) {
                        return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
                    }
                } else if (selectedZoneFeature) {
                    if (!isPointInGeometry(point, selectedZoneFeature.geometry)) {
                        return { stroke: false, fill: false, opacity: 0, fillOpacity: 0, interactive: false };
                    }
                }
            }

            return {
                color: isCitySurveyLayer ? '#f43f5e' : '#10b981',
                weight: isCitySurveyLayer ? 2 : 2.5,
                opacity: isCitySurveyLayer ? 0.8 : 0.85,
                fillOpacity: isCitySurveyLayer ? 0.02 : 0.03,
                fillColor: isCitySurveyLayer ? '#fda4af' : '#6ee7b7',
                interactive: true,
                stroke: true
            };
        }

        return { color: '#3b82f6', weight: 2 };
    }, [memoizedFilterContext, filterConfig.loadingDashboardData, filterConfig.isFetchingGridData, heatMapType, heatMapIntensity, filterConfig.selectionSource, activeModule]);

    return { getZoneColor, getFeatureStyle };
};
