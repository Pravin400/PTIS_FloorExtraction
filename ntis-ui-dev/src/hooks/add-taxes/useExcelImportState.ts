'use client';

import { useState } from 'react';
import { OperationPreviewResponse, ImportTemplateResponse } from '@/types/addTaxes.types';
import { WardItem } from '@/types/wardMaster.types';

export function useExcelImportState() {
  const [templateConfig, setTemplateConfig] = useState<ImportTemplateResponse | null>(null);
  const [fetchedWards, setFetchedWards] = useState<WardItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [selectedScopeType, setSelectedScopeType] = useState<string>('property');
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [calculatedStats, setCalculatedStats] = useState<{ eligible: number; total: number; skipped: number } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<OperationPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(5);

  return {
    templateConfig,
    setTemplateConfig,
    fetchedWards,
    setFetchedWards,
    file,
    setFile,
    rows,
    setRows,
    selectedScopeType,
    setSelectedScopeType,
    isDragging,
    setIsDragging,
    isDownloading,
    setIsDownloading,
    isCalculating,
    setIsCalculating,
    isValidating,
    setIsValidating,
    calculatedStats,
    setCalculatedStats,
    isReviewModalOpen,
    setIsReviewModalOpen,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewData,
    setPreviewData,
    isPreviewLoading,
    setIsPreviewLoading,
    previewPage,
    setPreviewPage,
    previewPageSize,
    setPreviewPageSize
  };
}
export type ExcelImportState = ReturnType<typeof useExcelImportState>;
