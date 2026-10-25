import React from 'react';
import { LoadingPage } from '@/components/common';

/**
 * Route-level loading boundary for Employee Status Master.
 * Automatically streamed by Next.js while page.tsx resolves server promises.
 */
export default function EmpStatusMasterLoading(): React.ReactElement {
  return <LoadingPage />;
}
