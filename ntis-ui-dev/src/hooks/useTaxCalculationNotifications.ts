'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  TaxCalculationProgressDto,
  TaxCalculationCompletedDto,
  ActiveTaxCalculationJob,
} from '@/types/tax-calculation-notification.types';
import {
  pauseTaxCalculationJobAction,
  resumeTaxCalculationJobAction,
  cancelTaxCalculationJobAction,
} from '@/app/actions/tax-calculation-job.actions';

export function useTaxCalculationNotifications(options?: {
  societyDetailId?: number | null;
  wingDetailId?: number | null;
  onCompleted?: (completed: TaxCalculationCompletedDto) => void;
  onProgress?: (progress: TaxCalculationProgressDto) => void;
}) {
  const [activeJobs, setActiveJobs] = useState<Record<string, ActiveTaxCalculationJob>>({});
  const sseRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const dismissJob = useCallback((jobId: string) => {
    setActiveJobs((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }, []);

  const pauseJob = useCallback(async (jobId: string): Promise<boolean> => {
    // Optimistically update status to Paused
    setActiveJobs((prev) => {
      if (!prev[jobId]) return prev;
      return {
        ...prev,
        [jobId]: {
          ...prev[jobId],
          status: 'Paused',
          isPaused: true,
          lastUpdated: Date.now(),
        },
      };
    });

    const res = await pauseTaxCalculationJobAction(jobId);
    return res.success;
  }, []);

  const resumeJob = useCallback(async (jobId: string): Promise<boolean> => {
    // Optimistically update status to Processing
    setActiveJobs((prev) => {
      if (!prev[jobId]) return prev;
      return {
        ...prev,
        [jobId]: {
          ...prev[jobId],
          status: 'Processing',
          isPaused: false,
          lastUpdated: Date.now(),
        },
      };
    });

    const res = await resumeTaxCalculationJobAction(jobId);
    return res.success;
  }, []);

  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    // Optimistically update status to Cancelled
    setActiveJobs((prev) => {
      if (!prev[jobId]) return prev;
      return {
        ...prev,
        [jobId]: {
          ...prev[jobId],
          status: 'Cancelled',
          isCancelled: true,
          isCompleted: true,
          isSuccess: false,
          lastUpdated: Date.now(),
        },
      };
    });

    const res = await cancelTaxCalculationJobAction(jobId);
    return res.success;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isLoginPath = pathname.includes('/login');
      const hasAuthCookie =
        document.cookie.includes('auth_token=') || document.cookie.includes('is_logged_in=true');
      if (isLoginPath || !hasAuthCookie) return;
    }

    const sse = new EventSource('/api/tax-calculation-events');
    sseRef.current = sse;

    sse.onerror = () => {
      sse.close();
      if (sseRef.current === sse) {
        sseRef.current = null;
      }
    };

    const handleProgress = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as TaxCalculationProgressDto;
        if (!data || !data.jobId) return;

        const isPaused = data.status === 'Paused' || data.isPaused === true;

        setActiveJobs((prev) => {
          return {
            ...prev,
            [data.jobId]: {
              ...(prev[data.jobId] || {}),
              jobId: data.jobId,
              entityType: data.entityType,
              societyDetailId: data.societyDetailId,
              wingDetailId: data.wingDetailId,
              processedUnits: data.processedUnits,
              totalUnits: data.totalUnits,
              percentComplete: data.percentComplete,
              status: data.status,
              isPaused,
              message: data.message,
              lastUpdated: Date.now(),
            },
          };
        });

        window.dispatchEvent(
          new CustomEvent('tax-recalculation-progress', { detail: data })
        );

        if (optionsRef.current?.onProgress) {
          optionsRef.current.onProgress(data);
        }
      } catch {
        // ignore parse error
      }
    };

    const handleCompleted = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data) as TaxCalculationCompletedDto;
        if (!data || !data.jobId) return;

        const isCancelled = data.status === 'Cancelled' || data.isCancelled === true;
        const isSuccess = !isCancelled && (data.isSuccess ?? data.success ?? (data.failedCount === 0));
        const message =
          data.message ||
          data.summaryMessage ||
          (isCancelled
            ? 'Tax calculation terminated by user.'
            : isSuccess
            ? 'Tax recalculation completed successfully.'
            : 'Tax recalculation encountered errors.');
        const succeededCount =
          data.succeededCount ??
          (isSuccess ? data.totalUnits : Math.max(0, data.totalUnits - (data.failedCount ?? 0)));
        const failedCount =
          data.failedCount ?? (isSuccess ? 0 : Math.max(0, data.totalUnits - succeededCount));

        setActiveJobs((prev) => {
          return {
            ...prev,
            [data.jobId]: {
              ...(prev[data.jobId] || {}),
              jobId: data.jobId,
              entityType: data.entityType,
              societyDetailId: data.societyDetailId,
              wingDetailId: data.wingDetailId,
              processedUnits: succeededCount,
              totalUnits: data.totalUnits,
              percentComplete: 100,
              status: isCancelled ? 'Cancelled' : isSuccess ? 'Completed' : 'Failed',
              message,
              isCompleted: true,
              isSuccess,
              isCancelled,
              isPaused: false,
              succeededCount,
              failedCount,
              durationMs: data.durationMs,
              lastUpdated: Date.now(),
            },
          };
        });

        // Auto-dismiss completed job after 8 seconds (if not cancelled/failed, or give user time to read)
        setTimeout(() => {
          if (mountedRef.current) {
            dismissJob(data.jobId);
          }
        }, isCancelled || !isSuccess ? 12000 : 8000);

        window.dispatchEvent(
          new CustomEvent('tax-recalculation-completed', { detail: data })
        );

        if (optionsRef.current?.onCompleted) {
          optionsRef.current.onCompleted(data);
        }
      } catch {
        // ignore parse error
      }
    };

    sse.addEventListener('progress', handleProgress);
    sse.addEventListener('completed', handleCompleted);

    return () => {
      mountedRef.current = false;
      sse.removeEventListener('progress', handleProgress);
      sse.removeEventListener('completed', handleCompleted);
      sse.close();
      sseRef.current = null;
    };
  }, [dismissJob]);

  const jobsList = Object.values(activeJobs);
  const isCalculating = jobsList.some((j) => !j.isCompleted);

  return {
    activeJobs,
    jobsList,
    isCalculating,
    dismissJob,
    pauseJob,
    resumeJob,
    cancelJob,
  };
}
