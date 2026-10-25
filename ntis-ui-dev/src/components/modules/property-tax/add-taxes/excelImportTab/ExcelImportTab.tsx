'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ScopeOptionItem } from '@/types/addTaxes.types';
import { useExcelImport } from '@/hooks/add-taxes/useExcelImport';
import { Badge } from '@/components/common/Badge';
import { ExecutionReviewModal } from '../ManualSelectionTab/ExecutionReviewModal';
import { ExcelGuide } from './ExcelGuide';
import { ExcelUploader } from './ExcelUploader';
import { ExcelPreviewTable } from './ExcelPreviewTable';
import { ExcelPreviewModal } from './ExcelPreviewModal';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { fetchZoneOptionsClient } from '@/lib/api/add-taxes/operations.client';

import type { WardItem } from '@/types/wardMaster.types';
import type { ImportTemplateResponse } from '@/types/addTaxes.types';

interface ExcelImportTabProps {
  onStartExecution: (jobId: string, totalCount: number, scheduledTime?: string) => void;
  financeYearId: string;
  zoneOptions?: { value: string; label: string }[];
  scopeOptions: ScopeOptionItem[];
  financeYear?: string;
  initialWards?: WardItem[];
  initialImportTemplate?: ImportTemplateResponse | null;
}

export default function ExcelImportTab({
  onStartExecution,
  financeYearId,
  zoneOptions = [],
  scopeOptions = [],
  financeYear,
  initialWards = [],
  initialImportTemplate = null
}: ExcelImportTabProps) {
  const t = useTranslations('addTaxes');
  const tCommon = useTranslations('common');

  const [localZoneOptions, setLocalZoneOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const zoneOpts = await fetchZoneOptionsClient();
        setLocalZoneOptions(zoneOpts);
      } catch (err) {
        logger.error("Failed to load zone options inside ExcelImportTab", { error: err as Error });
      }
    };
    loadZones();
  }, []);

  const {
    file,
    rows,
    selectedScopeType,
    setSelectedScopeType,
    isDragging,
    isDownloading,
    isCalculating,
    isValidating,
    calculatedStats,
    isReviewModalOpen,
    setIsReviewModalOpen,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewData,
    isPreviewLoading,
    pageNumber,
    pageSize,
    previewPage,
    previewPageSize,
    setPageNumber,
    setPageSize,
    handleDownloadTemplate,
    processFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleCalculateEligible,
    executeJob,
    handlePreview,
    mockCurrentScopeData,
    tableColumns,
    paginatedRows
  } = useExcelImport({
    onStartExecution,
    financeYearId,
    zoneOptions: localZoneOptions.length > 0 ? localZoneOptions : zoneOptions,
    scopeOptions,
    initialWards,
    initialImportTemplate
  });

  return (
    <div className="flex flex-col gap-6 mt-0">
      {/* Download and Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExcelGuide
          t={t}
          isDownloading={isDownloading}
          handleDownloadTemplate={handleDownloadTemplate}
        />
        <ExcelUploader
          t={t}
          file={file}
          isDragging={isDragging}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleRemoveFile={handleRemoveFile}
          processFile={processFile}
        />
      </div>

      {/* Scope selector & table preview */}
      {rows.length > 0 && (
        <ExcelPreviewTable
          t={t}
          tCommon={tCommon}
          rows={rows}
          selectedScopeType={selectedScopeType}
          setSelectedScopeType={setSelectedScopeType}
          tableColumns={tableColumns}
          paginatedRows={paginatedRows}
          pageNumber={pageNumber}
          pageSize={pageSize}
          setPageNumber={setPageNumber}
          setPageSize={setPageSize}
          calculatedStats={calculatedStats}
          isCalculating={isCalculating}
          handleCalculateEligible={handleCalculateEligible}
        />
      )}

      {/* Final Review & Execute Trigger Panel */}
      {calculatedStats && (
        <div className="bg-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between border border-gray-200 shadow-sm">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
              {t('executionValidation.title')}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" size="sm" icon={CheckCircle}>
                {t('executionValidation.tags.financeYear')}
              </Badge>
              <Badge variant="success" size="sm" icon={CheckCircle}>
                {t('executionValidation.tags.scope')}
              </Badge>
              <Badge variant="success" size="sm" icon={CheckCircle}>
                {t('executionValidation.tags.eligibleRecords')}
              </Badge>
              <Badge variant="success" size="sm" icon={CheckCircle}>
                {t('executionValidation.tags.permission')}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t('executionValidation.readyRecords')}</div>
              <div className="text-2xl font-bold text-gray-900 leading-none my-0.5">
                {calculatedStats.eligible}
              </div>
              <div className="text-[10px] text-gray-400 lowercase">{t('executionValidation.eligibleRecordsSub')}</div>
            </div>
            <button
              className={`text-white rounded-lg px-6 py-3 flex items-center justify-between gap-4 transition-colors ${calculatedStats.eligible === 0 || isValidating
                ? 'bg-[#6B9DF2] opacity-60 cursor-not-allowed'
                : 'bg-[#2563EB] hover:bg-blue-700'
                }`}
              disabled={calculatedStats.eligible === 0 || isValidating}
              onClick={() => setIsReviewModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-white/90" />
                <div className="text-left">
                  <div className="text-sm font-semibold leading-tight">{t('executionValidation.reviewExecute')}</div>
                  <div className="text-[10px] opacity-90 leading-none mt-0.5">{t('executionValidation.requiresConfirmation')}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ExecutionReviewModal
        isModalOpen={isReviewModalOpen}
        setIsModalOpen={setIsReviewModalOpen}
        currentScopeData={mockCurrentScopeData}
        eligibleCount={calculatedStats?.eligible ?? 0}
        onStartExecution={executeJob}
        onPreview={handlePreview}
        isPreviewLoading={isPreviewLoading || isValidating}
        financeYear={financeYear}
      />

      {/* Operation Preview Modal */}
      <ExcelPreviewModal
        t={t}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewData={previewData}
        previewPage={previewPage}
        previewPageSize={previewPageSize}
        onPageChange={(p) => handlePreview(p, previewPageSize)}
        onPageSizeChange={(s) => handlePreview(1, s)}
        isLoading={isPreviewLoading}
      />
    </div>
  );
}
