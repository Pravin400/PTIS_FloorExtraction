import { describe, it, expect } from 'vitest';
import empEn from '@/i18n/locales/en/payrollEmployeeClassMaster.json';
import empMr from '@/i18n/locales/mr/payrollEmployeeClassMaster.json';
import empHi from '@/i18n/locales/hi/payrollEmployeeClassMaster.json';
import zoneEn from '@/i18n/locales/en/payrollZoneDivisionMaster.json';
import zoneMr from '@/i18n/locales/mr/payrollZoneDivisionMaster.json';
import zoneHi from '@/i18n/locales/hi/payrollZoneDivisionMaster.json';

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getLeafKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe('Payroll Masters i18n Key Parity', () => {
  describe('Employee Class Master', () => {
    const enKeys = getLeafKeys(empEn);
    const mrKeys = getLeafKeys(empMr);
    const hiKeys = getLeafKeys(empHi);

    it('has identical keys in English and Marathi', () => {
      expect(mrKeys).toEqual(enKeys);
    });

    it('has identical keys in English and Hindi', () => {
      expect(hiKeys).toEqual(enKeys);
    });
  });

  describe('Zone Division Master', () => {
    const enKeys = getLeafKeys(zoneEn);
    const mrKeys = getLeafKeys(zoneMr);
    const hiKeys = getLeafKeys(zoneHi);

    it('has identical keys in English and Marathi', () => {
      expect(mrKeys).toEqual(enKeys);
    });

    it('has identical keys in English and Hindi', () => {
      expect(hiKeys).toEqual(enKeys);
    });
  });
});
