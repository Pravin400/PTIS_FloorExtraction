import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  getTabTranslationKey,
  getSubTabLabel,
  formatCurrency,
  createTaxMap,
  getHeaderGradientClass,
  getRowClassName,
  useTaxColumns,
  useTaxTableData,
  useHasData,
  useFooterContent,
  type TaxRowData,
} from '@/hooks/apartmentQc/useApartmentTaxDetailsTable';
import type { ApartmentTaxDetailsItems, DualMethodTaxDetails } from '@/types/apartmentQC.types';

/* ============================================================
   MOCK DATA
 ============================================================ */

const mockTaxAmounts = [
  { taxName: 'Property Tax', taxAmount: 1000, displayOrder: 1 },
  { taxName: 'Water Tax', taxAmount: 500, displayOrder: 2 },
  { taxName: 'Service Tax', taxAmount: 300, displayOrder: 3 },
];

const mockTaxDetails: ApartmentTaxDetailsItems = {
  propertyId: 1,
  propertyCount: 10,
  taxAmounts: mockTaxAmounts,
};

const mockDualMethodDetails: DualMethodTaxDetails = {
  rateable: {
    propertyId: 1,
    propertyCount: 5,
    taxAmounts: [
      { taxName: 'Property Tax', taxAmount: 800, displayOrder: 1 },
      { taxName: 'Water Tax', taxAmount: 400, displayOrder: 2 },
    ],
  },
  capital: {
    propertyId: 1,
    propertyCount: 3,
    taxAmounts: [
      { taxName: 'Property Tax', taxAmount: 1200, displayOrder: 1 },
      { taxName: 'Service Tax', taxAmount: 600, displayOrder: 3 },
    ],
  },
};

/* ============================================================
   UTILITY FUNCTION TESTS
 ============================================================ */

