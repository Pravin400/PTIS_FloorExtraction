import { StateCreator } from 'zustand';
import type { LayerSlice } from '@/types/asset-gis.types';

export type { LayerSlice };

function getLayerAliases(layer: string | number): string[] {
    const raw = String(layer).trim();
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    const aliases = new Set<string>([raw, clean]);

    if (clean === '1' || clean.includes('zone')) {
        aliases.add('1');
        aliases.add('zone');
        aliases.add('Zone');
        aliases.add('ZONE_BOUNDARY_LAYER');
        aliases.add('zone_boundary_layer');
        aliases.add('zone_boundary');
        aliases.add('zoneboundaries');
    }
    if (clean === '2' || clean === '5' || clean === '6' || clean.includes('ward')) {
        aliases.add('2');
        aliases.add('5');
        aliases.add('6');
        aliases.add('ward');
        aliases.add('Ward');
        aliases.add('WARD_BOUNDARY_LAYER');
        aliases.add('ward_boundary_layer');
        aliases.add('ward_boundary');
        aliases.add('wardboundaries');
    }
    if (clean === '3' || clean.includes('survey') || clean.includes('city')) {
        aliases.add('3');
        aliases.add('citysurvey');
        aliases.add('CitySurvey');
        aliases.add('CITY_SURVEY_BOUNDARY_LAYER');
        aliases.add('city_survey_boundary_layer');
        aliases.add('city_survey');
        aliases.add('citysurveyboundaries');
    }
    if (clean === '4' || clean.includes('nazul') || clean.includes('sheet')) {
        aliases.add('4');
        aliases.add('nazulsheet');
        aliases.add('NazulSheet');
        aliases.add('NAZUL_SHEET_LAYER');
        aliases.add('nazul_sheet_layer');
        aliases.add('nazul_sheet');
        aliases.add('nazulsheetboundaries');
    }
    if (clean.includes('municipal') || clean.includes('boundary')) {
        aliases.add('municipal_boundary');
        aliases.add('MUNICIPAL_BOUNDARY_LAYER');
    }
    return Array.from(aliases);
}

export const createLayerSlice: StateCreator<LayerSlice, [], [], LayerSlice> = (set) => ({
    layerVisibility: {
        '1': true,
        '2': true,
        '3': false,
        '4': false,
        '5': true,
        '6': true,
        zone: true,
        ward: true,
        block: false,
        footprints: true,
        mpms: true,
        citysurvey: false,
        nazulsheet: false,
        municipal_boundary: false,
        ZONE_BOUNDARY_LAYER: true,
        WARD_BOUNDARY_LAYER: true,
        CITY_SURVEY_BOUNDARY_LAYER: false,
        NAZUL_SHEET_LAYER: false
    },
    baseLayer: 'google_satellite',
    performanceMode: true,
    heatMapType: 'none',
    heatMapIntensity: 60,
    geoJsonLayers: {},
    geoJsonLoaded: false,
    loadingGeoJson: false,

    setLayerVisibility: (layer, visible) => set((state) => {
        const aliases = getLayerAliases(layer);
        const nextVisibility = { ...state.layerVisibility };
        for (const k of aliases) {
            nextVisibility[k] = visible;
        }
        nextVisibility[String(layer)] = visible;
        return { layerVisibility: nextVisibility };
    }),

    setBaseLayer: (layer) => set({ baseLayer: layer }),

    setPerformanceMode: (mode) => set({ performanceMode: mode }),

    setHeatMapType: (type) => set({ heatMapType: type }),

    setHeatMapIntensity: (intensity) => set({ heatMapIntensity: intensity }),

    setGeoJsonLayers: (layers) => set({ geoJsonLayers: layers, geoJsonLoaded: true })
});

