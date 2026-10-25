import { describe, it, expect } from 'vitest';
import {
  validateFloorConstructionYearSequence,
  validateFloorNumberSequence,
  parseFloorSequence,
} from '@/lib/validations/validateFloorSequence';

describe('validateFloorConstructionYearSequence', () => {
  it('correctly parses floor sequences', () => {
    expect(parseFloorSequence({ floor: 'Ground Floor' })).toBe(0);
    expect(parseFloorSequence({ floor: 'G' })).toBe(0);
    expect(parseFloorSequence({ floorDescription: 'तळमजला' })).toBe(0);
    expect(parseFloorSequence({ floorDescription: 'पहिला मजला' })).toBe(1);
    expect(parseFloorSequence({ floorDescription: 'दुसरा मजला' })).toBe(2);
    expect(parseFloorSequence({ floor: '1st Floor' })).toBe(1);
    expect(parseFloorSequence({ floor: '3 - तिसरा मजला' })).toBe(3);
    expect(parseFloorSequence({ floor: 'B1' })).toBe(-1);
    expect(parseFloorSequence({ floorSequenceNo: 5 })).toBe(5);
  });

  it('validates Test Case 1: 2020 -> 2019 -> 2021 (Mismatch on 1st Floor)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2020' },
      { propertyId: '16', floorId: '102', floor: '1st Floor', conYr: '2019' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor', conYr: '2021' },
    ];

    const result = validateFloorConstructionYearSequence(floors);
    expect(result.isValid).toBe(false);
    expect(result.mismatches.length).toBe(1);
    expect(result.mismatches[0].floorId).toBe('102');
    expect(result.mismatches[0].constructionYear).toBe(2019);
    expect(result.mismatches[0].previousConstructionYear).toBe(2020);
    expect(result.invalidFloorIds.has('102')).toBe(true);
  });

  it('validates Test Case 2: 2020 -> 2020 -> 2021 (Valid)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2020' },
      { propertyId: '16', floorId: '102', floor: '1st Floor', conYr: '2020' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor', conYr: '2021' },
    ];

    const result = validateFloorConstructionYearSequence(floors);
    expect(result.isValid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('validates Test Case 3: 2020 -> 2021 -> 2022 (Valid)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2020' },
      { propertyId: '16', floorId: '102', floor: '1st Floor', conYr: '2021' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor', conYr: '2022' },
    ];

    const result = validateFloorConstructionYearSequence(floors);
    expect(result.isValid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('validates Test Case 4: 2020 -> 2021 -> 2020 (Mismatch on 2nd Floor)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2020' },
      { propertyId: '16', floorId: '102', floor: '1st Floor', conYr: '2021' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor', conYr: '2020' },
    ];

    const result = validateFloorConstructionYearSequence(floors);
    expect(result.isValid).toBe(false);
    expect(result.mismatches.length).toBe(1);
    expect(result.mismatches[0].floorId).toBe('103');
    expect(result.mismatches[0].constructionYear).toBe(2020);
    expect(result.mismatches[0].previousConstructionYear).toBe(2021);
  });

  it('validates Test Case 5: 2020 -> 2020 -> 2020 (Valid)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2020' },
      { propertyId: '16', floorId: '102', floor: '1st Floor', conYr: '2020' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor', conYr: '2020' },
    ];

    const result = validateFloorConstructionYearSequence(floors);
    expect(result.isValid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('handles missing/unordered floors by explicit sequence sorting', () => {
    // Input provided in reversed order with missing 1st floor
    const unorderedFloors = [
      { propertyId: '16', floorId: '103', floor: '2nd Floor', conYr: '2018' },
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2020' },
    ];

    const result = validateFloorConstructionYearSequence(unorderedFloors);
    expect(result.isValid).toBe(false);
    expect(result.mismatches[0].floorId).toBe('103');
  });

  it('does NOT compare floors across different Property IDs', () => {
    const multiPropertyFloors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor', conYr: '2025' },
      { propertyId: '17', floorId: '201', floor: '1st Floor', conYr: '2010' },
    ];

    const result = validateFloorConstructionYearSequence(multiPropertyFloors);
    expect(result.isValid).toBe(true);
  });
});

describe('validateFloorNumberSequence', () => {
  it('validates a correct continuous sequence (Ground -> 1st -> 2nd -> 3rd)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor' },
      { propertyId: '16', floorId: '102', floor: '1st Floor' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor' },
      { propertyId: '16', floorId: '104', floor: '3rd Floor' },
    ];

    const result = validateFloorNumberSequence(floors);
    expect(result.isValid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('allows duplicate floor entries (e.g. multiple units on 1st Floor)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor' },
      { propertyId: '16', floorId: '102', floor: '1st Floor' },
      { propertyId: '16', floorId: '103', floor: '1st Floor' },
      { propertyId: '16', floorId: '104', floor: '2nd Floor' },
    ];

    const result = validateFloorNumberSequence(floors);
    expect(result.isValid).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('detects invalid sequence start when Ground Floor is missing', () => {
    const floors = [
      { propertyId: '16', floorId: '102', floor: '1st Floor' },
      { propertyId: '16', floorId: '103', floor: '2nd Floor' },
    ];

    const result = validateFloorNumberSequence(floors);
    expect(result.isValid).toBe(false);
    expect(result.mismatches.some((m) => m.type === 'INVALID_START')).toBe(true);
  });

  it('detects gaps/missing floor numbers (e.g. Ground -> 1st -> 3rd)', () => {
    const floors = [
      { propertyId: '16', floorId: '101', floor: 'Ground Floor' },
      { propertyId: '16', floorId: '102', floor: '1st Floor' },
      { propertyId: '16', floorId: '104', floor: '3rd Floor' },
    ];

    const result = validateFloorNumberSequence(floors);
    expect(result.isValid).toBe(false);
    expect(result.mismatches.some((m) => m.type === 'GAP_MISSING')).toBe(true);
  });
});
