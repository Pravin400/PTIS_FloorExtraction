import { describe, it, expect } from 'vitest';
import { propertySearchSchema } from '@/lib/validations/ptis.schema';

describe('propertySearchSchema', () => {
  const baseValidData = {
    wardNo: 'KLMAJOR2',
    propertyNo: '7',
    partitionNo: '0',
    wardId: 1,
    propertyId: '100',
  };

  describe('wardNo validation', () => {
    it('should pass with valid alphanumeric ward numbers up to 15 characters', () => {
      const validWardNos = ['KLMAJOR2', '123456789012345', 'A', '1'];
      validWardNos.forEach((wardNo) => {
        const result = propertySearchSchema.safeParse({ ...baseValidData, wardNo });
        expect(result.success).toBe(true);
      });
    });

    it('should fail if ward number exceeds 15 characters', () => {
      const result = propertySearchSchema.safeParse({
        ...baseValidData,
        wardNo: 'A'.repeat(16),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 15 characters');
      }
    });

    it('should fail if ward number contains spaces or symbols', () => {
      const invalidWardNos = ['KL MAJOR', 'KL-MAJOR', 'KL@123', 'KL_1'];
      invalidWardNos.forEach((wardNo) => {
        const result = propertySearchSchema.safeParse({ ...baseValidData, wardNo });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('only letters and numbers');
        }
      });
    });

    it('should fail if ward number is empty', () => {
      const result = propertySearchSchema.safeParse({
        ...baseValidData,
        wardNo: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('propertyNo validation', () => {
    it('should pass with valid alphanumeric and hyphen property numbers up to 10 characters', () => {
      const validPropertyNos = ['7', 'ABC1234567', 'A', '1234567890', '7-A', 'PROP-002'];
      validPropertyNos.forEach((propertyNo) => {
        const result = propertySearchSchema.safeParse({ ...baseValidData, propertyNo });
        expect(result.success).toBe(true);
      });
    });

    it('should fail if property number exceeds 10 characters', () => {
      const result = propertySearchSchema.safeParse({
        ...baseValidData,
        propertyNo: '1'.repeat(11),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 10 characters');
      }
    });

    it('should fail if property number contains spaces or invalid symbols', () => {
      const invalidPropertyNos = ['7A ', '7@B', '7_A'];
      invalidPropertyNos.forEach((propertyNo) => {
        const result = propertySearchSchema.safeParse({ ...baseValidData, propertyNo });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('only letters and numbers');
        }
      });
    });

    it('should fail if property number is empty', () => {
      const result = propertySearchSchema.safeParse({
        ...baseValidData,
        propertyNo: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('partitionNo validation', () => {
    it('should pass with valid alphanumeric and hyphen partition numbers up to 10 characters', () => {
      const validPartitionNos = ['0', 'ABC1234567', 'A', '1234567890', '', '1-A', 'B-1'];
      validPartitionNos.forEach((partitionNo) => {
        const result = propertySearchSchema.safeParse({ ...baseValidData, partitionNo });
        expect(result.success).toBe(true);
      });
    });

    it('should pass if partition number is undefined', () => {
      const { partitionNo: _, ...rest } = baseValidData;
      const result = propertySearchSchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it('should fail if partition number exceeds 10 characters', () => {
      const result = propertySearchSchema.safeParse({
        ...baseValidData,
        partitionNo: '1'.repeat(11),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 10 characters');
      }
    });

    it('should fail if partition number contains spaces or invalid symbols', () => {
      const invalidPartitionNos = ['1A ', '1@B', '1_A'];
      invalidPartitionNos.forEach((partitionNo) => {
        const result = propertySearchSchema.safeParse({ ...baseValidData, partitionNo });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('only letters and numbers');
        }
      });
    });
  });
});
