/* eslint-disable @typescript-eslint/no-explicit-any */
import { ScopeOptionItem, ScopeItem } from '@/types/addTaxes.types';
import { useTranslations } from 'next-intl';
import {
  Globe,
  MapPin,
  Grid,
  Building,
  Home,
  ArrowLeftRight,
  CheckCircle,
  LucideIcon,
} from 'lucide-react';

export const DEFAULT_SCOPE_OPTIONS: ScopeOptionItem[] = [
  { id: 1, name: 'ZoneNode', displayName: 'Zone / Node', description: 'Zone-wise selection', scopeType: 'zone', options: ['Zone', 'Property Type', 'Assessment Status'] },
  { id: 2, name: 'WardSector', displayName: 'Ward / Sector', description: 'Multi ward selection', scopeType: 'ward', options: ['Zone', 'Ward', 'Property Type', 'Assessment Status'] },
  { id: 3, name: 'BuildingWise', displayName: 'Building Wise', description: 'Building level', scopeType: 'building', options: ['Zone', 'Ward', 'Property No'] },
  { id: 4, name: 'PropertyWise', displayName: 'Property Wise', description: 'Property level', scopeType: 'property', options: ['UPIC Id', 'Mobile No'] },
  { id: 5, name: 'PropertyRange', displayName: 'Property Range', description: 'From-to property range', scopeType: 'range', options: ['Ward', 'Property Type', 'Assessment Status', 'From Property', 'To Property'] }
];

const SCOPE_ICON_MAP: Record<string, LucideIcon> = {
  all: Globe,
  zone: MapPin,
  ward: Grid,
  building: Building,
  property: Home,
  range: ArrowLeftRight,
};

/**
 * Builds the scope-tab display items (icon/title/description per scope type) — split out of
 * useAddTaxesState.ts verbatim (pure relocation, no logic change) as a plain data-transform
 * function, since it involves no state/effects and doesn't need to be a hook.
 */
export function buildScopeItems(scopeOptions: ScopeOptionItem[], t: ReturnType<typeof useTranslations>): ScopeItem[] {
  return scopeOptions.length > 0
    ? scopeOptions.map((s, idx) => {
      const scopeKey = s.scopeType === 'all' ? 'allProperties' : s.scopeType === 'zone' ? 'zoneNode' : s.scopeType === 'ward' ? 'wardSector' : s.scopeType === 'building' ? 'buildingWise' : s.scopeType === 'property' ? 'propertyWise' : s.scopeType === 'range' ? 'propertyRange' : s.scopeType;
      const titleKey = `scopeSelection.scopes.${scopeKey}`;
      const descKey = `scopeSelection.scopes.${scopeKey}Desc`;
      return {
        id: s.scopeType,
        num: (idx + 1).toString().padStart(2, '0'),
        icon: SCOPE_ICON_MAP[s.scopeType] || Globe,
        title: t.has(titleKey) ? t(titleKey) : s.displayName,
        desc: t.has(descKey) ? t(descKey) : s.description
      };
    })
    : [
      { id: 'all', num: '01', icon: Globe, title: t('scopeSelection.scopes.allProperties'), desc: t('scopeSelection.scopes.allPropertiesDesc') },
      { id: 'zone', num: '02', icon: MapPin, title: t('scopeSelection.scopes.zoneNode'), desc: t('scopeSelection.scopes.zoneNodeDesc') },
      { id: 'ward', num: '03', icon: Grid, title: t('scopeSelection.scopes.wardSector'), desc: t('scopeSelection.scopes.wardSectorDesc') },
      { id: 'building', num: '04', icon: Building, title: t('scopeSelection.scopes.buildingWise'), desc: t('scopeSelection.scopes.buildingWiseDesc') },
      { id: 'property', num: '05', icon: Home, title: t('scopeSelection.scopes.propertyWise'), desc: t('scopeSelection.scopes.propertyWiseDesc') },
      { id: 'range', num: '06', icon: ArrowLeftRight, title: t('scopeSelection.scopes.propertyRange'), desc: t('scopeSelection.scopes.propertyRangeDesc') },
    ];
}

function getActionStyle(t: ReturnType<typeof useTranslations>, isAllowed: boolean, allowedStyle: Record<string, string>, restrictedStyle: Record<string, string>) {
  return isAllowed ? { status: t('validateEligibility.status.allowed'), ...allowedStyle } : { status: t('validateEligibility.status.restricted'), ...restrictedStyle };
}

/**
 * Builds the Validate Eligibility panel's permission-based action styling — split out of
 * useAddTaxesState.ts verbatim (pure relocation, no logic change), same rationale as buildScopeItems.
 */
export function buildEligibilityActions(permissions: any, t: ReturnType<typeof useTranslations>) {
  return [
    {
      id: 'addTax', icon: CheckCircle, title: t('validateEligibility.actions.addTax'), desc: t('validateEligibility.actions.addTaxDesc'),
      ...getActionStyle(t, !!permissions?.addTax,
        { color: 'text-green-600', borderColor: 'border-green-500', bg: 'bg-green-50', iconColor: 'text-green-500' },
        { color: 'text-green-500', borderColor: 'border-green-200', bg: 'bg-white', iconColor: 'text-gray-400' }
      )
    }
  ];
}
