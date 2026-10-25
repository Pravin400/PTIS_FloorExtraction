import type {
  CertificateData,
  CertificateTypeMasterOption,
} from '@/types/building-permission.types';
import {
  isCertificateFromApartmentLevel,
  type CertificateItem,
  type CertificateGridItems,
} from '@/lib/utils/certificate-grid-mapper';

export interface CommonResolveParams {
  ct: CertificateTypeMasterOption;
  isSelected: boolean;
  gridItems: CertificateGridItems | null;
  initialData?: CertificateData | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function resolveApartmentCertificate(params: CommonResolveParams): {
  gridRecord?: CertificateItem;
  customStatusBadge: CertificateData['customStatusBadge'];
  sourceLevel: CertificateData['sourceLevel'];
  hasDirectSavedData: boolean;
  resolvedPropCertId?: number | null;
} {
  const { ct, isSelected, gridItems, initialData, t } = params;
  const gridRecord = (gridItems?.societyCertificates || []).find(
    (r: CertificateItem) => r.certificateTypeId === ct.certificateTypeId
  );

  const hasRecordData = Boolean(
    gridRecord &&
      (gridRecord.hasDocument ||
        (gridRecord.documentGuid && gridRecord.documentGuid !== 'null' && gridRecord.documentGuid !== 'undefined') ||
        (gridRecord.certificateNumber && gridRecord.certificateNumber.trim() !== '') ||
        (gridRecord.certificateDate && gridRecord.certificateDate.trim() !== ''))
  );

  const hasInitialData =
    isSelected &&
    (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) &&
    Boolean(
      (initialData?.documentGuid && initialData.documentGuid !== 'null' && initialData.documentGuid !== 'undefined') ||
        (initialData?.number && initialData.number.trim() !== '') ||
        (initialData?.date && initialData.date.trim() !== '')
    );

  const customStatusBadge: CertificateData['customStatusBadge'] = (hasRecordData || hasInitialData)
    ? { label: t('building.apartmentLevel') || 'Apartment Level', variant: 'purple' }
    : { label: t('building.notConfigured') || 'Not Configured', variant: 'secondary' };

  const sourceLevel: CertificateData['sourceLevel'] = (hasRecordData || hasInitialData) ? 'Direct' : 'None';

  const aptRec = gridRecord;
  const hasDirectSavedData = Boolean(
    (aptRec?.propertyCertificateId && aptRec.propertyCertificateId > 0) ||
      (aptRec?.hasDocument && aptRec.documentGuid && aptRec.documentGuid !== 'temp-guid') ||
      (isSelected &&
        (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId) &&
        Boolean(initialData?.propertyCertificateId || (initialData?.documentGuid && initialData.documentGuid !== 'temp-guid')))
  );

  const resolvedPropCertId =
    gridRecord?.propertyCertificateId ||
    (isSelected && (initialData?.certificateTypeId == null || initialData.certificateTypeId === ct.certificateTypeId)
      ? initialData?.propertyCertificateId
      : undefined);

  return { gridRecord, customStatusBadge, sourceLevel, hasDirectSavedData, resolvedPropCertId };
}

export function resolveWingCertificate(
  params: CommonResolveParams & { selectedWingDetailId: number | null }
): {
  gridRecord?: CertificateItem;
  customStatusBadge: CertificateData['customStatusBadge'];
  sourceLevel: CertificateData['sourceLevel'];
  hasDirectSavedData: boolean;
  resolvedPropCertId?: number | null;
} {
  const { ct, gridItems, selectedWingDetailId, t } = params;
  const wingRecord = selectedWingDetailId != null
    ? (gridItems?.wingCertificates || []).find(
        (r: CertificateItem) => Number(r.wingDetailId) === Number(selectedWingDetailId) && r.certificateTypeId === ct.certificateTypeId
      )
    : undefined;
  const aptRecord = (gridItems?.societyCertificates || []).find(
    (r: CertificateItem) => r.certificateTypeId === ct.certificateTypeId
  );
  const gridRecord = wingRecord || aptRecord;

  const hasAptCovered = Boolean(
    aptRecord && (aptRecord.hasDocument || aptRecord.documentGuid || aptRecord.certificateNumber || aptRecord.certificateDate)
  );
  const isWingApt = isCertificateFromApartmentLevel(wingRecord, aptRecord);
  const hasWingDirectData = Boolean(
    wingRecord &&
      !isWingApt &&
      (wingRecord.hasDocument || wingRecord.documentGuid || wingRecord.certificateNumber || wingRecord.certificateDate)
  );

  let customStatusBadge: CertificateData['customStatusBadge'];
  let sourceLevel: CertificateData['sourceLevel'];

  if (hasWingDirectData) {
    customStatusBadge = { label: t('building.wingLevel') || 'Wing Level', variant: 'success' };
    sourceLevel = 'Direct';
  } else if (hasAptCovered || isWingApt) {
    customStatusBadge = { label: t('building.coveredByApartment') || 'Apartment Covered', variant: 'purple' };
    sourceLevel = 'Apartment';
  } else {
    customStatusBadge = { label: t('building.notConfigured') || 'Not Configured', variant: 'secondary' };
    sourceLevel = 'None';
  }

  const isWingRecApt = isCertificateFromApartmentLevel(wingRecord, aptRecord);
  const hasDirectSavedData = Boolean(
    wingRecord &&
      !isWingRecApt &&
      (wingRecord.entityType === 'W' || Number(wingRecord.wingDetailId) === Number(selectedWingDetailId)) &&
      ((wingRecord.propertyCertificateId && wingRecord.propertyCertificateId > 0) ||
        (wingRecord.hasDocument && wingRecord.documentGuid && wingRecord.documentGuid !== 'temp-guid'))
  );

  const resolvedPropCertId =
    gridRecord?.entityType === 'W' || gridRecord?.wingDetailId === selectedWingDetailId
      ? gridRecord?.propertyCertificateId
      : undefined;

  return { gridRecord, customStatusBadge, sourceLevel, hasDirectSavedData, resolvedPropCertId };
}
