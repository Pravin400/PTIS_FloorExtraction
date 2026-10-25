import { describe, it, expect } from 'vitest';
import {
  designationMasterFormSchema,
  createDesignationMasterActionSchema,
  updateDesignationMasterActionSchema,
  designationMasterQuerySchema,
} from '@/lib/validations/payroll/designationMaster.schema';

describe('Designation Master Zod Validation Schemas', () => {
  const validBaseData = {
    designationCode: 'DY_COMM',
    designationName: 'Deputy Commissioner',
    designationNameMarathi: 'उपायुक्त',
    departmentId: 1,
    description: 'Deputy head of administration',
    isActive: true,
  };

  describe('designationMasterFormSchema', () => {
    it('passes with valid designation data', () => {
      const result = designationMasterFormSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.designationCode).toBe('DY_COMM');
      }
    });

    it('transforms lowercase code to uppercase and allows hyphens/underscores', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationCode: 'jr-clerk',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.designationCode).toBe('JR-CLERK');
      }
    });

    it('allows designationCode with alphanumeric characters, hyphens, and underscores', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationCode: 'CLERK123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.designationCode).toBe('CLERK123');
      }
    });

    it('fails when designationCode contains invalid special characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationCode: 'CLERK@123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('designationCode');
      }
    });

    it('fails when designationCode is empty', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationCode: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('designationCode');
      }
    });

    it('fails when designationCode exceeds 20 characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationCode: 'D'.repeat(21),
      });
      expect(result.success).toBe(false);
    });

    it('fails when designationName is empty', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationName: '   ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Designation Name is required.');
      }
    });

    it('fails when designationName is less than 5 characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationName: 'Head',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Designation name must be at least 5 characters'
        );
      }
    });

    it('fails when designationName exceeds 100 characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationName: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('allows valid designation names with letters, spaces, dots, hyphens, slashes, ampersands, and parentheses', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationName: 'Municipal Commissioner / Senior Clerk (Admin.) - Dept. & Div.',
      });
      expect(result.success).toBe(true);
    });

    it('fails when designationName contains numbers', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationName: 'Executive Officer 2026',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('designationName');
      }
    });

    it('fails when designationName contains invalid symbols', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationName: 's!#@!-[jnklghckmhjb',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('designationName');
      }
    });

    it('fails when designationNameMarathi is empty', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Designation Name (Regional) is required.'
        );
      }
    });

    it('fails when designationNameMarathi is less than 5 characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: 'लिप',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Designation name (Regional) must be at least 5 characters'
        );
      }
    });

    it('fails when designationNameMarathi exceeds 100 characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: 'अ'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('allows valid designation regional names with Marathi characters and allowed punctuation', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: 'महानगरपालिका आयुक्त / वरिष्ठ लिपिक (प्रशासन)',
      });
      expect(result.success).toBe(true);
    });

    it('fails when designationNameMarathi contains numbers (Arabic or Devanagari)', () => {
      const resultArabic = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: 'लिपिक 123',
      });
      expect(resultArabic.success).toBe(false);
      if (!resultArabic.success) {
        expect(resultArabic.error.issues[0].path).toContain('designationNameMarathi');
      }

      const resultDevanagari = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: 'लिपिक १२३',
      });
      expect(resultDevanagari.success).toBe(false);
      if (!resultDevanagari.success) {
        expect(resultDevanagari.error.issues[0].path).toContain('designationNameMarathi');
      }
    });

    it('fails when designationNameMarathi contains invalid symbols', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        designationNameMarathi: 'स!#@!-[जनकलघकमहजबी',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('designationNameMarathi');
      }
    });

    it('fails when description exceeds 250 characters', () => {
      const result = designationMasterFormSchema.safeParse({
        ...validBaseData,
        description: 'D'.repeat(251),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('250');
      }
    });

    it('allows null or omitted departmentId', () => {
      const resultNull = designationMasterFormSchema.safeParse({
        ...validBaseData,
        departmentId: null,
      });
      expect(resultNull.success).toBe(true);

      const resultUndefined = designationMasterFormSchema.safeParse({
        ...validBaseData,
        departmentId: undefined,
      });
      expect(resultUndefined.success).toBe(true);
    });
  });

  describe('createDesignationMasterActionSchema', () => {
    it('passes with valid designation data', () => {
      const result = createDesignationMasterActionSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateDesignationMasterActionSchema', () => {
    it('passes with partial fields and numeric id', () => {
      const result = updateDesignationMasterActionSchema.safeParse({
        id: 5,
        designationName: 'Executive Engineer',
      });
      expect(result.success).toBe(true);
    });

    it('passes with string id for UI backward-compatibility', () => {
      const result = updateDesignationMasterActionSchema.safeParse({
        id: 'DESIG-5',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('designationMasterQuerySchema', () => {
    it('applies default pagination values when omitted', () => {
      const result = designationMasterQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('coerces string numbers for page and pageSize', () => {
      const result = designationMasterQuerySchema.safeParse({
        page: '2',
        pageSize: '20',
        q: 'officer',
        status: 'inactive',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.q).toBe('officer');
        expect(result.data.status).toBe('inactive');
      }
    });
  });
});
