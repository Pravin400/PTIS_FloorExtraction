/**
 * Utility functions for formatting data
 */

export const formatDate = (date: string | Date, locale = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

export const formatDateTime = (date: string | Date, locale = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const toSafeString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const toPositiveInt = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const num = Number(trimmed);
  return Number.isInteger(num) && num > 0 ? num : undefined;
};

/**
 * Safely parses any value (string, number, unknown) to a positive integer (> 0).
 * Returns null if invalid, NaN, <= 0, or non-finite.
 */
export const parsePositiveInt = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return !Number.isNaN(num) && Number.isFinite(num) && num > 0 ? Math.floor(num) : null;
};


export const normalizePartition = (val: string | null | undefined): string => {
  const trimmed = (val ?? '').trim();
  return trimmed === '0' ? '' : trimmed;
};

/**
 * Formats a 12-digit Aadhar number into 4-digit groups (e.g. 5856 7591 4738).
 */
export function formatAadharNumber(aadhar?: string | null): string {
  if (!aadhar || aadhar === '-' || aadhar.trim() === '') return '';
  const digits = aadhar.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }
  return aadhar.trim();
}
// --- PTIS Specific Formatting Utilities ---

function formatNumber(
  value: number | null | undefined,
  minimumFractionDigits: number,
  maximumFractionDigits: number
) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(value ?? 0));
}

export function formatIndianNumber(
  value: number | null | undefined,
  minimumFractionDigits = 0,
  maximumFractionDigits = 0
): string {
  return formatNumber(value, minimumFractionDigits, maximumFractionDigits);
}

export function formatNumberPair(
  first: number | null | undefined,
  second: number | null | undefined,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string {
  return `${formatNumber(first, minimumFractionDigits, maximumFractionDigits)} / ${formatNumber(second, minimumFractionDigits, maximumFractionDigits)}`;
}

export function formatNumericDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const cleanVal = String(value).trim().toLowerCase();
  if (cleanVal === 'null' || cleanVal === 'undefined' || cleanVal === '' || cleanVal.startsWith('0001-01-01')) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatAreaWithUnit(
  sqft: number | null | undefined,
  sqm: number | null | undefined,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string {
  const sqftValue = formatNumber(sqft, minimumFractionDigits, maximumFractionDigits);
  const sqmValue = formatNumber(sqm, minimumFractionDigits, maximumFractionDigits);
  return `${sqftValue} (${sqmValue} m²)`;
}

import { DateUtils } from "./date-helpers";

export function formatDateToDDMMYYYY(dateStr: string | null | undefined): string {
  return DateUtils.formatToDDMMYYYY(dateStr);
}

export function formatDDMMYYYYToISO(dateStr: string | null | undefined): string | null {
  return DateUtils.parseToISO(dateStr);
}

export function toTitleCase(str: string | null | undefined): string {
  const trimmed = (str ?? '').trim();
  if (!trimmed) return '';
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- Reassessment Specific Formatting Utilities ---

export function formatCompactCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '0') return '₹0';
    if (trimmed.startsWith('₹') || trimmed.startsWith('-₹') || trimmed.startsWith('+₹')) return trimmed;

    const isNegative = trimmed.startsWith('-');
    const cleanStr = trimmed.replace(/^[-\s]+/, '');

    if (cleanStr.endsWith('Crore') || cleanStr.endsWith('Cr')) {
      const numPart = cleanStr.replace(/Crore|Cr/i, '').trim();
      return `${isNegative ? '-' : ''}₹${numPart}Cr`;
    }
    if (cleanStr.endsWith('Lakh')) {
      const numPart = cleanStr.replace(/Lakh/i, '').trim();
      return `${isNegative ? '-' : ''}₹${numPart}L`;
    }
    if (/L$/i.test(cleanStr)) {
      const numPart = cleanStr.replace(/L$/i, '').trim();
      return `${isNegative ? '-' : ''}₹${numPart}L`;
    }
    if (/k$/i.test(cleanStr)) {
      const numPart = cleanStr.replace(/k$/i, '').trim();
      return `${isNegative ? '-' : ''}₹${numPart}k`;
    }
    const parsed = parseFloat(cleanStr.replace(/,/g, ''));
    if (!isNaN(parsed)) {
      val = isNegative ? -parsed : parsed;
    } else {
      return `${isNegative ? '-' : ''}₹${cleanStr}`;
    }
  }

  const absVal = Math.abs(val);
  let formatted = '';
  if (absVal >= 10000000) {
    formatted = `${(absVal / 10000000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}Cr`;
  } else if (absVal >= 100000) {
    formatted = `${(absVal / 100000).toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}L`;
  } else if (absVal >= 1000) {
    formatted = `${(absVal / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  } else {
    formatted = `${absVal}`;
  }
  return val < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatReassessmentCurrency(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

export function sumReassessmentTaxAmounts(taxes: Record<string, number>): number {
  return Object.values(taxes).reduce(
    (sum, val) => sum + (Number.isFinite(val) ? val : 0),
    0
  );
}

export function formatCompactCurrencyWithSign(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '+₹0';
  const str = String(val).trim();
  if (str.startsWith('+') || str.startsWith('-')) return str;
  const formatted = formatCompactCurrency(val);
  return formatted.startsWith('-') ? formatted : `+${formatted}`;
}

export function formatFullCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '0') return '₹0';
    if (trimmed.startsWith('₹')) return trimmed;
    const parsed = parseFloat(trimmed.replace(/,/g, ''));
    if (isNaN(parsed)) return `₹${trimmed}`;
    val = parsed;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Formats tax amounts with adaptive precision so small rupee-level
 * differences remain visible even when values are in Crores/Lakhs.
 */
export function formatReassessmentTaxCurrency(value: number, compareWith?: number): string {
  if (compareWith === undefined || value === compareWith) {
    return formatReassessmentCurrency(value);
  }

  const standardFormat = formatReassessmentCurrency(value);
  if (standardFormat !== formatReassessmentCurrency(compareWith)) {
    return standardFormat;
  }

  if (value >= 10000000 && compareWith >= 10000000) {
    for (let decimals = 3; decimals <= 7; decimals++) {
      const formatted = `₹${(value / 10000000).toFixed(decimals)}Cr`;
      const formattedCompare = `₹${(compareWith / 10000000).toFixed(decimals)}Cr`;
      if (formatted !== formattedCompare) return formatted;
    }
  } else if (value >= 100000 && compareWith >= 100000) {
    for (let decimals = 3; decimals <= 5; decimals++) {
      const formatted = `₹${(value / 100000).toFixed(decimals)}L`;
      const formattedCompare = `₹${(compareWith / 100000).toFixed(decimals)}L`;
      if (formatted !== formattedCompare) return formatted;
    }
  }

  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatReassessmentNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

export function getNumberLocale(locale?: string): string {
  if (locale === 'mr') return 'mr-IN';
  if (locale === 'hi') return 'hi-IN';
  return 'en-IN';
}
