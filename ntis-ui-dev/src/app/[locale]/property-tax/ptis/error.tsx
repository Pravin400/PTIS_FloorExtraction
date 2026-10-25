'use client';

import { ErrorPage } from '@/components/common';

interface PtisErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PtisError({ error, reset }: PtisErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="ptis.error" />;
}
