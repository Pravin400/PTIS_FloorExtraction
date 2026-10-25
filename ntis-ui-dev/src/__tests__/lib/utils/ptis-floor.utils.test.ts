import { describe, it, expect } from 'vitest';
import {
  formatFloorLabel,
  extractAvailableFloors,
  matchesFloor,
  normalizeFloor,
} from '@/lib/utils/ptis-floor.utils';

describe('ptis-floor.utils', () => {
  describe('formatFloorLabel', () => {
    it('returns raw trimmed floor string without localization into MR/HI', () => {
      expect(formatFloorLabel('0', 'en')).toBe('0');
      expect(formatFloorLabel('0', 'mr')).toBe('0');
      expect(formatFloorLabel('0', 'hi')).toBe('0');

      expect(formatFloorLabel('1', 'mr')).toBe('1');
      expect(formatFloorLabel('2', 'hi')).toBe('2');
      expect(formatFloorLabel('3', 'en')).toBe('3');

      expect(formatFloorLabel('Ground Floor', 'mr')).toBe('Ground Floor');
      expect(formatFloorLabel(' 1st Floor ', 'hi')).toBe('1st Floor');
      expect(formatFloorLabel(null as unknown as string)).toBe('');
    });
  });

  describe('extractAvailableFloors', () => {
    it('returns empty array when no floors are present from API data (no hardcoded fallback)', () => {
      const result = extractAvailableFloors([], [], []);
      expect(result).toEqual([]);
    });

    it('extracts unique sorted floors from surveyUnits and previousUnits', () => {
      const surveyUnits = [
        { flr: '2', rawSurvey: { floor: '2' } },
        { flr: '1', rawSurvey: { floor: '1' } },
        { flr: '0', rawSurvey: { floor: '0' } },
      ];
      const previousUnits = [
        { flr: '3', rawSurvey: { floor: '3' } },
        { flr: '1', rawSurvey: { floor: '1' } },
      ];

      const result = extractAvailableFloors(surveyUnits, previousUnits);
      expect(result).toEqual(['0', '1', '2', '3']);
    });

    it('extracts floor from wgFl when flr and rawSurvey.floor are absent', () => {
      const surveyUnits = [
        { wgFl: 'A / Ground' },
        { wgFl: 'A / 1' },
      ];

      const result = extractAvailableFloors(surveyUnits);
      expect(result).toEqual(['Ground', '1']);
    });

    it('extracts floors from active wing floorRange if units have no floors', () => {
      const wings = [
        { wingMasterId: 101, floorRange: '1-3' },
      ];

      const result = extractAvailableFloors([], [], wings, 101);
      expect(result).toEqual(['1', '2', '3']);
    });
  });

  describe('matchesFloor', () => {
    it('matches "all" or empty selection to any floor', () => {
      expect(matchesFloor('1', '')).toBe(true);
      expect(matchesFloor('1', 'all')).toBe(true);
      expect(matchesFloor('1', null)).toBe(true);
    });

    it('matches exact and ground floor variants', () => {
      expect(matchesFloor('0', '0')).toBe(true);
      expect(matchesFloor('Ground', '0')).toBe(true);
      expect(matchesFloor('0', 'Ground')).toBe(true);
      expect(matchesFloor('1', '1')).toBe(true);
      expect(matchesFloor('2', '1')).toBe(false);
    });
  });

  describe('normalizeFloor', () => {
    it('normalizes string and null values', () => {
      expect(normalizeFloor(null)).toBe('');
      expect(normalizeFloor(undefined)).toBe('');
      expect(normalizeFloor(' 2 ')).toBe('2');
      expect(normalizeFloor(3)).toBe('3');
    });
  });
});
