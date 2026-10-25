/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { fetchServerTimeClient, fetchAuditListClient } from '@/lib/api/add-taxes/operations.client';

export interface ActiveJob {
  jobId: string;
  total: number;
  scheduledTime?: string;
}

interface UseActiveJobMonitorProps {
  financeYearId?: string;
  refreshStats: () => void;
}

/**
 * Owns the "is a job currently running" polling (and the one-time clock-skew measurement) that
 * used to live directly inside AddTaxesConsole.tsx — moved out so the component only ever consumes
 * a hook's returned state/functions, never imports the API-client layer (operations.client.ts)
 * directly, keeping the same facade boundary every other consumer in this module already follows
 * (useScopeSelection, useExcelImport, useAuditMonitor).
 *
 * Pure extraction — same state, same effects, same dependency arrays as before; no behavior change.
 */
export function useActiveJobMonitor({ financeYearId, refreshStats }: UseActiveJobMonitorProps) {
  const t = useTranslations('addTaxes');

  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [runningJobsCount, setRunningJobsCount] = useState<number | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  const triggerAuditRefresh = useCallback(() => {
    setAuditRefreshKey((prev) => prev + 1);
  }, []);

  // Tracks whether the previous checkActiveJobs tick found an active job, so refreshStats() only
  // fires on a genuine start/finish transition instead of on every 10s poll tick regardless of
  // whether anything changed — that unconditional call was dragging the expensive
  // initOperationsAction stats query along on a perpetual loop (it's a Server Action, so every call
  // re-renders page.tsx's whole body, including that slow query, as a side effect).
  const hadActiveJobRef = useRef(false);

  useEffect(() => {
    const fetchSkew = async () => {
      try {
        const clientRequestTime = Date.now();
        const serverTimeStr = await fetchServerTimeClient();
        if (serverTimeStr) {
          const oneWayLatency = (Date.now() - clientRequestTime) / 2;
          const serverTime = new Date(new Date(serverTimeStr).getTime() + oneWayLatency);
          const clientTime = new Date();
          const skewMs = clientTime.getTime() - serverTime.getTime();
          window.sessionStorage.setItem('ntis_clock_skew_ms', String(skewMs));
        }
      } catch (err) {
        logger.error('Failed to fetch initial clock skew', { error: err as Error });
      }
    };
    void fetchSkew();
  }, []);

  useEffect(() => {
    const checkActiveJobs = async () => {
      try {
        const query: Record<string, string | number> = { PageSize: 100 };
        if (financeYearId) query.FinanceYearId = financeYearId;
        const res = await fetchAuditListClient(query);
        if (res?.items) {
          const activeJobs = res.items.filter((j: any) =>
            ['inprogress', 'running', 'pending', 'started', 'scheduled'].includes(j.status?.toLowerCase())
          );
          setRunningJobsCount(activeJobs.length);

          const inProgressJob = activeJobs.find((j: any) =>
            ['inprogress', 'running', 'pending', 'started'].includes(j.status?.toLowerCase())
          );
          if (inProgressJob) {
            const parts = inProgressJob.records?.split('/') || [];
            const total = parts[1] ? Number(parts[1].trim()) : 0;
            setActiveJob({ jobId: inProgressJob.jobId, total });
            setShowProgress(true);
            if (!hadActiveJobRef.current) {
              refreshStats();
            }
            hadActiveJobRef.current = true;
          } else {
            setActiveJob((prevActive) => {
              if (prevActive) {
                triggerAuditRefresh();
              }
              return null;
            });
            if (hadActiveJobRef.current) {
              refreshStats();
            }
            hadActiveJobRef.current = false;
          }
        } else {
          setActiveJob(null);
          setRunningJobsCount(0);
        }
      } catch (err) {
        logger.error('Failed to check active jobs', { error: err as Error });
      }
    };

    checkActiveJobs();
    const interval = setInterval(checkActiveJobs, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financeYearId, auditRefreshKey]);

  useEffect(() => {
    if (!activeJob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowProgress(false);
      return;
    }
    if (!activeJob.scheduledTime) {
      setShowProgress(true);
      return;
    }
    const scheduledDate = new Date(activeJob.scheduledTime);
    setShowProgress(scheduledDate.getTime() <= Date.now());
  }, [activeJob]);

  useEffect(() => {
    if (!activeJob || !activeJob.scheduledTime) return;

    const scheduledDate = new Date(activeJob.scheduledTime);
    const now = new Date();
    const delay = scheduledDate.getTime() - now.getTime();

    if (delay <= 0) return;

    const timer = setTimeout(() => {
      setShowProgress(true);
      toast.info(t('messages.scheduledJobStarted', { jobId: activeJob.jobId }));
    }, delay);

    return () => clearTimeout(timer);
  }, [activeJob, t]);

  return {
    activeJob,
    setActiveJob,
    runningJobsCount,
    showProgress,
    auditRefreshKey,
    triggerAuditRefresh,
  };
}
