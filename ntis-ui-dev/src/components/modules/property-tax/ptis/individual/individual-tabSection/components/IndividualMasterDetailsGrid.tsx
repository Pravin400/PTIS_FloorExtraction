'use client';

import React, { memo } from 'react';
import type { IndividualPropertyMasterData } from '@/types/property-tax/individual';
import { IndividualMasterOwnerColumn } from './IndividualMasterOwnerColumn';
import { IndividualMasterPropertyColumn } from './IndividualMasterPropertyColumn';
import { IndividualMasterContactColumn } from './IndividualMasterContactColumn';

export interface IndividualMasterDetailsGridProps {
  data?: IndividualPropertyMasterData;
}

/**
 * Pure presentational 3-column grid for Individual Property Master details.
 * Modularized into focused subcomponents for maintainability and small file size.
 */
export const IndividualMasterDetailsGrid: React.FC<IndividualMasterDetailsGridProps> = memo(({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1.12fr_1.3fr] lg:grid-cols-[1.05fr_1.12fr_1.28fr] xl:grid-cols-[1.08fr_1.1fr_1.32fr] 2xl:grid-cols-[1.08fr_1.08fr_1.44fr] gap-x-2.5 lg:gap-x-3 xl:gap-x-4 2xl:gap-x-4.5 gap-y-1 text-[11px] sm:text-[11.5px] xl:text-[12px] pt-0.5 min-w-0">
      {/* COLUMN 1: Owner & Holder Details */}
      <IndividualMasterOwnerColumn data={data} />

      {/* COLUMN 2: Property & Zone Identifiers */}
      <IndividualMasterPropertyColumn data={data} />

      {/* COLUMN 3: Contact & Area Dimensions */}
      <IndividualMasterContactColumn data={data} />
    </div>
  );
});

IndividualMasterDetailsGrid.displayName = 'IndividualMasterDetailsGrid';

export default IndividualMasterDetailsGrid;
