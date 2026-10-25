import { useState } from 'react';
import { toast } from 'sonner';

interface UseAddTaxesExportsProps {
  financeYearId: string;
  pathname: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Owns the dashboard cards' "export to Excel" flow — moved out of AddTaxesConsole.tsx verbatim
 * (pure relocation, no logic change) as part of splitting that file down in size.
 */
export function useAddTaxesExports({ financeYearId, pathname, t }: UseAddTaxesExportsProps) {
  const [exportingStatus, setExportingStatus] = useState<string | null>(null);

  const handleExportProperties = async (status: string) => {
    if (exportingStatus) return;

    if (!financeYearId) {
      toast.error(
        t('messages.financeYearRequiredForExport', { fallback: 'Please select a finance year before exporting.' })
      );
      return;
    }

    setExportingStatus(status);

    const toastId = toast.loading(
      t('messages.exportingDownloading', { fallback: 'Export downloading, please wait...' })
    );

    try {
      const downloadUrl = `${pathname}/export-excel?status=${encodeURIComponent(status)}&financeYearId=${encodeURIComponent(financeYearId)}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `property_tax_properties_${status.toLowerCase()}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, '');
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(
        t('messages.exportCompleted', { fallback: 'Export download completed' }),
        { id: toastId }
      );
    } catch (_error) {
      toast.error(
        t('messages.exportFailed', { fallback: 'Failed to export properties' }),
        { id: toastId }
      );
    } finally {
      setExportingStatus(null);
    }
  };

  return { exportingStatus, handleExportProperties };
}
