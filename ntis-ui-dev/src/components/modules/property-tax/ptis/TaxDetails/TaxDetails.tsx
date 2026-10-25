'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FloorDetailsTable } from '@/components/common';
import type { TaxDetailsData, PendingTaxRow, TaxRow, PendingYearTaxDetail } from '@/types/ptisMain-taxdetails.types';
import {
  getTaxDetailsFloorColumns,
  getPendingTaxDetailsFloorColumns,
} from './TaxDetailsColumns';
import { getTaxRowStyleByLabel } from './config';

interface TaxDetailsProps {
  initialTaxDetails?: TaxDetailsData;
  locale?: string;
  activeTab?: 'current' | 'pending';
}

/**
 * TaxDetails Component
 * 
 * Standard, theme-compliant table of taxation breakdown using the common FloorDetailsTable component.
 * Displays either Current Taxes or Pending Taxes based on activeTab prop.
 */
const TaxDetails = ({ initialTaxDetails, activeTab = 'current' }: TaxDetailsProps) => {
  const t = useTranslations('ptisMainTaxDetails');

  const allTaxNames = useMemo(() => {
    const policies = initialTaxDetails?.policies || [];
    const seen = new Set<string>();
    const names: string[] = [];
    policies.forEach((policy) => {
      policy.taxAmounts?.forEach((item) => {
        if (item.taxName) {
          const lower = item.taxName.trim().toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            names.push(item.taxName);
          }
        }
      });
      policy.pendingYears?.forEach((pYear) => {
        pYear.taxAmounts?.forEach((item) => {
          if (item.taxName) {
            const lower = item.taxName.trim().toLowerCase();
            if (!seen.has(lower)) {
              seen.add(lower);
              names.push(item.taxName);
            }
          }
        });
      });
    });

    return names;
  }, [initialTaxDetails]);

  const currentFloorColumns = useMemo(
    () =>
      getTaxDetailsFloorColumns(
        allTaxNames,
        t,
        getTaxRowStyleByLabel
      ),
    [allTaxNames, t]
  );

  const pendingFloorColumns = useMemo(
    () => getPendingTaxDetailsFloorColumns(allTaxNames, t, getTaxRowStyleByLabel),
    [allTaxNames, t]
  );

  const taxRows = useMemo(() => {
    const policies = initialTaxDetails?.policies || [];
    return policies
      .filter((policy) => {
        const code = (policy.policyCode || policy.policyName || '').toUpperCase();
        if (code === 'ARREARS') return false;
        if (policies.length <= 1) return true;
        if (code.includes('CC') || code.includes('COMMENCEMENT')) {
          const hasPositiveTax =
            policy.taxAmounts &&
            policy.taxAmounts.length > 0 &&
            policy.taxAmounts.some((item) => Number(item.taxAmount || 0) > 0);
          const hasPositiveTotal = Number(policy.taxTotal || 0) > 0;
          if (!hasPositiveTax && !hasPositiveTotal) {
            return false;
          }
        }
        return true;
      })
      .map((policy, index) => {
        const code = policy.policyCode || policy.policyName || 'NETTAX';
        const row: Record<string, unknown> = {
          id: 100 + index,
          taxes: code,
          labelKey: code,
          totalTax: policy.taxTotal,
          pendingYears: policy.pendingYears,
        };

        policy.taxAmounts?.forEach((item) => {
          if (item.taxName) {
            row[item.taxName] = item.taxAmount;
            row[item.taxName.trim().toLowerCase()] = item.taxAmount;
          }
        });

        // Fallback for TAXTOTAL from policy.taxTotal
        if (policy.taxTotal !== undefined && policy.taxTotal !== null) {
          const lowerTotalVal = (row['taxtotal'] as number | undefined);
          if (lowerTotalVal === undefined || lowerTotalVal === 0) {
            row['TAXTOTAL'] = policy.taxTotal;
            row['TaxTotal'] = policy.taxTotal;
            row['taxtotal'] = policy.taxTotal;
          }
        }

        return row as unknown as TaxRow;
      });
  }, [initialTaxDetails]);

  const pendingTaxRows = useMemo(() => {
    const policies = initialTaxDetails?.policies || [];
    const rows: PendingTaxRow[] = [];
    const seenRowKeys = new Set<string>();

    // 1st Row: Arrears summary row (replaces NETTAX row in Arrears tab)
    const arrearsPolicy = policies.find(
      (p) => (p.policyCode || p.policyName || '').toUpperCase() === 'ARREARS'
    );

    if (arrearsPolicy && arrearsPolicy.pendingYears && arrearsPolicy.pendingYears.length > 0) {
      arrearsPolicy.pendingYears.forEach((pYear, yIdx) => {
        const baseKey = `Arrears-${pYear.yearCode || yIdx}`;
        seenRowKeys.add(baseKey);
        rows.push({
          id: baseKey,
          policyCode: 'Arrears',
          yearCode: pYear.yearCode,
          taxTotal: pYear.taxTotal,
          taxAmounts: pYear.taxAmounts,
        });
      });
    } else if (
      arrearsPolicy &&
      ((arrearsPolicy.taxAmounts && arrearsPolicy.taxAmounts.length > 0) ||
        (arrearsPolicy.taxTotal !== undefined && arrearsPolicy.taxTotal > 0))
    ) {
      const baseKey = 'Arrears-Summary';
      seenRowKeys.add(baseKey);
      rows.push({
        id: baseKey,
        policyCode: 'Arrears',
        yearCode: '',
        taxTotal: arrearsPolicy.taxTotal ?? 0,
        taxAmounts: arrearsPolicy.taxAmounts || [],
      });
    }

    // Subsequent Rows: Certificate pending year rows (OC, CC, Electric Bill, etc.)
    const certPendingItems: {
      pYear: PendingYearTaxDetail;
      policyCode: string;
      pIdx: number;
      yIdx: number;
      startYear: number;
    }[] = [];

    policies.forEach((policy, pIdx) => {
      const codeUpper = (policy.policyCode || policy.policyName || '').toUpperCase();
      if (codeUpper !== 'NETTAX' && codeUpper !== 'ARREARS' && policy.pendingYears && policy.pendingYears.length > 0) {
        policy.pendingYears.forEach((pYear, yIdx) => {
          const itemPolicyCode =
            (pYear as unknown as { policyCode?: string; PolicyCode?: string }).policyCode ||
            (pYear as unknown as { policyCode?: string; PolicyCode?: string }).PolicyCode ||
            policy.policyCode ||
            policy.policyName ||
            'OC';

          const yearMatch = (pYear.yearCode || '').match(/\d{4}/);
          const startYear = yearMatch ? parseInt(yearMatch[0], 10) : 0;

          certPendingItems.push({
            pYear,
            policyCode: itemPolicyCode,
            pIdx,
            yIdx,
            startYear,
          });
        });
      }
    });

    // Sort certificate pending items chronologically by financial start year ASCENDING
    certPendingItems.sort((a, b) => a.startYear - b.startYear);

    certPendingItems.forEach(({ pYear, policyCode, pIdx, yIdx }) => {
      const baseKey = `${policyCode}-${pYear.yearCode}`;
      if (!seenRowKeys.has(baseKey)) {
        seenRowKeys.add(baseKey);
        rows.push({
          id: baseKey,
          policyCode,
          yearCode: pYear.yearCode,
          taxTotal: pYear.taxTotal,
          taxAmounts: pYear.taxAmounts,
        });
      } else {
        const fallbackKey = `${baseKey}-${pIdx}-${yIdx}`;
        seenRowKeys.add(fallbackKey);
        rows.push({
          id: fallbackKey,
          policyCode,
          yearCode: pYear.yearCode,
          taxTotal: pYear.taxTotal,
          taxAmounts: pYear.taxAmounts,
        });
      }
    });

    return rows;
  }, [initialTaxDetails]);

  return (
    <div
      className="w-full overflow-x-auto tax-details-container"
      data-testid="master-table"
    >
      {activeTab === 'current' ? (
        <FloorDetailsTable<TaxRow>
          data={taxRows}
          columns={currentFloorColumns}
          emptyMessage={t('noTaxDetailsAvailable')}
          showExpandColumn={false}
          showScrollButtons={false}
          showBorder={false}
          containerClassName="max-h-[300px] overflow-y-auto relative rounded-b-xl border-0 shadow-none"
          tableClassName="w-full border-collapse"
          theadClassName="bg-[#1e3a8a] text-white border-b border-blue-700/60 shadow-xs sticky top-0 z-20"
        />
      ) : (
        <FloorDetailsTable<PendingTaxRow>
          data={pendingTaxRows}
          columns={pendingFloorColumns}
          emptyMessage={t('noArrearsTaxDetailsAvailable')}
          showExpandColumn={false}
          showScrollButtons={false}
          showBorder={false}
          containerClassName="max-h-[300px] overflow-y-auto relative rounded-b-xl border-0 shadow-none"
          tableClassName="w-full border-collapse"
          theadClassName="bg-[#1e3a8a] text-white border-b border-blue-700/60 shadow-xs sticky top-0 z-20"
        />
      )}
    </div>
  );
};

TaxDetails.displayName = 'TaxDetails';

export default TaxDetails;
