"use client";

import { ErrorPage } from '@/components/common';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RVRateMasterError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="ptis_RVRateMaster.rvRateMaster.error"
    />
  );
}
