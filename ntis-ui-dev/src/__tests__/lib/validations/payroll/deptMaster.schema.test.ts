import { describe, it, expect } from 'vitest';
import {
  deptMasterFormSchema,
  createDeptMasterActionSchema,
  updateDeptMasterActionSchema,
  deptMasterQuerySchema,
} from '@/lib/validations/payroll/deptMaster.schema';

describe('Department Master Zod Validation Schemas', () => {
  const validBaseData = {
    departmentCode: 'GEN_ADMIN',
    departmentName: 'General Administration',
    departmentNameMarathi: 'सामान्य प्रशासन',
    description: 'Administration of municipal operations',
    isActive: true,
  };

  describe('deptMasterFormSchema', () => {
    it('passes with valid department data', () => {
      const result = deptMasterFormSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.departmentCode).toBe('GEN_ADMIN');
      }
    });

    it('transforms lowercase code to uppercase and allows hyphens/underscores', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentCode: 'dept-edu',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.departmentCode).toBe('DEPT-EDU');
      }
    });

    it('allows departmentCode with alphanumeric characters, hyphens, and underscores', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentCode: 'DEPT123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.departmentCode).toBe('DEPT123');
      }
    });

    it('fails when departmentCode contains invalid special characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentCode: 'DEPT@123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('departmentCode');
      }
    });

    it('fails when departmentCode is empty', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentCode: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('departmentCode');
      }
    });

    it('fails when departmentCode exceeds 20 characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentCode: 'A'.repeat(21),
      });
      expect(result.success).toBe(false);
    });

    it('fails when departmentName is empty', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentName: '   ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Department Name is required.');
      }
    });

    it('fails when departmentName is less than 5 characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentName: 'Dept',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Department name must be at least 5 characters'
        );
      }
    });

    it('fails when departmentName exceeds 100 characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentName: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('allows valid department names with letters, spaces, dots, hyphens, slashes, ampersands, and parentheses', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentName: 'Health & Family Welfare (H&FW) - Dept. / Div.',
      });
      expect(result.success).toBe(true);
    });

    it('fails when departmentName contains numbers', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentName: 'Education 2026',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('departmentName');
      }
    });

    it('fails when departmentName contains invalid symbols', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentName: 'ds sd -_-=-======-*/|-/*-/+```!@#$$%%^^(l^(&)*_+_( )++',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('departmentName');
      }
    });

    it('fails when departmentNameMarathi is empty', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Department Name (Regional) is required.'
        );
      }
    });

    it('fails when departmentNameMarathi is less than 5 characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: 'विभा',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Department name (Regional) must be at least 5 characters'
        );
      }
    });

    it('fails when departmentNameMarathi exceeds 100 characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: 'अ'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('allows valid department regional names with Marathi characters and allowed punctuation', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: 'आरोग्य आणि कुटुंब कल्याण (H&FW) - विभाग / शाखा',
      });
      expect(result.success).toBe(true);
    });

    it('fails when departmentNameMarathi contains numbers (Arabic or Devanagari)', () => {
      const resultArabic = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: 'शिक्षण 123',
      });
      expect(resultArabic.success).toBe(false);
      if (!resultArabic.success) {
        expect(resultArabic.error.issues[0].path).toContain('departmentNameMarathi');
      }

      const resultDevanagari = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: 'शिक्षण १२३',
      });
      expect(resultDevanagari.success).toBe(false);
      if (!resultDevanagari.success) {
        expect(resultDevanagari.error.issues[0].path).toContain('departmentNameMarathi');
      }
    });

    it('fails when departmentNameMarathi contains invalid symbols', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        departmentNameMarathi: 'डास सद -_-=-======-*/|-/*-/+```!@#$$%%^^(इ^(&)*_+_( )++',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('departmentNameMarathi');
      }
    });

    it('fails when description exceeds 250 characters', () => {
      const result = deptMasterFormSchema.safeParse({
        ...validBaseData,
        description: 'D'.repeat(251),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('250');
      }
    });

    it('allows empty or omitted description', () => {
      const resultEmpty = deptMasterFormSchema.safeParse({
        ...validBaseData,
        description: '',
      });
      expect(resultEmpty.success).toBe(true);

      const resultOmitted = deptMasterFormSchema.safeParse({
        ...validBaseData,
        description: undefined,
      });
      expect(resultOmitted.success).toBe(true);
    });
  });

  describe('createDeptMasterActionSchema', () => {
    it('passes with valid department data', () => {
      const result = createDeptMasterActionSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateDeptMasterActionSchema', () => {
    it('passes with partial fields and numeric id', () => {
      const result = updateDeptMasterActionSchema.safeParse({
        id: 10,
        departmentName: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('passes with string id for UI backward-compatibility', () => {
      const result = updateDeptMasterActionSchema.safeParse({
        id: 'DEPT-10',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deptMasterQuerySchema', () => {
    it('applies default pagination values when omitted', () => {
      const result = deptMasterQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('coerces string numbers for page and pageSize', () => {
      const result = deptMasterQuerySchema.safeParse({
        page: '3',
        pageSize: '25',
        q: 'admin',
        status: 'active',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(25);
        expect(result.data.q).toBe('admin');
        expect(result.data.status).toBe('active');
      }
    });

    it('rejects invalid status filter value', () => {
      const result = deptMasterQuerySchema.safeParse({
        status: 'invalid_status',
      });
      expect(result.success).toBe(false);
    });
  });
});
