import { describe, it, expect } from 'vitest';
import {
  createEmpClassMasterSchemas,
  defaultEmpClassMasterSchemas,
} from '@/lib/validations/payroll/empClassMaster.schema';

describe('empClassMaster.schema', () => {
  const { formSchema, classCodeSchema, classNameSchema, classNameMarathiSchema } =
    defaultEmpClassMasterSchemas;

  describe('classCodeSchema', () => {
    it('accepts valid uppercase codes and transforms lowercase', () => {
      expect(classCodeSchema.parse('CLASS-A')).toBe('CLASS-A');
      expect(classCodeSchema.parse('class_b')).toBe('CLASS_B');
    });

    it('rejects empty codes', () => {
      const res = classCodeSchema.safeParse('');
      expect(res.success).toBe(false);
    });

    it('rejects codes shorter than 3 characters', () => {
      const res = classCodeSchema.safeParse('AB');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('rejects codes exceeding 20 chars', () => {
      const res = classCodeSchema.safeParse('A'.repeat(21));
      expect(res.success).toBe(false);
    });

    it('rejects invalid characters', () => {
      const res = classCodeSchema.safeParse('CLASS 1');
      expect(res.success).toBe(false);
    });
  });

  describe('classNameSchema', () => {
    it('accepts valid class names with letters, numbers, and spaces', () => {
      expect(classNameSchema.parse('Class I Group A')).toBe('Class I Group A');
      expect(classNameSchema.parse('Class 1')).toBe('Class 1');
      expect(classNameSchema.parse('Group 4 Cadre')).toBe('Group 4 Cadre');
    });

    it('rejects empty class name', () => {
      const res = classNameSchema.safeParse('');
      expect(res.success).toBe(false);
    });
  });

  describe('classNameMarathiSchema', () => {
    it('accepts valid Marathi class names with Marathi and English numbers', () => {
      expect(classNameMarathiSchema.parse('वर्ग अ')).toBe('वर्ग अ');
      expect(classNameMarathiSchema.parse('वर्ग १')).toBe('वर्ग १');
      expect(classNameMarathiSchema.parse('वर्ग ४ (गट ड)')).toBe('वर्ग ४ (गट ड)');
    });

    it('rejects empty Marathi class name', () => {
      const res = classNameMarathiSchema.safeParse('');
      expect(res.success).toBe(false);
    });
  });

  describe('formSchema', () => {
    it('validates a complete valid form model', () => {
      const res = formSchema.safeParse({
        classCode: 'CLASS-A',
        className: 'Class Group A',
        classNameMarathi: 'वर्ग अ',
        description: 'Standard group classification',
        isActive: true,
      });
      expect(res.success).toBe(true);
    });

    it('customizes messages when translation function is passed', () => {
      const customSchemas = createEmpClassMasterSchemas((k) => `custom_${k}`);
      const res = customSchemas.classCodeSchema.safeParse('');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('custom_codeRequired');
      }
    });
  });
});
