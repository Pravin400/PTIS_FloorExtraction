import { useMemo } from 'react';
import type {
  ApplicationLevel,
  CertificateData,
  CertificateTypeMasterOption,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import { calculateDeleteAccessInfo } from './calculate-delete-access';
import { buildCertificatesList } from './build-certificates-list';
import { calculateIsDirty } from './building-permission.utils';
import { useUnitStatusMap } from './useUnitStatusMap';
import type {
  DeleteAccessInfo,
  CertificateItem,
  CertificateGridItems,
} from './building-permission.types';

interface UseBuildingPermissionStatusParams {
  units: UnitSelectionItem[];
  filteredUnits: UnitSelectionItem[];
  activeCertificateTypes: CertificateTypeMasterOption[];
  selectedTypeId: number;
  level: ApplicationLevel;
  selectedWingDetailId: number | null;
  selectedUnitIds: Set<number>;
  gridItems: CertificateGridItems | null;
  societyId?: number | null;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  activeCertificate?: CertificateItem | null;
  certificateNumber: string;
  certificateDate: string;
  attachedFiles: File[];
  existingDocumentGuid: string | null;
  hasExistingDocument: boolean;
  removedAttachmentTypeIds: Set<number>;
  enabledStateMap: Record<number, boolean>;
  inheritedFrom?: string | null;
  isSaving: boolean;
  unitStatusMap?: Map<number | string, import('@/lib/utils/certificate-grid-mapper').UnitStatusResolution>;
  allUnitsList?: UnitSelectionItem[];
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useBuildingPermissionStatus(p: UseBuildingPermissionStatusParams) {
  const computed = useUnitStatusMap({
    units: p.units,
    filteredUnits: p.filteredUnits,
    selectedWingDetailId: p.selectedWingDetailId,
    gridItems: p.gridItems,
    selectedTypeId: p.selectedTypeId,
    societyId: p.societyId,
  });

  const allUnitsList = p.allUnitsList || computed.allUnitsList;
  const unitStatusMap = p.unitStatusMap || computed.unitStatusMap;

  const certificatesList: CertificateData[] = useMemo(() => {
    return buildCertificatesList({
      activeCertificateTypes: p.activeCertificateTypes,
      selectedTypeId: p.selectedTypeId,
      level: p.level,
      selectedWingDetailId: p.selectedWingDetailId,
      selectedUnitIds: p.selectedUnitIds,
      allUnitsList,
      gridItems: p.gridItems,
      societyId: p.societyId,
      isApartmentIndividual: p.isApartmentIndividual,
      initialData: p.initialData,
      certificateNumber: p.certificateNumber,
      certificateDate: p.certificateDate,
      attachedFiles: p.attachedFiles,
      existingDocumentGuid: p.existingDocumentGuid,
      removedAttachmentTypeIds: p.removedAttachmentTypeIds,
      enabledStateMap: p.enabledStateMap,
      t: p.t,
    });
  }, [
    p.activeCertificateTypes, p.selectedTypeId, p.level, p.selectedWingDetailId,
    p.selectedUnitIds, allUnitsList, p.gridItems, p.societyId, p.isApartmentIndividual,
    p.initialData, p.certificateNumber, p.certificateDate, p.attachedFiles,
    p.existingDocumentGuid, p.removedAttachmentTypeIds, p.enabledStateMap, p.t,
  ]);

  const activeUnitStat = useMemo(() => {
    if (p.selectedUnitIds.size === 1) return unitStatusMap.get(Array.from(p.selectedUnitIds)[0]);
    if (p.selectedUnitIds.size > 1) {
      const stats = Array.from(p.selectedUnitIds).map((id) => unitStatusMap.get(id)).filter(Boolean);
      return stats.find((s) => s?.status === 'direct') || stats.find((s) => s?.status === 'wing') || stats.find((s) => s?.status === 'apartment') || stats[0];
    }
    return undefined;
  }, [p.selectedUnitIds, unitStatusMap]);

  const isNoUnitsSelectedInUnitLevel = !p.isApartmentIndividual && p.level === 'Unit' && p.selectedUnitIds.size === 0;
  const currentSelectedCertItem = certificatesList.find((c) => c.certificateTypeId === p.selectedTypeId);
  const isCurrentCertEnabled = Boolean(currentSelectedCertItem?.enabled);
  const isFormDisabled = p.isSaving || (isNoUnitsSelectedInUnitLevel && !isCurrentCertEnabled);

  const deleteAccessInfo: DeleteAccessInfo = useMemo(() => {
    return calculateDeleteAccessInfo({
      selectedTypeId: p.selectedTypeId,
      level: p.level,
      gridItems: p.gridItems,
      activeCertificate: p.activeCertificate,
      isApartmentIndividual: p.isApartmentIndividual,
      initialData: p.initialData,
      selectedWingDetailId: p.selectedWingDetailId,
      inheritedFrom: p.inheritedFrom,
      selectedUnitIds: p.selectedUnitIds,
      allUnitsList,
      unitStatusMap,
      societyId: p.societyId,
      t: p.t,
    });
  }, [p.selectedTypeId, p.level, p.gridItems, p.activeCertificate, p.isApartmentIndividual, p.initialData, p.selectedWingDetailId, p.inheritedFrom, p.selectedUnitIds, allUnitsList, unitStatusMap, p.societyId, p.t]);

  const hasExistingRecord = useMemo(() => {
    if (p.activeCertificate && (
      Boolean(p.activeCertificate.certificateNumber && p.activeCertificate.certificateNumber.trim() !== '') ||
      Boolean(p.activeCertificate.hasDocument) ||
      Boolean(p.activeCertificate.documentGuid && p.activeCertificate.documentGuid !== 'null' && p.activeCertificate.documentGuid !== 'undefined') ||
      Boolean(p.activeCertificate.propertyCertificateId && p.activeCertificate.propertyCertificateId > 0)
    )) return true;

    if (p.hasExistingDocument || p.existingDocumentGuid || Boolean(p.certificateNumber && p.certificateNumber.trim() !== '')) return true;
    return false;
  }, [p.activeCertificate, p.hasExistingDocument, p.existingDocumentGuid, p.certificateNumber]);

  const isDirty = useMemo(() => {
    return calculateIsDirty({
      isNoUnitsSelectedInUnitLevel,
      isCurrentCertEnabled,
      attachedFiles: p.attachedFiles,
      activeCertificate: p.activeCertificate,
      level: p.level,
      initialData: p.initialData,
      existingDocumentGuid: p.existingDocumentGuid,
      removedAttachmentTypeIds: p.removedAttachmentTypeIds,
      selectedTypeId: p.selectedTypeId,
      certificateNumber: p.certificateNumber,
      certificateDate: p.certificateDate,
      hasExistingRecord,
    });
  }, [isNoUnitsSelectedInUnitLevel, isCurrentCertEnabled, p.attachedFiles, p.activeCertificate, p.level, p.initialData, p.existingDocumentGuid, p.removedAttachmentTypeIds, p.selectedTypeId, p.certificateNumber, p.certificateDate, hasExistingRecord]);

  const isCertificateFilled = useMemo(() => {
    const hasFileActual = p.attachedFiles.length > 0 ||
      (!p.removedAttachmentTypeIds.has(p.selectedTypeId) &&
        Boolean(p.activeCertificate?.hasDocument || (p.activeCertificate?.documentGuid && p.activeCertificate.documentGuid !== 'null') || p.existingDocumentGuid));
    return hasFileActual && Boolean(p.certificateNumber?.trim()) && Boolean(p.certificateDate?.trim());
  }, [p.attachedFiles, p.removedAttachmentTypeIds, p.selectedTypeId, p.activeCertificate, p.existingDocumentGuid, p.certificateNumber, p.certificateDate]);

  const appliedUnitsCount = useMemo(() => {
    const list = p.filteredUnits && p.filteredUnits.length > 0 ? p.filteredUnits : p.units;
    return list.filter((u) => {
      const stat = unitStatusMap.get(u.propertyDetailsId) || (u.propertyId != null ? unitStatusMap.get(u.propertyId) : undefined);
      return stat?.status === 'direct';
    }).length;
  }, [p.filteredUnits, p.units, unitStatusMap]);

  const selectedUnitNamesSummary = useMemo(() => {
    if (p.selectedUnitIds.size === 0) return '';
    const names = p.filteredUnits
      .filter((u) => p.selectedUnitIds.has(u.propertyDetailsId) || (u.propertyId != null && p.selectedUnitIds.has(u.propertyId)))
      .map((u) => u.unitNo)
      .filter(Boolean);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`;
  }, [p.selectedUnitIds, p.filteredUnits]);

  return {
    allUnitsList,
    unitStatusMap,
    certificatesList,
    activeUnitStat,
    deleteAccessInfo,
    isFormDisabled,
    isCurrentCertEnabled,
    hasExistingRecord,
    isDirty,
    isCertificateFilled,
    appliedUnitsCount,
    selectedUnitNamesSummary,
  };
}
