import { describe, it, expect } from 'vitest';
import {
  qualificationMasterFormSchema,
  createQualificationMasterActionSchema,
  updateQualificationMasterActionSchema,
  qualificationMasterQuerySchema,
} from '@/lib/validations/payroll/qualificationMaster.schema';

describe('Qualification Master Zod Validation Schemas', () => {
  const validBaseData = {
    qualificationCode: 'BCOM',
    qualificationName: 'Bachelor of Commerce',
    qualificationNameRegional: 'वाणिज्य पदवी',
    sequenceNo: 1,
    isActive: true,
  };

  describe('qualificationMasterFormSchema', () => {
    it('passes with valid qualification data', () => {
      const result = qualificationMasterFormSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.qualificationCode).toBe('BCOM');
      }
    });

    it('transforms lowercase code to uppercase and allows hyphens/underscores', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationCode: 'bsc-cs',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.qualificationCode).toBe('BSC-CS');
      }
    });

    it('allows qualificationCode with alphanumeric characters, hyphens, and underscores', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationCode: 'TECH_101',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.qualificationCode).toBe('TECH_101');
      }
    });

    it('fails when qualificationCode contains invalid special characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationCode: 'QUAL@123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('qualificationCode');
      }
    });

    it('fails when qualificationCode is empty', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationCode: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('qualificationCode');
      }
    });

    it('fails when qualificationCode exceeds 30 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationCode: 'A'.repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it('fails when qualificationName is empty', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('fails when qualificationName is less than 2 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Qualification name must be at least 2 characters'
        );
      }
    });

    it('passes when qualificationName has minimum 2 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: 'BA',
      });
      expect(result.success).toBe(true);
    });

    it('fails when qualificationName exceeds 100 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('allows valid qualification names with letters, spaces, dots, hyphens, and parentheses', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: 'Secondary School Certificate (SSC) - Ph.D. & M.Sc.',
      });
      expect(result.success).toBe(true);
    });


    it('allows numbers, commas, and plus signs in qualificationName (e.g. 10th, 10+2, 4-Year B.Tech)', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: 'Secondary School Certificate (10th / SSC) 10+2, B.Tech 4-Year',
      });
      expect(result.success).toBe(true);
    });

    it('allows Devanagari and Latin numbers and plus signs in qualificationNameRegional', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationNameRegional: 'सेकंडरी स्कूल सर्टिफिकेट (१० वी / एसएससी) १०+२',
      });
      expect(result.success).toBe(true);
    });

    it('fails when qualificationName contains invalid symbols like @, !, *, |', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationName: 'sdf//**/-*-*+++@!@////+++*/---|',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('qualificationName');
      }
    });

    it('fails when qualificationNameRegional is empty', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationNameRegional: '',
      });
      expect(result.success).toBe(false);
    });

    it('fails when qualificationNameRegional is less than 2 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationNameRegional: 'अ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Qualification name (Regional) must be at least 2 characters'
        );
      }
    });

    it('passes when qualificationNameRegional has minimum 2 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationNameRegional: 'बीए',
      });
      expect(result.success).toBe(true);
    });

    it('fails when qualificationNameRegional exceeds 150 characters', () => {
      const result = qualificationMasterFormSchema.safeParse({
        ...validBaseData,
        qualificationNameRegional: 'अ'.repeat(151),
      });
      expect(result.success).toBe(false);
    });

    it('allows optional sequenceNo', () => {
      const { sequenceNo: _, ...withoutSeq } = validBaseData;
      const result = qualificationMasterFormSchema.safeParse(withoutSeq);
      expect(result.success).toBe(true);
    });

    it('defaults isActive to true when not provided', () => {
      const { isActive: _, ...withoutActive } = validBaseData;
      const result = qualificationMasterFormSchema.safeParse(withoutActive);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe('createQualificationMasterActionSchema', () => {
    it('validates creation payload successfully', () => {
      const result = createQualificationMasterActionSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateQualificationMasterActionSchema', () => {
    it('allows partial payload updates', () => {
      const result = updateQualificationMasterActionSchema.safeParse({
        qualificationName: 'Updated Qualification Name',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it('allows optional id in payload', () => {
      const result = updateQualificationMasterActionSchema.safeParse({
        id: 10,
        qualificationName: 'Master of Arts',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('qualificationMasterQuerySchema', () => {
    it('applies default pagination values when omitted', () => {
      const result = qualificationMasterQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('coerces string numbers for page and pageSize', () => {
      const result = qualificationMasterQuerySchema.safeParse({
        page: '3',
        pageSize: '25',
        q: 'commerce',
        status: 'active',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(25);
        expect(result.data.q).toBe('commerce');
        expect(result.data.status).toBe('active');
      }
    });

    it('rejects invalid status filter value', () => {
      const result = qualificationMasterQuerySchema.safeParse({
        status: 'invalid_status',
      });
      expect(result.success).toBe(false);
    });
  });
});

