import { Building2, Home, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getItemLevel } from '@/lib/utils/ptis/social-details';
import type { PropertySocialDetailItem } from '@/types/ptis.types';

export { getItemLevel };

export interface ScopeBadgeResult {
  label: string;
  className: string;
  icon: LucideIcon;
}

export function resolveDiscountScopeBadge(
  item: PropertySocialDetailItem,
  propertyNo?: string | null,
  wingName?: string | null,
  isApartmentScreen = true,
  t?: (key: string) => string
): ScopeBadgeResult | null {
  if (!isApartmentScreen) return null;
  const lvl = getItemLevel(item);

  if (lvl === 'Apartment') {
    const rawObj = item as unknown as Record<string, unknown>;
    const mainProp = (propertyNo || (rawObj.propertyNo ? String(rawObj.propertyNo) : '')).trim();
    const aptLabel = t?.('buildingPermission.levels.apartment') || 'Apartment Level';
    return {
      label: mainProp ? `${aptLabel} (${mainProp})` : aptLabel,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Building2,
    };
  }
  if (lvl === 'Wing') {
    const rawWing = (item.wingName || item.applicableToLabel || wingName || '').trim();
    const cleanWing = rawWing.replace(/\s*wing$/i, '').trim();
    return {
      label: cleanWing ? `${cleanWing} Wing` : rawWing || t?.('buildingPermission.levels.wing') || 'Wing Level',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Home,
    };
  }
  if (lvl === 'Unit') {
    const rawNo = (item.partitionNo || item.unitNo || '').trim();
    const isPropertyId = rawNo === String(item.propertyId) || (/^\d{6,}$/.test(rawNo) && !item.partitionNo);
    const safeNo = isPropertyId ? item.partitionNo || '' : rawNo;
    const cleanNo = safeNo ? String(safeNo).replace(/^(unit|partition(\s*no\.?)?)\s*/i, '').trim() : '';
    const rawWing = (item.wingName || wingName || '').trim();
    const cleanWing = rawWing.replace(/\s*wing$/i, '').trim();
    const wingPrefix = cleanWing && !cleanNo.toLowerCase().includes(cleanWing.toLowerCase()) ? `${cleanWing} - ` : '';
    const backendLabel = item.applicableToLabel?.trim();
    return {
      label:
        backendLabel ||
        (cleanNo
          ? /unit$/i.test(cleanNo)
            ? cleanNo
            : `${wingPrefix}${cleanNo} Unit`
          : cleanWing
          ? `${cleanWing} Unit`
          : t?.('buildingPermission.levels.unit') || 'Unit Level'),
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Store,
    };
  }
  return null;
}

export function buildDiscountEditUrl(params: {
  targetPropId: string | number;
  wardNo?: string | null;
  wardId?: string | number | null;
  propertyNo?: string | null;
  societyDetailId?: number | null;
  wingDetailsId?: number | null;
  wingName?: string | null;
  selectedLevel?: string;
  item?: PropertySocialDetailItem;
  activeSubTab?: 'discount' | 'social';
  locale: string;
}): string {
  const {
    targetPropId,
    wardNo,
    wardId,
    propertyNo,
    societyDetailId,
    wingDetailsId,
    wingName,
    selectedLevel,
    item,
    activeSubTab,
    locale,
  } = params;

  const q = new URLSearchParams();
  if (wardNo) q.set('wardNo', String(wardNo));
  if (wardId) q.set('wardId', String(wardId));
  if (propertyNo) q.set('propertyNo', String(propertyNo));
  if (societyDetailId) {
    q.set('societyId', String(societyDetailId));
    q.set('societyDetailId', String(societyDetailId));
  }

  const itemLevel = item ? getItemLevel(item) : selectedLevel || 'Apartment';
  const targetWingId = item?.wingDetailId || wingDetailsId;
  const targetWingName = item?.wingName || wingName;
  const targetUnitPropId = itemLevel === 'Unit' ? item?.propertyId : undefined;
  const effectiveLevel =
    itemLevel.toLowerCase() === 'all'
      ? 'Apartment'
      : itemLevel.toLowerCase() === 'wing'
      ? 'Wing'
      : itemLevel.toLowerCase() === 'unit'
      ? 'Unit'
      : 'Apartment';

  if (effectiveLevel) q.set('level', effectiveLevel);
  if (targetWingId) q.set('wingDetailId', String(targetWingId));
  if (targetWingName) q.set('wingName', String(targetWingName));
  if (targetUnitPropId && Number(targetUnitPropId) > 0) q.set('unitPropertyId', String(targetUnitPropId));
  if (item?.socialAttributeId) q.set('socialAttributeId', String(item.socialAttributeId));
  q.set('returnTab', 'discount');

  const isSocialView = item ? item.isDiscountApplicable === false : activeSubTab === 'social';
  q.set('view', isSocialView ? 'social' : 'discount');

  return `/${locale}/property-tax/ptis/QuickDataEntry/${encodeURIComponent(String(targetPropId))}/Discount?${q.toString()}`;
}

/**
 * Determines whether a discount/social attribute item renders a status label (e.g. "Status: Applied")
 * versus a numerical value label (e.g. "Value: 2").
 */
export function isStatusValue(item: PropertySocialDetailItem): boolean {
  if (item.intValue !== null && item.intValue !== undefined) return false;
  if (item.decimalValue !== null && item.decimalValue !== undefined) return false;
  if (item.dateValue && item.dateValue.trim() !== '') return false;
  if (item.textValue && item.textValue.trim() !== '' && item.textValue.trim().toLowerCase() !== 'string') {
    const isYes = item.textValue.trim().toLowerCase() === 'yes' || item.textValue.trim().toLowerCase() === 'true';
    if (isYes) return true;
    if (!isNaN(Number(item.textValue.trim()))) return false;
    return false;
  }
  return true;
}

