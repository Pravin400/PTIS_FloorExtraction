import { buildPtisUrl } from '@/lib/utils/params';
import { PTIS_TAX_KEY_MAP } from '@/components/modules/property-tax/ptis/constants';

type TranslationFn = ((key: string) => string) & { has: (key: string) => boolean };

/**
 * Aggregates unique error messages from multiple potential error sources.
 *
 * @param dualError - Error from dual method fetch
 * @param rateableError - Error from rateable value fetch
 * @param capitalError - Error from capital value fetch
 * @returns Combined error string or null
 */
export function collectDualMethodErrors(
  dualError?: string,
  rateableError?: string,
  capitalError?: string
): string | null {
  const messages = [dualError, rateableError, capitalError].filter(
    (message): message is string => Boolean(message?.trim())
  );

  if (messages.length === 0) {
    return null;
  }

  return Array.from(new Set(messages)).join(' | ');
}

/**
 * Normalizes API tax labels to the camelCase translation keys used by PTIS locales.
 */
export function getTaxTranslationKey(taxName: string): string {
  const upperName = taxName.trim().toUpperCase();
  if (PTIS_TAX_KEY_MAP[upperName]) {
    return PTIS_TAX_KEY_MAP[upperName];
  }


  if (/^[a-z][a-zA-Z0-9]*$/.test(taxName)) {
    return taxName;
  }

  return taxName
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^\w/, (char) => char.toLowerCase())
    .replace(/\s/g, '');
}

export function parseExpandedRowIds(value: string | string[] | undefined): number[] {
  if (!value) return [];

  // If multiple values are provided (e.g., ?expand=1&expand=2), Next.js returns an array.
  // We process all values to ensure no expansion state is silently lost during SSR.
  const rawValues = Array.isArray(value) ? value : [value];
  const allIds: number[] = [];

  for (const rawValue of rawValues) {
    if (!rawValue) continue;
    const ids = rawValue
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => !isNaN(item) && Number.isInteger(item) && item > 0);
    allIds.push(...ids);
  }

  // Return unique IDs
  return Array.from(new Set(allIds));
}

export function getTranslatedTaxLabel(t: TranslationFn, taxName: string): string {
  const translationKey = getTaxTranslationKey(taxName);
  return t.has(`taxes.${translationKey}`) ? t(`taxes.${translationKey}`) : taxName;
}

export function formatTaxAmount(
  currencySymbol: string,
  value: number | string | undefined,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string {
  return `${currencySymbol} ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
}

/**
 * Builds the URL for expanding/collapsing a row in PTIS valuation tables.
 *
 * @param searchParams - Current URL search parameters
 * @param rowId - Unique ID of the row to toggle
 * @param expandedRowIds - Array of currently expanded row IDs
 * @param expandParam - The query parameter key to update ('rateableExpand' or 'capitalExpand')
 * @returns A formatted PTIS URL with updated expansion state
 */
export function buildExpandedRowsHref(
  searchParams: Record<string, string | string[] | undefined>,
  rowId: number,
  expandedRowIds: number[],
  expandParam: 'rateableExpand' | 'capitalExpand'
) {
  const nextExpandedRowIds = expandedRowIds.includes(rowId)
    ? expandedRowIds.filter((id) => id !== rowId)
    : [...expandedRowIds, rowId];

  return buildPtisUrl(searchParams, {
    [expandParam]: nextExpandedRowIds.length > 0 ? nextExpandedRowIds.join(',') : null,
  });
}
