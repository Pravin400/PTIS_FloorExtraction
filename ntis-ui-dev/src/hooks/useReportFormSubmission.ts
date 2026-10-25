'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { CreateReportRequest, ReportDefinition, ReportParamValues } from '@/types/report.types';


interface UseReportFormSubmissionOptions {
  reportCode: string;
  paramValues: ReportParamValues;
  selectedDefinition: ReportDefinition | undefined;
  setIsSubmitting: (v: boolean) => void;
  queuedMessage: string;
  errorMessage: string;
  onQueued?: () => void;
  createReportRequest?: CreateReportRequest;
}

export function useReportFormSubmission({
  reportCode,
  paramValues,
  selectedDefinition,
  setIsSubmitting,
  queuedMessage,
  errorMessage,
  onQueued,
  createReportRequest,
}: UseReportFormSubmissionOptions) {
  const submitReport = useCallback(async () => {
    if (!selectedDefinition) return;

    // Send only non-empty values as parameters
    const parameters: Record<string, string> = {};
    for (const [key, value] of Object.entries(paramValues)) {
      if (value.trim()) parameters[key] = value.trim();
    }

    setIsSubmitting(true);
    try {
      if (!createReportRequest) {
        throw new Error('createReportRequest server action is not provided');
      }

      const result = await createReportRequest(
        reportCode,
        parameters,
      );

      if (!result.success) {
        toast.error(errorMessage);
        return;
      }

      toast.info(queuedMessage);
      onQueued?.();
    } catch {
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [reportCode, paramValues, selectedDefinition, setIsSubmitting, queuedMessage, errorMessage, onQueued, createReportRequest]);

  return { submitReport };
}
