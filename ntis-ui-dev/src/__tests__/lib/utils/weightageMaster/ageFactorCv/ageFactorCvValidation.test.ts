import { describe, it, expect } from 'vitest';
import {
  parseRangeValue,
  getAgeFactorRowUid,
  hasExistingAgeFactor,
  validateFactorValue,
  matchesFilterCriteria,
  checkAgeRangeOverlap,
} from '@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation';
import { AgeFactorCVMaster } from '@/types/ageFactorCv.types';

describe('ageFactorCvValidation', () => {
  describe('parseRangeValue', () => {
    it('should parse valid range string', () => {
      const result = parseRangeValue('0-10');
      expect(result).toEqual({ ageFrom: 0, ageTo: 10 });
    });

    it('should return null for invalid range', () => {
      const result = parseRangeValue('invalid');
      expect(result).toBeNull();
    });

    it('should parse range with larger numbers', () => {
      const result = parseRangeValue('50-100');
      expect(result).toEqual({ ageFrom: 50, ageTo: 100 });
    });
  });

  describe('getAgeFactorRowUid', () => {
    it('should return id as string for existing records', () => {
      const row: AgeFactorCVMaster = {
        id: 123,
        constructionTypeId: 1,
        yearRangeCVId: 2,
        ageFrom: 0,
        ageTo: 5,
        factor: 1.0,
      } as AgeFactorCVMaster;

      expect(getAgeFactorRowUid(row)).toBe('123');
    });

    it('should return composite key for new records', () => {
      const row: AgeFactorCVMaster = {
        id: 0,
        constructionTypeId: 1,
        yearRangeCVId: 2,
        ageFrom: 0,
        ageTo: 5,
        factor: 1.0,
      } as AgeFactorCVMaster;

      expect(getAgeFactorRowUid(row)).toBe('0-1-2-0-5');
    });

    it('should handle yearRangeCVID property', () => {
      const row: AgeFactorCVMaster = {
        id: 0,
        constructionTypeId: 1,
        yearRangeCVID: 3,
        ageFrom: 10,
        ageTo: 15,
        factor: 1.0,
      } as AgeFactorCVMaster;

      expect(getAgeFactorRowUid(row)).toBe('0-1-3-10-15');
    });
  });

  describe('hasExistingAgeFactor', () => {
    const allAgeFactors: AgeFactorCVMaster[] = [
      {
        id: 1,
        constructionTypeId: 1,
        yearRangeCVId: 2,
        ageFrom: 0,
        ageTo: 5,
        factor: 1.0,
      } as AgeFactorCVMaster,
      {
        id: 2,
        constructionTypeId: 1,
        yearRangeCVId: 2,
        ageFrom: 6,
        ageTo: 10,
        factor: 1.0,
      } as AgeFactorCVMaster,
    ];

    it('should return true when exact match exists', () => {
      expect(hasExistingAgeFactor(1, 2, 0, 5, allAgeFactors)).toBe(true);
    });

    it('should return false when no match exists', () => {
      expect(hasExistingAgeFactor(1, 2, 11, 15, allAgeFactors)).toBe(false);
    });

    it('should return false for unsaved records (id = 0)', () => {
      const factors: AgeFactorCVMaster[] = [
        {
          id: 0,
          constructionTypeId: 1,
          yearRangeCVId: 2,
          ageFrom: 0,
          ageTo: 5,
          factor: 1.0,
        } as AgeFactorCVMaster,
      ];

      expect(hasExistingAgeFactor(1, 2, 0, 5, factors)).toBe(false);
    });
  });

  describe('validateFactorValue', () => {
    it('should validate positive numbers', () => {
      const result = validateFactorValue('1.5');
      expect(result).toEqual({ isValid: true, factor: 1.5 });
    });

    it('should reject zero', () => {
      const result = validateFactorValue('0');
      expect(result).toEqual({ isValid: false, factor: 0 });
    });

    it('should reject values below the 0.1 lower bound', () => {
      const result = validateFactorValue('0.05');
      expect(result).toEqual({ isValid: false, factor: 0 });
    });

    it('should validate a value at the 0.1 lower bound', () => {
      const result = validateFactorValue('0.1');
      expect(result).toEqual({ isValid: true, factor: 0.1 });
    });

    it('should reject negative numbers', () => {
      const result = validateFactorValue('-1');
      expect(result).toEqual({ isValid: false, factor: 0 });
    });

    it('should reject invalid strings', () => {
      const result = validateFactorValue('invalid');
      expect(result).toEqual({ isValid: false, factor: 0 });
    });

    it('should validate a value at the upper bound', () => {
      const result = validateFactorValue('100');
      expect(result).toEqual({ isValid: true, factor: 100 });
    });

    it('should reject values above 100', () => {
      const result = validateFactorValue('100.01');
      expect(result).toEqual({ isValid: false, factor: 0 });
    });
  });

  describe('matchesFilterCriteria', () => {
    const row: AgeFactorCVMaster = {
      id: 1,
      constructionTypeId: 1,
      yearRangeCVId: 2,
      ageFrom: 5,
      ageTo: 10,
      factor: 1.0,
    } as AgeFactorCVMaster;

    it('should match when construction type matches', () => {
      const result = matchesFilterCriteria(row, {
        constructionType: '1',
        selectedAgeRange: '',
        ageFrom: '',
        ageTo: '',
        selectedYear: '',
      });
      expect(result).toBe(true);
    });

    it('should not match when construction type differs', () => {
      const result = matchesFilterCriteria(row, {
        constructionType: '2',
        selectedAgeRange: '',
        ageFrom: '',
        ageTo: '',
        selectedYear: '',
      });
      expect(result).toBe(false);
    });

    it('should match exact age range', () => {
      const result = matchesFilterCriteria(row, {
        constructionType: '',
        selectedAgeRange: '5-10',
        ageFrom: '',
        ageTo: '',
        selectedYear: '',
      });
      expect(result).toBe(true);
    });

    it('should match when year matches', () => {
      const result = matchesFilterCriteria(row, {
        constructionType: '',
        selectedAgeRange: '',
        ageFrom: '',
        ageTo: '',
        selectedYear: '2',
      });
      expect(result).toBe(true);
    });
  });

  describe('checkAgeRangeOverlap', () => {
    const existingRanges = ['0-5', '11-15', '20-25'];

    it('should detect complete overlap (new range within existing)', () => {
      const result = checkAgeRangeOverlap(2, 4, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '0-5' });
    });

    it('should detect partial overlap (new range overlaps start)', () => {
      const result = checkAgeRangeOverlap(3, 8, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '0-5' });
    });

    it('should detect partial overlap (new range overlaps end)', () => {
      const result = checkAgeRangeOverlap(13, 18, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '11-15' });
    });

    it('should detect when new range completely contains existing', () => {
      const result = checkAgeRangeOverlap(10, 16, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '11-15' });
    });

    it('should detect exact match as overlap', () => {
      const result = checkAgeRangeOverlap(0, 5, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '0-5' });
    });

    it('should allow range that fits between existing ranges', () => {
      const result = checkAgeRangeOverlap(6, 10, existingRanges);
      expect(result).toEqual({ hasOverlap: false });
    });

    it('should allow range before all existing ranges', () => {
      const result = checkAgeRangeOverlap(-5, -1, ['0-5', '10-15']);
      expect(result).toEqual({ hasOverlap: false });
    });

    it('should allow range after all existing ranges', () => {
      const result = checkAgeRangeOverlap(30, 40, existingRanges);
      expect(result).toEqual({ hasOverlap: false });
    });

    it('should detect overlap with adjacent boundary (touching ranges)', () => {
      const result = checkAgeRangeOverlap(5, 10, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '0-5' });
    });

    it('should allow range just after existing (non-touching)', () => {
      const result = checkAgeRangeOverlap(16, 19, existingRanges);
      expect(result).toEqual({ hasOverlap: false });
    });

    it('should handle empty existing ranges', () => {
      const result = checkAgeRangeOverlap(0, 10, []);
      expect(result).toEqual({ hasOverlap: false });
    });

    it('should detect overlap spanning multiple existing ranges', () => {
      const result = checkAgeRangeOverlap(4, 22, existingRanges);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '0-5' });
    });

    it('should handle invalid range strings gracefully', () => {
      const result = checkAgeRangeOverlap(5, 10, ['0-5', 'invalid', '15-20']);
      expect(result).toEqual({ hasOverlap: true, overlappingRange: '0-5' });
    });
  });
});
