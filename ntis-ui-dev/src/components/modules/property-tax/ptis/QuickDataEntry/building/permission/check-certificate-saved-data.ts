import {
  resolveUnitCertificateStatus,
  isCertificateFromApartmentLevel,
  type CertificateItem,
  type CertificateGridItems,
} from '@/lib/utils/certificate-grid-mapper';
import type {
  ApplicationLevel,
  CertificateData,
  UnitSelectionItem,
} from '@/types/building-permission.types';

interface CheckCertificateSavedDataParams {
  typeId: number;
  selectedTypeId: number;
  level: ApplicationLevel;
  selectedUnitIds: Set<number>;
  filteredUnits: UnitSelectionItem[];
  units: UnitSelectionItem[];
  gridItems: CertificateGridItems | null;
  societyId?: number | null;
  selectedWingDetailId: number | null;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
}

export function checkCertificateHasSavedData(params: CheckCertificateSavedDataParams): boolean {
  const {
    typeId,
    selectedTypeId,
    level,
    selectedUnitIds,
    filteredUnits,
    units,
    gridItems,
    societyId,
    selectedWingDetailId,
    isApartmentIndividual,
    initialData,
  } = params;

  const isSelected = selectedTypeId === typeId;

  if (level === 'Unit' && selectedUnitIds.size > 0) {
    const firstSelectedId = Array.from(selectedUnitIds)[0];
    const matchedUnit =
      filteredUnits.find((u) => u.propertyDetailsId === firstSelectedId) ||
      units.find((u) => u.propertyDetailsId === firstSelectedId);
    if (matchedUnit) {
      const stat = resolveUnitCertificateStatus(gridItems, typeId, matchedUnit, societyId ? Number(societyId) : undefined);
      if (
        stat.status === 'direct' &&
        (stat.certificate?.propertyCertificateId ||
          stat.certificate?.documentGuid ||
          (stat.certificate?.certificateNumber && stat.certificate.certificateNumber.trim() !== ''))
      ) {
        return true;
      }
    }
    return false;
  }

  if (level === 'Unit' && selectedUnitIds.size === 0) {
    const wingRec = selectedWingDetailId != null
      ? (gridItems?.wingCertificates || []).find(
          (r: CertificateItem) => Number(r.wingDetailId) === Number(selectedWingDetailId) && r.certificateTypeId === typeId
        )
      : undefined;
    const aptRec = (gridItems?.societyCertificates || []).find((r: CertificateItem) => r.certificateTypeId === typeId);
    const isWingApt = isCertificateFromApartmentLevel(wingRec, aptRec);
    if (
      wingRec &&
      !isWingApt &&
      (wingRec.propertyCertificateId ||
        (wingRec.documentGuid && wingRec.documentGuid !== 'temp-guid') ||
        (wingRec.certificateNumber && wingRec.certificateNumber.trim() !== ''))
    ) {
      return true;
    }
    return false;
  }

  const recs: CertificateItem[] =
    level === 'Apartment'
      ? gridItems?.societyCertificates || []
      : level === 'Wing'
      ? selectedWingDetailId != null
        ? (gridItems?.wingCertificates || []).filter((r: CertificateItem) => Number(r.wingDetailId) === Number(selectedWingDetailId))
        : []
      : gridItems?.unitCertificates || [];

  const gridMatch = recs?.find((r) => r.certificateTypeId === typeId);
  const aptMatch = level === 'Wing'
    ? (gridItems?.societyCertificates || []).find((r: CertificateItem) => r.certificateTypeId === typeId)
    : undefined;

  const hasInitialData = isSelected && isApartmentIndividual && Boolean(
    (initialData?.documentGuid && initialData.documentGuid !== 'null' && initialData.documentGuid !== 'undefined') ||
    (initialData?.propertyCertificateId && initialData.propertyCertificateId > 0)
  );

  return Boolean(
    gridMatch?.propertyCertificateId ||
    gridMatch?.documentGuid ||
    (gridMatch?.certificateNumber && gridMatch.certificateNumber.trim() !== '') ||
    aptMatch?.propertyCertificateId ||
    aptMatch?.documentGuid ||
    (aptMatch?.certificateNumber && aptMatch.certificateNumber.trim() !== '') ||
    hasInitialData
  );
}
