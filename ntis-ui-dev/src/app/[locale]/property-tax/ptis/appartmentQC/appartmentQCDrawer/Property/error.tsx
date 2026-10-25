'use client';

import { ErrorPage } from '@/components/common';

interface PropertyErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PropertyError({ error, reset }: PropertyErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="ptis.error" />;
}
