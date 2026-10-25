import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { ScopeOptionItem, ImportTemplateResponse } from '@/types/addTaxes.types';
import type { WardItem } from '@/types/wardMaster.types';
import { useExcelImportState } from './useExcelImportState';
import { useExcelImportActions } from './useExcelImportActions';

interface UseExcelImportProps {
  onStartExecution: (jobId: string, totalCount: number, scheduledTime?: string) => void;
  financeYearId: string;
  zoneOptions: { value: string; label: string }[];
  scopeOptions: ScopeOptionItem[];
  initialWards?: WardItem[];
  initialImportTemplate?: ImportTemplateResponse | null;
}

export function useExcelImport({
  onStartExecution,
  financeYearId,
  zoneOptions,
  scopeOptions,
  initialWards = [],
  initialImportTemplate = null
}: UseExcelImportProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useExcelImportState();
  const { setTemplateConfig, setFetchedWards } = state;
  const excelActions = useExcelImportActions({
    state,
    onStartExecution,
    financeYearId,
    zoneOptions,
    scopeOptions
  });

  const setPageNumber = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('excelPage', String(page));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setPageSize = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('excelPage', '1');
    params.set('excelPageSize', String(size));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Seed state from SSR prefetched props
  useEffect(() => {
    if (initialImportTemplate && !state.templateConfig) {
      setTemplateConfig(initialImportTemplate);
    }
    if (initialWards && initialWards.length > 0 && state.fetchedWards.length === 0) {
      setFetchedWards(initialWards);
    }
  }, [initialImportTemplate, initialWards, state.templateConfig, state.fetchedWards.length, setTemplateConfig, setFetchedWards]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    state.setIsDragging(true);
  };

  const handleDragLeave = () => {
    state.setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    state.setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      excelActions.processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    state.setFile(null);
    state.setRows([]);
    state.setCalculatedStats(null);
  };

  return {
    file: state.file,
    rows: state.rows,
    selectedScopeType: state.selectedScopeType,
    setSelectedScopeType: state.setSelectedScopeType,
    isDragging: state.isDragging,
    isDownloading: state.isDownloading,
    isCalculating: state.isCalculating,
    isValidating: state.isValidating,
    calculatedStats: state.calculatedStats,
    isReviewModalOpen: state.isReviewModalOpen,
    setIsReviewModalOpen: state.setIsReviewModalOpen,
    isPreviewModalOpen: state.isPreviewModalOpen,
    setIsPreviewModalOpen: state.setIsPreviewModalOpen,
    previewData: state.previewData,
    isPreviewLoading: state.isPreviewLoading,
    pageNumber: excelActions.pageNumber,
    pageSize: excelActions.pageSize,
    previewPage: excelActions.previewPage,
    previewPageSize: excelActions.previewPageSize,
    setPageNumber,
    setPageSize,
    handleDownloadTemplate: excelActions.handleDownloadTemplate,
    processFile: excelActions.processFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleCalculateEligible: excelActions.handleCalculateEligible,
    executeJob: excelActions.executeJob,
    handlePreview: excelActions.handlePreview,
    mockCurrentScopeData: excelActions.mockCurrentScopeData,
    tableColumns: excelActions.tableColumns,
    paginatedRows: excelActions.paginatedRows
  };
}
