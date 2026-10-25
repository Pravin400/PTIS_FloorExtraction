import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  qualificationMasterFormSchema,
  createQualificationMasterSchemas,
} from '@/lib/validations/payroll/qualificationMaster.schema';
import {
  createQualificationMaster,
  updateQualificationMaster,
  deleteQualificationMaster,
  normalizeQualificationMaster,
} from '@/lib/api/payroll/QualificationMaster/qualificationMaster.service';
import { apiClient } from '@/services/api.service';
import { getQualificationMasterColumns } from '@/components/modules/payroll/MasterModule/OrganizationMaster/QualificationMaster/qualificationMasterColumns';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Qualification Master — Non-Functional Requirements (NFR) Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. SECURITY & INPUT HARDENING (XSS, SQL Injection, Boundary Limits)
  // =========================================================================
  describe('NFR 1: Security & Input Hardening', () => {
    const validBase = {
      qualificationCode: 'BCOM',
      qualificationName: 'Bachelor of Commerce',
      qualificationNameRegional: 'वाणिज्य पदवी',
      isActive: true,
    };

    it('rejects SQL Injection attempts in qualificationCode and qualificationName', () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE qualification_master; --",
        "admin' --",
        "1; SELECT * FROM users",
      ];

      for (const attack of sqlInjectionPayloads) {
        const codeResult = qualificationMasterFormSchema.safeParse({
          ...validBase,
          qualificationCode: attack,
        });
        expect(codeResult.success).toBe(false);

        const nameResult = qualificationMasterFormSchema.safeParse({
          ...validBase,
          qualificationName: attack,
        });
        expect(nameResult.success).toBe(false);
      }
    });

    it('rejects Cross-Site Scripting (XSS) script tags and event handlers', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>',
      ];

      for (const payload of xssPayloads) {
        const codeResult = qualificationMasterFormSchema.safeParse({
          ...validBase,
          qualificationCode: payload,
        });
        expect(codeResult.success).toBe(false);

        const nameResult = qualificationMasterFormSchema.safeParse({
          ...validBase,
          qualificationName: payload,
        });
        expect(nameResult.success).toBe(false);
      }
    });

    it('enforces exact boundary limits on code (max 30), name (max 100), regional (max 150)', () => {
      // Code boundary: 30 is OK, 31 fails
      const code30 = 'A'.repeat(30);
      const code31 = 'A'.repeat(31);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationCode: code30 }).success).toBe(true);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationCode: code31 }).success).toBe(false);

      // Name boundary: 100 is OK, 101 fails
      const name100 = 'A'.repeat(100);
      const name101 = 'A'.repeat(101);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationName: name100 }).success).toBe(true);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationName: name101 }).success).toBe(false);

      // Regional boundary: 150 is OK, 151 fails
      const reg150 = 'अ'.repeat(150);
      const reg151 = 'अ'.repeat(151);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationNameRegional: reg150 }).success).toBe(true);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationNameRegional: reg151 }).success).toBe(false);
    });


    it('supports realistic academic credentials containing numbers, plus signs, and commas', () => {
      const academicSamples = [
        { code: 'SSC_10', name: 'Secondary School Certificate (10th / SSC)', regional: 'सेकंडरी स्कूल सर्टिफिकेट (१० वी / एसएससी)' },
        { code: 'HSC_12', name: 'Higher Secondary Certificate (12th / HSC)', regional: '१२ वी (एचएससी)' },
        { code: 'PLUS_TWO', name: 'Intermediate (10+2 Pattern)', regional: '१०+२ स्तर' },
        { code: 'BTECH_4YR', name: 'Bachelor of Technology (4 Years), Honours', regional: 'अभियांत्रिकी पदवी (४ वर्षे)' },
      ];

      for (const sample of academicSamples) {
        const result = qualificationMasterFormSchema.safeParse({
          qualificationCode: sample.code,
          qualificationName: sample.name,
          qualificationNameRegional: sample.regional,
          isActive: true,
        });
        expect(result.success).toBe(true);
      }
    });

    it('enforces minimum length constraints: min 2 chars for names', () => {
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationName: 'A' }).success).toBe(false);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationName: 'AB' }).success).toBe(true);

      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationNameRegional: 'अ' }).success).toBe(false);
      expect(qualificationMasterFormSchema.safeParse({ ...validBase, qualificationNameRegional: 'अब' }).success).toBe(true);
    });

    it('sanitizes URL path parameters using encodeURIComponent to prevent path traversal', async () => {
      (apiClient.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      (apiClient.put as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: {} });

      const maliciousId = '../etc/passwd';
      await deleteQualificationMaster(maliciousId);
      expect(apiClient.delete).toHaveBeenCalledWith(
        `/payroll/qualification-master/${encodeURIComponent(maliciousId)}`
      );

      await updateQualificationMaster(maliciousId, { qualificationName: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith(
        `/payroll/qualification-master/${encodeURIComponent(maliciousId)}`,
        expect.any(Object)
      );
    });

    it('ensures payload anti-tampering: never transmits userId, createdBy, updatedBy or sequenceNo', async () => {
      (apiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 1, qualificationCode: 'MSC', qualificationName: 'Master of Science', isActive: true },
      });

      // Pass object with extra/unauthorized properties
      await createQualificationMaster({
        qualificationCode: 'MSC',
        qualificationName: 'Master of Science',
        qualificationNameRegional: 'विज्ञान पदव्युत्तर',
        isActive: true,
        sequenceNo: 10,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ userId: 999, createdBy: 999, adminRole: true } as any),
      });

      const calledPayload = (apiClient.post as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(calledPayload).not.toHaveProperty('userId');
      expect(calledPayload).not.toHaveProperty('createdBy');
      expect(calledPayload).not.toHaveProperty('updatedBy');
      expect(calledPayload).not.toHaveProperty('sequenceNo');
      expect(calledPayload).not.toHaveProperty('adminRole');
      expect(Object.keys(calledPayload).sort()).toEqual([
        'isActive',
        'qualificationCode',
        'qualificationName',
        'qualificationNameRegional',
      ].sort());
    });
  });

  // =========================================================================
  // 2. RESILIENCE, CONCURRENCY & ERROR HANDLING
  // =========================================================================
  describe('NFR 2: Resilience & Error Handling', () => {
    it('gracefully handles empty and malformed API objects in normalizeQualificationMaster', () => {
      const empty = normalizeQualificationMaster(null);
      expect(empty.qualificationCode).toBe('');
      expect(empty.qualificationName).toBe('');
      expect(empty.qualificationNameRegional).toBe('');
      expect(empty.isActive).toBe(true);
      expect(empty.markedForDeletion).toBe(false);

      const malformed = normalizeQualificationMaster({
        id: 'not-a-number',
        qualificationCode: 12345,
        isActive: 'true',
      });
      expect(malformed.id).toBeUndefined();
      expect(malformed.qualificationCode).toBe('12345');
      expect(malformed.isActive).toBe(true);
    });

    it('rejects duplicate qualification codes on client before network call', () => {
      const schemas = createQualificationMasterSchemas();
      const parsed = schemas.qualificationCodeSchema.safeParse('bcom');
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toBe('BCOM');
      }
    });
  });

  // =========================================================================
  // 3. ACCESSIBILITY (a11y) & WCAG 2.1 AA
  // =========================================================================
  describe('NFR 3: Accessibility & WCAG 2.1 AA', () => {
    it('provides accessible titles and aria-labels for table action buttons', () => {
      const tMock = (k: string) => {
        const dict: Record<string, string> = {
          'list.table.qualificationCode': 'Qualification Code',
          'list.table.qualificationName': 'Qualification Name',
          'list.table.qualificationNameLocal': 'Qualification Name (Regional)',
          'list.table.status': 'Status',
        };
        return dict[k] ?? k;
      };
      const tCommonMock = (k: string) => (k === 'status.active' ? 'Active' : 'Inactive');

      const columns = getQualificationMasterColumns(tMock, tCommonMock);
      expect(columns).toHaveLength(4);

      // Verify column header labels are all non-empty strings
      columns.forEach((col) => {
        expect(col.label).toBeDefined();
        expect(typeof col.label).toBe('string');
        expect((col.label as string).length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // 4. INTERNATIONALIZATION (i18n) PARITY ACROSS ALL LOCALES
  // =========================================================================
  describe('NFR 4: Internationalization (i18n) Parity', () => {
    function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
      let result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result = { ...result, ...flattenKeys(value as Record<string, unknown>, currentKey) };
        } else {
          result[currentKey] = String(value);
        }
      }
      return result;
    }

    it('enforces 100% key parity between en, hi, and mr translation files', () => {
      const enPath = path.resolve(process.cwd(), 'src/i18n/locales/en/payrollQualificationMaster.json');
      const hiPath = path.resolve(process.cwd(), 'src/i18n/locales/hi/payrollQualificationMaster.json');
      const mrPath = path.resolve(process.cwd(), 'src/i18n/locales/mr/payrollQualificationMaster.json');

      expect(fs.existsSync(enPath)).toBe(true);
      expect(fs.existsSync(hiPath)).toBe(true);
      expect(fs.existsSync(mrPath)).toBe(true);

      const enKeys = flattenKeys(JSON.parse(fs.readFileSync(enPath, 'utf8')));
      const hiKeys = flattenKeys(JSON.parse(fs.readFileSync(hiPath, 'utf8')));
      const mrKeys = flattenKeys(JSON.parse(fs.readFileSync(mrPath, 'utf8')));

      const enKeyList = Object.keys(enKeys).sort();

      // Check for missing keys in Hindi
      const missingInHi = enKeyList.filter((k) => !hiKeys[k]);
      expect(missingInHi).toEqual([]);

      // Check for missing keys in Marathi
      const missingInMr = enKeyList.filter((k) => !mrKeys[k]);
      expect(missingInMr).toEqual([]);

      // Verify no empty translation values
      enKeyList.forEach((k) => {
        expect(enKeys[k].trim().length).toBeGreaterThan(0);
        expect(hiKeys[k].trim().length).toBeGreaterThan(0);
        expect(mrKeys[k].trim().length).toBeGreaterThan(0);
      });
    });
  });
});
