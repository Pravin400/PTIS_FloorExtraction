'use server';

import { getReportLookup } from '@/lib/api/property-tax/reports/report.service';
import type { LookupOption } from '@/types/report.types';

/**
 * Server action to fetch options for a 'select' report parameter.
 * - `source` is the parameter's OptionsSource.
 * - `parentValue` is the selected value of the cascade parent (if any).
 */
export async function getLookupOptions(
  source: string | null,
  parentValue?: string,
): Promise<LookupOption[]> {
  if (!source) return [];
  try {
    return await getReportLookup(source, parentValue);
  } catch {
    return [];
  }
}
