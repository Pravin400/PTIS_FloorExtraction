import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { exportExcelAction } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';

interface UseExcelExportProps {
  wardId?: string;
  propertyNo?: string;
}

export const useExcelExport = ({ wardId, propertyNo }: UseExcelExportProps) => {
  const t = useTranslations('appartmentQC');
  const [isExporting, setIsExporting] = useState(false);

  const handleExcelExport = useCallback(async () => {
    if (!wardId || !propertyNo) {
      logger.warn('[useExcelExport] Cannot export: missing wardId or propertyNo');
      toast.error(t('export.missingParams') || 'Missing ward ID or property number');
      return;
    }

    setIsExporting(true);
    const loadingToastId = toast.loading(t('export.downloading') || 'Downloading Excel file...');

    try {
      const result = await exportExcelAction(wardId, propertyNo);

      if (!result.success) {
        throw new Error(result.error || 'Failed to export Excel');
      }

      if (!result.data) {
        throw new Error('Failed to export Excel: No data returned');
      }

      // Decode base64 to binary data
      const byteCharacters = atob(result.data.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.filename || `apartment-qc-${propertyNo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(loadingToastId);
      toast.success(t('export.success') || 'Excel file downloaded successfully!');
    } catch (error) {
      logger.error('[useExcelExport] Excel export failed', { error: error as Error });
      toast.dismiss(loadingToastId);
      toast.error(t('export.error') || 'Failed to download Excel file');
    } finally {
      setIsExporting(false);
    }
  }, [wardId, propertyNo, t]);

  return {
    isExporting,
    handleExcelExport
  };
};
