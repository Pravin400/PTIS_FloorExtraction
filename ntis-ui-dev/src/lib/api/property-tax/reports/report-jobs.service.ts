import 'server-only';
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';
import type { ReportJob, ReportJobStatus, ReportJobType } from '@/types/report.types';
import type { DesignerReportJob } from '@/types/report-designer.types';

export async function fetchReportJobsServer(take = 25): Promise<ReportJob[]> {
  try {
    const safeTake = Math.min(Math.max(take, 1), 100);
    const htmlResult = await apiClient.get<Array<{
        jobId: string;
        reportCode: string;
        status: string;
        totalRecords?: number;
        processedRecords?: number;
        totalChunks?: number;
        completedChunks?: number;
        currentChunk?: number;
        progressPercentage?: number;
        stage?: string;
        errorMessage?: string | null;
        createdDate: string;
        completedDate?: string | null;
      }>>(`/designer-report-jobs?take=${encodeURIComponent(String(safeTake))}`);
    const htmlJobs = htmlResult.success && Array.isArray(htmlResult.data)
      ? htmlResult.data.map((job): ReportJob => ({
          reportRequestId: job.jobId,
          reportCode: job.reportCode,
          status: normalizeHtmlJobStatus(job.status),
          createdDate: job.createdDate,
          completedDate: job.completedDate ?? null,
          errorMessage: job.errorMessage ?? null,
          downloadAvailable: job.status === 'Completed' || job.status === 'PartiallyCompleted',
          totalRecords: job.totalRecords ?? 0,
          processedRecords: job.processedRecords ?? 0,
          totalChunks: job.totalChunks ?? 0,
          completedChunks: job.completedChunks ?? 0,
          currentChunk: job.currentChunk ?? 0,
          progressPercentage: job.progressPercentage ?? 0,
          stage: job.stage ?? job.status,
        }))
      : [];

    return htmlJobs
      .sort((left, right) => Date.parse(right.createdDate) - Date.parse(left.createdDate))
      .slice(0, safeTake);
  } catch {
    return [];
  }
}

function normalizeHtmlJobStatus(status: string): ReportJobStatus {
  if (status === 'Queued') return 'Pending';
  if (status === 'PartiallyCompleted') return 'Completed';
  if (status === 'Processing' || status === 'Completed' || status === 'Failed' || status === 'Cancelled' || status === 'Retrying') {
    return status as ReportJobStatus;
  }
  return 'Pending';
}


export async function getDesignerReportStatusServer(jobId: string): Promise<DesignerReportJob> {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(jobId)) {
    throw new ApiError(400, 'Invalid report job ID.', 'Report status');
  }
  const result = await apiClient.get<DesignerReportJob>(`/designer-report-jobs/${encodeURIComponent(jobId)}`);
  if (!result.success || !result.data) {
    throw new ApiError(result.statusCode || 502, result.error || 'Report status could not be loaded.', 'Report status');
  }
  return result.data;
}

export async function createDesignerReportJobServer(payload: {
  reportCode: string;
  parameters: Record<string, string>;
  outputMode: string;
  jobType: ReportJobType;
}) {
  return apiClient.post<{ jobId: string; status: string }>('/designer-report-jobs', payload);
}
