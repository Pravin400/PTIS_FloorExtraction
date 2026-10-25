import L from 'leaflet';

export type SurveyorMapLayerType = 'default' | 'satellite' | 'terrain';

/**
 * Creates high-performance tile layers for municipal fire audit mapping.
 */
export function createSurveyorTileLayer(layerType: SurveyorMapLayerType): L.TileLayer {
  if (layerType === 'satellite') {
    return L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; Google Maps',
    });
  }

  if (layerType === 'terrain') {
    return L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; Google Maps',
    });
  }

  // Default OpenStreetMap layer - 100% free, public, and requires zero API key
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  });
}
