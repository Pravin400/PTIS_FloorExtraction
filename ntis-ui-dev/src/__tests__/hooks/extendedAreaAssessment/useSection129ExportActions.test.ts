import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { toast } from 'sonner';
import { useSection129ExportActions } from '@/hooks/extendedAreaAssessment/useSection129ExportActions';
import {
  exportSection129ScheduleCsvAction,
  exportSection129SchedulePdfAction,
} from '@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action', () => ({
  exportSection129ScheduleCsvAction: vi.fn(),
  exportSection129SchedulePdfAction: vi.fn(),
}));

const t = ((key: string) => key) as unknown as Parameters<typeof useSection129ExportActions>[1];

describe('useSection129ExportActions', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let clickSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('atob', vi.fn(() => 'mock-binary-data'));
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  describe('handleExportCsv', () => {
    it('errors when no property has been searched', async () => {
      const { result } = renderHook(() => useSection129ExportActions(null, t));
      await act(async () => {
        await result.current.handleExportCsv();
      });
      expect(toast.error).toHaveBeenCalledWith('messages.propertyNotFound');
      expect(exportSection129ScheduleCsvAction).not.toHaveBeenCalled();
    });

    it('downloads the CSV file on success', async () => {
      vi.mocked(exportSection129ScheduleCsvAction).mockResolvedValue({
        success: true,
        data: { base64: 'aGVsbG8=', contentType: 'text/csv', contentDisposition: null },
      });
      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      await act(async () => {
        await result.current.handleExportCsv();
      });
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('shows an error toast when the CSV export fails', async () => {
      vi.mocked(exportSection129ScheduleCsvAction).mockResolvedValue({ success: false, data: null, error: 'boom' });
      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      await act(async () => {
        await result.current.handleExportCsv();
      });
      expect(toast.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('handlePrint', () => {
    it('errors when no property has been searched', async () => {
      const { result } = renderHook(() => useSection129ExportActions(null, t));
      await act(async () => {
        await result.current.handlePrint();
      });
      expect(toast.error).toHaveBeenCalledWith('messages.propertyNotFound');
      expect(exportSection129SchedulePdfAction).not.toHaveBeenCalled();
    });

    it('fetches the server-generated PDF and sets pdfPreviewUrl instead of downloading it directly', async () => {
      vi.mocked(exportSection129SchedulePdfAction).mockResolvedValue({
        success: true,
        data: { base64: 'aGVsbG8=', contentType: 'application/pdf', contentDisposition: null },
      });

      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      await act(async () => {
        await result.current.handlePrint();
      });

      await waitFor(() => expect(result.current.pdfPreviewUrl).toBe('blob:mock-url'));
      expect(exportSection129SchedulePdfAction).toHaveBeenCalledWith(549439);
      expect(clickSpy).not.toHaveBeenCalled(); // no auto-download, it's previewed instead
    });

    it('shows an error toast when the PDF export fails', async () => {
      vi.mocked(exportSection129SchedulePdfAction).mockResolvedValue({ success: false, data: null, error: 'render failed' });

      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      await act(async () => {
        await result.current.handlePrint();
      });

      expect(toast.error).toHaveBeenCalledWith('render failed');
      expect(result.current.pdfPreviewUrl).toBeNull();
    });

    it('shows an error toast when the PDF export throws', async () => {
      vi.mocked(exportSection129SchedulePdfAction).mockRejectedValue(new Error('network down'));

      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      await act(async () => {
        await result.current.handlePrint();
      });

      expect(toast.error).toHaveBeenCalledWith('network down');
      expect(result.current.pdfPreviewUrl).toBeNull();
    });
  });

  describe('closePdfPreview', () => {
    it('revokes the object URL and clears pdfPreviewUrl', async () => {
      vi.mocked(exportSection129SchedulePdfAction).mockResolvedValue({
        success: true,
        data: { base64: 'aGVsbG8=', contentType: 'application/pdf', contentDisposition: null },
      });

      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      await act(async () => {
        await result.current.handlePrint();
      });
      await waitFor(() => expect(result.current.pdfPreviewUrl).not.toBeNull());

      act(() => {
        result.current.closePdfPreview();
      });

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(result.current.pdfPreviewUrl).toBeNull();
    });

    it('does nothing destructive when there is no open preview', () => {
      const { result } = renderHook(() => useSection129ExportActions(549439, t));
      act(() => {
        result.current.closePdfPreview();
      });
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
      expect(result.current.pdfPreviewUrl).toBeNull();
    });
  });
});
