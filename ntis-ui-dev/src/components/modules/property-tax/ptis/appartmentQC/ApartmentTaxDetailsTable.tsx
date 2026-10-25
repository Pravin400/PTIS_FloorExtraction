'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { ApartmentTaxDetailsItems, DualMethodTaxDetails } from '@/types/apartmentQC.types';
import { MasterTable } from '@/components/common/MasterTable';
import { cn } from '@/lib/utils/cn';
import {
  useTaxColumns,
  useTaxTableData,
  useHasData,
  getTabTranslationKey,
  getSubTabLabel,
  getHeaderGradientClass,
  getRowClassName,
  type TaxRowData,
} from '@/hooks/apartmentQc/useApartmentTaxDetailsTable';
import { useTaxTableColumns } from '@/hooks/apartmentQc/useTaxTableColumns';

/* ============================================================
   TYPE DEFINITIONS
 ============================================================ */

interface ApartmentTaxDetailsTableProps {
  taxDetails: ApartmentTaxDetailsItems | null;
  dualMethodDetails?: DualMethodTaxDetails | null;
  loading?: boolean;
  activeMainTab: string;
  activeSubTab: string;
}

/* ============================================================
   MAIN COMPONENT
 ============================================================ */

/**
 * Table component that displays tax details for apartment properties.
 * Uses MasterTable for consistent styling.
 * Supports Rateable Value, Capital Value, and Dual Method views.
 */
export function ApartmentTaxDetailsTable({
  taxDetails,
  dualMethodDetails,
  loading = false,
  activeMainTab,
  activeSubTab,
}: ApartmentTaxDetailsTableProps) {
  const t = useTranslations('appartmentQC');
  const tPtis = useTranslations('ptis');

  // Use custom hooks for data processing
  const taxColumns = useTaxColumns(taxDetails, dualMethodDetails, activeSubTab);
  const hasData = useHasData(taxDetails, dualMethodDetails, taxColumns, activeSubTab);
  const tableData = useTaxTableData(
    taxDetails,
    dualMethodDetails,
    taxColumns,
    activeSubTab,
    activeMainTab,
    t,
    tPtis
  );

  // Build table columns
  const columns = useTaxTableColumns({
    taxColumns,
    activeSubTab,
    t,
    hasData,
  });

  // Build header title
  const headerTitle = useMemo(() => {
    const tabLabel = tPtis(getTabTranslationKey(activeMainTab));
    const subLabel = getSubTabLabel(activeSubTab, tPtis);
    return `${t('taxDetails.title')} - ${tabLabel} (${subLabel})`;
  }, [t, tPtis, activeMainTab, activeSubTab]);

  // Build subtitle
  const headerSubtitle = useMemo(() => {
    if (!hasData) return undefined;
    if (activeSubTab === 'dual-method') {
      return `${t('taxDetails.subtitle')} - ${tPtis('apartmentTabs.rateable')} / ${tPtis('apartmentTabs.capital')}`;
    }
    return t('taxDetails.subtitle');
  }, [hasData, activeSubTab, t, tPtis]);

  return (
    <div className={cn('w-full', getHeaderGradientClass(activeSubTab), 'rounded-t-xl')}>
      <MasterTable<TaxRowData>
        columns={columns}
        data={tableData}
        loading={loading}
        loadingText={tPtis('apartmentTabs.loading')}
        emptyText={t('taxDetails.noData')}
        headerExtra={
          <div className="flex gap-2 items-center z-0">
            <div className="text-sm font-semibold text-[#1E3A8A]">{headerTitle}</div>
            <span className="text-[#6B7280]">-</span>
            <div className="text-sm text-[#6B7280]">
              {headerSubtitle}
            </div>
          </div>
        }
        getRowKey={(row) => row.id}
        rowClassName={getRowClassName}
        height="xs"
        theadClassName="bg-[#d9e3ec] z-0"
        containerClassName="shadow-sm"
        paginationConfig={{ enabled: false }}
      />
    </div>
  );
}

export default ApartmentTaxDetailsTable;
