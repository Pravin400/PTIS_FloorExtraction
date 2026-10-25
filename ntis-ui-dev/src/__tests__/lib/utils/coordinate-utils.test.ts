import { describe, it, expect } from 'vitest';
import {
  latLngToTile,
  parseSingleCoord,
  parseCoordinatePair,
  normalizeCoordinates,
  extractCoordinates,
  getSatelliteTileUrl,
  getEsriWorldImageryTileUrl,
} from '@/lib/utils/coordinate-utils';

describe('coordinate-utils', () => {
  describe('latLngToTile', () => {
    it('correctly calculates slippy map tile coordinates for Jalna (lat: 19.84, lng: 75.88) at zoom 17', () => {
      const tile = latLngToTile(19.84, 75.88, 17);
      expect(tile.z).toBe(17);
      expect(tile.x).toBe(93163);
      expect(tile.y).toBe(58163);
    });

    it('clamps latitude and wraps longitude within boundary limits', () => {
      const tileMax = latLngToTile(95, 200, 10);
      expect(tileMax.z).toBe(10);
      expect(tileMax.x).toBeGreaterThanOrEqual(0);
      expect(tileMax.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('parseSingleCoord', () => {
    it('returns number when finite and non-zero', () => {
      expect(parseSingleCoord(19.2183)).toBe(19.2183);
      expect(parseSingleCoord('19.2183')).toBe(19.2183);
      expect(parseSingleCoord('-72.9781')).toBe(-72.9781);
    });

    it('returns undefined for invalid, zero, or empty values', () => {
      expect(parseSingleCoord(0)).toBeUndefined();
      expect(parseSingleCoord('0')).toBeUndefined();
      expect(parseSingleCoord('')).toBeUndefined();
      expect(parseSingleCoord('-')).toBeUndefined();
      expect(parseSingleCoord('null')).toBeUndefined();
      expect(parseSingleCoord(null)).toBeUndefined();
      expect(parseSingleCoord(undefined)).toBeUndefined();
      expect(parseSingleCoord(NaN)).toBeUndefined();
    });
  });

  describe('parseCoordinatePair', () => {
    it('parses comma-separated coordinate strings', () => {
      const res = parseCoordinatePair('19.218342, 72.978125');
      expect(res).toEqual({ lat: 19.218342, lng: 72.978125 });
    });

    it('parses space-separated coordinate strings', () => {
      const res = parseCoordinatePair('19.218342 72.978125');
      expect(res).toEqual({ lat: 19.218342, lng: 72.978125 });
    });

    it('parses WKT POINT strings with POINT(lng lat)', () => {
      const res = parseCoordinatePair('POINT(72.978125 19.218342)');
      expect(res).toEqual({ lat: 19.218342, lng: 72.978125 });
    });

    it('parses object with lat/lng fields', () => {
      const res = parseCoordinatePair({ latitude: '19.2183', longitude: '72.9781' });
      expect(res).toEqual({ lat: 19.2183, lng: 72.9781 });
    });
  });

  describe('normalizeCoordinates', () => {
    it('corrects swapped coordinates when latitude > 45 and longitude < 45 in Indian bbox', () => {
      const swapped = normalizeCoordinates(72.9781, 19.2183);
      expect(swapped).toEqual({ lat: 19.2183, lng: 72.9781 });
    });

    it('preserves valid coordinates', () => {
      const normal = normalizeCoordinates(19.2183, 72.9781);
      expect(normal).toEqual({ lat: 19.2183, lng: 72.9781 });
    });
  });

  describe('extractCoordinates', () => {
    it('extracts coordinates from first valid source in hierarchy', () => {
      const source1 = { latitude: null, longitude: null };
      const source2 = { gisCoordinates: '19.218342, 72.978125' };
      const source3 = { latitude: 20.0, longitude: 73.0 };

      const result = extractCoordinates([source1, source2, source3]);
      expect(result.hasCoords).toBe(true);
      expect(result.latitude).toBe(19.218342);
      expect(result.longitude).toBe(72.978125);
    });

    it('extracts separate Latitude and Longitude with capitalization variants', () => {
      const source = { Latitude: '19.8400', Longitude: '75.8800' };
      const result = extractCoordinates([source]);
      expect(result.hasCoords).toBe(true);
      expect(result.latitude).toBe(19.84);
      expect(result.longitude).toBe(75.88);
    });

    it('returns hasCoords: false when all sources lack coordinates', () => {
      const result = extractCoordinates([null, {}, { latitude: 0, longitude: 0 }]);
      expect(result.hasCoords).toBe(false);
      expect(result.latitude).toBeUndefined();
      expect(result.longitude).toBeUndefined();
    });
  });

  describe('tile URL builders', () => {
    it('builds ESRI World Imagery URL', () => {
      const url = getEsriWorldImageryTileUrl(93163, 58163, 17);
      expect(url).toBe('https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/17/58163/93163');
    });

    it('builds Wayback Static Tile URL with releaseId', () => {
      const url = getSatelliteTileUrl(19.84, 75.88, 17, 32246);
      expect(url).toBe('https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/32246/17/58163/93163');
    });

    it('falls back to ESRI World Imagery URL when releaseId is omitted', () => {
      const url = getSatelliteTileUrl(19.84, 75.88, 17);
      expect(url).toBe('https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/17/58163/93163');
    });
  });
});