describe('Utility Functions', () => {
  describe('getTabTranslationKey', () => {
    it('should return correct key for commercial tab', () => {
      expect(getTabTranslationKey('commercial')).toBe('apartmentTabs.commercial');
    });

    it('should return correct key for residential tab', () => {
      expect(getTabTranslationKey('residential')).toBe('apartmentTabs.residential');
    });

    it('should return amenities key as default', () => {
      expect(getTabTranslationKey('amenities')).toBe('apartmentTabs.amenities');
      expect(getTabTranslationKey('unknown')).toBe('apartmentTabs.amenities');
    });
  });

  describe('getSubTabLabel', () => {
    const mockTranslator = (key: string) => {
      const translations: Record<string, string> = {
        'apartmentTabs.capital': 'Capital Value',
        'apartmentTabs.dual': 'Dual Method',
        'apartmentTabs.rateable': 'Rateable Value',
      };
      return translations[key] || key;
    };

    it('should return capital label', () => {
      expect(getSubTabLabel('capital', mockTranslator)).toBe('Capital Value');
    });

    it('should return dual method label', () => {
      expect(getSubTabLabel('dual-method', mockTranslator)).toBe('Dual Method');
    });

    it('should return rateable as default', () => {
      expect(getSubTabLabel('rateable', mockTranslator)).toBe('Rateable Value');
      expect(getSubTabLabel('unknown', mockTranslator)).toBe('Rateable Value');
    });
  });

  describe('formatCurrency', () => {
    it('should format whole numbers without decimal', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1,000');
    });

    it('should format decimal numbers with up to 2 decimal places', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1,234.56');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should format large numbers with Indian formatting', () => {
      const result = formatCurrency(1234567);
      // Indian format: 12,34,567
      expect(result).toContain('12,34,567');
    });
  });

  describe('createTaxMap', () => {
    it('should create a map from tax amounts', () => {
      const map = createTaxMap(mockTaxAmounts);
      expect(map.get('Property Tax')).toBe(1000);
      expect(map.get('Water Tax')).toBe(500);
      expect(map.get('Service Tax')).toBe(300);
    });

    it('should return empty map for undefined input', () => {
      const map = createTaxMap(undefined);
      expect(map.size).toBe(0);
    });

    it('should return empty map for empty array', () => {
      const map = createTaxMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('getHeaderGradientClass', () => {
    it('should return purple gradient for dual-method', () => {
      expect(getHeaderGradientClass('dual-method')).toBe('bg-gradient-to-r from-purple-50 to-indigo-50');
    });

    it('should return green gradient for capital', () => {
      expect(getHeaderGradientClass('capital')).toBe('bg-gradient-to-r from-green-50 to-emerald-50');
    });

    it('should return blue gradient as default', () => {
      expect(getHeaderGradientClass('rateable')).toBe('bg-gradient-to-r from-blue-50 to-indigo-50');
      expect(getHeaderGradientClass('unknown')).toBe('bg-gradient-to-r from-blue-50 to-indigo-50');
    });
  });

  describe('getRowClassName', () => {
    it('should return blue class for rateable row', () => {
      const row: TaxRowData = { id: '1', rowType: 'rateable', methodLabel: 'RV', total: 100 };
      expect(getRowClassName(row)).toBe('bg-blue-50/30 hover:bg-blue-50');
    });

    it('should return green class for capital row', () => {
      const row: TaxRowData = { id: '1', rowType: 'capital', methodLabel: 'CV', total: 100 };
      expect(getRowClassName(row)).toBe('bg-green-50/30 hover:bg-green-50');
    });

    it('should return gradient class for total row', () => {
      const row: TaxRowData = { id: '1', rowType: 'total', methodLabel: 'Total', total: 100 };
      expect(getRowClassName(row)).toBe('bg-gradient-to-r from-purple-100 to-indigo-100');
    });

    it('should return white class for single row', () => {
      const row: TaxRowData = { id: '1', rowType: 'single', methodLabel: 'Tax', total: 100 };
      expect(getRowClassName(row)).toBe('bg-white hover:bg-gray-50');
    });
  });
});

/* ============================================================
   HOOK TESTS
 ============================================================ */

describe('useTaxColumns', () => {
  it('should return sorted tax columns from single method data', () => {
    const { result } = renderHook(() => 
      useTaxColumns(mockTaxDetails, null, 'rateable')
    );

    expect(result.current).toHaveLength(3);
    expect(result.current[0].taxName).toBe('Property Tax');
    expect(result.current[1].taxName).toBe('Water Tax');
    expect(result.current[2].taxName).toBe('Service Tax');
  });

  it('should merge tax columns from dual method data', () => {
    const { result } = renderHook(() => 
      useTaxColumns(null, mockDualMethodDetails, 'dual-method')
    );

    // Should have Property Tax, Water Tax, Service Tax (merged)
    expect(result.current).toHaveLength(3);
    const taxNames = result.current.map(c => c.taxName);
    expect(taxNames).toContain('Property Tax');
    expect(taxNames).toContain('Water Tax');
    expect(taxNames).toContain('Service Tax');
  });

  it('should return empty array when no data', () => {
    const { result } = renderHook(() => 
      useTaxColumns(null, null, 'rateable')
    );

    expect(result.current).toHaveLength(0);
  });

  it('should sort columns by displayOrder', () => {
    const { result } = renderHook(() => 
      useTaxColumns(mockTaxDetails, null, 'rateable')
    );

    expect(result.current[0].displayOrder).toBe(1);
    expect(result.current[1].displayOrder).toBe(2);
    expect(result.current[2].displayOrder).toBe(3);
  });
});

describe('useHasData', () => {
  const mockColumns = [
    { taxName: 'Property Tax', displayOrder: 1 },
  ];

  it('should return true for dual method with rateable data', () => {
    const { result } = renderHook(() => 
      useHasData(null, mockDualMethodDetails, mockColumns, 'dual-method')
    );
    expect(result.current).toBe(true);
  });

  it('should return true for dual method with capital data', () => {
    const partialDual: DualMethodTaxDetails = {
      rateable: null,
      capital: mockDualMethodDetails.capital,
    };
    const { result } = renderHook(() => 
      useHasData(null, partialDual, mockColumns, 'dual-method')
    );
    expect(result.current).toBe(true);
  });

  it('should return false for dual method with no data', () => {
    const { result } = renderHook(() => 
      useHasData(null, null, mockColumns, 'dual-method')
    );
    expect(result.current).toBe(false);
  });

  it('should return true for single method with data and columns', () => {
    const { result } = renderHook(() => 
      useHasData(mockTaxDetails, null, mockColumns, 'rateable')
    );
    expect(result.current).toBe(true);
  });

  it('should return false for single method with no data', () => {
    const { result } = renderHook(() => 
      useHasData(null, null, mockColumns, 'rateable')
    );
    expect(result.current).toBe(false);
  });

  it('should return false for single method with no columns', () => {
    const { result } = renderHook(() => 
      useHasData(mockTaxDetails, null, [], 'rateable')
    );
    expect(result.current).toBe(false);
  });
});

describe('useTaxTableData', () => {
  const mockT = (key: string) => key;
  const mockTPtis = (key: string) => {
    const translations: Record<string, string> = {
      'apartmentTabs.rateable': 'Rateable Value',
      'apartmentTabs.capital': 'Capital Value',
      'apartmentTabs.amenities': 'Amenities',
    };
    return translations[key] || key;
  };

  it('should return single row for rateable method', () => {
    const taxColumns = mockTaxAmounts.map(t => ({ taxName: t.taxName, displayOrder: t.displayOrder }));
    
    const { result } = renderHook(() => 
      useTaxTableData(mockTaxDetails, null, taxColumns, 'rateable', 'amenities', mockT, mockTPtis)
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].rowType).toBe('single');
    expect(result.current[0]['Property Tax']).toBe(1000);
  });

  it('should return three rows for dual method (RV, CV, Total)', () => {
    const taxColumns = [
      { taxName: 'Property Tax', displayOrder: 1 },
      { taxName: 'Water Tax', displayOrder: 2 },
      { taxName: 'Service Tax', displayOrder: 3 },
    ];

    const { result } = renderHook(() => 
      useTaxTableData(null, mockDualMethodDetails, taxColumns, 'dual-method', 'amenities', mockT, mockTPtis)
    );

    expect(result.current).toHaveLength(3);
    expect(result.current[0].rowType).toBe('rateable');
    expect(result.current[1].rowType).toBe('capital');
    expect(result.current[2].rowType).toBe('total');
  });

  it('should calculate correct totals for dual method', () => {
    const taxColumns = [
      { taxName: 'Property Tax', displayOrder: 1 },
      { taxName: 'Water Tax', displayOrder: 2 },
      { taxName: 'Service Tax', displayOrder: 3 },
    ];

    const { result } = renderHook(() => 
      useTaxTableData(null, mockDualMethodDetails, taxColumns, 'dual-method', 'amenities', mockT, mockTPtis)
    );

    expect(result.current[0]['Property Tax']).toBe(800);
    expect(result.current[1]['Property Tax']).toBe(1200);
    expect(result.current[2]['Property Tax']).toBe(2000); // 800 + 1200
  });

  it('should return empty array when no data', () => {
    const { result } = renderHook(() => 
      useTaxTableData(null, null, [], 'rateable', 'amenities', mockT, mockTPtis)
    );

    expect(result.current).toHaveLength(0);
  });
});

describe('useFooterContent', () => {
  it('should return property count for single method', () => {
    const { result } = renderHook(() => 
      useFooterContent(mockTaxDetails, null, 'rateable')
    );

    expect(result.current).toEqual({ singleCount: 10 });
  });

  it('should return dual counts for dual method', () => {
    const { result } = renderHook(() => 
      useFooterContent(null, mockDualMethodDetails, 'dual-method')
    );

    expect(result.current).toEqual({ rvCount: 5, cvCount: 3 });
  });

  it('should return null when no data', () => {
    const { result } = renderHook(() => 
      useFooterContent(null, null, 'rateable')
    );

    expect(result.current).toBeNull();
  });

  it('should return null for single method with zero property count', () => {
    const zeroCountDetails: ApartmentTaxDetailsItems = { ...mockTaxDetails, propertyCount: 0 };
    const { result } = renderHook(() => 
      useFooterContent(zeroCountDetails, null, 'rateable')
    );

    expect(result.current).toBeNull();
  });
});
