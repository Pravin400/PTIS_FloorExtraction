/**
 * Type of Use Group Icon Configuration
 * 
 * Centralized configuration for group icons used in Type of Use Master
 * This file contains all icon mappings, labels, and helper functions
 */

import {
  LayoutGrid,
  Home,
  Building2,
  Factory,
  GraduationCap,
  Wheat,
  MapPin,
  LandPlot,
  SquareParking,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UseGroupIconKey } from '@/types/typeOfUse.types';

/**
 * Icon option type with proper typing for Lucide icons
 */
export interface IconOption {
  value: UseGroupIconKey;
  label: string;
  Icon: LucideIcon;
}

/**
 * Available icon options for Type of Use groups
 * Each option includes the key, display label, and Lucide icon component
 */
export const ICON_OPTIONS: IconOption[] = [
  { value: 'grid', label: 'All Group (Grid)', Icon: LayoutGrid },
  { value: 'home', label: 'Home / Residential', Icon: Home },
  { value: 'building', label: 'Commercial Building', Icon: Building2 },
  { value: 'factory', label: 'Factory / Industrial', Icon: Factory },
  { value: 'school', label: 'School / Education', Icon: GraduationCap },
  { value: 'leaf', label: 'Wheat / Agriculture', Icon: Wheat },
  { value: 'map', label: 'MapPin / Location', Icon: MapPin },
  { value: 'plots', label: 'Land Plot', Icon: LandPlot },
  { value: 'parking', label: 'Parking', Icon: SquareParking },
  { value: 'other', label: 'Other', Icon: Layers },
];

/**
 * Helper to convert groupIcon string to UseGroupIconKey for display
 * Handles legacy icon formats and normalizes to standard keys with smart fallback
 * 
 * @param iconStr - The icon string from the database (e.g., 'home-icon', 'building')
 * @param groupNameOrCode - Optional group name or code for smart fallback
 * @returns The normalized UseGroupIconKey
 */
export const getIconKey = (iconStr?: string | null, groupNameOrCode?: string | null): UseGroupIconKey => {
  const str = (iconStr || '').toLowerCase();
  const fallbackStr = (groupNameOrCode || '').toLowerCase();

  // First check explicit icon string if present
  if (str.includes('grid') || str.includes('total') || str.includes('layout') || str.includes('all')) return 'grid';
  if (str.includes('home')) return 'home';
  if (str.includes('building') || str.includes('briefcase') || str.includes('commercial')) return 'building';
  if (str.includes('factory') || str.includes('industrial')) return 'factory';
  if (str.includes('school') || str.includes('graduation') || str.includes('educational')) return 'school';
  if (str.includes('leaf') || str.includes('wheat') || str.includes('agriculture')) return 'leaf';
  if (str.includes('map') || str.includes('pin') || str.includes('location')) return 'map';
  if (str.includes('plot') || str.includes('land')) return 'plots';
  if (str.includes('parking') || str.includes('car')) return 'parking';
  if (str.includes('other') || str.includes('layers')) return 'other';

  // Secondary smart fallback matching group name or code (English & Marathi/Hindi)
  if (fallbackStr.includes('total') || fallbackStr.includes('all') || fallbackStr === '0') return 'grid';
  if (fallbackStr.includes('nivasi') || fallbackStr.includes('निवासी') || fallbackStr.includes('res')) return 'home';
  if (fallbackStr.includes('vyav') || fallbackStr.includes('व्याव') || fallbackStr.includes('com')) return 'building';
  if (fallbackStr.includes('audyo') || fallbackStr.includes('औद्यो') || fallbackStr.includes('ind')) return 'factory';
  if (fallbackStr.includes('plot') || fallbackStr.includes('प्लॉट') || fallbackStr.includes('प्लाॉट')) return 'plots';
  if (fallbackStr.includes('itar') || fallbackStr.includes('इतर') || fallbackStr.includes('oth')) return 'other';
  if (fallbackStr.includes('park')) return 'parking';

  return 'home'; // default fallback
};

/**
 * Get the icon component for a given icon key
 * 
 * @param iconKey - The UseGroupIconKey
 * @returns The corresponding Lucide icon component
 */
export const getIconComponent = (iconKey: UseGroupIconKey): LucideIcon => {
  const option = ICON_OPTIONS.find(opt => opt.value === iconKey);
  return option?.Icon || Home;
};
