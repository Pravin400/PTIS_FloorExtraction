'use client';

import React from 'react';
import { ErrorPage } from '@/components/common';

interface ZoneDivisionMasterErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for Zone / Division Office Master.
 * Catches unhandled runtime errors and provides recovery without full page reload.
 */
export default function ZoneDivisionMasterError({
  error,
  reset,
}: ZoneDivisionMasterErrorProps): React.ReactElement {
  return <ErrorPage error={error} reset={reset} translationNamespace="common.error" />;
}
