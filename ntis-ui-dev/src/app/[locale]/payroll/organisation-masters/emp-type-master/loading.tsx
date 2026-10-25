import React from 'react';
import { LoadingPage } from '@/components/common';

/**
 * Route-level loading boundary for Employee Type Master.
 * Automatically streamed by Next.js while page.tsx resolves server promises.
 */
export default function EmpTypeMasterLoading(): React.ReactElement {
  return <LoadingPage />;
}
