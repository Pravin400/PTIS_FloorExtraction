'use client';

import { useEffect } from 'react';
import { ErrorPage } from '@/components/common';
import { useAssessmentYearRangeError } from '@/components/modules/property-tax/assessment-year-range/AssessmentYearRangeErrorContext';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { setHasError } = useAssessmentYearRangeError();

  useEffect(() => {
    setHasError(true);
    return () => setHasError(false);
  }, [setHasError]);

  return (
    <ErrorPage 
      error={error} 
      reset={reset} 
      translationNamespace="assessmentYearRange.capitalValue.error" 
    />
  );
}
