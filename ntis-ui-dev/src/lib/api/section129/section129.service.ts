import 'server-only';
import { apiClient } from '@/services/api.service';
import type { Section129ApplyRequest, Section129RecalculateRequest, Section129ScheduleApi } from '@/types/section129.types';

interface Section129ApiEnvelope {
  success: boolean;
  message?: string;
  items?: Section129ScheduleApi | null;
}

export interface Section129ServiceResult {
  success: boolean;
  data: Section129ScheduleApi | null;
  error?: string;
}

/** GET /Property/{propertyId}/section129a-schedule */
export async function getSection129Schedule(propertyId: number): Promise<Section129ServiceResult> {
  const response = await apiClient.get<Section129ApiEnvelope>(
    `/Property/${propertyId}/section129a-schedule`,
    { cache: 'no-store' }
  );

  if (!response.success || !response.data?.success) {
    return {
      success: false,
      data: null,
      error: response.data?.message || response.error || 'Failed to fetch Section 129A schedule',
    };
  }

  return { success: true, data: response.data.items ?? null };
}

/** GET /Property/section129a-search-by-old-gp-no?oldGpNo=... — accepts comma-separated values. */
export async function searchSection129ScheduleByOldGpNo(oldGpNo: string): Promise<Section129ServiceResult> {
  const response = await apiClient.get<Section129ApiEnvelope>(
    `/Property/section129a-search-by-old-gp-no?oldGpNo=${encodeURIComponent(oldGpNo)}`,
    { cache: 'no-store' }
  );

  if (!response.success || !response.data?.success) {
    return {
      success: false,
      data: null,
      error: response.data?.message || response.error || 'Failed to find a property for that Old Gram Panchayat Number',
    };
  }

  return { success: true, data: response.data.items ?? null };
}

/** POST /Property/{propertyId}/section129a-apply */
export async function applySection129A(
  propertyId: number,
  request: Section129ApplyRequest
): Promise<Section129ServiceResult> {
  const response = await apiClient.post<Section129ApiEnvelope>(
    `/Property/${propertyId}/section129a-apply`,
    request
  );

  if (!response.success || !response.data?.success) {
    return {
      success: false,
      data: null,
      error: response.data?.message || response.error || 'Failed to apply Section 129A',
    };
  }

  return { success: true, data: response.data.items ?? null };
}

/** POST /Property/{propertyId}/section129a-recalculate */
export async function recalculateSection129A(
  propertyId: number,
  request?: Section129RecalculateRequest
): Promise<Section129ServiceResult> {
  const response = await apiClient.post<Section129ApiEnvelope>(
    `/Property/${propertyId}/section129a-recalculate`,
    request ?? {}
  );

  if (!response.success || !response.data?.success) {
    return {
      success: false,
      data: null,
      error: response.data?.message || response.error || 'Failed to recalculate Section 129A',
    };
  }

  return { success: true, data: response.data.items ?? null };
}

export interface Section129CsvExportResult {
  base64: string;
  contentType: string;
  contentDisposition: string | null;
}

/** GET /Property/{propertyId}/section129a-schedule/export-csv */
export async function exportSection129ScheduleCsv(propertyId: number): Promise<Section129CsvExportResult> {
  const response = await apiClient.fetch(`/Property/${propertyId}/section129a-schedule/export-csv`);

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to export Section 129A schedule CSV (${response.status}): ${errText || response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return {
    base64: Buffer.from(buffer).toString('base64'),
    contentType: response.headers.get('content-type') || 'text/csv',
    contentDisposition: response.headers.get('content-disposition'),
  };
}

export interface Section129PdfExportResult {
  base64: string;
  contentType: string;
  contentDisposition: string | null;
}

/** GET /Property/{propertyId}/section129a-schedule/export-pdf — server-side (PdfSharp/MigraDoc). */
export async function exportSection129SchedulePdf(propertyId: number): Promise<Section129PdfExportResult> {
  const response = await apiClient.fetch(`/Property/${propertyId}/section129a-schedule/export-pdf`);

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to export Section 129A schedule PDF (${response.status}): ${errText || response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return {
    base64: Buffer.from(buffer).toString('base64'),
    contentType: response.headers.get('content-type') || 'application/pdf',
    contentDisposition: response.headers.get('content-disposition'),
  };
}
