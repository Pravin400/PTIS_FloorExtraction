'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { getTranslatedTaxLabel } from '@/lib/utils/ptis';
import type { PtisTaxDetail } from '@/types/ptis-core.types';

export type TaxEntry = PtisTaxDetail;

/**
 * Properties for the ShowTaxOnExpand component
 */
export interface ShowTaxOnExpandProps {
  /** Array of tax entries to display */
  taxes: TaxEntry[];
  /** Current locale for translations */
  locale: string;
  /** Primary color for text and background (default: #1D4ED8) */
  color?: string;
  /** Border color for the tax chips (default: #93C5FD) */
  borderColor?: string;
  /** Whether to localize tax name using i18n dictionary (default: true) */
  localizeTaxName?: boolean;
}

/**
 * Helper to normalize tax entries and ensure default values
 */
function buildTaxEntries(taxes: TaxEntry[] | undefined): TaxEntry[] {
  if (Array.isArray(taxes) && taxes.length > 0) {
    return taxes
      .map((tax) => ({
        taxName: tax.taxName,
        amount: tax.amount ?? 0,
        percentage: tax.percentage ?? 0,
        taxId: tax.taxId ?? 0,
      }));
  }
  return [];
}

/**
 * Tailwind CSS styling classes mapped to specific tax names or keywords.
 * Standardizes text, border, and background color classes for tax chips.
 */
const TAX_THEME_CLASSES: Record<string, string> = {
  // Fire Cess
  'fire cess': 'text-red-700 border-red-500 bg-red-50',

  // Water Cess / Water Bill
  'special water cess': 'text-blue-700 border-blue-500 bg-blue-50',
  'water benefit cess': 'text-blue-700 border-blue-500 bg-blue-50',
  'water bill': 'text-blue-700 border-blue-500 bg-blue-50',

  // Tree Cess
  'tree cess': 'text-green-700 border-green-500 bg-green-50',

  // Light Cess
  'light cess': 'text-amber-700 border-amber-500 bg-amber-50',

  // Road Cess
  'road cess': 'text-slate-700 border-slate-500 bg-slate-50',

  // Sewage Disposal Cess / Drain Cess
  'sewage disposal cess': 'text-stone-700 border-stone-500 bg-stone-50',
  'drain cess': 'text-stone-700 border-stone-500 bg-stone-50',

  // Sanitation Cess
  'sanitation cess': 'text-orange-700 border-orange-500 bg-orange-50',

  // Penalties
  'illegal construction penalty': 'text-rose-700 border-rose-500 bg-rose-50',
  'old penalty of ulb': 'text-orange-700 border-orange-500 bg-orange-50',
  'run time penalty': 'text-orange-700 border-orange-500 bg-orange-50',

  // Big Building
  'big building': 'text-purple-700 border-purple-500 bg-purple-50',

  // User Charges & Service Tax
  'user charges': 'text-cyan-700 border-cyan-500 bg-cyan-50',
  'service tax': 'text-cyan-700 border-cyan-500 bg-cyan-50',

  // General & Education / Employment Taxes
  'general tax': 'text-indigo-700 border-indigo-500 bg-indigo-50',
  'state education tax': 'text-indigo-700 border-indigo-500 bg-indigo-50',
  'state employment tax': 'text-indigo-700 border-indigo-500 bg-indigo-50',
  'special education tax': 'text-indigo-700 border-indigo-500 bg-indigo-50',

  // Total
  'taxtotal': 'text-slate-900 border-slate-600 bg-slate-100',
  'total': 'text-slate-900 border-slate-600 bg-slate-100',
};

/**
 * Resolves Tailwind CSS classes for a given tax name based on keyword/exact matching.
 */
function getTaxThemeClasses(taxName: string | undefined): string {
  const normalized = (taxName || '').trim().toLowerCase();

  // Try exact match first
  if (TAX_THEME_CLASSES[normalized]) {
    return TAX_THEME_CLASSES[normalized];
  }

  // Keyword-based fallback checks
  if (normalized.includes('fire')) {
    return TAX_THEME_CLASSES['fire cess'];
  }
  if (normalized.includes('special water') || normalized.includes('water benefit') || normalized.includes('water bill')) {
    return TAX_THEME_CLASSES['special water cess'];
  }
  if (normalized.includes('tree')) {
    return TAX_THEME_CLASSES['tree cess'];
  }
  if (normalized.includes('light')) {
    return TAX_THEME_CLASSES['light cess'];
  }
  if (normalized.includes('road')) {
    return TAX_THEME_CLASSES['road cess'];
  }
  if (normalized.includes('sewage disposal') || normalized.includes('drain cess') || normalized.includes('sewage') || normalized.includes('drain')) {
    return TAX_THEME_CLASSES['sewage disposal cess'];
  }
  if (normalized.includes('sanitation')) {
    return TAX_THEME_CLASSES['sanitation cess'];
  }
  if (normalized.includes('illegal construction') || normalized.includes('illegal')) {
    return TAX_THEME_CLASSES['illegal construction penalty'];
  }
  if (normalized.includes('penalty')) {
    return TAX_THEME_CLASSES['old penalty of ulb'];
  }
  if (normalized.includes('big building')) {
    return TAX_THEME_CLASSES['big building'];
  }
  if (normalized.includes('user charges') || normalized.includes('service')) {
    return TAX_THEME_CLASSES['user charges'];
  }
  if (
    normalized.includes('general') ||
    normalized.includes('education') ||
    normalized.includes('employment')
  ) {
    return TAX_THEME_CLASSES['general tax'];
  }
  if (normalized.includes('total')) {
    return TAX_THEME_CLASSES['taxtotal'];
  }

  // Default fallback theme
  return 'text-blue-700 border-blue-500 bg-blue-50';
}

/**
 * A shared component to display a horizontal list of tax breakdowns.
 * Used when expanding rows in PTIS tables (Rateable, Capital, etc.)
 */
export const ShowTaxOnExpand: React.FC<ShowTaxOnExpandProps> = ({
  taxes,
  locale: _locale,
  color: _color,
  borderColor: _borderColor,
  localizeTaxName = true,
}) => {
  const t = useTranslations('ptis');
  const commonT = useTranslations('common');
  const currencySymbol = commonT('Grid.currencySymbol');

  const entries = buildTaxEntries(taxes).map((tax) => {
    const themeClasses = getTaxThemeClasses(tax.taxName);
    return {
      displayLabel: localizeTaxName ? getTranslatedTaxLabel(t, tax.taxName) : (tax.taxName || ''),
      themeClasses,
      ...tax,
    };
  });

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <div className="flex flex-nowrap items-center gap-1" data-testid="expanded-tax-row p-0">
          {entries.map((tax, index) => (
            <div
              key={`${tax.taxId}-${tax.taxName}-${index}`}
              className={`flex min-w-max items-center gap-1 whitespace-nowrap rounded border px-1 py-0.5 text-[11px] p-0 ${tax.themeClasses}`}
            >
              <span className="font-semibold">{tax.displayLabel}:</span>
              <span className="font-bold">{currencySymbol} {tax.amount != null ? String(tax.amount) : '0'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};