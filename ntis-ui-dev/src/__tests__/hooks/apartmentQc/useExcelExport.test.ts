import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { useExcelExport } from '@/hooks/apartmentQc/useExcelExport';
import { toast } from 'sonner';
import { exportExcelAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import { logger } from '@/lib/utils/logger';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'loading-toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  exportExcelAction: vi.fn(),
}));

describe('useExcelExport', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  let clickSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    
    // Spy on anchor click on real anchor elements
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    
    // Mock atob to return a valid string representing binary data
    vi.stubGlobal('atob', vi.fn(() => 'mock-binary-data'));
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should initialize with isExporting as false', () => {
    const { result } = renderHook(() => useExcelExport({ wardId: '1', propertyNo: 'PROP1' }));
    expect(result.current.isExporting).toBe(false);
  });

  it('should show error if wardId or propertyNo is missing', async () => {
    const { result } = renderHook(() => useExcelExport({ wardId: '', propertyNo: '' }));
    
    await act(async () => {
      await result.current.handleExcelExport();
    });

    expect(logger.warn).toHaveBeenCalledWith('[useExcelExport] Cannot export: missing wardId or propertyNo');
    expect(toast.error).toHaveBeenCalledWith('export.missingParams');
    expect(exportExcelAction).not.toHaveBeenCalled();
  });

  it('should handle successful export', async () => {
    vi.mocked(exportExcelAction).mockResolvedValue({
      success: true,
      data: {
        base64Data: 'SGVsbG8gV29ybGQ=', // Valid base64
        filename: 'test.xlsx'
      }
    });

    const { result } = renderHook(() => useExcelExport({ wardId: '1', propertyNo: 'PROP1' }));
    
    await act(async () => {
      await result.current.handleExcelExport();
    });

    expect(toast.loading).toHaveBeenCalledWith('export.downloading');
    expect(exportExcelAction).toHaveBeenCalledWith('1', 'PROP1');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalledWith('loading-toast-id');
    expect(toast.success).toHaveBeenCalledWith('export.success');
    expect(result.current.isExporting).toBe(false);
  });

  it('should handle export failure from API', async () => {
    vi.mocked(exportExcelAction).mockResolvedValue({
      success: false,
      error: 'API Error'
    });

    const { result } = renderHook(() => useExcelExport({ wardId: '1', propertyNo: 'PROP1' }));
    
    await act(async () => {
      await result.current.handleExcelExport();
    });

    expect(toast.loading).toHaveBeenCalledWith('export.downloading');
    expect(logger.error).toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalledWith('loading-toast-id');
    expect(toast.error).toHaveBeenCalledWith('export.error');
    expect(result.current.isExporting).toBe(false);
  });

  it('should handle export exception', async () => {
    vi.mocked(exportExcelAction).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useExcelExport({ wardId: '1', propertyNo: 'PROP1' }));
    
    await act(async () => {
      await result.current.handleExcelExport();
    });

    expect(logger.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('export.error');
    expect(result.current.isExporting).toBe(false);
  });
});
