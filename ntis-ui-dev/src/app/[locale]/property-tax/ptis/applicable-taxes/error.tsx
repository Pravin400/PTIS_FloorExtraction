'use client';

import ErrorPage from "@/components/common/ErrorPage";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PropertyError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="applicableTaxes.errors.failedToConnect"
    />
  );
}   

