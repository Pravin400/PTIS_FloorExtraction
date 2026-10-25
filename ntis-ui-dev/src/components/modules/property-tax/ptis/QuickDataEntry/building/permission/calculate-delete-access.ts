import type {
  ApplicationLevel,
  CertificateData,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import {
  isCertificateFromApartmentLevel,
  type CertificateItem,
  type CertificateGridItems,
  type UnitStatusResolution,
} from '@/lib/utils/certificate-grid-mapper';
import { calculateUnitDeleteAccess } from './calculate-unit-delete-access';
import type { DeleteAccessInfo } from './building-permission.types';

export function calculateDeleteAccessInfo(params: {
  selectedTypeId: number;
  level: ApplicationLevel;
  gridItems: CertificateGridItems | null;
  activeCertificate?: CertificateItem | null;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  selectedWingDetailId: number | null;
  inheritedFrom?: string | null;
  selectedUnitIds: Set<number>;
  allUnitsList: UnitSelectionItem[];
  unitStatusMap: Map<number | string, UnitStatusResolution>;
  societyId?: number | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}): DeleteAccessInfo {
  const {
    selectedTypeId,
    level,
    gridItems,
    activeCertificate,
    isApartmentIndividual,
    initialData,
    selectedWingDetailId,
    inheritedFrom,
    selectedUnitIds,
    allUnitsList,
    unitStatusMap,
    societyId,
    t,
  } = params;

  if (!selectedTypeId) {
    return { canDelete: false, tooltip: t('building.noCertificateToDelete') || 'No certificate to delete.' };
  }

  // 1. Apartment Level
  if (level === 'Apartment') {
    const aptRec = (gridItems?.societyCertificates || []).find(
      (r: CertificateItem) => r.certificateTypeId === selectedTypeId && (r.hasDocument || r.documentGuid || r.certificateNumber || r.propertyCertificateId)
    );
    const hasAptRecord = Boolean(
      aptRec ||
      (activeCertificate && (
        (activeCertificate.propertyCertificateId && activeCertificate.propertyCertificateId > 0) ||
        activeCertificate.hasDocument ||
        (activeCertificate.documentGuid && activeCertificate.documentGuid !== 'null' && activeCertificate.documentGuid !== 'undefined') ||
        (activeCertificate.certificateNumber && activeCertificate.certificateNumber.trim() !== '')
      )) ||
      (isApartmentIndividual && initialData && (
        initialData.propertyCertificateId ||
        initialData.documentGuid ||
        (initialData.number && initialData.number.trim() !== '')
      ))
    );

    if (hasAptRecord) {
      return { canDelete: true, tooltip: undefined };
    }
    return {
      canDelete: false,
      tooltip: t('building.noCertificateToDelete') || 'No certificate to delete.',
    };
  }

  // 2. Wing Level
  if (level === 'Wing') {
    const targetWingId = selectedWingDetailId != null ? Number(selectedWingDetailId) : undefined;
    const wingRec = targetWingId != null
      ? (gridItems?.wingCertificates || []).find(
          (r: CertificateItem) => Number(r.wingDetailId) === Number(targetWingId) && r.certificateTypeId === selectedTypeId && (r.hasDocument || r.documentGuid || r.certificateNumber || r.propertyCertificateId)
        )
      : undefined;
    const aptRec = (gridItems?.societyCertificates || []).find(
      (r: CertificateItem) => r.certificateTypeId === selectedTypeId && (r.hasDocument || r.documentGuid || r.certificateNumber || r.propertyCertificateId)
    );
    const isWingRecApt = isCertificateFromApartmentLevel(wingRec, aptRec);
    const hasDirectWingRecord = Boolean(
      wingRec &&
      !isWingRecApt &&
      (wingRec.entityType === 'W' || Number(wingRec.wingDetailId) === Number(targetWingId)) &&
      (
        (wingRec.propertyCertificateId && wingRec.propertyCertificateId > 0) ||
        (wingRec.hasDocument && wingRec.documentGuid && wingRec.documentGuid !== 'temp-guid') ||
        (wingRec.certificateNumber && wingRec.certificateNumber.trim() !== '')
      )
    );

    if (hasDirectWingRecord) {
      return { canDelete: true, tooltip: undefined };
    }

    const isCoveredByApartment = Boolean(
      isWingRecApt ||
      aptRec ||
      inheritedFrom === 'Apartment' ||
      activeCertificate?.entityType === 'S' ||
      activeCertificate?.level === 'Apartment'
    );

    if (isCoveredByApartment) {
      return {
        canDelete: false,
        tooltip: t('building.cannotDeleteInheritedFromAptInWing') || 'This certificate is covered by Apartment Level. You can delete it from the Apartment Level section.',
      };
    }

    return {
      canDelete: false,
      tooltip: t('building.noCertificateToDelete') || 'No certificate to delete.',
    };
  }

  // 3. Unit Level
  return calculateUnitDeleteAccess({
    selectedTypeId,
    gridItems,
    activeCertificate,
    isApartmentIndividual,
    initialData,
    selectedWingDetailId,
    inheritedFrom,
    selectedUnitIds,
    allUnitsList,
    unitStatusMap,
    societyId,
    t,
  });
}
