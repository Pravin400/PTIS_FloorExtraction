import { fetchPropertyMediaJobStatusAction } from "@/app/[locale]/property-tax/property-media/action";
import {
  JobStatusItem,
  MEDIA_JOB_STATUS,
  MediaJobStatus,
} from "@/types/PropertyMedia/PropertyMedia.types";

export interface ToastEmitter {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

export interface PollMediaJobOptions {
  jobId: number;
  recordsCount?: number;
  jobCode?: string;
  toast: ToastEmitter;
  t: (key: string, values?: Record<string, string | number>) => string;
  onStatusChange?: (item: JobStatusItem) => void;
  onCompleted?: (item: JobStatusItem) => void;
  onFailed?: (item: JobStatusItem) => void;
  onCancelled?: (item: JobStatusItem) => void;
  onSettled?: () => void;
}

/**
 * Polls background media upload job status adaptively until a terminal state
 * (Completed, Failed, Cancelled) or timeout is reached.
 *
 * @param options Polling configuration options
 * @returns A cleanup function to cancel the active polling timer.
 */
export function pollMediaJobStatus(options: PollMediaJobOptions): () => void {
  const {
    jobId,
    recordsCount = 1,
    jobCode: fallbackJobCode,
    toast,
    t,
    onStatusChange,
    onCompleted,
    onFailed,
    onCancelled,
    onSettled,
  } = options;

  let timerId: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let consecutiveErrors = 0;
  let isCancelled = false;
  let isSettled = false;
  const maxAttempts = 60; // Max ~4-5 minutes

  const settle = () => {
    if (isSettled) return;
    isSettled = true;
    isCancelled = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    onSettled?.();
  };

  const getDelay = (status: MediaJobStatus, attempt: number): number => {
    // While still in Pending queue, check quickly
    if (status === MEDIA_JOB_STATUS.PENDING) {
      return 1500;
    }

    // If small batch (1-3 images), keep polling fast
    if (recordsCount <= 3) {
      return 2000;
    }

    // Adaptive backoff for larger batches
    if (attempt <= 2) return 2500;
    if (attempt <= 5) return 3500;
    return 5000; // Cap at 5s
  };

  const checkStatus = async () => {
    if (isCancelled) return;
    attempts++;

    try {
      const response = await fetchPropertyMediaJobStatusAction(jobId);
      if (isCancelled) return;

      if (response.success && response.data) {
        consecutiveErrors = 0;
        const job = response.data;
        const currentCode = job.jobCode || fallbackJobCode || `#${job.jobId}`;
        const status = job.status;

        onStatusChange?.(job);

        switch (status) {
          case MEDIA_JOB_STATUS.COMPLETED: {
            settle();
            toast.success(t("uploadDownloadDrawer.status.completed", { jobCode: currentCode }));
            onCompleted?.(job);
            return;
          }

          case MEDIA_JOB_STATUS.FAILED: {
            settle();
            toast.error(t("uploadDownloadDrawer.status.failed", { jobCode: currentCode }));
            onFailed?.(job);
            return;
          }

          case MEDIA_JOB_STATUS.CANCELLED: {
            settle();
            toast.warning(t("uploadDownloadDrawer.status.cancelled", { jobCode: currentCode }));
            onCancelled?.(job);
            return;
          }

          case MEDIA_JOB_STATUS.PENDING:
          case MEDIA_JOB_STATUS.RUNNING:
          default: {
            if (attempts >= maxAttempts) {
              settle();
              toast.info(t("uploadDownloadDrawer.status.timeout", { jobCode: currentCode }));
              return;
            }

            timerId = setTimeout(checkStatus, getDelay(status, attempts));
            return;
          }
        }
      } else {
        consecutiveErrors++;
      }
    } catch {
      consecutiveErrors++;
    }

    if (isCancelled) return;

    if (consecutiveErrors >= 3) {
      settle();
      toast.warning(t("uploadDownloadDrawer.status.statusCheckFailed"));
      return;
    }

    if (attempts >= maxAttempts) {
      settle();
      const currentCode = fallbackJobCode || `#${jobId}`;
      toast.info(t("uploadDownloadDrawer.status.timeout", { jobCode: currentCode }));
      return;
    }

    timerId = setTimeout(checkStatus, getDelay(MEDIA_JOB_STATUS.RUNNING, attempts));
  };

  const initialDelay = recordsCount <= 3 ? 1500 : 2500;
  timerId = setTimeout(checkStatus, initialDelay);

  return () => {
    settle();
  };
}
