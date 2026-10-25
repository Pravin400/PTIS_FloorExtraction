'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { MasterTable } from '@/components/common/MasterTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DashboardCard } from '@/components/common/DashboardCard';
import {
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchJobPropertiesClient, fetchJobStatusClient } from '@/lib/api/add-taxes/operations.client';
import { getProgressPanelColumns } from './ExecutionProgressPanelColumns';
import { logger } from '@/lib/utils/logger';
import type { JobPropertyItem } from '@/types/addTaxes.types';

interface JobPropertiesResult {
  items?: JobPropertyItem[];
  totalCount?: number;
}

interface ExecutionProgressPanelProps {
  jobId: string;
  totalRecords: number;
  onComplete?: () => void;
}

export function ExecutionProgressPanel({ jobId, totalRecords, onComplete }: ExecutionProgressPanelProps) {
  const t = useTranslations('addTaxes');
  const [isExpanded, setIsExpanded] = useState(true);
  const [processed, setProcessed] = useState(0);
  const [added, setAdded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [status, setStatus] = useState<'InProgress' | 'Completed'>('InProgress');
  const [totalJobRecords, setTotalJobRecords] = useState(totalRecords);
  const [totalLogCount, setTotalLogCount] = useState(0);

  const [logs, setLogs] = useState<JobPropertyItem[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const hasCompletedRef = useRef<Record<string, boolean>>({});

  const pageParam = searchParams.get('jobPage');
  const pageSizeParam = searchParams.get('jobPageSize');

  const pageNumber = pageParam ? Number(pageParam) : 1;
  const pageSize = pageSizeParam ? Number(pageSizeParam) : 10;

  const setPageNumber = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('jobPage', String(page));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setPageSize = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('jobPage', '1');
    params.set('jobPageSize', String(size));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Real progress polling from API
  useEffect(() => {
    const numericJobId = jobId.split('-').pop() || '';
    if (!numericJobId) return;

    let isSubscribed = true;

    const fetchProgress = async () => {
      try {
        // Fetch overall status first from status API
        const statusRes = await fetchJobStatusClient(numericJobId);
        if (!isSubscribed) return;

        if (statusRes?.success && statusRes.data) {
          const statusData = statusRes.data;
          setProcessed(statusData.processed);
          setAdded(statusData.success);
          setFailed(statusData.failed);
          if (statusData.total > 0) {
            setTotalJobRecords(statusData.total);
          }

          const backendStatus = statusData.status?.toLowerCase();
          if (['completed', 'success'].includes(backendStatus)) {
            setStatus('Completed');
            if (!hasCompletedRef.current[jobId]) {
              hasCompletedRef.current[jobId] = true;
              onCompleteRef.current?.();
            }
          } else {
            setStatus('InProgress');
          }
        }

        // Fetch logs for the master table
        const propertiesRes = await fetchJobPropertiesClient(numericJobId, pageNumber, pageSize) as JobPropertiesResult | null;
        if (!isSubscribed) return;

        if (propertiesRes && propertiesRes.items) {
          setLogs(propertiesRes.items);
          setTotalLogCount(propertiesRes.totalCount || 0);
        }
      } catch (e) {
        logger.error('Failed to fetch job progress details', { error: e as Error });
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [jobId, pageNumber, pageSize]);

  const percentage = totalJobRecords > 0 ? Math.min(100, Math.floor((processed / totalJobRecords) * 100)) : 0;
  const pending = Math.max(0, totalJobRecords - processed);

  const columns = getProgressPanelColumns(t);

  return (
    <Card className="border border-blue-200 bg-[#F4F8FE] mb-6 overflow-hidden p-2 py-4 mb-0">
      {/* Header (Always visible) */}
      <div
        className="px-2 py-1 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500 animate-spin-slow" />
            <h3 className="text-lg font-semibold text-gray-800">{t('progressPanel.title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {status === 'InProgress' ? t('progressPanel.processing') : t('progressPanel.completed')}
            </span>
            {status === 'InProgress' ? (
              <StatusBadge variant="pending" label={t('progressPanel.inProgress')} />
            ) : (
              <StatusBadge variant="status" value={true} activeLabel={t('progressPanel.completed')} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs text-gray-500 font-medium">{jobId}</div>
          <div className="flex items-center gap-3 w-48">
            <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-xs font-bold text-[#1E3A8A] w-8">{percentage}%</div>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-blue-100 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-bold text-gray-900">{t('progressPanel.propertiesProcessed', { processed, total: totalJobRecords })}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t('progressPanel.expandListNotice')}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-5 gap-4 mb-2">
            <DashboardCard
              label={t('progressPanel.stats.total')}
              value={totalJobRecords}
              valueColor="text-gray-800"
            />
            <DashboardCard
              label={t('progressPanel.stats.processed')}
              value={processed}
              valueColor="text-blue-600"
            />
            <DashboardCard
              label={t('progressPanel.stats.added')}
              value={added}
              valueColor="text-green-600"
            />
            <DashboardCard
              label={t('progressPanel.stats.failed')}
              value={failed}
              valueColor="text-red-500"
            />
            <DashboardCard
              label={t('progressPanel.stats.pending')}
              value={pending}
              valueColor="text-orange-500"
            />
          </div>

          {/* MasterTable */}
          <MasterTable
            columns={columns}
            data={logs}
            totalCount={totalLogCount}
            loading={status === 'InProgress' && logs.length === 0}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={Math.ceil(totalLogCount / pageSize)}
            onPageChange={setPageNumber}
            onPageSizeChange={setPageSize}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            height="sm"
          />
        </div>
      )}
    </Card>
  );
}
