import type {
  CertificateData,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import {
  isCertificateFromApartmentLevel,
  resolveUnitCertificateStatus,
  type CertificateItem,
  type CertificateGridItems,
  type UnitStatusResolution,
} from '@/lib/utils/certificate-grid-mapper';
import type { DeleteAccessInfo } from './building-permission.types';

interface CalculateUnitDeleteAccessParams {
  selectedTypeId: number;
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
}

export function calculateUnitDeleteAccess(params: CalculateUnitDeleteAccessParams): DeleteAccessInfo {
  const {
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
  } = params;

  if (isApartmentIndividual) {
    const unitRec = (gridItems?.unitCertificates || []).find(
      (r: CertificateItem) => r.certificateTypeId === selectedTypeId && (r.hasDocument || r.documentGuid || r.certificateNumber || r.propertyCertificateId)
    );
    const hasUnitRec = Boolean(
      unitRec ||
      (initialData && (initialData.propertyCertificateId || initialData.documentGuid || (initialData.number && initialData.number.trim() !== '')))
    );
    if (hasUnitRec) {
      return { canDelete: true, tooltip: undefined };
    }
    return {
      canDelete: false,
      tooltip: t('building.noCertificateToDelete') || 'No certificate to delete.',
    };
  }

  // In Society mode:
  if (selectedUnitIds.size === 0) {
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
    const hasDirectWing = Boolean(
      wingRec &&
      !isWingRecApt &&
      (wingRec.entityType === 'W' || Number(wingRec.wingDetailId) === Number(targetWingId)) &&
      (wingRec.propertyCertificateId || wingRec.hasDocument || wingRec.certificateNumber)
    );

    if (hasDirectWing || inheritedFrom === 'Wing' || activeCertificate?.entityType === 'W' || activeCertificate?.level === 'Wing') {
      return {
        canDelete: false,
        tooltip: t('building.cannotDeleteWingFromUnitTooltip') || 'This certificate is covered by Wing Level. You can delete it from the Wing Level section.',
      };
    }

    if (aptRec || isWingRecApt || inheritedFrom === 'Apartment' || activeCertificate?.entityType === 'S' || activeCertificate?.level === 'Apartment') {
      return {
        canDelete: false,
        tooltip: t('building.cannotDeleteAptFromUnitTooltip') || 'This certificate is covered by Apartment Level. You can delete it from the Apartment Level section.',
      };
    }

    return {
      canDelete: false,
      tooltip: t('building.selectUnitToDeleteTooltip') || 'Please select a directly applied unit to delete its certificate.',
    };
  }

  // Units ARE selected
  const selectedUnitsList = allUnitsList.filter(
    (u) => selectedUnitIds.has(u.propertyDetailsId) || (u.propertyId != null && selectedUnitIds.has(u.propertyId))
  );
  const unitCoverageEntries = selectedUnitsList.map((u) => {
    const stat =
      unitStatusMap.get(u.propertyDetailsId) ||
      (u.propertyId != null ? unitStatusMap.get(u.propertyId) : undefined) ||
      resolveUnitCertificateStatus(gridItems, selectedTypeId, u, societyId ? Number(societyId) : undefined);
    return { unit: u, stat };
  });

  const directUnits = unitCoverageEntries.filter((e) => e.stat.status === 'direct');
  const wingUnits = unitCoverageEntries.filter((e) => e.stat.status === 'wing');
  const apartmentUnits = unitCoverageEntries.filter((e) => e.stat.status === 'apartment');

  if (directUnits.length === 0) {
    if (wingUnits.length > 0) {
      return {
        canDelete: false,
        tooltip: t('building.cannotDeleteWingCoveredUnitTooltip') || 'The selected unit(s) are covered by Wing Level. You can delete it from the Wing Level section.',
      };
    }
    if (apartmentUnits.length > 0) {
      return {
        canDelete: false,
        tooltip: t('building.cannotDeleteAptCoveredUnitTooltip') || 'The selected unit(s) are covered by Apartment Level. You can delete it from the Apartment Level section.',
      };
    }
    return {
      canDelete: false,
      tooltip: t('building.noCertificateToDelete') || 'No certificate to delete.',
    };
  }

  return {
    canDelete: true,
    tooltip: undefined,
    targetDirectUnits: directUnits,
  };
}
