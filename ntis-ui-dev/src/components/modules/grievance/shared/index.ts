import dynamic from 'next/dynamic';
import React from 'react';
import type { AmravatiMapHandle, AmravatiMapProps } from './AmravatiMap';

/**
 * Shared Cross-Persona Grievance UI Components
 * Symmetrical Layer: src/components/modules/grievance/shared/
 */

export type { AmravatiMapHandle, AmravatiMapProps };
export const AmravatiMap = dynamic<AmravatiMapProps & React.RefAttributes<AmravatiMapHandle>>(
  () => import('./AmravatiMap').then((mod) => mod.AmravatiMap),
  { ssr: false }
);

export * from './ComplaintDetailCard';
export * from './GrievanceSidebar';

// Department sub-module (absorbed into grievance for NTIS self-containment)
export * from './department';
export * from './GrievanceModalShell';
