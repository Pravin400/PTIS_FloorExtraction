import { useMemo } from 'react';
import type { 
  ApartmentTaxDetailsItems, 
  DualMethodTaxDetails, 
  ApartmentTaxAmountItem 
} from '@/types/apartmentQC.types';

/* ============================================================
   TYPE DEFINITIONS
 ============================================================ */

/**
 * Row data structure for the tax details table
 */
export interface TaxRowData extends Record<string, unknown> {
  id: string;
  rowType: 'rateable' | 'capital' | 'single' | 'total';
  methodLabel: string;
  [key: string]: unknown;
}

/**
 * Tax column definition
 */
export interface TaxColumnDef {
  taxName: string;
  displayOrder: number;
}

/**
 * Props for the useApartmentTaxDetailsTable hook
 */
export interface UseApartmentTaxDetailsTableProps {
  taxDetails: ApartmentTaxDetailsItems | null;
  dualMethodDetails?: DualMethodTaxDetails | null;
  activeMainTab: string;
  activeSubTab: string;
  t: (key: string) => string;
  tPtis: (key: string) => string;
}

/* ============================================================
   UTILITY FUNCTIONS
 ============================================================ */

/**
 * Get the translation key for the main tab label
 */
export function getTabTranslationKey(mainTab: string): string {
  switch (mainTab) {
    case 'commercial':
      return 'apartmentTabs.commercial';
    case 'residential':
      return 'apartmentTabs.residential';
    case 'amenities':
    default:
      return 'apartmentTabs.amenities';
  }
}

/**
 * Get the sub-tab label for display
 */
export function getSubTabLabel(subTab: string, t: (key: string) => string): string {
  switch (subTab) {
    case 'capital':
      return t('apartmentTabs.capital');
    case 'dual-method':
      return t('apartmentTabs.dual');
    case 'rateable':
    default:
      return t('apartmentTabs.rateable');
  }
}

/**
 * Cached currency formatter for performance
 * Creating Intl.NumberFormat is relatively expensive, so we cache it at module scope
 */
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

/**
 * Create a map for quick tax amount lookup
 */
export function createTaxMap(taxAmounts: ApartmentTaxAmountItem[] | undefined): Map<string, number> {
  const map = new Map<string, number>();
  taxAmounts?.forEach(tax => map.set(tax.taxName, tax.taxAmount));
  return map;
}



/**
 * Determine header gradient class based on sub-tab
 */
export function getHeaderGradientClass(activeSubTab: string): string {
  if (activeSubTab === 'dual-method') return 'bg-gradient-to-r from-purple-50 to-indigo-50';
  if (activeSubTab === 'capital') return 'bg-gradient-to-r from-green-50 to-emerald-50';
  return 'bg-gradient-to-r from-blue-50 to-indigo-50';
}

/**
 * Get custom row class based on row type
 */
export function getRowClassName(row: TaxRowData): string {
  if (row.rowType === 'rateable') return 'bg-blue-50/30 hover:bg-blue-50';
  if (row.rowType === 'capital') return 'bg-green-50/30 hover:bg-green-50';
  if (row.rowType === 'total') return 'bg-gradient-to-r from-purple-100 to-indigo-100';
  return 'bg-white hover:bg-gray-50';
}

/* ============================================================
   HOOKS
 ============================================================ */

/**
 * Hook to compute tax columns from tax details or dual method details
 */
