import type {
  CertificateData,
  UnitSelectionItem,
} from '@/types/building-permission.types';
import {
  isCertificateFromApartmentLevel,
  resolveUnitCertificateStatus,
  type CertificateItem,
  type UnitStatusResolution,
} from '@/lib/utils/certificate-grid-mapper';
import type { CommonResolveParams } from './resolve-apartment-wing-certificate';

export function resolveUnitScopeCertificate(
  params: CommonResolveParams & {
    isApartmentIndividual: boolean;
    selectedUnitIds: Set<number>;
    allUnitsList: UnitSelectionItem[];
    ctUnitStat?: UnitStatusResolution;
    selectedWingDetailId: number | null;
    societyId?: number | null;
  }
): {
  gridRecord?: CertificateItem;
  customStatusBadge: CertificateData['customStatusBadge'];
  sourceLevel: CertificateData['sourceLevel'];
  hasDirectSavedData: boolean;
  resolvedPropCertId?: number | null;
} {
  const {
    ct,
    isSelected,
    gridItems,
    initialData,
    t,
    isApartmentIndividual,
    selectedUnitIds,
    allUnitsList,
    ctUnitStat,
    selectedWingDetailId,
    societyId,
  } = params;

  if (isApartmentIndividual) {
    const unitRec = (gridItems?.unitCertificates || []).find(
      (r: CertificateItem) => r.certificateTypeId === ct.certificateTypeId
    );
    const hasIndividualData = Boolean(
      (unitRec?.propertyCertificateId && unitRec.propertyCertificateId > 0) ||
        (unitRec?.hasDocument && unitRec.documentGuid && unitRec.documentGuid !== 'temp-guid') ||
        (isSelected &&
          (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) &&
          Boolean(initialData?.propertyCertificateId || (initialData?.documentGuid && initialData.documentGuid !== 'temp-guid')))
    );

    return {
      gridRecord: unitRec,
      customStatusBadge: hasIndividualData
        ? { label: t('building.unitLevel') || 'Unit Level', variant: 'success' }
        : { label: t('building.notConfigured') || 'Not Configured', variant: 'secondary' },
      sourceLevel: hasIndividualData ? 'Direct' : 'None',
      hasDirectSavedData: hasIndividualData,
      resolvedPropCertId:
        unitRec?.propertyCertificateId ||
        (isSelected && (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId)
          ? initialData?.propertyCertificateId
          : undefined),
    };
  }

  if (selectedUnitIds.size === 1) {
    let gridRecord = ctUnitStat?.certificate || undefined;
    if (ctUnitStat?.status === 'wing') {
      gridRecord = (ctUnitStat.certificate?.wingDetailId != null
        ? (gridItems?.wingCertificates || []).find(
            (r: CertificateItem) => Number(r.wingDetailId) === Number(ctUnitStat.certificate?.wingDetailId) && r.certificateTypeId === ct.certificateTypeId
          )
        : undefined) || ctUnitStat.certificate || undefined;
    } else if (ctUnitStat?.status === 'apartment') {
      gridRecord = (gridItems?.societyCertificates || []).find(
        (r: CertificateItem) => r.certificateTypeId === ct.certificateTypeId
      ) || ctUnitStat.certificate || undefined;
    }

    const hasDirectSavedData = Boolean(
      ctUnitStat?.status === 'direct' &&
        ctUnitStat.certificate?.certificateTypeId === ct.certificateTypeId &&
        ((ctUnitStat.certificate?.propertyCertificateId && ctUnitStat.certificate.propertyCertificateId > 0) ||
          (ctUnitStat.certificate?.hasDocument && ctUnitStat.certificate?.documentGuid && ctUnitStat.certificate?.documentGuid !== 'temp-guid'))
    );

    let customStatusBadge: CertificateData['customStatusBadge'] = { label: t('building.notConfigured') || 'Not Configured', variant: 'secondary' };
    let sourceLevel: CertificateData['sourceLevel'] = 'None';

    if (ctUnitStat?.status === 'direct') {
      customStatusBadge = { label: t('building.appliedDirectly') || 'Applied Separately', variant: 'success' };
      sourceLevel = 'Direct';
    } else if (ctUnitStat?.status === 'wing') {
      customStatusBadge = { label: t('building.coveredByWing') || 'Wing Covered', variant: 'info' };
      sourceLevel = 'Wing';
    } else if (ctUnitStat?.status === 'apartment') {
      customStatusBadge = { label: t('building.coveredByApartment') || 'Apartment Covered', variant: 'purple' };
      sourceLevel = 'Apartment';
    }

    return {
      gridRecord: gridRecord || undefined,
      customStatusBadge,
      sourceLevel,
      hasDirectSavedData,
      resolvedPropCertId: ctUnitStat?.status === 'direct' ? ctUnitStat.certificate?.propertyCertificateId : undefined,
    };
  }

  if (selectedUnitIds.size > 1) {
    const selectedUnitsList = allUnitsList.filter(
      (u) => selectedUnitIds.has(u.propertyDetailsId) || (u.propertyId != null && selectedUnitIds.has(u.propertyId))
    );
    const statsForCt = selectedUnitsList.map((u) =>
      resolveUnitCertificateStatus(gridItems, ct.certificateTypeId, u, societyId ? Number(societyId) : undefined)
    );
    const allDirect = statsForCt.length > 0 && statsForCt.every((s) =>
      s.status === 'direct' &&
      s.certificate?.certificateTypeId === ct.certificateTypeId &&
      Boolean(
        (s.certificate?.propertyCertificateId && s.certificate.propertyCertificateId > 0) ||
        (s.certificate?.hasDocument && s.certificate?.documentGuid && s.certificate?.documentGuid !== 'temp-guid') ||
        (s.certificate?.certificateNumber && s.certificate.certificateNumber.trim() !== '')
      )
    );
    const allWing = !allDirect && statsForCt.length > 0 && statsForCt.every((s) => s.status === 'wing');
    const allApt = !allDirect && !allWing && statsForCt.length > 0 && statsForCt.every((s) => s.status === 'apartment');

    let customStatusBadge: CertificateData['customStatusBadge'] = { label: t('building.notConfigured') || 'Not Configured', variant: 'secondary' };
    let sourceLevel: CertificateData['sourceLevel'] = 'None';

    if (allDirect) {
      customStatusBadge = { label: t('building.appliedDirectly') || 'Applied Separately', variant: 'success' };
      sourceLevel = 'Direct';
    } else if (allWing) {
      customStatusBadge = { label: t('building.coveredByWing') || 'Wing Covered', variant: 'info' };
      sourceLevel = 'Wing';
    } else if (allApt) {
      customStatusBadge = { label: t('building.coveredByApartment') || 'Apartment Covered', variant: 'purple' };
      sourceLevel = 'Apartment';
    }

    const wingRecord = selectedWingDetailId != null
      ? (gridItems?.wingCertificates || []).find(
          (r: CertificateItem) => Number(r.wingDetailId) === Number(selectedWingDetailId) && r.certificateTypeId === ct.certificateTypeId
        )
      : undefined;
    const aptRecord = (gridItems?.societyCertificates || []).find(
      (r: CertificateItem) => r.certificateTypeId === ct.certificateTypeId
    );
    const gridRecord = wingRecord || aptRecord;

    const resolvedPropCertId = allDirect
      ? (gridItems?.unitCertificates || []).find((r: CertificateItem) =>
          r.certificateTypeId === ct.certificateTypeId &&
          (selectedUnitIds.has(r.propertyDetailsId as number) || (r.propertyId != null && selectedUnitIds.has(r.propertyId as number)))
        )?.propertyCertificateId
      : undefined;

    return { gridRecord, customStatusBadge, sourceLevel, hasDirectSavedData: allDirect, resolvedPropCertId };
  }

  // selectedUnitIds.size === 0
  const aptRecord = (gridItems?.societyCertificates || []).find((r: CertificateItem) => r.certificateTypeId === ct.certificateTypeId);
  const wingRecord = selectedWingDetailId != null
    ? (gridItems?.wingCertificates || []).find(
        (r: CertificateItem) => Number(r.wingDetailId) === Number(selectedWingDetailId) && r.certificateTypeId === ct.certificateTypeId
      )
    : undefined;
  const isWingApt = isCertificateFromApartmentLevel(wingRecord, aptRecord);

  let customStatusBadge: CertificateData['customStatusBadge'] = { label: t('building.notConfigured') || 'Not Configured', variant: 'secondary' };
  let sourceLevel: CertificateData['sourceLevel'] = 'None';

  if (wingRecord && !isWingApt && (wingRecord.hasDocument || wingRecord.documentGuid || wingRecord.certificateNumber)) {
    customStatusBadge = { label: t('building.coveredByWing') || 'Wing Covered', variant: 'info' };
    sourceLevel = 'Wing';
  } else if ((aptRecord && (aptRecord.hasDocument || aptRecord.documentGuid || aptRecord.certificateNumber)) || isWingApt) {
    customStatusBadge = { label: t('building.coveredByApartment') || 'Apartment Covered', variant: 'purple' };
    sourceLevel = 'Apartment';
  }

  return { gridRecord: wingRecord || aptRecord, customStatusBadge, sourceLevel, hasDirectSavedData: false, resolvedPropCertId: undefined };
}
