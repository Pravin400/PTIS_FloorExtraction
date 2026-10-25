'use client';

import { ErrorPage } from '@/components/common';

interface DepartmentMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DepartmentMasterError({ error, reset }: DepartmentMasterErrorProps) {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
