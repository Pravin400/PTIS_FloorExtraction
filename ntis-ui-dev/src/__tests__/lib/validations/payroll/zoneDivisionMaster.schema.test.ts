import { describe, it, expect } from 'vitest';
import {
  zoneDivisionMasterFormSchema,
  createZoneDivisionMasterActionSchema,
  updateZoneDivisionMasterActionSchema,
  zoneDivisionMasterQuerySchema,
  zoneDivisionMasterIdActionSchema,
} from '@/lib/validations/payroll/zoneDivisionMaster.schema';

describe('Zone / Division Master Zod Validation Schemas', () => {
  const validBaseData = {
    zoneDivisionCode: 'DIV-EAST',
    zoneDivisionName: 'East Division Administrative Office',
    zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
    address: 'Near Shivaji Statue, Old Agra Road',
    isActive: true,
  };

  describe('zoneDivisionMasterFormSchema', () => {
    it('passes with valid zone / division office data', () => {
      const result = zoneDivisionMasterFormSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.zoneDivisionCode).toBe('DIV-EAST');
        expect(result.data.zoneDivisionName).toBe('East Division Administrative Office');
      }
    });

    it('transforms lowercase code to uppercase and allows numbers, hyphens, and underscores', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionCode: 'div_east-1',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.zoneDivisionCode).toBe('DIV_EAST-1');
      }
    });

    it('fails when zoneDivisionCode contains special characters outside hyphens/underscores', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionCode: 'DIV@EAST',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('zoneDivisionCode');
      }
    });

    it('fails when zoneDivisionCode is empty', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionCode: '',
      });
      expect(result.success).toBe(false);
    });

    it('fails when zoneDivisionCode is shorter than 3 characters', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionCode: 'ZN',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('fails when zoneDivisionName is empty or only whitespace', () => {
      const resultEmpty = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionName: '',
      });
      expect(resultEmpty.success).toBe(false);

      const resultWhitespace = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionName: '   ',
      });
      expect(resultWhitespace.success).toBe(false);
    });

    it('fails when zoneDivisionName is shorter than 3 characters', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionName: 'AB',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('fails when zoneDivisionName contains invalid special characters', () => {
      const invalidChars = [';', "'", '[', ']', '!', '@', '#', '$', '%', '^', '*', '+', '<', '>'];
      for (const char of invalidChars) {
        const result = zoneDivisionMasterFormSchema.safeParse({
          ...validBaseData,
          zoneDivisionName: `Office Name ${char}`,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('zoneDivisionName');
        }
      }
    });

    it('allows valid punctuation (. - / & ()) in zoneDivisionName', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionName: 'East Div. & Sub-Office (Zone 1) / A',
      });
      expect(result.success).toBe(true);
    });

    it('fails when zoneDivisionNameRegional is empty or only whitespace', () => {
      const resultEmpty = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionNameRegional: '',
      });
      expect(resultEmpty.success).toBe(false);

      const resultWhitespace = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionNameRegional: '   ',
      });
      expect(resultWhitespace.success).toBe(false);
    });

    it('fails when zoneDivisionNameRegional is shorter than 2 characters', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionNameRegional: 'अ',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('fails when zoneDivisionNameRegional contains invalid special characters', () => {
      const invalidChars = [';', "'", '[', ']', '!', '@', '#', '$', '%', '^', '*', '+', '<', '>'];
      for (const char of invalidChars) {
        const result = zoneDivisionMasterFormSchema.safeParse({
          ...validBaseData,
          zoneDivisionNameRegional: `विभाग ${char}`,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain('zoneDivisionNameRegional');
        }
      }
    });

    it('allows valid punctuation (. - / & ()) and Devanagari characters in zoneDivisionNameRegional', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        zoneDivisionNameRegional: 'पूर्व विभाग व उप-कार्यालय (झोन १) / अ',
      });
      expect(result.success).toBe(true);
    });

    it('fails when address is empty or only whitespace', () => {
      const resultEmpty = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        address: '',
      });
      expect(resultEmpty.success).toBe(false);

      const resultWhitespace = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        address: '     ',
      });
      expect(resultWhitespace.success).toBe(false);
    });

    it('fails when address is shorter than 5 characters', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        address: 'Road',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 5 characters');
      }
    });

    it('fails when address exceeds maximum length of 250', () => {
      const result = zoneDivisionMasterFormSchema.safeParse({
        ...validBaseData,
        address: 'a'.repeat(251),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createZoneDivisionMasterActionSchema', () => {
    it('passes with valid zone division payload', () => {
      const result = createZoneDivisionMasterActionSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateZoneDivisionMasterActionSchema', () => {
    it('passes with partial fields', () => {
      const result = updateZoneDivisionMasterActionSchema.safeParse({
        zoneDivisionName: 'Updated Division Office',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('zoneDivisionMasterIdActionSchema', () => {
    it('validates string or numeric id', () => {
      expect(zoneDivisionMasterIdActionSchema.safeParse({ id: '1' }).success).toBe(true);
      expect(zoneDivisionMasterIdActionSchema.safeParse({ id: 1 }).success).toBe(true);
      expect(zoneDivisionMasterIdActionSchema.safeParse({ id: '' }).success).toBe(false);
    });
  });

  describe('zoneDivisionMasterQuerySchema', () => {
    it('applies default pagination values when omitted', () => {
      const result = zoneDivisionMasterQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('coerces string numbers for page and pageSize', () => {
      const result = zoneDivisionMasterQuerySchema.safeParse({
        page: '2',
        pageSize: '25',
        q: 'east',
        status: 'active',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(25);
        expect(result.data.q).toBe('east');
        expect(result.data.status).toBe('active');
      }
    });

    it('rejects invalid status filter value', () => {
      const result = zoneDivisionMasterQuerySchema.safeParse({
        status: 'unknown_status',
      });
      expect(result.success).toBe(false);
    });
  });
});
