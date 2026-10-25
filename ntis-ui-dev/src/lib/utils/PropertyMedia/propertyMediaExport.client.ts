'use client';

import { toast as sonnerToast } from "sonner";
import {
    DetailedCoverageExportParams,
    MissingPropertiesExportParams,
    AuditTrailExportParams,
} from "@/types/PropertyMedia/PropertyMedia.types";
import { buildQueryString } from "@/lib/utils/PropertyMedia/propertyMediaHelper";
import { logger } from "@/lib/utils/logger";

export function resolveFileName(contentDisposition: string | null, fallbackName: string): string {
    if (!contentDisposition) return fallbackName;

    const utf8Match = /filename\*=UTF-8''([^;\n]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1].trim());
    }

    const basicMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(contentDisposition);
    if (basicMatch?.[1]) {
        return basicMatch[1].replace(/['"]/g, '').trim();
    }

    return fallbackName;
}

export async function triggerDownload(url: string, fallbackName: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Export failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const fileName = resolveFileName(response.headers.get('content-disposition'), fallbackName);

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
}

/**
 * Trigger export for Gap Analysis Detailed Coverage list (Excel or PDF).
 */
export async function exportDetailedCoverage(
    params: DetailedCoverageExportParams,
    t: (key: string) => string
): Promise<void> {
    const queryString = buildQueryString({
        type: 'detailed-coverage',
        format: params.format,
        Category: params.category,
        SearchTerm: params.searchTerm,
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
    });

    const ext = params.format === 0 ? 'xlsx' : 'pdf';
    const fallbackName = `PropertyMedia_DetailedCoverage.${ext}`;
    const url = `/api/property-media/export?${queryString}`;

    const notifySuccess = params.toastHandlers?.success || sonnerToast.success;
    const notifyError = params.toastHandlers?.error || sonnerToast.error;
    try {
        await triggerDownload(url, fallbackName);
        notifySuccess(params.format === 0 ? t('export.excelSuccess') : t('export.pdfSuccess'));
    } catch (error) {
        logger.error('Failed to export detailed coverage', { error: error as Error });
        notifyError(t('export.failed'));
        throw error;
    }
}

/**
 * Trigger export for Gap Analysis Missing Properties list (Excel or PDF).
 */
export async function exportMissingProperties(
    params: MissingPropertiesExportParams,
    t: (key: string) => string
): Promise<void> {
    const queryString = buildQueryString({
        type: 'missing-properties',
        format: params.format,
        SearchTerm: params.searchTerm,
        photoTypeId: params.photoTypeId,
        ZoneId: params.zoneId,
        WardId: params.wardId,
        WorkflowStageId: params.workflowStageId,
        PropertyTypeId: params.propertyTypeId,
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
    });

    const ext = params.format === 0 ? 'xlsx' : 'pdf';
    const fallbackName = `PropertyMedia_MissingProperties.${ext}`;
    const url = `/api/property-media/export?${queryString}`;

    const notifySuccess = params.toastHandlers?.success || sonnerToast.success;
    const notifyError = params.toastHandlers?.error || sonnerToast.error;
    try {
        await triggerDownload(url, fallbackName);
        notifySuccess(params.format === 0 ? t('export.excelSuccess') : t('export.pdfSuccess'));
    } catch (error) {
        logger.error('Failed to export missing properties', { error: error as Error });
        notifyError(t('export.failed'));
        throw error;
    }
}

/**
 * Trigger export for Audit Trail jobs history (Excel or PDF).
 */
export async function exportAuditTrail(
    params: AuditTrailExportParams,
    t: (key: string) => string
): Promise<void> {
    const queryString = buildQueryString({
        type: 'audit-trail',
        format: params.format,
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
    });

    const ext = params.format === 0 ? 'xlsx' : 'pdf';
    const fallbackName = `PropertyMedia_AuditTrail.${ext}`;
    const url = `/api/property-media/export?${queryString}`;

    const notifySuccess = params.toastHandlers?.success || sonnerToast.success;
    const notifyError = params.toastHandlers?.error || sonnerToast.error;
    try {
        await triggerDownload(url, fallbackName);
        notifySuccess(params.format === 0 ? t('export.excelSuccess') : t('export.pdfSuccess'));
    } catch (error) {
        logger.error('Failed to export audit trail', { error: error as Error });
        notifyError(t('export.failed'));
        throw error;
    }
}
