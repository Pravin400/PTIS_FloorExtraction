import { DualMethodResponse, DualMethodTaxes } from '@/types/ptis.types';

export interface ComparisonRow {
  id: string | number;
  label: string;
  totalTax: number;
  colorClass?: string;
  [key: string]: string | number | undefined;
}

export interface ComparisonTableData {
  taxNames: string[];
  rows: ComparisonRow[];
}

/**
 * Converts an arbitrary tax name into a stable, safe key for table columns/rows.
 * This avoids using raw tax labels (which may contain spaces/special characters)
 * as object keys or column keys.
 */
export function taxNameToKey(taxName: string): string {
  const base = taxName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const safe = base.length > 0 ? base : 'tax';
  return safe.startsWith('tax_') ? safe : `tax_${safe}`;
}

/**
 * Builds a unique mapping from taxName -> safeKey. If multiple names normalize to
 * the same safe key, a numeric suffix is appended to keep keys unique.
 */
export function buildTaxKeyMap(taxNames: string[]): Record<string, string> {
  const used = new Map<string, number>();
  const map: Record<string, string> = {};

  for (const name of taxNames) {
    const base = taxNameToKey(name);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    map[name] = count === 0 ? base : `${base}_${count + 1}`;
  }

  return map;
}

/**
 * Extracts unique tax names from all tax categories in dual method data.
 * 
 * @param dualMethodData - Response from dual method API
 * @returns Array of unique tax names
 */
export function getUniqueTaxNames(dualMethodData: DualMethodResponse | null): string[] {
  if (!dualMethodData) return [];

  const allKeys = new Set<string>();

  const extractKeys = (taxes: DualMethodTaxes | undefined) => {
    if (Array.isArray(taxes)) {
      taxes.forEach((tax) => {
        if (tax.taxName) {
          const upperName = tax.taxName.toUpperCase();
          if (upperName !== 'TAXTOTAL' && upperName !== 'TOTAL') {
            allKeys.add(tax.taxName);
          }
        }
      });
    }
  };

  extractKeys(dualMethodData.oldTaxes);
  extractKeys(dualMethodData.rvTaxes);
  extractKeys(dualMethodData.cvTaxes);
  extractKeys(dualMethodData.retainTaxes);

  return Array.from(allKeys);
}

/**
 * Builds rows for the dual method comparison table.
 * 
 * @param dualMethodData - Response from dual method API
 * @param taxNames - Array of unique tax names to include as columns
 * @param labels - Configuration for row labels and colors
 * @returns Array of comparison rows
 */
export function buildComparisonRows(
  dualMethodData: DualMethodResponse | null,
  taxNames: string[],
  labels: { id: string; key: keyof DualMethodResponse; label: string; color: string }[],
  taxKeyMap?: Record<string, string>
): ComparisonRow[] {
  if (!dualMethodData) return [];

  const resolveKey = (taxName: string) => taxKeyMap?.[taxName] ?? taxNameToKey(taxName);

  return labels.map((item) => {
    const data = dualMethodData?.[item.key] as DualMethodTaxes | undefined;
    const taxesArray = Array.isArray(data) ? data : [];
    const taxAmountByName = new Map<string, number>();
    for (const tax of taxesArray) {
      if (tax.taxName) {
        const previousAmount = taxAmountByName.get(tax.taxName) ?? 0;
        taxAmountByName.set(tax.taxName, previousAmount + (tax.amount || 0));
      }
    }
    const filteredTaxesArray = taxesArray.filter(
      (t) =>
        t.taxName?.toUpperCase() !== 'TAXTOTAL' &&
        t.taxName?.toUpperCase() !== 'TOTAL'
    );

    const serverTotal = dualMethodData?.[
      `${item.id}TaxesTotal` as keyof DualMethodResponse
    ] as number | null | undefined;

    const row: ComparisonRow = {
      id: item.id,
      label: item.label,
      totalTax: serverTotal ?? filteredTaxesArray.reduce((sum, t) => sum + (t.amount || 0), 0),
      colorClass: item.color,
    };

    taxNames.forEach((taxName) => {
      const key = resolveKey(taxName);
      row[key] = taxAmountByName.get(taxName) ?? 0;
    });

    return row;
  });
}
