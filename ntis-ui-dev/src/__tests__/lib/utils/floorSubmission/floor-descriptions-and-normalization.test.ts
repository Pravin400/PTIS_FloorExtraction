import { describe, it, expect } from 'vitest';
import {
  formatCodeAndDescription,
  getFloorDescription,
  getSubFloorDescription,
  getConstructionDescription,
  getUseDescription,
} from '@/lib/utils/floorSubmission/floor-descriptions';
import { normalizeFloorData } from '@/lib/utils/floorSubmission/floor-normalization';
import { LookupData } from '@/types/common-details.types';

describe('formatCodeAndDescription', () => {
  it('combines code and description when both are provided', () => {
    expect(formatCodeAndDescription('G', 'तळमजला')).toBe('G - तळमजला');
    expect(formatCodeAndDescription('A', 'सिमेंट कॉक्रिट संरचनाA')).toBe('A - सिमेंट कॉक्रिट संरचनाA');
    expect(formatCodeAndDescription('OP', 'Open Plot')).toBe('OP - Open Plot');
  });

  it('avoids duplicate prefixing when description already starts with code', () => {
    expect(formatCodeAndDescription('G', 'G - तळमजला')).toBe('G - तळमजला');
    expect(formatCodeAndDescription('WR', 'WR-व्हरांडा निवासी')).toBe('WR-व्हरांडा निवासी');
    expect(formatCodeAndDescription('OP', 'OP - खुला भूखंड')).toBe('OP - खुला भूखंड');
  });

  it('handles code only or description only', () => {
    expect(formatCodeAndDescription('B1', '')).toBe('B1');
    expect(formatCodeAndDescription('', 'तळमजला')).toBe('तळमजला');
    expect(formatCodeAndDescription(undefined, 'तळमजला')).toBe('तळमजला');
    expect(formatCodeAndDescription(undefined, undefined)).toBe('');
  });
});

describe('Lookup description getters with code formatting', () => {
  const floorLookup: LookupData[] = [
    { floorId: 67, floorCode: 'G', description: 'तळमजला' },
    { floorId: 77, floorCode: 'OP', description: 'Open Plot' },
  ];

  const subFloorLookup: LookupData[] = [
    { subFloorId: 10, subFloorCode: 'B1', description: 'Basement 1' },
  ];

  const constructionLookup: LookupData[] = [
    { constructionTypeId: 1, constructionCode: 'A', description: 'सिमेंट कॉक्रिट संरचनाA' },
  ];

  const useLookup: LookupData[] = [
    { typeOfUseId: 7, typeOfUseCode: 'WR', description: 'WR-व्हरांडा निवासी' },
    { typeOfUseId: 15115, typeOfUseCode: 'OP', description: 'खुला भूखंड' },
  ];

  it('getFloorDescription returns code and description', () => {
    expect(getFloorDescription(67, floorLookup)).toBe('G - तळमजला');
    expect(getFloorDescription(77, floorLookup)).toBe('OP - Open Plot');
  });

  it('getSubFloorDescription returns subFloorCode and description', () => {
    expect(getSubFloorDescription(10, subFloorLookup)).toBe('B1 - Basement 1');
  });

  it('getConstructionDescription returns constructionCode and description', () => {
    expect(getConstructionDescription(1, constructionLookup)).toBe('A - सिमेंट कॉक्रिट संरचनाA');
  });

  it('getUseDescription returns typeOfUseCode and description', () => {
    expect(getUseDescription(7, useLookup)).toBe('WR-व्हरांडा निवासी');
    expect(getUseDescription(15115, useLookup)).toBe('OP - खुला भूखंड');
  });
});

describe('normalizeFloorData with codes and subFloorCode mapping', () => {
  const rawApiItems = [
    {
      propertyId: 1488616,
      floorId: 77,
      floorCode: 'OP',
      floorDescription: 'Open Plot',
      subFloorId: null,
      subFloorCode: null,
      subFloorDescription: null,
      constructionYear: '2026',
      assessmentYear: '2026',
      constructionTypeId: 11,
      constructionCode: 'op',
      constructionTypeDescription: 'open plot',
      typeOfUseId: 15115,
      typeOfUseCode: 'OP',
      typeOfUseDescription: 'खुला भूखंड',
      carpetAreaSqFeet: 1076.4,
      carpetAreaSqMeter: 100,
      builtupAreaSqMeter: 100,
      builtupAreaSqFeet: 1076.4,
      noOfRooms: 0,
      isRenter: false,
      isTaxable: true,
      isOpenPlot: true,
      id: 3106611,
    },
    {
      propertyId: 1488616,
      floorId: 67,
      floorCode: 'G',
      floorDescription: 'तळमजला',
      subFloorId: null,
      subFloorCode: null,
      subFloorDescription: null,
      constructionYear: '2026',
      assessmentYear: '2026',
      constructionTypeId: 1,
      constructionCode: 'A',
      constructionTypeDescription: 'सिमेंट कॉक्रिट संरचनाA',
      typeOfUseId: 7,
      typeOfUseCode: 'WR',
      typeOfUseDescription: 'WR-व्हरांडा निवासी',
      carpetAreaSqFeet: 215.28,
      carpetAreaSqMeter: 20,
      builtupAreaSqMeter: 24,
      builtupAreaSqFeet: 258.34,
      noOfRooms: 0,
      isRenter: false,
      isTaxable: true,
      isOpenPlot: false,
      id: 3106612,
    },
  ];

  it('maps floorCode, constructionCode, typeOfUseCode, and subFloorCode correctly', () => {
    const item0 = normalizeFloorData(rawApiItems[0] as Record<string, unknown>, {});
    expect(item0.floorCode).toBe('OP');
    expect(item0.floor).toBe('OP - Open Plot');
    expect(item0.constructionCode).toBe('op');
    expect(item0.conTyp).toBe('op - open plot');
    expect(item0.typeOfUseCode).toBe('OP');
    expect(item0.use).toBe('OP - खुला भूखंड');
    expect(item0.subFloorCode).toBe('');

    const item1 = normalizeFloorData(rawApiItems[1] as Record<string, unknown>, {});
    expect(item1.floorCode).toBe('G');
    expect(item1.floor).toBe('G - तळमजला');
    expect(item1.constructionCode).toBe('A');
    expect(item1.conTyp).toBe('A - सिमेंट कॉक्रिट संरचनाA');
    expect(item1.typeOfUseCode).toBe('WR');
    expect(item1.use).toBe('WR-व्हरांडा निवासी');
    expect(item1.subFloorCode).toBe('');
  });

  it('maps subFloorCode when provided in raw API data', () => {
    const rawWithSubFloor = {
      ...rawApiItems[1],
      subFloorId: 101,
      subFloorCode: 'B1',
      subFloorDescription: 'बेसमेंट १',
    };

    const normalized = normalizeFloorData(rawWithSubFloor as Record<string, unknown>, {});
    expect(normalized.subFloorCode).toBe('B1');
    expect(normalized.subFloor).toBe('B1 - बेसमेंट १');
  });
});
