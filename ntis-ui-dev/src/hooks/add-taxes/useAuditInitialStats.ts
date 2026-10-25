import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import type { JobAuditItem } from '@/components/modules/property-tax/add-taxes/auditMonitorTab/AuditMonitorColumns';
import { fetchAuditListClient } from '@/lib/api/add-taxes/operations.client';

interface AuditListResult {
  items?: JobAuditItem[];
  totalCount?: number;
  totalPages?: number;
}

interface UseAuditInitialStatsProps {
  financeYearId?: string;
  refreshKey?: number;
  manualRefreshKey: number;
}

/**
 * Owns the Audit & Monitor tab's "initial stats + job-code suggestions" fetch (the dashboard-style
 * Total/Completed/Running/Failed tiles and the job-code filter dropdown's options) — split out of
 * useAuditMonitor.ts verbatim (pure relocation, no logic change) per review feedback on that hook's
 * size. `setStats` is still exposed, since useAuditMonitor.ts's own paginated-jobs fetch also
 * updates the `total` tile when no filters are applied — that cross-hook write is unchanged.
 */
export function useAuditInitialStats({ financeYearId, refreshKey, manualRefreshKey }: UseAuditInitialStatsProps) {
  const [allJobCodes, setAllJobCodes] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, running: 0, failed: 0 });

  // Fetch initial suggestion list and statistics ONCE on mount / financeYearId change / refreshKey change
  useEffect(() => {
    let isCancelled = false;
    const fetchInitialData = async () => {
      try {
        const baseQuery: Record<string, string | number> = {};
        if (financeYearId) {
          baseQuery.FinanceYearId = financeYearId;
        }

        // Fetch the first page only — the 5 separate per-Status count queries below are now only
        // fetched as a fallback (see isAllItemsComplete), not eagerly in parallel with this, since
        // they were redundant with data this call already fetches in the common case (confirmed by
        // this same code's own "100% precision" comment further down).
        const firstPageRes: AuditListResult | null = await fetchAuditListClient({ ...baseQuery, PageNumber: 1, PageSize: 100 });

        if (isCancelled) return;

        let allItems = firstPageRes?.items || [];
        const totalCountFromApi = typeof firstPageRes?.totalCount === 'number' ? firstPageRes.totalCount : allItems.length;
        const totalPages = firstPageRes?.totalPages || Math.ceil(totalCountFromApi / 100);

        // If there are additional pages (up to 10 pages / 1000 items), fetch them to build complete job code suggestions & item list
        if (totalPages > 1 && totalPages <= 10) {
          const remainingPromises = [];
          for (let p = 2; p <= totalPages; p++) {
            remainingPromises.push(fetchAuditListClient({ ...baseQuery, PageNumber: p, PageSize: 100 }));
          }
          const remainingResults: (AuditListResult | null)[] = await Promise.all(remainingPromises);
          if (isCancelled) return;
          const additionalItems = remainingResults.flatMap((r) => r?.items || []);
          allItems = [...allItems, ...additionalItems];
        }

        const codes = Array.from(new Set(allItems.map((j) => j.jobId).filter(Boolean)));
        setAllJobCodes(codes);

        // If allItems contains all records, count directly from allItems for 100% precision — no
        // extra network calls needed. Only when it's genuinely truncated (more than the 1000-item/
        // 10-page cap above) do we fall back to 5 separate live per-Status count queries.
        const isAllItemsComplete = allItems.length >= totalCountFromApi;
        let computedCompleted: number;
        let computedRunning: number;
        let computedFailed: number;

        if (isAllItemsComplete) {
          computedCompleted = allItems.filter((j) => ['completed', 'success'].includes(j.status?.toLowerCase())).length;
          computedRunning = allItems.filter((j) => ['running', 'inprogress', 'pending', 'started', 'scheduled'].includes(j.status?.toLowerCase())).length;
          computedFailed = allItems.filter((j) => ['failed', 'error'].includes(j.status?.toLowerCase())).length;
        } else {
          const [completedRes, inProgressRes, pendingRes, scheduledRes, failedRes]: (AuditListResult | null)[] = await Promise.all([
            fetchAuditListClient({ ...baseQuery, Status: 'Completed', PageNumber: 1, PageSize: 1 }),
            fetchAuditListClient({ ...baseQuery, Status: 'InProgress', PageNumber: 1, PageSize: 1 }),
            fetchAuditListClient({ ...baseQuery, Status: 'Pending', PageNumber: 1, PageSize: 1 }),
            fetchAuditListClient({ ...baseQuery, Status: 'Scheduled', PageNumber: 1, PageSize: 1 }),
            fetchAuditListClient({ ...baseQuery, Status: 'Failed', PageNumber: 1, PageSize: 1 }),
          ]);
          if (isCancelled) return;

          const statusCompletedCount = completedRes?.totalCount ?? 0;
          const statusInProgressCount = inProgressRes?.totalCount ?? 0;
          const statusPendingCount = pendingRes?.totalCount ?? 0;
          const statusScheduledCount = scheduledRes?.totalCount ?? 0;
          const statusFailedCount = failedRes?.totalCount ?? 0;
          const totalRunningFromStatus = statusInProgressCount + statusPendingCount + statusScheduledCount;

          computedCompleted = Math.max(statusCompletedCount, allItems.filter((j) => ['completed', 'success'].includes(j.status?.toLowerCase())).length);
          computedRunning = Math.max(totalRunningFromStatus, allItems.filter((j) => ['running', 'inprogress', 'pending', 'started', 'scheduled'].includes(j.status?.toLowerCase())).length);
          computedFailed = Math.max(statusFailedCount, allItems.filter((j) => ['failed', 'error'].includes(j.status?.toLowerCase())).length);
        }

        setStats({
          total: totalCountFromApi,
          completed: computedCompleted,
          running: computedRunning,
          failed: computedFailed,
        });
      } catch (err) {
        logger.error('Failed to fetch initial audit data client-side', { error: err as Error });
        if (!isCancelled) {
          setAllJobCodes([]);
          setStats({ total: 0, completed: 0, running: 0, failed: 0 });
        }
      }
    };
    fetchInitialData();
    return () => {
      isCancelled = true;
    };
  }, [financeYearId, refreshKey, manualRefreshKey]);

  return { allJobCodes, stats, setStats };
}
