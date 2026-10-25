/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFloorFormValidation } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormValidation';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/utils/validation-schemas', () => ({
  oldDetailsValidations: {
    validateFloorInformation: vi.fn((data) => {
      const errors: any = {};
      if (!data.oldFloorId) errors.oldFloorId = 'Required';
      return errors;
    }),
  },
}));

describe('useFloorFormValidation', () => {
  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useFloorFormValidation());

    expect(result.current.errors).toEqual({});
  });

  it('should validate data and set errors', () => {
    const { result } = renderHook(() => useFloorFormValidation());
    const invalidData = { oldFloorId: '' };

    act(() => {
      const errors = result.current.validate(invalidData as any);
      expect(errors.oldFloorId).toBeDefined();
    });

    expect(result.current.errors.oldFloorId).toBeDefined();
  });

  it('should reset validation errors', () => {
    const { result } = renderHook(() => useFloorFormValidation());

    act(() => {
      result.current.validate({ oldFloorId: '' } as any);
      result.current.resetValidation();
    });

    expect(result.current.errors).toEqual({});
  });

  describe('validateYearField', () => {
    it('should clear errors for empty or short year values', () => {
      const { result } = renderHook(() => useFloorFormValidation());

      act(() => {
        result.current.validateYearField('oldConstructionYear', '20');
      });
      expect(result.current.errors.oldConstructionYear).toBeUndefined();
    });

    it('should report error for invalid year range with standard digits', () => {
      const { result } = renderHook(() => useFloorFormValidation());

      act(() => {
        result.current.validateYearField('oldConstructionYear', '1699');
      });
      expect(result.current.errors.oldConstructionYear).toBeDefined();

      act(() => {
        result.current.validateYearField('oldConstructionYear', '2027');
      });
      expect(result.current.errors.oldConstructionYear).toBeDefined();
    });

    it('should accept valid standard digit years without errors', () => {
      const { result } = renderHook(() => useFloorFormValidation());

      act(() => {
        result.current.validateYearField('oldConstructionYear', '2020');
      });
      expect(result.current.errors.oldConstructionYear).toBeUndefined();
    });

    it('should accept and translate valid Marathi/Devanagari digit years without errors', () => {
      const { result } = renderHook(() => useFloorFormValidation());

      // '२०२०' is '2020' in Marathi digits
      act(() => {
        result.current.validateYearField('oldConstructionYear', '२०२०');
      });
      expect(result.current.errors.oldConstructionYear).toBeUndefined();
    });

    it('should report error for invalid Marathi/Devanagari digit year range', () => {
      const { result } = renderHook(() => useFloorFormValidation());

      // '१६९९' is '1699' in Marathi digits
      act(() => {
        result.current.validateYearField('oldConstructionYear', '१६९९');
      });
      expect(result.current.errors.oldConstructionYear).toBeDefined();
    });
  });
});
