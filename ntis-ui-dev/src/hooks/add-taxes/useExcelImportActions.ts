import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ScopeOptionItem } from '@/types/addTaxes.types';
import { autoDetectScopeType, mapExcelDataToPayload, getNormalizedHeaders, getRowValue, hasRequiredBuildingHeaders, isWardValueValid, isPropertyValueValid } from '@/components/modules/property-tax/add-taxes/excelImportTab/ExcelImportUtils';
import { ExcelImportState } from './useExcelImportState';
import { logger } from '@/lib/utils/logger';
import { useTranslations } from 'next-intl';
import { fetchEligibleCountClient, executeOperationClient, getImportTemplateClient, previewOperationClient } from '@/lib/api/add-taxes/operations.client';

interface EligibleCountResult {
  eligible?: number;
  total?: number;
  skipped?: number;
  error?: string;
}

interface ExecuteResult {
  items?: {
    jobId: string;
    summary: {
      total: number;
    };
  };
  error?: string;
}

interface UseExcelImportActionsProps {
  state: ExcelImportState;
  onStartExecution: (jobId: string, totalCount: number, scheduledTime?: string) => void;
  financeYearId: string;
  zoneOptions: { value: string; label: string }[];
  scopeOptions: ScopeOptionItem[];
}

export function useExcelImportActions({
  state,
  onStartExecution,
  financeYearId,
  zoneOptions,
  scopeOptions
}: UseExcelImportActionsProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('addTaxes');

  const pageNumber = Number(searchParams.get('excelPage') || '1');
  const pageSize = Number(searchParams.get('excelPageSize') || '10');
  const previewPage = Number(searchParams.get('previewPage') || '1');
  const previewPageSize = Number(searchParams.get('previewPageSize') || '5');

  const handleDownloadTemplate = async () => {
    state.setIsDownloading(true);
    try {
      const data = state.templateConfig || await getImportTemplateClient();
      const columns = data?.columns || [
        { key: "Zone", header: "Zone", dataType: "string", required: false },
        { key: "Ward", header: "Ward", dataType: "string", required: false },
        { key: "PropertyNo", header: "Property No", dataType: "string", required: false },
        { key: "UpicId", header: "UPIC Id", dataType: "string", required: false },
        { key: "MobileNo", header: "Mobile No", dataType: "string", required: false }
      ];
      const headers = (columns as { header: string }[]).map((col) => col.header);
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "property_tax_import_template.xlsx");
      toast.success(t('messages.templateDownloaded'));
    } catch (error) {
      logger.error("Failed to download Excel template", { error: error as Error });
      toast.error(t('messages.failedTemplateDownload'));
    } finally {
      state.setIsDownloading(false);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error(t('messages.invalidFileFormat'));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t('messages.fileTooLarge'));
      return;
    }
    state.setFile(selectedFile);
    state.setCalculatedStats(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        if (json.length === 0) {
          toast.warning(t('messages.emptyExcelSheet'));
          state.setRows([]);
          return;
        }

        const normalizedHeaders = getNormalizedHeaders(json as Record<string, unknown>[]);
        if (!hasRequiredBuildingHeaders(normalizedHeaders)) {
          toast.error(t('messages.invalidExcelTemplate'));
          state.setRows([]);
          return;
        }

        const rows = json as Record<string, unknown>[];
        let invalidRowCount = 0;
        rows.forEach(row => {
          const rawWard = getRowValue(row, ['ward', 'wardno', 'ward name', 'wardno']);
          const rawProperty = getRowValue(row, ['propertynopartitionno', 'propertyno', 'propertynumber']);

          const wardValid = rawWard ? isWardValueValid(rawWard, state.fetchedWards) : false;
          const propertyValid = rawProperty ? isPropertyValueValid(rawProperty) : false;
          if (!wardValid || !propertyValid) {
            invalidRowCount += 1;
          }
        });

        if (invalidRowCount === rows.length) {
          toast.error(t('messages.invalidWardPropertyData'));
          state.setRows([]);
          return;
        }

        if (invalidRowCount > 0) {
          toast.error(t('messages.invalidWardPropertyData'));
        }

        state.setRows(rows);
        const detected = autoDetectScopeType(rows);
        state.setSelectedScopeType(detected);
        toast.success(t('messages.uploadSuccess', {
          scope: detected === 'building'
            ? t('scopeSelection.scopes.buildingWise')
            : t('scopeSelection.scopes.propertyWise')
        }));
      } catch (err) {
        logger.error("Failed to parse excel file", { error: err as Error });
        toast.error(t('messages.failedParseExcel'));
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleCalculateEligible = async () => {
    if (state.rows.length === 0) return;
    state.setIsCalculating(true);
    try {
      const scopeData = mapExcelDataToPayload(state.rows, state.selectedScopeType, zoneOptions, state.fetchedWards);
      const payload = {
        financeYearId: String(financeYearId),
        scopeType: state.selectedScopeType,
        scope: scopeData,
        operation: 'addTax'
      };
      const result: EligibleCountResult | null = await fetchEligibleCountClient(payload);
      if (result && !result.error) {
        state.setCalculatedStats({
          eligible: result.eligible ?? 0,
          total: result.total ?? state.rows.length,
          skipped: result.skipped ?? 0,
        });
        toast.success(t('messages.eligibleCalculated'));
      } else {
        state.setCalculatedStats({ eligible: 0, total: state.rows.length, skipped: state.rows.length });
        toast.error(result?.error || t('messages.failedFetchCalculation'));
      }
    } catch (error) {
      logger.error("Calculation failed", { error: error as Error });
      toast.error(t('messages.errorCalculating'));
    } finally {
      state.setIsCalculating(false);
    }
  };

  const executeJob = async (isScheduled: boolean, scheduledDateTime?: string, forceRecalculate?: boolean) => {
    state.setIsValidating(true);
    try {
      const scopeData = mapExcelDataToPayload(state.rows, state.selectedScopeType, zoneOptions, state.fetchedWards);
      if (forceRecalculate) {
        scopeData.forceRecalculate = true;
      }
      const payload = {
        financeYearId: Number(financeYearId),
        operation: 'addTax',
        scopeType: state.selectedScopeType,
        scope: scopeData,
        options: {
          previewBeforeExecute: true,
          isScheduled,
          ...(scheduledDateTime ? { scheduledDateTime } : {})
        }
      };
      const response: ExecuteResult | null = await executeOperationClient(payload);
      if (response && response.items && response.items.jobId) {
        state.setIsReviewModalOpen(false);
        state.setFile(null);
        state.setRows([]);
        state.setCalculatedStats(null);
        if (isScheduled) {
          toast.success(t('messages.jobScheduled', { jobId: response.items.jobId }));
          onStartExecution(response.items.jobId, response.items.summary.total, scheduledDateTime);
        } else {
          toast.success(t('messages.executionStarted', { jobId: response.items.jobId }));
          onStartExecution(response.items.jobId, response.items.summary.total);
        }
      } else {
        toast.error(response?.error || t('messages.failedExecute'));
      }
    } catch (e) {
      logger.error('Failed to execute operation', { error: e as Error });
      toast.error(t('messages.errorExecution'));
    } finally {
      state.setIsValidating(false);
    }
  };

  const handlePreview = async (targetPage?: number, targetPageSize?: number) => {
    state.setIsPreviewLoading(true);
    try {
      const p = typeof targetPage === 'number' && Number.isFinite(targetPage) ? targetPage : 1;
      const size = typeof targetPageSize === 'number' && Number.isFinite(targetPageSize) ? targetPageSize : (state.previewPageSize || 5);

      state.setPreviewPage(p);
      state.setPreviewPageSize(size);
      const scopeData = mapExcelDataToPayload(state.rows, state.selectedScopeType, zoneOptions, state.fetchedWards);
      const payload = {
        pageNumber: p,
        pageSize: size,
        searchTerm: '',
        sortBy: '',
        sortOrder: '',
        filterLogic: 0,
        financeYearId: Number(financeYearId),
        scopeType: state.selectedScopeType,
        scope: scopeData,
        operation: 'addTax'
      };
      const result = await previewOperationClient(payload);
      if (result && 'records' in result) {
        state.setPreviewData(result);
        state.setIsPreviewModalOpen(true);
      } else {
        toast.error(result?.error || t('messages.failedPreview'));
      }
    } catch (e) {
      logger.error('Failed to preview operation', { error: e as Error });
      toast.error(t('messages.errorPreview'));
    } finally {
      state.setIsPreviewLoading(false);
    }
  };

  const mockCurrentScopeData = useMemo(() => {
    const match = scopeOptions.find(s => s.scopeType === state.selectedScopeType);
    if (match) return match;
    return {
      id: state.selectedScopeType === 'building' ? 3 : 4,
      name: state.selectedScopeType === 'building' ? 'BuildingWise' : 'PropertyWise',
      scopeType: state.selectedScopeType,
      displayName: state.selectedScopeType === 'building' ? 'Building Wise' : 'Property Wise',
      description: 'Excel Import Selection',
      options: []
    };
  }, [scopeOptions, state.selectedScopeType]);

  const tableColumns = useMemo(() => {
    if (state.rows.length === 0) return [];
    const keys = Object.keys(state.rows[0]);
    return keys.map(k => ({
      key: k,
      label: k,
      width: `${100 / Math.max(1, keys.length)}%`
    }));
  }, [state.rows]);

  const paginatedRows = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return state.rows.slice(start, start + pageSize);
  }, [state.rows, pageNumber, pageSize]);

  return {
    pageNumber,
    pageSize,
    previewPage,
    previewPageSize,
    handleDownloadTemplate,
    processFile,
    handleCalculateEligible,
    executeJob,
    handlePreview,
    mockCurrentScopeData,
    tableColumns,
    paginatedRows
  };
}
