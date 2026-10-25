"use client";

import { ErrorPage } from '@/components/common';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OpenPlotEditDeleteError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="ptis_RVRateMaster.openPlotRateMaster.error"
    />
  );
}
