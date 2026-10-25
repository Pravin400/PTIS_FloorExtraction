import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaxZoningExport } from '@/hooks/taxZoningRange/useTaxZoningExport';

const mockDownloadTaxZoningExport = vi.fn();
vi.mock('@/lib/api/taxZoningRange/taxZoningRange-export.client', () => ({
  downloadTaxZoningExport: (...args: unknown[]) => mockDownloadTaxZoningExport(...args),
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

const t = (key: string) => key;

describe('useTaxZoningExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return isExportingExcel=false and isExportingPending=false initially', () => {
    const { result } = renderHook(() => useTaxZoningExport({}, false, t));
    expect(result.current.isExportingExcel).toBe(false);
    expect(result.current.isExportingPending).toBe(false);
  });

  describe('handleExportExcel', () => {
    it('should show toast.info and call downloadTaxZoningExport with all filters mapped', () => {
      const filters = {
        wardId: 5,
        taxZoneId: 2,
        fromPropertyNo: '10',
        toPropertyNo: '20',
        searchTerm: 'abc',
        ulbName: 'MyUlb',
      };
      const { result } = renderHook(() => useTaxZoningExport(filters, true, t));

      act(() => {
        result.current.handleExportExcel();
      });

      expect(mockToast.info).toHaveBeenCalledWith('messages.exportDownloading');
      expect(mockDownloadTaxZoningExport).toHaveBeenCalledWith('ranges-excel', {
        locale: 'en',
        WardId: '5',
        TaxZoneId: '2',
        PropertyNo: '10',
        SearchTerm: 'abc',
        ulbName: 'MyUlb',
      });
    });

    it('should only include truthy filter keys', () => {
      const filters = {
        wardId: 5,
        searchTerm: 'abc',
      };
      const { result } = renderHook(() => useTaxZoningExport(filters, true, t));

      act(() => {
        result.current.handleExportExcel();
      });

      expect(mockDownloadTaxZoningExport).toHaveBeenCalledWith('ranges-excel', {
        locale: 'en',
        WardId: '5',
        SearchTerm: 'abc',
      });
    });

    it('should call downloadTaxZoningExport with just the current locale when all filters are empty', () => {
      const { result } = renderHook(() => useTaxZoningExport({}, false, t));

      act(() => {
        result.current.handleExportExcel();
      });

      expect(mockDownloadTaxZoningExport).toHaveBeenCalledWith('ranges-excel', { locale: 'en' });
    });
  });

  describe('handleExportPending', () => {
    it('should show toast.info and call downloadTaxZoningExport with only wardId param', () => {
      const filters = {
        wardId: 7,
        taxZoneId: 2,
        searchTerm: 'ignored',
      };
      const { result } = renderHook(() => useTaxZoningExport(filters, true, t));

      act(() => {
        result.current.handleExportPending();
      });

      expect(mockToast.info).toHaveBeenCalledWith('messages.exportDownloading');
      expect(mockDownloadTaxZoningExport).toHaveBeenCalledWith('pending-excel', { wardId: '7' });
    });

    it('should call downloadTaxZoningExport with undefined when wardId is empty', () => {
      const { result } = renderHook(() => useTaxZoningExport({}, false, t));

      act(() => {
        result.current.handleExportPending();
      });

      expect(mockDownloadTaxZoningExport).toHaveBeenCalledWith('pending-excel', undefined);
    });
  });
});
