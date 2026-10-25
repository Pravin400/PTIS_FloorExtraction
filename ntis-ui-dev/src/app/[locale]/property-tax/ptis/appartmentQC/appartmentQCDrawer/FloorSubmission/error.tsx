'use client';

import { ErrorPage } from '@/components/common';

interface FloorSubmissionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FloorSubmissionError({ error, reset }: FloorSubmissionErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="ptis.error" />;
}
