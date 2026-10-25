"use client";

import { ErrorPage } from '@/components/common';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AddTapStatusError({ error, reset }: ErrorProps) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      translationNamespace="waterConnectionMaster.tapStatus.error"
    />
  );
}
