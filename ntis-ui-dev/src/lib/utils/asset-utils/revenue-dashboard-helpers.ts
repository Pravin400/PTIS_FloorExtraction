 
import React from 'react';
import {
  Building2,
  Car,
  Home,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import type { RevenueDashboardPageCopy, RevenueRecordsPageCopy } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

const VALUATION_ICON: Record<string, React.ElementType> = {
  LAND: MapPin,
  BUILDING: ShoppingBag,
  INFRASTRUCTURE: Building2,
  MOVABLE: Car,
  GENERIC: Home,
};

export function iconForCategory(valuationType: string): React.ElementType {
  return VALUATION_ICON[valuationType?.toUpperCase()] ?? Building2;
}

export const createCurrencyTWrapper = (copy: RevenueDashboardPageCopy | RevenueRecordsPageCopy) => {
  return (key: string, options?: Record<string, unknown>) => {
    if (key === 'currency.symbol') return copy.currency.symbol;
    if (key === 'currency.lakh') return copy.currency.lakh.replace('{val}', String(options?.val || ''));
    if (key === 'currency.crore') return copy.currency.crore.replace('{val}', String(options?.val || ''));
    return key;
  };
};

/**
 * Safely parses a string to an integer with a fallback value.
 * Prevents NaN from being sent to APIs.
 */
export function safeParseInt(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/** Percentage with a single decimal, e.g. 78.234 -> "78.2%". */
export function formatPercent(value: number, decimals = 1): string {
  return `${(Number(value) || 0).toFixed(decimals)}%`;
}

/**
 * Visual theme for a category card / zone slice. The API drives counts and money;
 * the palette is purely presentational and cycles deterministically by index so the
 * same category always keeps the same colour within a render.
 */
export interface RevenuePalette {
  border: string;
  bg: string;
  iconBg: string;
  hex: string;
}

const CATEGORY_PALETTE: readonly RevenuePalette[] = [
  { border: 'border-emerald-200', bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', hex: '#10B981' },
  { border: 'border-blue-200', bg: 'bg-blue-50', iconBg: 'bg-blue-500', hex: '#3B82F6' },
  { border: 'border-purple-200', bg: 'bg-purple-50', iconBg: 'bg-fuchsia-500', hex: '#A855F7' },
  { border: 'border-orange-200', bg: 'bg-orange-50', iconBg: 'bg-orange-500', hex: '#F97316' },
  { border: 'border-pink-200', bg: 'bg-pink-50', iconBg: 'bg-pink-500', hex: '#EC4899' },
  { border: 'border-teal-200', bg: 'bg-teal-50', iconBg: 'bg-teal-500', hex: '#14B8A6' },
];

export function paletteForIndex(index: number): RevenuePalette {
  return CATEGORY_PALETTE[((index % CATEGORY_PALETTE.length) + CATEGORY_PALETTE.length) % CATEGORY_PALETTE.length];
}

const ZONE_HEX: readonly string[] = ['#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#3B82F6', '#10B981'];

export function zoneColorForIndex(index: number): string {
  return ZONE_HEX[((index % ZONE_HEX.length) + ZONE_HEX.length) % ZONE_HEX.length];
}

