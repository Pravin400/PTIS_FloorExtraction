import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { getMasterDataChangeSummaryClient } from '@/lib/api/add-taxes/operations.client';
import type { MasterDataChangeSummary } from '@/types/addTaxes.types';

interface UseMasterDataChangeActionsProps {
  financeYearId: string;
  pathname: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Owns the whole Master Data Change feature: the "N properties affected" summary (fetched
 * independently on its own timer, since its `affectedCount` can change from a CDC flag raised by an
 * unrelated edit elsewhere in the system, with no job start/finish event to key off) plus the
 * banner's "Proceed Execution"/"Export CSV" actions. Originally split across this file (actions
 * only) and useAddTaxesState.ts (summary polling only) — merged here into one hook per review
 * feedback on useAddTaxesState.ts's size, since both halves are the same feature. Pure relocation,
 * no logic change.
 */
export function useMasterDataChangeActions({ financeYearId, pathname, t }: UseMasterDataChangeActionsProps) {
  const [isExportingMasterDataCsv, setIsExportingMasterDataCsv] = useState(false);
  const [isProceedingMasterData, setIsProceedingMasterData] = useState(false);
  const masterDataRecalcHandlerRef = useRef<((scope?: string) => void) | null>(null);
  const [masterDataChangeSummary, setMasterDataChangeSummary] = useState<MasterDataChangeSummary | null>(null);

  // This is a plain Route Handler fetch (not a Server Action), so polling it independently never
  // re-triggers page.tsx's generateFlight re-render regardless of frequency.
  useEffect(() => {
    if (!financeYearId) return;
    let active = true;
    const fetchMdcSummary = async () => {
      try {
        const mdcSummary = await getMasterDataChangeSummaryClient(financeYearId);
        if (mdcSummary && active) {
          setMasterDataChangeSummary(mdcSummary);
        }
      } catch (err) {
        logger.error("Failed to load master data change summary", { error: err as Error });
      }
    };
    fetchMdcSummary();
    const interval = setInterval(fetchMdcSummary, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [financeYearId]);

  const handleProceedMasterDataExecution = async () => {
    setIsProceedingMasterData(true);
    try {
      if (masterDataRecalcHandlerRef.current) {
        await masterDataRecalcHandlerRef.current('masterDataChange');
      }
    } finally {
      setIsProceedingMasterData(false);
    }
  };

  const handleExportMasterDataCsv = async () => {
    if (isExportingMasterDataCsv) return;
    if (!financeYearId) {
      toast.error(t('masterDataChange.selectFinanceYearExportError'));
      return;
    }

    setIsExportingMasterDataCsv(true);
    const toastId = toast.loading(t('masterDataChange.exportingCsvToast'));

    try {
      // Plain fetch against the existing dedicated Route Handler (not a Server Action) — same
      // pattern as handleExportProperties in useAddTaxesExports.
      const downloadUrl = `${pathname}/master-data-changes-export?financeYearId=${encodeURIComponent(financeYearId)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `master_data_affected_properties_FY${financeYearId}.csv`;
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

      toast.success(t('masterDataChange.exportSuccessToast'), { id: toastId });
    } catch (error) {
      toast.error((error as Error).message || t('masterDataChange.exportFailedToast'), { id: toastId });
    } finally {
      setIsExportingMasterDataCsv(false);
    }
  };

  return {
    isExportingMasterDataCsv,
    isProceedingMasterData,
    masterDataRecalcHandlerRef,
    handleProceedMasterDataExecution,
    handleExportMasterDataCsv,
    masterDataChangeSummary,
  };
}
