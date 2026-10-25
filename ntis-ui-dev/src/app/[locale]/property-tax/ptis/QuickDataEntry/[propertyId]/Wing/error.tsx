'use client';

import ErrorPage from "@/components/common/ErrorPage";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WingError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="quickDataEntry.wing.errors.failedToConnect"
    />
  );
}
