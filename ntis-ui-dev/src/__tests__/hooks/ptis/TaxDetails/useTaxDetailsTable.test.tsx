import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaxDetailsTable } from '@/components/modules/property-tax/ptis/TaxDetails/useTaxDetailsTable';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import { TAX_ROW_LABELS } from '@/components/modules/property-tax/ptis/TaxDetails/constants';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      [TAX_ROW_LABELS.NET_TAXES]: 'Net Taxes',
      [TAX_ROW_LABELS.RETAIN]: 'Retain',
      [TAX_ROW_LABELS.HEARING]: 'Hearing',
      [TAX_ROW_LABELS.ALL_TAXES]: 'All Taxes',
      taxes: 'Taxes',
      totalTax: 'Total Tax',
    };
    return translations[key] || key;
  }),
}));

// Mock the column utility to isolate hook logic testing
vi.mock('@/components/modules/property-tax/ptis/TaxDetails/TaxDetailsColumns', () => ({
  getTaxDetailsFloorColumns: vi.fn((_names, t) => [
    {
      key: 'taxes',
      label: t('taxes'),
    },
    {
      key: 'totalTax',
      label: t('totalTax'),
    },
  ]),
}));

describe('useTaxDetailsTable Hook', () => {
  const mockTaxDetailsData: TaxDetailsData = {
    propertyId: 12345,
    policies: [
      {
        policyCode: 'NETTAX',
        taxAmounts: [
          { taxName: 'General Tax', taxAmount: 5000 },
          { taxName: 'Water Tax', taxAmount: 1500 },
        ],
        taxTotal: 6500,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Row Generation', () => {
    it('should return exactly the tax rows corresponding to provided policies', () => {
      const { result } = renderHook(() => useTaxDetailsTable(mockTaxDetailsData));

      expect(result.current.taxRows).toHaveLength(1);
      expect(result.current.taxRows[0].taxes).toBe('NETTAX');
    });

    it('should correctly map policy data to the appropriate row (NETTAX)', () => {
      const { result } = renderHook(() => useTaxDetailsTable(mockTaxDetailsData));
      const netTaxesRow = result.current.taxRows[0];

      expect(netTaxesRow['General Tax']).toBe('5000');
      expect(netTaxesRow['Water Tax']).toBe('1500');
      expect(netTaxesRow.totalTax).toBe('6500');
    });

    it('should handle multiple policies and map them to their respective rows', () => {
      const multiPolicyData: TaxDetailsData = {
        propertyId: 12345,
        policies: [
          {
            policyCode: 'NETTAX',
            taxAmounts: [{ taxName: 'Tax1', taxAmount: 100 }],
            taxTotal: 100,
          },
          {
            policyCode: 'HEARING',
            taxAmounts: [{ taxName: 'Tax1', taxAmount: 200 }],
            taxTotal: 200,
          },
        ],
      };

      const { result } = renderHook(() => useTaxDetailsTable(multiPolicyData));

      expect(result.current.taxRows).toHaveLength(2);
      expect(result.current.taxRows[0].totalTax).toBe('100'); // Row 1: NETTAX
      expect(result.current.taxRows[1].totalTax).toBe('200'); // Row 2: HEARING
    });

    it('should use the API-provided taxTotal directly instead of manual calculation', () => {
      const data: TaxDetailsData = {
        propertyId: 1,
        policies: [
          {
            policyCode: 'NETTAX',
            taxAmounts: [
              { taxName: 'T1', taxAmount: 10.5 },
              { taxName: 'T2', taxAmount: 20.25 },
            ],
            taxTotal: 100, // Should be used directly
          },
        ],
      };

      const { result } = renderHook(() => useTaxDetailsTable(data));
      expect(result.current.taxRows[0].totalTax).toBe('100');
    });

    it('should deduplicate policy codes case-insensitively and handle mixed case', () => {
      const mixedCaseData: TaxDetailsData = {
        propertyId: 12345,
        policies: [
          {
            policyCode: 'NETTAX',
            taxAmounts: [{ taxName: 'Tax1', taxAmount: 100 }],
            taxTotal: 100,
          },
          {
            policyCode: 'Retain',
            taxAmounts: [{ taxName: 'Tax2', taxAmount: 150 }],
            taxTotal: 150,
          },
          {
            policyCode: 'nettax', // duplicate, should be skipped
            taxAmounts: [{ taxName: 'Tax1', taxAmount: 200 }],
            taxTotal: 200,
          },
        ],
      };

      const { result } = renderHook(() => useTaxDetailsTable(mixedCaseData));

      expect(result.current.taxRows).toHaveLength(2);
      expect(result.current.taxRows[0].taxes).toBe('NETTAX');
      expect(result.current.taxRows[0].totalTax).toBe('100');
      expect(result.current.taxRows[1].taxes).toBe('Retain');
      expect(result.current.taxRows[1].totalTax).toBe('150');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty data rows when policies array is empty', () => {
      const emptyData: TaxDetailsData = {
        propertyId: 12345,
        policies: [],
      };
      const { result } = renderHook(() => useTaxDetailsTable(emptyData));

      expect(result.current.taxRows).toHaveLength(0);
    });

    it('should handle undefined initialTaxDetails gracefully', () => {
      const { result } = renderHook(() => useTaxDetailsTable(undefined));

      expect(result.current.taxRows).toHaveLength(0);
      expect(result.current.taxColumns).toBeDefined();
    });

    it('should handle missing or malformed policies data gracefully', () => {
      // Testing with invalid input cast to satisfy types while verifying runtime resilience
      const { result } = renderHook(() => useTaxDetailsTable({} as unknown as TaxDetailsData));

      expect(result.current.taxRows).toHaveLength(0);
      expect(result.current.taxColumns).toBeDefined();
    });
  });

  describe('Column Generation Integration', () => {
    it('should return the columns generated by the utility', () => {
      const { result } = renderHook(() => useTaxDetailsTable(mockTaxDetailsData));

      expect(result.current.taxColumns).toHaveLength(2);
      expect(result.current.taxColumns[0].label).toBe('Taxes');
      expect(result.current.taxColumns[1].label).toBe('Total Tax');
    });
  });
});
