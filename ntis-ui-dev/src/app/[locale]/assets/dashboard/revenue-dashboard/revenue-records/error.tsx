'use client';

import { ErrorPage } from '@/components/common';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RevenueRecordsError({ error, reset }: ErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
