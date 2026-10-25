'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FloorDetailsTable } from '@/components/common';
import { ShowTaxOnExpand } from '@/components/modules/property-tax/ptis/ShowTaxOnExpand';
import {
  getRateableColumns,
  getRateableDetails,
  mapRateableRow,
} from '../RateableColumns';
import type { RateableValueResponse, RateableRow } from '@/types/rateableValue.types';
import { parseExpandedRowIds } from '@/lib/utils/ptis';
import { PTIS_TABLE_PRESETS } from '@/components/modules/property-tax/ptis/constants';

interface RateableTaxTableProps {
  rateableData: RateableValueResponse | null;
  searchParams: Record<string, string | string[] | undefined>;
  locale: string;
  propertyId?: number;
}

export const RateableTaxTable: React.FC<RateableTaxTableProps> = ({ rateableData, searchParams, locale, propertyId }) => {
  const t = useTranslations('ptis.modules.PtisTaxDetails');
  const rootT = useTranslations('ptis');
  const details = getRateableDetails(rateableData);
  const rows = details.map(mapRateableRow);

  const expandedParam = Array.isArray(searchParams.rateableExpand)
    ? searchParams.rateableExpand[searchParams.rateableExpand.length - 1]
    : searchParams.rateableExpand;

  const expandedRowIds = parseExpandedRowIds(expandedParam);

  return (
    <div className={PTIS_TABLE_PRESETS.container}>
      <FloorDetailsTable
        data={rows}
        columns={getRateableColumns(rootT)}
        emptyMessage={t('noRateableRows')}
        expandedLabel={t('viewTaxBreakdown')}
        expandedRowIds={expandedRowIds}
        getEditHref={propertyId ? (row) => {
          const params = new URLSearchParams();
          params.set('floorId', String(row.id));
          if (searchParams.wardNo) params.set('wardNo', String(searchParams.wardNo));
          if (searchParams.wardId) params.set('wardId', String(searchParams.wardId));
          if (searchParams.propertyNo) params.set('propertyNo', String(searchParams.propertyNo));
          if (searchParams.partitionNo) params.set('partitionNo', String(searchParams.partitionNo));
          params.set('returnTab', 'individual');
          params.set('from', 'individual');
          return `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/FloorSubmission?${params.toString()}`;
        } : undefined}
        editTooltip={typeof rootT?.has === 'function' && rootT.has('floor.editFloor') ? rootT('floor.editFloor') : 'Edit Floor'}
        tableClassName="w-full min-w-[1500px]"
        headerBadgeClassName={PTIS_TABLE_PRESETS.headerBadge}
        cellClassName={PTIS_TABLE_PRESETS.cellText}
        containerClassName="overflow-x-auto"
        heightRows={3}
        renderExpanded={(row: RateableRow) => <ShowTaxOnExpand locale={locale} taxes={row.taxes} />}
      />
    </div>
  );
};