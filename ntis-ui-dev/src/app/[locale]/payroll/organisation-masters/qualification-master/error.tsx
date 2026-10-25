'use client';

import { ErrorPage } from '@/components/common';

interface QualificationMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * QualificationMasterError
 * Next.js route-level error boundary for Qualification Master.
 */
export default function QualificationMasterError({ error, reset }: QualificationMasterErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
