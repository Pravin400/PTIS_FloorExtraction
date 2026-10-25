'use client';

import React from 'react';
import { ErrorPage } from '@/components/common';

interface EmpTypeMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for Employee Type Master.
 * Catches unhandled runtime errors and provides recovery without full page reload.
 */
export default function EmpTypeMasterError({
  error,
  reset,
}: EmpTypeMasterErrorProps): React.ReactElement {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
