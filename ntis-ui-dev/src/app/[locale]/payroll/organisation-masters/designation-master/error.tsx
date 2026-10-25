'use client';

import { ErrorPage } from '@/components/common';

interface DesignationMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DesignationMasterError({ error, reset }: DesignationMasterErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
