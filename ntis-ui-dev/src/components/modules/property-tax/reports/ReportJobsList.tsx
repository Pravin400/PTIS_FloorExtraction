'use client';

import { useMemo } from 'react';
import { MasterTable, Badge, PreviewButton } from '@/components/common';
import type { Column } from '@/components/common';
import type { ReportJob, ReportJobStatus, ReportJobsListProps } from '@/types/report.types';
type BadgeVariant = 'success' | 'destructive' | 'warning' | 'secondary';

const STATUS_VARIANT: Record<ReportJobStatus, BadgeVariant> = {
  Completed: 'success',
  Failed: 'destructive',
  Cancelled: 'destructive',
  Pending: 'warning',
  Processing: 'warning',
  Retrying: 'warning',
};
function formatDate(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

export function ReportJobsList({ jobs, loading, copy, reportDefinitions, onPreview }: ReportJobsListProps) {
  const reportNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of reportDefinitions) map.set(d.reportCode, d.reportName);
    return map;
  }, [reportDefinitions]);

  const columns: Column<ReportJob>[] = [
    {
      key: 'reportCode',
      label: copy.columns.report,
      render: (_v, row) => reportNameByCode.get(row.reportCode) ?? row.reportCode,
    },
    {
      key: 'status',
      label: copy.columns.status,
      align: 'center',
      render: (_v, row) => (
        <div className="flex flex-col items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[row.status]} dot={STATUS_VARIANT[row.status] === 'warning'}>
            {copy.statuses[row.status]}
          </Badge>
          {row.status !== 'Completed' && (
            row.stage != null || row.progressPercentage != null || row.totalChunks != null
          ) ? (
            <div className="min-w-32 text-[10px] text-gray-500">
              <div className="flex justify-between gap-2">
                <span>{row.stage ?? row.status}</span>
                <span>{Math.round(row.progressPercentage ?? 0)}%</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded bg-gray-100">
                <div className="h-full rounded bg-blue-600" style={{ width: `${Math.min(100, row.progressPercentage ?? 0)}%` }} />
              </div>
              {(row.totalChunks ?? 0) > 0 ? (
                <div className="mt-1">{`${row.completedChunks ?? 0}/${row.totalChunks}`}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'createdDate',
      label: copy.columns.requested,
      render: (_v, row) => formatDate(row.createdDate),
    },
    {
      key: 'completedDate',
      label: copy.columns.completed,
      render: (_v, row) => formatDate(row.completedDate),
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <MasterTable<ReportJob>
        columns={columns}
        data={jobs}
        loading={loading}
        getRowKey={(row) => row.reportRequestId}
        paginationConfig={{ enabled: false }}
        renderActions={(row) =>
          row.downloadAvailable ? (
            <div className="flex items-center gap-2">
              {/* Preview button */}
              <PreviewButton
                size="xs"
                variant="secondary"
                onClick={() => onPreview?.(row.reportRequestId)}
                title={copy.previewTitle}
              >
                {copy.preview}
              </PreviewButton>
              {/* Download button */}
              <a
                href={`/api/designer-report-download/${encodeURIComponent(row.reportRequestId)}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#004c8c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003a6e] transition-colors shadow-sm"
              >
                {copy.download}
              </a>
            </div>
          ) : (
            <Badge variant="secondary" className="bg-transparent border-none text-gray-400 hover:bg-transparent px-0">-</Badge>
          )
        }
      />
      {!loading && jobs.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-10">{copy.empty}</p>
      )}
    </div>
  );
}
