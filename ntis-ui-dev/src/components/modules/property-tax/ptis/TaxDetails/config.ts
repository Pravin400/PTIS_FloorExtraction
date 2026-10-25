/**
 * Tax Details Module Configuration
 * 
 * Centralized configuration for the TaxDetails component including:
 * - Policy codes and mappings
 * - Translation keys
 * - Styling classes and themes
 * - Row definitions
 */

// ==================== Policy Codes ====================

/**
 * Standard policy codes used across the tax system
 */
export const TAX_POLICY_CODES = {
  NETTAX: 'NETTAX',
  RETAIN: 'RETAIN',
  HEARING: 'HEARING',
  ALLTAXES: 'ALLTAXES',
} as const;

export type TaxPolicyCode = keyof typeof TAX_POLICY_CODES;

// ==================== Translation Keys ====================

/**
 * i18n translation keys for tax row labels
 */
export const TAX_ROW_LABELS = {
  NET_TAXES: 'netTaxes',
  RETAIN: 'retain',
  HEARING: 'hearing',
  ALL_TAXES: 'allTaxes',
} as const;

// ==================== Styling Classes ====================

/**
 * Base styling classes for tax labels (badges)
 */
export const TAX_LABEL_CLASSES = 'px-1.5 py-0.5 rounded-md shadow-2xs border text-center text-[11px] font-bold tracking-tight uppercase transition-all whitespace-nowrap inline-flex items-center justify-center';

/**
 * Header text styling for table columns
 */
export const HEADER_TEXT_CLASSES = 'text-white text-[9.5px] font-bold tracking-tight py-1 uppercase';

/**
 * Center alignment class for cells
 */
export const CELL_CENTER_CLASS = 'text-center px-0.5';

/**
 * Styling for number cells (tax amount columns)
 */
export const NUMBER_CELL_CLASSES = 'border border-blue-200 rounded-md px-1.5 py-0.5 text-center bg-white text-[12px] min-w-[50px] shadow-2xs font-semibold text-slate-800 hover:border-blue-300 transition-colors';

/**
 * Styling for total column cells
 */
export const TOTAL_CELL_CLASSES = 'border border-emerald-300 rounded-md px-1.5 py-0.5 text-center bg-emerald-50/80 text-[12px] min-w-[60px] font-bold text-emerald-800 shadow-2xs hover:border-emerald-400 transition-colors';

/**
 * Default fallback styling for unknown tax types
 */
export const DEFAULT_TAX_ROW_STYLE = 'bg-blue-50/90 text-blue-900 border-blue-200';

// ==================== Tax Row Style Themes ====================

/**
 * Color theme configuration for each tax row type
 */
export const TAX_ROW_STYLE_THEMES = {
  [TAX_ROW_LABELS.NET_TAXES]: 'bg-blue-50/90 text-blue-900 border-blue-200',
  [TAX_ROW_LABELS.RETAIN]: 'bg-blue-50/90 text-blue-900 border-blue-200',
  [TAX_ROW_LABELS.HEARING]: 'bg-purple-50/90 text-purple-900 border-purple-200',
  [TAX_ROW_LABELS.ALL_TAXES]: 'bg-rose-50/90 text-rose-900 border-rose-200',
} as const;

// ==================== Helper Functions ====================

/**
 * Gets the styling class for a tax row by its label key or policy code
 * 
 * @param labelKey - The translation key or policy code for the tax row
 * @returns Styling classes for the row, or default style if not found
 */
export function getTaxRowStyleByLabel(labelKey: string): string {
  if (!labelKey) return DEFAULT_TAX_ROW_STYLE;
  
  const key = labelKey.toUpperCase().replace(/_/g, '');
  if (key === 'NETTAX' || key === 'NETTAXES') {
    return 'bg-blue-50/90 text-blue-900 border-blue-200';
  }
  if (key.includes('OC') || key.includes('OCCUPANCY')) {
    return 'bg-blue-50/90 text-blue-900 border-blue-200';
  }
  if (key.includes('CC') || key.includes('COMMENCEMENT')) {
    return 'bg-purple-50/90 text-purple-900 border-purple-200';
  }
  if (key.includes('ELECTRIC') || key.includes('EB')) {
    return 'bg-amber-50/90 text-amber-900 border-amber-200';
  }
  if (key === 'RETAIN') {
    return 'bg-blue-50/90 text-blue-900 border-blue-200';
  }
  if (key === 'HEARING') {
    return 'bg-purple-50/90 text-purple-900 border-purple-200';
  }
  if (key === 'ALLTAXES') {
    return 'bg-rose-50/90 text-rose-900 border-rose-200';
  }
  
  return 'bg-blue-50/90 text-blue-900 border-blue-200';
}
