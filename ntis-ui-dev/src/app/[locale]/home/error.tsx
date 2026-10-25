'use client';

import { useEffect } from 'react';
import ErrorPage from '@/components/common/ErrorPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error can be logged to an error reporting service if needed
  }, [error]);

  return (
    <ErrorPage 
      error={error}
      reset={reset}
    />
  );
}
