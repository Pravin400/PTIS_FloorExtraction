export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  wardNumber?: number;
  landmark?: string;
  formattedAddress?: string;
  displayName?: string;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  displayName?: string;
}

export const DEFAULT_MUNICIPAL_COORDINATES = {
  latitude: 20.932,
  longitude: 77.7523,
  amravati: {
    lat: 20.932,
    lng: 77.7523,
  },
};

export class GeocodingService {
  async reverseGeocode(lat: number, lng: number, _accuracy?: number): Promise<GeocodingResult> {
    const addr = `Amravati Civic Zone: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    return {
      latitude: lat,
      longitude: lng,
      address: addr,
      formattedAddress: addr,
      displayName: addr,
      wardNumber: 1,
    };
  }

  async searchAddress(_query: string): Promise<SearchSuggestion[]> {
    return [];
  }
}

export const geocodingService = new GeocodingService();
