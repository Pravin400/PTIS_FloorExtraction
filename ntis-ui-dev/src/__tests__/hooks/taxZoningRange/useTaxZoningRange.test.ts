import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  comparePropertyNo,
  useTaxZoningRangeForm,
  useTaxZoningRangeFilters,
  useTaxZoningRangeLookups,
} from '@/hooks/taxZoningRange/useTaxZoningRange';
import type { TaxZoningRange, Ward, TaxZone } from '@/types/taxZoningRange.types';

const mockPush = vi.fn();
const mockToString = vi.fn(() => '');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ toString: mockToString }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('comparePropertyNo', () => {
  it('should sort numeric strings numerically (2 < 10)', () => {
    expect(comparePropertyNo('2', '10')).toBeLessThan(0);
    expect(comparePropertyNo('10', '2')).toBeGreaterThan(0);
    expect(comparePropertyNo('5', '5')).toBe(0);
  });

  it('should fall back to natural localeCompare for non-numeric strings', () => {
    expect(comparePropertyNo('A1', 'A10')).toBeLessThan(0);
    expect(comparePropertyNo('A10', 'A1')).toBeGreaterThan(0);
    expect(comparePropertyNo('A1', 'A1')).toBe(0);
  });
});

describe('useTaxZoningRangeForm', () => {
  it('should return an empty form when no initial value is given', () => {
    const { result } = renderHook(() => useTaxZoningRangeForm());
    expect(result.current.form).toEqual({
      wardIds: [],
      taxZoneId: '',
      assignEntireWard: false,
      fromPropertyNo: '',
      toPropertyNo: '',
      zoneDescription: '',
    });
    expect(result.current.submitted).toBe(false);
  });

  it('should hydrate from an initial TaxZoningRange', () => {
    const initial: TaxZoningRange = {
      id: 5,
      wardId: 89,
      wardNo: 'W1',
      taxZoneId: 3,
      taxZoneNo: 'Z1',
      fromPropertyNo: '10',
      toPropertyNo: '20',
      assignEntireWard: false,
      zoneDescription: 'Existing description',
      isActive: true,
      createdDate: null,
      updatedDate: null,
      minPropertyNo: null,
      maxPropertyNo: null,
      totalProperties: 0,
    };
    const { result } = renderHook(() => useTaxZoningRangeForm(initial));
    expect(result.current.form).toEqual({
      id: 5,
      wardIds: [89],
      taxZoneId: 3,
      assignEntireWard: false,
      fromPropertyNo: '10',
      toPropertyNo: '20',
      zoneDescription: 'Existing description',
    });
  });

  it('should update wardIds, taxZoneId, fromPropertyNo, toPropertyNo via setters', () => {
    const { result } = renderHook(() => useTaxZoningRangeForm());

    act(() => result.current.setWardIds([1, 2]));
    expect(result.current.form.wardIds).toEqual([1, 2]);

    act(() => result.current.setTaxZoneId(7));
    expect(result.current.form.taxZoneId).toBe(7);

    act(() => result.current.setFromPropertyNo('100'));
    expect(result.current.form.fromPropertyNo).toBe('100');
    expect(result.current.form.assignEntireWard).toBe(false);

    act(() => result.current.setToPropertyNo('200'));
    expect(result.current.form.toPropertyNo).toBe('200');
  });

  it('should sanitize disallowed characters when setting zoneDescription', () => {
    const { result } = renderHook(() => useTaxZoningRangeForm());
    act(() => result.current.setZoneDescription('Valid text @#$% here'));
    // DESCRIPTION_SANITIZE strips anything not letter/mark/number/space/,./-()&
    expect(result.current.form.zoneDescription).toBe('Valid text  here');
  });

  it('should allow letters, numbers, spaces and basic punctuation in zoneDescription', () => {
    const { result } = renderHook(() => useTaxZoningRangeForm());
    act(() => result.current.setZoneDescription('Zone A-1, near river (north)'));
    expect(result.current.form.zoneDescription).toBe('Zone A-1, near river (north)');
  });

  it('should set isMultiWard=true when wardIds.length>1', () => {
    const { result } = renderHook(() => useTaxZoningRangeForm());
    expect(result.current.isMultiWard).toBe(false);
    act(() => result.current.setWardIds([1, 2]));
    expect(result.current.isMultiWard).toBe(true);
    act(() => result.current.setWardIds([1]));
    expect(result.current.isMultiWard).toBe(false);
  });

  describe('validity flags', () => {
    it('isWardValid should require at least one ward', () => {
      const { result } = renderHook(() => useTaxZoningRangeForm());
      expect(result.current.isWardValid).toBe(false);
      act(() => result.current.setWardIds([1]));
      expect(result.current.isWardValid).toBe(true);
    });

    it('isZoneValid should require a non-empty, non-zero taxZoneId', () => {
      const { result } = renderHook(() => useTaxZoningRangeForm());
      expect(result.current.isZoneValid).toBe(false);
      act(() => result.current.setTaxZoneId(0));
      expect(result.current.isZoneValid).toBe(false);
      act(() => result.current.setTaxZoneId(3));
      expect(result.current.isZoneValid).toBe(true);
    });

    it('isDescriptionValid should require length between 15 and 200 (inclusive)', () => {
      const { result } = renderHook(() => useTaxZoningRangeForm());

      act(() => result.current.setZoneDescription('short'));
      expect(result.current.isDescriptionValid).toBe(false);

      act(() => result.current.setZoneDescription('a'.repeat(14)));
      expect(result.current.isDescriptionValid).toBe(false);

      act(() => result.current.setZoneDescription('a'.repeat(15)));
      expect(result.current.isDescriptionValid).toBe(true);

      act(() => result.current.setZoneDescription('a'.repeat(200)));
      expect(result.current.isDescriptionValid).toBe(true);

      act(() => result.current.setZoneDescription('a'.repeat(201)));
      expect(result.current.isDescriptionValid).toBe(false);
    });

    it('isRangeValid should require fromPropertyNo <= toPropertyNo for single-ward', () => {
      const { result } = renderHook(() => useTaxZoningRangeForm());

      expect(result.current.isRangeValid).toBe(false);

      act(() => {
        result.current.setFromPropertyNo('20');
        result.current.setToPropertyNo('10');
      });
      expect(result.current.isRangeValid).toBe(false);

      act(() => {
        result.current.setFromPropertyNo('10');
        result.current.setToPropertyNo('20');
      });
      expect(result.current.isRangeValid).toBe(true);
    });

    it('isRangeValid should be true for multi-ward regardless of property fields', () => {
      const { result } = renderHook(() => useTaxZoningRangeForm());
      act(() => result.current.setWardIds([1, 2]));
      expect(result.current.isRangeValid).toBe(true);
    });

    it('isFormValid should be true only when all validity flags are true', () => {
      const { result } = renderHook(() => useTaxZoningRangeForm());
      expect(result.current.isFormValid).toBe(false);

      act(() => {
        result.current.setWardIds([1]);
        result.current.setTaxZoneId(3);
        result.current.setZoneDescription('a'.repeat(20));
        result.current.setFromPropertyNo('10');
        result.current.setToPropertyNo('20');
      });
      expect(result.current.isFormValid).toBe(true);
    });
  });

  it('resetForm should reset the form and submitted state', () => {
    const { result } = renderHook(() => useTaxZoningRangeForm());

    act(() => {
      result.current.setWardIds([1]);
      result.current.setTaxZoneId(3);
      result.current.setZoneDescription('a'.repeat(20));
      result.current.setSubmitted(true);
    });
    expect(result.current.submitted).toBe(true);

    act(() => result.current.resetForm());

    expect(result.current.form).toEqual({
      wardIds: [],
      taxZoneId: '',
      assignEntireWard: false,
      fromPropertyNo: '',
      toPropertyNo: '',
      zoneDescription: '',
    });
    expect(result.current.submitted).toBe(false);
  });
});

