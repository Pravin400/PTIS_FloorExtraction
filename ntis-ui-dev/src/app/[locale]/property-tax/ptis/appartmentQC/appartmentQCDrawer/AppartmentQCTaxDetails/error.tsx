'use client';

import { ErrorPage } from '@/components/common';

interface AppartmentQCTaxDetailsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppartmentQCTaxDetailsError({ error, reset }: AppartmentQCTaxDetailsErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="ptis.error" />;
}
