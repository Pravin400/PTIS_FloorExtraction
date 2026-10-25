'use client';

import { ErrorPage } from '@/components/common';

interface AppartmentQCErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppartmentQCError({ error, reset }: AppartmentQCErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="ptis.error" />;
}
