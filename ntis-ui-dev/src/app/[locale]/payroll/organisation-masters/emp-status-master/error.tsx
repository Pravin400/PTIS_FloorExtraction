'use client';

import React from 'react';
import { ErrorPage } from '@/components/common';

interface EmpStatusMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for Employee Status Master.
 * Catches unhandled runtime errors and provides recovery without full page reload.
 */
export default function EmpStatusMasterError({
  error,
  reset,
}: EmpStatusMasterErrorProps): React.ReactElement {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
