import { describe, it, expect } from 'vitest';
import { getTaxZoningColumns, getPreviewColumns } from '@/components/modules/property-tax/taxzoningmaster/TaxZoningColumns';

const t = (key: string) => key;
const tCommon = (key: string) => key;

describe('getTaxZoningColumns', () => {
  it('should return 4 columns with correct keys', () => {
    const cols = getTaxZoningColumns(t, tCommon);
    expect(cols).toHaveLength(4);
    expect(cols.map(c => c.key)).toEqual(['wardNo', 'fromProperty', 'toProperty', 'taxZoneNo']);
  });

  it('should use translated labels', () => {
    const cols = getTaxZoningColumns(t, tCommon);
    expect(cols[0].label).toBe('columns.wardNo');
    expect(cols[3].label).toBe('columns.taxZoneNo');
  });
});

describe('getPreviewColumns', () => {
  it('should return 4 columns with correct keys', () => {
    const cols = getPreviewColumns(t);
    expect(cols).toHaveLength(4);
    expect(cols.map(c => c.key)).toEqual(['oldTaxZoneNo', 'taxZoneNo', 'wardNo', 'propertyNo']);
  });

  it('should include headerClassName for styling', () => {
    const cols = getPreviewColumns(t);
    cols.forEach(col => {
      expect(col.headerClassName).toBe('p-2 text-[12px]');
    });
  });
});
