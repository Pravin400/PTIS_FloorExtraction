import React from 'react';
import { LoadingPage } from '@/components/common';

/**
 * Route-level loading boundary for Zone / Division Office Master.
 * Automatically streamed by Next.js while page.tsx resolves server promises.
 */
export default function ZoneDivisionMasterLoading(): React.ReactElement {
  return <LoadingPage />;
}
