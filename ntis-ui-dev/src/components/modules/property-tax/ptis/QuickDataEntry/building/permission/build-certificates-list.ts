import type {
  ApplicationLevel,
  CertificateData,
  CertificateTypeMasterOption,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import type { CertificateGridItems } from './building-permission.types';
import {
  resolveUnitCertificateStatus,
  type UnitStatusResolution,
} from '@/lib/utils/certificate-grid-mapper';
import {
  resolveApartmentCertificate,
  resolveWingCertificate,
  resolveUnitScopeCertificate,
} from './certificate-status-resolvers';

interface BuildCertificatesListParams {
  activeCertificateTypes: CertificateTypeMasterOption[];
  selectedTypeId: number;
  level: ApplicationLevel;
  selectedWingDetailId: number | null;
  selectedUnitIds: Set<number>;
  allUnitsList: UnitSelectionItem[];
  gridItems: CertificateGridItems | null;
  societyId?: number | null;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  certificateNumber: string;
  certificateDate: string;
  attachedFiles: File[];
  existingDocumentGuid: string | null;
  removedAttachmentTypeIds: Set<number>;
  enabledStateMap: Record<number, boolean>;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function buildCertificatesList(params: BuildCertificatesListParams): CertificateData[] {
  const {
    activeCertificateTypes,
    selectedTypeId,
    level,
    selectedWingDetailId,
    selectedUnitIds,
    allUnitsList,
    gridItems,
    societyId,
    isApartmentIndividual,
    initialData,
    certificateNumber,
    certificateDate,
    attachedFiles,
    existingDocumentGuid,
    removedAttachmentTypeIds,
    enabledStateMap,
    t,
  } = params;

  return activeCertificateTypes.map((ct) => {
    const isSelected = selectedTypeId === ct.certificateTypeId;
    let ctUnitStat: UnitStatusResolution | undefined;

    if (level === 'Unit' && !isApartmentIndividual && selectedUnitIds.size === 1) {
      const singleUnitId = Array.from(selectedUnitIds)[0];
      const targetUnit = allUnitsList.find(
        (u) => Number(u.propertyDetailsId) === Number(singleUnitId) || Number(u.propertyId) === Number(singleUnitId)
      );
      if (targetUnit) {
        ctUnitStat = resolveUnitCertificateStatus(gridItems, ct.certificateTypeId, targetUnit, societyId ? Number(societyId) : undefined);
      }
    }

    const common = { ct, isSelected, gridItems, initialData, t };
    const res =
      level === 'Apartment'
        ? resolveApartmentCertificate(common)
        : level === 'Wing'
        ? resolveWingCertificate({ ...common, selectedWingDetailId })
        : resolveUnitScopeCertificate({
            ...common,
            isApartmentIndividual,
            selectedUnitIds,
            allUnitsList,
            ctUnitStat,
            selectedWingDetailId,
            societyId,
          });

    const { gridRecord, customStatusBadge, sourceLevel, hasDirectSavedData, resolvedPropCertId } = res;
    const isAttachmentRemoved = isSelected && removedAttachmentTypeIds.has(ct.certificateTypeId);

    const certNo = isSelected
      ? (certificateNumber || gridRecord?.certificateNumber || (isApartmentIndividual && (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) ? initialData?.number : '') || '')
      : (gridRecord?.certificateNumber || '');

    let rawDate = isSelected
      ? (certificateDate || gridRecord?.certificateDate || (isApartmentIndividual && (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) ? initialData?.date : '') || '')
      : (gridRecord?.certificateDate || '');
    if (rawDate.includes('T')) rawDate = rawDate.split('T')[0];

    const hasDoc =
      (isSelected && attachedFiles.length > 0) ||
      (!isAttachmentRemoved &&
        (gridRecord?.hasDocument ||
          (gridRecord?.documentGuid && gridRecord.documentGuid !== 'null' && gridRecord.documentGuid !== 'undefined') ||
          (isSelected && (existingDocumentGuid || (isApartmentIndividual && (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) && initialData?.documentGuid)))));

    const docGuid = hasDoc
      ? (isSelected && existingDocumentGuid
          ? existingDocumentGuid
          : (isApartmentIndividual && (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) ? initialData?.documentGuid : undefined) || gridRecord?.documentGuid || 'temp-guid')
      : undefined;

    const manualState = enabledStateMap[ct.certificateTypeId];
    const isDrafting = isSelected && (attachedFiles.length > 0 || certificateNumber.trim() !== '' || certificateDate.trim() !== '');
    const isCoveredOrSaved = Boolean(hasDirectSavedData || (sourceLevel && sourceLevel !== 'None' && sourceLevel !== 'Partial'));
    const finalEnabled = isCoveredOrSaved
      ? true
      : level === 'Unit'
      ? (!isApartmentIndividual && selectedUnitIds.size === 0 ? Boolean(manualState) : (isSelected ? Boolean(isDrafting || manualState) : false))
      : (manualState !== undefined ? manualState : false);

    return {
      certificateTypeId: ct.certificateTypeId,
      certificateTypeName: ct.certificateTypeName || gridRecord?.certificateTypeName,
      enabled: finalEnabled,
      number: certNo,
      date: rawDate,
      documentGuid: docGuid,
      customStatusBadge,
      sourceLevel,
      propertyCertificateId: resolvedPropCertId,
      hasExistingData: hasDirectSavedData,
    };
  });
}
