'use client';

import ErrorPage from '@/components/common/ErrorPage';

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for Configuration Master
 */
export default function Error({ error, reset }: ErrorProps) {
  return (
    <ErrorPage 
      error={error} 
      reset={reset} 
      translationNamespace="common.error"
    />
  );
}
