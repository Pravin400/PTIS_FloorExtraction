'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchReportJobs as fetchReportJobsAction } from '@/app/[locale]/property-tax/reports/actions';
import type { ReportJob, ReportJobStatus } from '@/types/report.types';

const POLL_ACTIVE_MS = 2_000;
const POLL_IDLE_MS = 15_000;
const IN_PROGRESS: ReadonlySet<ReportJobStatus> = new Set([
  'Pending',
  'Processing',
  'Retrying',
]);

function hasInProgress(jobs: ReportJob[]): boolean {
  return jobs.some((job) => IN_PROGRESS.has(job.status));
}

/** Loads and polls the current user's HTML report jobs. */
export function useReportJobs(
  initialJobs: ReportJob[] = [],
  fetchJobs?: (take?: number) => Promise<ReportJob[]>,
) {
  const [jobs, setJobs] = useState<ReportJob[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(initialJobs.length === 0);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const load = useCallback(async () => {
    let keepPolling = true;
    try {
      const list = fetchJobs
        ? await fetchJobs(25)
        : await fetchReportJobsAction(25);
      if (!mountedRef.current) return;
      setJobs(list);
      keepPolling = hasInProgress(list);
    } catch {
      // Keep polling after transient request failures.
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        clearTimer();
        const nextDelay = keepPolling ? POLL_ACTIVE_MS : POLL_IDLE_MS;
        timerRef.current = setTimeout(load, nextDelay);
      }
    }
  }, [clearTimer, fetchJobs]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [load, clearTimer]);

  return { jobs, isLoading, refresh };
}
