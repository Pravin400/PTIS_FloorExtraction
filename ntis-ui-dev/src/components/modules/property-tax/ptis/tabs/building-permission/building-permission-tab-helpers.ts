import { format } from 'date-fns';
import type { Option } from '@/components/common';
import type { BuildingPermissionItem } from '@/types/ptis.types';

export function formatCertificateDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return format(parsed, 'dd/MM/yyyy');
  } catch { /* fallback */ }
  return dateStr;
}

export function formatCertificateNumberDisplay(certNo?: string | null, maxChars = 25): string {
  if (!certNo) return '-';
  const trimmed = certNo.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}...`;
}

export function extractIndividualCertificateTypeOptions(
  items: BuildingPermissionItem[],
  allLabel: string
): Option[] {
  const options: Option[] = [{ label: allLabel, value: 'ALL' }];
  const seen = new Set<string>(['all']);

  for (const item of items) {
    let name = (item.certificateTypeName || '').trim();
    if (!name) continue;
    name = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const key = name.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      options.push({ label: name, value: name });
    }
  }

  return options;
}

export function filterIndividualItems(
  items: BuildingPermissionItem[],
  selectedCertType: string
): BuildingPermissionItem[] {
  if (!selectedCertType || selectedCertType === 'ALL') return items;
  const target = selectedCertType.toLowerCase().trim();

  return items.filter((item) => {
    let name = (item.certificateTypeName || '').toLowerCase().trim();
    name = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const rawItem = item as unknown as { certificateTypeCode?: string; CertificateTypeCode?: string };
    const code = (rawItem.certificateTypeCode || rawItem.CertificateTypeCode || '').toLowerCase().trim();
    const idStr = item.certificateTypeId ? String(item.certificateTypeId) : '';
    return name === target || code === target || idStr === target;
  });
}

export function resolveScopeBadge(
  item: BuildingPermissionItem,
  partitionNo: string | null | undefined,
  societyDetailId: number | string | null | undefined,
  categoryId: number | null | undefined,
  t: (key: string) => string
): { label: string; className: string } {
  const scopeName = item.floorDescription || (item.propertyDetailsId ? `Floor #${item.propertyDetailsId}` : null);
  const rawEntityType = item.entityType || (item as unknown as { EntityType?: string })?.EntityType;
  const rawSourceLevel = item.sourceLevel || item.level || (item as unknown as { Level?: string })?.Level;
  const isApartmentContext = Boolean(
    (partitionNo && partitionNo.trim() !== '' && partitionNo !== '0') ||
    (societyDetailId && Number(societyDetailId) > 0) ||
    categoryId === 1
  );
  const certNoLower = (item.certificateNo || '').toLowerCase();

  if (rawEntityType === 'S' || rawSourceLevel === 'Apartment' || item.inheritedFrom === 'Apartment') {
    return { label: t('building.apartmentLevel') || 'Apartment Level', className: 'bg-purple-50/90 text-purple-700 border-purple-200/90' };
  }
  if (rawEntityType === 'W' || rawSourceLevel === 'Wing' || item.inheritedFrom === 'Wing' || (!rawEntityType && (certNoLower.startsWith('wing-') || certNoLower.includes('wing-level')))) {
    return { label: item.wingName ? `Wing Level (${item.wingName})` : (t('building.wingLevel') || 'Wing Level'), className: 'bg-sky-50/90 text-sky-700 border-sky-200/90' };
  }
  if (rawEntityType === 'F' || rawSourceLevel === 'Floor' || (!isApartmentContext && Boolean(item.propertyDetailsId))) {
    return { label: scopeName ? `Floor Level (${scopeName})` : (t('building.floorLevel') || 'Floor Level'), className: 'bg-amber-50/90 text-amber-700 border-amber-200/90' };
  }
  if (rawEntityType === 'P' || rawSourceLevel === 'Unit' || (isApartmentContext && rawEntityType === 'U')) {
    return { label: scopeName ? `Unit Level (${scopeName})` : (t('building.unitLevel') || 'Unit Level'), className: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90' };
  }
  if (item.propertyDetailsId) {
    return isApartmentContext
      ? { label: scopeName ? `Unit Level (${scopeName})` : (t('building.unitLevel') || 'Unit Level'), className: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90' }
      : { label: scopeName ? `Floor Level (${scopeName})` : (t('building.floorLevel') || 'Floor Level'), className: 'bg-amber-50/90 text-amber-700 border-amber-200/90' };
  }
  if (isApartmentContext) {
    return { label: t('building.unitLevel') || 'Unit Level', className: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90' };
  }
  return { label: t('building.entireProperty') || t('building.scopeProperty') || 'Entire Property', className: 'bg-blue-50/90 text-blue-700 border-blue-200/90' };
}

export function buildIndividualEditUrl({
  resolvedPropId,
  wardNo,
  wardId,
  propertyNo,
  partitionNo,
  societyDetailId,
  categoryId,
  item,
  locale,
}: {
  resolvedPropId: string | number;
  wardNo?: string | null;
  wardId?: number | string | null;
  propertyNo?: string | null;
  partitionNo?: string | null;
  societyDetailId?: number | string | null;
  categoryId?: number | null;
  item?: BuildingPermissionItem;
  locale: string;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set('propertyId', String(resolvedPropId));
  if (wardNo) searchParams.set('wardNo', String(wardNo));
  if (wardId) searchParams.set('wardId', String(wardId));
  if (propertyNo) searchParams.set('propertyNo', String(propertyNo));
  if (partitionNo) searchParams.set('partitionNo', String(partitionNo));
  searchParams.set('returnTab', 'buildingpermission');
  searchParams.set('fromFooterEdit', 'true');
  searchParams.set('hideWing', 'true');

  if (item) {
    if (item.certificateTypeId) searchParams.set('certificateTypeId', String(item.certificateTypeId));
    if (item.propertyCertificateId) searchParams.set('propertyCertificateId', String(item.propertyCertificateId));
    if (item.certificateNo) searchParams.set('certificateNumber', String(item.certificateNo));
    if (item.issueDate) searchParams.set('certificateDate', String(item.issueDate));
    if (item.documentGuid) searchParams.set('documentGuid', String(item.documentGuid));
    if (item.fileName) searchParams.set('fileName', String(item.fileName));

    const isApartmentContext = Boolean((partitionNo && partitionNo.trim() !== '' && partitionNo !== '0') || (societyDetailId && Number(societyDetailId) > 0) || categoryId === 1);
    const rawEntityType = item.entityType || (item as unknown as { EntityType?: string })?.EntityType;
    const rawSourceLevel = item.sourceLevel || item.level;
    const certNoLower = (item.certificateNo || '').toLowerCase();

    if (rawEntityType === 'S' || rawSourceLevel === 'Apartment' || item.inheritedFrom === 'Apartment') {
      searchParams.set('activeScope', 'Property');
      searchParams.set('level', 'Apartment');
    } else if (rawEntityType === 'W' || rawSourceLevel === 'Wing' || item.inheritedFrom === 'Wing' || (!rawEntityType && (certNoLower.startsWith('wing-') || certNoLower.includes('wing-level')))) {
      searchParams.set('activeScope', 'Property');
      searchParams.set('level', 'Wing');
      if (item.wingDetailId) searchParams.set('wingDetailId', String(item.wingDetailId));
    } else if (rawEntityType === 'F' || rawSourceLevel === 'Floor' || item.propertyDetailsId) {
      searchParams.set('activeScope', 'Floor');
      if (item.propertyDetailsId) {
        searchParams.set('selectedFloorId', String(item.propertyDetailsId));
        searchParams.set('activeFloorId', String(item.propertyDetailsId));
      }
      searchParams.set('level', 'Unit');
    } else if (rawEntityType === 'P' || rawSourceLevel === 'Unit' || isApartmentContext) {
      searchParams.set('activeScope', 'Property');
      searchParams.set('level', 'Unit');
    } else {
      searchParams.set('activeScope', 'Property');
      searchParams.set('level', 'Apartment');
    }
  } else {
    searchParams.set('activeScope', 'Property');
    searchParams.set('level', 'Unit');
  }

  return `/${locale}/property-tax/ptis/QuickDataEntry/${resolvedPropId}/Building?${searchParams.toString()}`;
}