describe('useTaxZoningRangeFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToString.mockReturnValue('');
  });

  const emptyInitial = {
    pageNumber: 1,
    pageSize: 10,
    filters: {},
  };

  it('should hydrate initial filter state from initial.filters', () => {
    const { result } = renderHook(() =>
      useTaxZoningRangeFilters({
        pageNumber: 1,
        pageSize: 10,
        filters: {
          wardId: 89,
          fromPropertyNo: '10',
          toPropertyNo: '20',
          taxZoneId: 3,
          search: 'term',
        },
      })
    );

    expect(result.current.filterWard).toBe('89');
    expect(result.current.filterFrom).toBe('10');
    expect(result.current.filterTo).toBe('20');
    expect(result.current.filterZone).toBe('3');
    expect(result.current.search).toBe('term');
  });

  it('should default to empty strings when initial.filters has no values', () => {
    const { result } = renderHook(() => useTaxZoningRangeFilters(emptyInitial));
    expect(result.current.filterWard).toBe('');
    expect(result.current.filterFrom).toBe('');
    expect(result.current.filterTo).toBe('');
    expect(result.current.filterZone).toBe('');
    expect(result.current.search).toBe('');
  });

  it('handleApplyFilters should push only the currently-set filter fields with page=1', () => {
    const { result } = renderHook(() => useTaxZoningRangeFilters(emptyInitial));

    act(() => {
      result.current.setFilterWard('89');
      result.current.setSearch('abc');
    });

    act(() => result.current.handleApplyFilters());

    expect(mockPush).toHaveBeenCalledTimes(1);
    const url = mockPush.mock.calls[0][0] as string;
    expect(url.startsWith('/en/property-tax/taxzoningmaster?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('page')).toBe('1');
    expect(params.get('wardId')).toBe('89');
    expect(params.get('search')).toBe('abc');
    expect(params.has('propertyFrom')).toBe(false);
    expect(params.has('propertyTo')).toBe(false);
    expect(params.has('taxZoneId')).toBe(false);
  });

  it('handleClearFilters should reset all filter state and remove params from URL', () => {
    const { result } = renderHook(() =>
      useTaxZoningRangeFilters({
        pageNumber: 1,
        pageSize: 10,
        filters: { wardId: 89, fromPropertyNo: '10', toPropertyNo: '20', taxZoneId: 3, search: 'term' },
      })
    );

    act(() => result.current.handleClearFilters());

    expect(result.current.filterWard).toBe('');
    expect(result.current.filterFrom).toBe('');
    expect(result.current.filterTo).toBe('');
    expect(result.current.filterZone).toBe('');
    expect(result.current.search).toBe('');

    expect(mockPush).toHaveBeenCalledTimes(1);
    const url = mockPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('page')).toBe('1');
    expect(params.has('wardId')).toBe(false);
    expect(params.has('propertyFrom')).toBe(false);
    expect(params.has('propertyTo')).toBe(false);
    expect(params.has('taxZoneId')).toBe(false);
    expect(params.has('search')).toBe(false);
  });

  it('changePage should push the requested page number', () => {
    const { result } = renderHook(() => useTaxZoningRangeFilters(emptyInitial));

    act(() => result.current.changePage(3));

    const url = mockPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('page')).toBe('3');
  });

  it('changePageSize should push page=1 and the requested pageSize', () => {
    const { result } = renderHook(() => useTaxZoningRangeFilters(emptyInitial));

    act(() => result.current.changePageSize(50));

    const url = mockPush.mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('50');
  });
});

describe('useTaxZoningRangeLookups', () => {
  it('should map wards and taxZones to {label, value} options', () => {
    const wards: Ward[] = [
      {
        id: 89,
        wardNo: 'W1',
        zoneNo: 'Z1',
        description: null,
        descriptionEnglish: null,
        sequenceNo: null,
        isActive: true,
        createdBy: null,
        createdDate: '',
        updatedBy: null,
        updatedDate: null,
      },
    ];
    const taxZones: TaxZone[] = [
      {
        id: 3,
        taxZoneNo: 'ZN1',
        taxZoneType: 'Residential',
        remark: null,
        createdDate: '',
        updatedDate: null,
        isActive: true,
      },
    ];

    const { result } = renderHook(() => useTaxZoningRangeLookups(wards, taxZones));

    expect(result.current.wardOptions).toEqual([{ label: 'W1', value: '89' }]);
    expect(result.current.zoneOptions).toEqual([{ label: 'ZN1', value: '3' }]);
  });

  it('should return empty arrays for empty inputs', () => {
    const { result } = renderHook(() => useTaxZoningRangeLookups([], []));
    expect(result.current.wardOptions).toEqual([]);
    expect(result.current.zoneOptions).toEqual([]);
  });
});
