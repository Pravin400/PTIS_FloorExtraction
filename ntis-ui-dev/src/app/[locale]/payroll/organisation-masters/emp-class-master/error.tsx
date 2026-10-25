'use client';

import { ErrorPage } from '@/components/common';

interface EmpClassMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EmpClassMasterError({ error, reset }: EmpClassMasterErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
