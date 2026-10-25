'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/common';
import { useTranslations } from 'next-intl';
import { exportAuditTrail, exportDetailedCoverage, exportMissingProperties } from '@/lib/utils/PropertyMedia/propertyMediaExport.client';
import { AuditTrailExportParams, DetailedCoverageExportParams, MissingPropertiesExportParams, ExportFormat } from '@/types/PropertyMedia/PropertyMedia.types';

/**
 * Custom React Hook that integrates with `useToast()` from `@/components/common`.
 * Tracks export state per format (Excel or PDF) and displays start notifications.
 */
export function usePropertyMediaExport() {
    const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
    const t = useTranslations('propertyMedia');
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

    const isExporting = exportingFormat !== null;
    const isExportingExcel = exportingFormat === 0;
    const isExportingPdf = exportingFormat === 1;

    const notifyExportStarted = useCallback(
        (format: ExportFormat) => {
            if (format === 0) {
                toastInfo(t('export.excelStarted'));
            } else if (format === 1) {
                toastInfo(t('export.pdfStarted'));
            }
        },
        [toastInfo, t]
    );

    const handleExportCoverage = useCallback(
        async (params: Omit<DetailedCoverageExportParams, 'toastHandlers'>) => {
            if (exportingFormat !== null) return;
            setExportingFormat(params.format);
            notifyExportStarted(params.format);
            try {
                await exportDetailedCoverage(
                    {
                        ...params,
                        toastHandlers: { success: toastSuccess, error: toastError },
                    },
                    t
                );
            } finally {
                setExportingFormat(null);
            }
        },
        [exportingFormat, notifyExportStarted, toastSuccess, toastError, t]
    );

    const handleExportMissing = useCallback(
        async (params: Omit<MissingPropertiesExportParams, 'toastHandlers'>) => {
            if (exportingFormat !== null) return;
            setExportingFormat(params.format);
            notifyExportStarted(params.format);
            try {
                await exportMissingProperties(
                    {
                        ...params,
                        toastHandlers: { success: toastSuccess, error: toastError },
                    },
                    t
                );
            } finally {
                setExportingFormat(null);
            }
        },
        [exportingFormat, notifyExportStarted, toastSuccess, toastError, t]
    );

    const handleExportAuditTrail = useCallback(
        async (params: AuditTrailExportParams) => {
            if (exportingFormat !== null) return;
            setExportingFormat(params.format);
            notifyExportStarted(params.format);
            try {
                await exportAuditTrail(
                    {
                        ...params,
                        toastHandlers: { success: toastSuccess, error: toastError },
                    },
                    t
                );
            } finally {
                setExportingFormat(null);
            }
        },
        [exportingFormat, notifyExportStarted, toastSuccess, toastError, t]
    );

    return {
        exportDetailedCoverage: handleExportCoverage,
        exportMissingProperties: handleExportMissing,
        exportAuditTrail: handleExportAuditTrail,
        isExporting,
        isExportingExcel,
        isExportingPdf,
    };
}
