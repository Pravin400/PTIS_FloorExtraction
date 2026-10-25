/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWards, useProperties, usePropertyTypes, useAssessmentTypes } from '@/hooks/reports/useReportDataHooks';

export function useReportOptionLists({
  financialYears,
  zones,
  zoneId,
  wardId,
  selectionMode,
  isPropertyDrawerOpen,
  fetchWards,
  fetchProperties
}: {
  financialYears: any[];
  zones: any[];
  zoneId: string;
  wardId: string[];
  selectionMode: string;
  isPropertyDrawerOpen: boolean;
  fetchWards?: any;
  fetchProperties?: any;
}) {
  const sortedFinancialYears = [...(financialYears || [])].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return (b.year || 0) - (a.year || 0);
  });

  const fyOptions = sortedFinancialYears.map((y) => {
    const label = y.yearCode || (y.year ? `${y.year}-${y.year + 1}` : y.description || `FY ${y.id}`);
    return { value: String(y.year ?? y.id), label };
  });

  const zoneOptions = zones.map((z) => {
    const zoneNo = (z.zoneNo || '').trim();
    const desc = (z.description || '').trim();
    const isSameMeaning = zoneNo.toLowerCase().replace(/\s+/g, '') === desc.toLowerCase().replace(/\s+/g, '');
    const label = desc && !isSameMeaning ? `${zoneNo} - ${desc}` : desc || zoneNo || `Zone ${z.id}`;
    return { value: String(z.id), label };
  });

  const { wards, wardLoading } = useWards(zoneId, fetchWards);
  const wardOptions = wards.map((w) => {
    const wardNo = (w.wardNo || '').trim();
    const desc = (w.description || '').trim();
    const label = wardNo || desc || `Ward ${w.id}`;
    return { value: String(w.id), label };
  });

  const { properties, propLoading } = useProperties(
    wardId[0] || '',
    (selectionMode === 'property' || selectionMode === 'range') && isPropertyDrawerOpen,
    fetchProperties
  );

  const allPropertyTypes = usePropertyTypes();
  const propertyTypeMap = new Map<number, string>(
    allPropertyTypes.map(pt => [pt.id, pt.propertyDescription])
  );

  const propertyDescriptionOptions = [...new Set(allPropertyTypes.map(pt => (pt.propertyDescription || String(pt.id)).trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map(label => {
      const pt = allPropertyTypes.find(p => (p.propertyDescription || String(p.id)).trim() === label);
      return { value: String(pt?.id), label };
    });

  const allAssessmentTypes = useAssessmentTypes();
  const assessmentStatusOptions = allAssessmentTypes.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  return {
    fyOptions,
    zoneOptions,
    wards,
    wardOptions,
    wardLoading,
    properties,
    propLoading,
    propertyTypeMap,
    propertyDescriptionOptions,
    assessmentStatusOptions
  };
}
