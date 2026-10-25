export type TaxCalculationJobStatus =
  | 'Pending'
  | 'Processing'
  | 'Paused'
  | 'Cancelled'
  | 'Completed'
  | 'Failed';

export interface TaxCalculationProgressDto {
  jobId: string;
  entityType: string;
  societyDetailId: number | null;
  wingDetailId: number | null;
  processedUnits: number;
  totalUnits: number;
  percentComplete: number;
  status: TaxCalculationJobStatus;
  message: string;
  isPaused?: boolean;
}

export interface TaxCalculationCompletedDto {
  jobId: string;
  entityType: string;
  societyDetailId: number | null;
  wingDetailId: number | null;
  totalUnits: number;
  succeededCount: number;
  failedCount: number;
  status?: TaxCalculationJobStatus | string;
  isSuccess?: boolean;
  success?: boolean;
  isCancelled?: boolean;
  durationMs?: number;
  completedAt?: string;
  message?: string;
  summaryMessage?: string;
  failureDetails?: string[];
}

export interface ActiveTaxCalculationJob {
  jobId: string;
  entityType: string;
  societyDetailId: number | null;
  wingDetailId: number | null;
  processedUnits: number;
  totalUnits: number;
  percentComplete: number;
  status: TaxCalculationJobStatus;
  message: string;
  isCompleted?: boolean;
  isSuccess?: boolean;
  isPaused?: boolean;
  isCancelled?: boolean;
  succeededCount?: number;
  failedCount?: number;
  durationMs?: number;
  lastUpdated: number;
}
