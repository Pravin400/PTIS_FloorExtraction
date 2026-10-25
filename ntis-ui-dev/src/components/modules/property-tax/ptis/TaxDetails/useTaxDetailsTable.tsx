import { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { FloorDetailsTableColumn } from '@/components/common/FloorDetailsTable';
import type { TaxDetailsData, TaxRow } from '@/types/ptisMain-taxdetails.types';
import { getTaxRowStyleByLabel } from './config';
import { getTaxDetailsFloorColumns } from './TaxDetailsColumns';

/**
 * Custom hook to handle business logic for TaxDetails table.
 * Handles optional tax details data and generates empty structure when not provided.
 */
export const useTaxDetailsTable = (
  initialTaxDetails?: TaxDetailsData,
) => {
  const t = useTranslations('ptisMainTaxDetails');

  // Utility to get tax label style based on label key
  const getTaxLabelStyle = useCallback((labelKey: string): string => {
    return getTaxRowStyleByLabel(labelKey);
  }, []);

  // Generate tax rows data dynamically based on the returned policies
  const taxRows = useMemo(() => {
    const policies = initialTaxDetails?.policies || [];

    // Deduplicate policies by case-insensitive policyCode
    const seenPolicyCodes = new Set<string>();
    const uniquePolicies: typeof policies = [];

    policies.forEach((policy) => {
      const code = (policy?.policyCode || policy?.policyName || 'NETTAX').trim();
      if (policy && code) {
        const upperCode = code.toUpperCase();
        if (!seenPolicyCodes.has(upperCode)) {
          seenPolicyCodes.add(upperCode);
          uniquePolicies.push(policy);
        }
      }
    });

    return uniquePolicies.map((policy, index) => {
      const code = (policy.policyCode || policy.policyName || 'NETTAX').trim();
      const taxBreakdown = policy.taxAmounts.map((item, taxIdx) => ({
        taxId: (item as unknown as { taxId?: number }).taxId ?? (taxIdx + 1),
        taxName: item.taxName,
        percentage: (item as unknown as { percentage?: number }).percentage ?? 0,
        amount: Number(item.taxAmount || 0),
      }));

      // Use Object.create(null) to prevent prototype pollution from API-provided taxName keys
      const row: TaxRow = Object.assign(Object.create(null), {
        id: 100 + index,
        taxes: code,
        labelKey: code,
        yearCode: policy.yearCode,
        pendingYearId: policy.pendingYearId,
        totalTax: String(policy.taxTotal || 0),
        taxBreakdown,
        pendingYears: policy.pendingYears,
      });

      policy.taxAmounts.forEach((item) => {
        // Safe to assign taxName as key since row has null prototype
        row[item.taxName] = String(item.taxAmount || 0);
      });

      return row;
    });
  }, [initialTaxDetails]);

  // Generate table columns using the utility
  const taxColumns = useMemo<FloorDetailsTableColumn<TaxRow>[]>(() => {
    const policies = initialTaxDetails?.policies || [];
    const allTaxNamesRaw = Array.from(
      new Set(policies.flatMap((p) => p.taxAmounts.map((a) => a.taxName)))
    );

    // Include active tax heads or TaxTotal
    const activeTaxNames = allTaxNamesRaw.filter((taxName) => {
      const lower = taxName.trim().toLowerCase();
      if (lower === 'totaltax' || lower === 'taxtotal' || lower === 'total tax' || lower === 'total' || lower === 'tax total') {
        return true;
      }
      return policies.some((p) => {
        const item = p.taxAmounts.find(
          (a) => a.taxName.trim().toLowerCase() === lower
        );
        return item && Number(item.taxAmount || 0) > 0;
      });
    });

    const finalTaxNames = activeTaxNames.length > 0 ? activeTaxNames : allTaxNamesRaw;

    const hasTotal = finalTaxNames.some((name) => {
      const lower = name.trim().toLowerCase();
      return lower === 'totaltax' || lower === 'taxtotal' || lower === 'total tax' || lower === 'total' || lower === 'tax total';
    });

    const orderedTaxNames = hasTotal ? finalTaxNames : [...finalTaxNames, 'taxTotal'];

    return getTaxDetailsFloorColumns(orderedTaxNames, t, getTaxLabelStyle);
  }, [initialTaxDetails, getTaxLabelStyle, t]);

  return {
    taxRows,
    taxColumns,
  };
};