export function useTaxColumns(
  taxDetails: ApartmentTaxDetailsItems | null,
  dualMethodDetails: DualMethodTaxDetails | null | undefined,
  activeSubTab: string
): TaxColumnDef[] {
  return useMemo((): TaxColumnDef[] => {
    if (activeSubTab === 'dual-method' && dualMethodDetails) {
      const taxMap = new Map<string, TaxColumnDef>();
      
      dualMethodDetails.rateable?.taxAmounts?.forEach(tax => {
        if (!taxMap.has(tax.taxName)) {
          taxMap.set(tax.taxName, { taxName: tax.taxName, displayOrder: tax.displayOrder });
        }
      });
      
      dualMethodDetails.capital?.taxAmounts?.forEach(tax => {
        if (!taxMap.has(tax.taxName)) {
          taxMap.set(tax.taxName, { taxName: tax.taxName, displayOrder: tax.displayOrder });
        }
      });
      
      return Array.from(taxMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
    }
    
    if (!taxDetails?.taxAmounts) return [];
    return taxDetails.taxAmounts
      .map(tax => ({ taxName: tax.taxName, displayOrder: tax.displayOrder }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [taxDetails, dualMethodDetails, activeSubTab]);
}

/**
 * Hook to build table row data from tax details
 */
export function useTaxTableData(
  taxDetails: ApartmentTaxDetailsItems | null,
  dualMethodDetails: DualMethodTaxDetails | null | undefined,
  taxColumns: TaxColumnDef[],
  activeSubTab: string,
  activeMainTab: string,
  t: (key: string) => string,
  tPtis: (key: string) => string
): TaxRowData[] {
  return useMemo((): TaxRowData[] => {
    if (activeSubTab === 'dual-method' && dualMethodDetails) {
      const rvTaxMap = createTaxMap(dualMethodDetails.rateable?.taxAmounts);
      const cvTaxMap = createTaxMap(dualMethodDetails.capital?.taxAmounts);

      const rows: TaxRowData[] = [];

      // Rateable row
      const rvRow: TaxRowData = {
        id: 'rateable',
        rowType: 'rateable',
        methodLabel: tPtis('apartmentTabs.rateable'),
      };
      taxColumns.forEach((tax) => {
        rvRow[tax.taxName] = rvTaxMap.get(tax.taxName);
      });
      rows.push(rvRow);

      // Capital row
      const cvRow: TaxRowData = {
        id: 'capital',
        rowType: 'capital',
        methodLabel: tPtis('apartmentTabs.capital'),
      };
      taxColumns.forEach((tax) => {
        cvRow[tax.taxName] = cvTaxMap.get(tax.taxName);
      });
      rows.push(cvRow);

      // Grand total row
      const totalRow: TaxRowData = {
        id: 'total',
        rowType: 'total',
        methodLabel: t('taxDetails.columnTotal'),
      };
      taxColumns.forEach((tax) => {
        const rvAmount = rvTaxMap.get(tax.taxName) ?? 0;
        const cvAmount = cvTaxMap.get(tax.taxName) ?? 0;
        totalRow[tax.taxName] = rvAmount + cvAmount;
      });
      rows.push(totalRow);

      return rows;
    }

    // Single method
    if (!taxDetails?.taxAmounts || taxColumns.length === 0) return [];
    
    const taxMap = createTaxMap(taxDetails.taxAmounts);

    const row: TaxRowData = {
      id: 'single',
      rowType: 'single',
      methodLabel: tPtis(getTabTranslationKey(activeMainTab)),
    };
    taxColumns.forEach((tax) => {
      row[tax.taxName] = taxMap.get(tax.taxName);
    });

    return [row];
  }, [taxDetails, dualMethodDetails, taxColumns, activeSubTab, activeMainTab, t, tPtis]);
}

/**
 * Hook to check if data is available
 */
export function useHasData(
  taxDetails: ApartmentTaxDetailsItems | null,
  dualMethodDetails: DualMethodTaxDetails | null | undefined,
  taxColumns: TaxColumnDef[],
  activeSubTab: string
): boolean {
  return useMemo(() => {
    if (activeSubTab === 'dual-method') {
      return !!(dualMethodDetails?.rateable || dualMethodDetails?.capital);
    }
    return !!(taxDetails && taxColumns.length > 0);
  }, [taxDetails, dualMethodDetails, taxColumns, activeSubTab]);
}

/**
 * Hook to generate footer content with property counts
 */
export function useFooterContent(
  taxDetails: ApartmentTaxDetailsItems | null,
  dualMethodDetails: DualMethodTaxDetails | null | undefined,
  activeSubTab: string
): { rvCount?: number; cvCount?: number; singleCount?: number } | null {
  return useMemo(() => {
    if (activeSubTab === 'dual-method' && dualMethodDetails) {
      const result: { rvCount?: number; cvCount?: number } = {};
      if (dualMethodDetails.rateable) result.rvCount = dualMethodDetails.rateable.propertyCount;
      if (dualMethodDetails.capital) result.cvCount = dualMethodDetails.capital.propertyCount;
      return Object.keys(result).length > 0 ? result : null;
    }
    
    if (taxDetails && taxDetails.propertyCount > 0) {
      return { singleCount: taxDetails.propertyCount };
    }
    
    return null;
  }, [taxDetails, dualMethodDetails, activeSubTab]);
}
