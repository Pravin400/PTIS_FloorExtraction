import type {
  ApplicationLevel,
  CertificateData,
  WingOption,
} from '@/types/building-permission.types';
import type { CertificateItem } from '@/lib/utils/certificate-grid-mapper';
import type {
  DeleteAccessInfo,
  DeleteCertificateRecordParams,
  CertificateGridItems,
} from './building-permission.types';

interface ResolveDeletePayloadParams {
  level: ApplicationLevel;
  selectedTypeId: number;
  certTypeName: string;
  docGuid?: string | null;
  certId?: number | null;
  certNum: string;
  fileName: string;
  issueDt: string;
  targetSocietyDetailId: number | null;
  gridItems: CertificateGridItems | null;
  selectedWingDetailId: number | null;
  activeWings: WingOption[];
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  propertyId: string;
  deleteAccessInfo: DeleteAccessInfo;
  activeCertificate?: CertificateItem | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function resolveDeletePayload(params: ResolveDeletePayloadParams) {
  const {
    level,
    selectedTypeId,
    certTypeName,
    targetSocietyDetailId,
    gridItems,
    selectedWingDetailId,
    activeWings,
    isApartmentIndividual,
    initialData,
    propertyId,
    deleteAccessInfo,
    activeCertificate,
    t,
  } = params;

  let docGuid = params.docGuid;
  let certId = params.certId;
  let certNum = params.certNum;
  let fileName = params.fileName;
  let issueDt = params.issueDt;

  let confirmTitle = t('building.confirmDeleteCertificateTitle') || 'Delete Certificate & Data';
  let deletePayload: DeleteCertificateRecordParams = { certificateTypeId: selectedTypeId };
  let detailsLines: string[] = [];

  if (level === 'Apartment') {
    const aptRec = (gridItems?.societyCertificates || []).find((r: CertificateItem) => r.certificateTypeId === selectedTypeId);
    if (aptRec) {
      docGuid = docGuid || aptRec.documentGuid || undefined;
      certId = certId || aptRec.propertyCertificateId || undefined;
      certNum = certNum || aptRec.certificateNumber || '';
      fileName = fileName || aptRec.fileName || '';
      issueDt = issueDt || (aptRec.certificateDate || '').split('T')[0];
    }
    confirmTitle = t('building.confirmDeleteAptCertTitle') || 'Delete Apartment Level Certificate';
    detailsLines = [
      t('building.levelToDeleteApartment') || 'Level to Delete: APARTMENT LEVEL (Entire Society)',
      t('building.impactScopeApartment') || 'Cascading Impact: Deleting will remove this certificate across ALL wings and units in the entire society.',
      t('building.certificateLabel', { name: certTypeName }) || `Certificate: ${certTypeName}`,
    ];
    deletePayload = { certificateTypeId: selectedTypeId, documentGuid: docGuid, propertyCertificateId: certId, level: 'Apartment', entityType: 'S', societyDetailId: targetSocietyDetailId };
  } else if (level === 'Wing') {
    const targetWingId = selectedWingDetailId != null ? Number(selectedWingDetailId) : undefined;
    const wingRec = targetWingId != null ? (gridItems?.wingCertificates || []).find((r: CertificateItem) => Number(r.wingDetailId) === Number(targetWingId) && r.certificateTypeId === selectedTypeId) : undefined;
    if (wingRec) {
      docGuid = docGuid || wingRec.documentGuid || undefined;
      certId = certId || wingRec.propertyCertificateId || undefined;
      certNum = certNum || wingRec.certificateNumber || '';
      fileName = fileName || wingRec.fileName || '';
      issueDt = issueDt || (wingRec.certificateDate || '').split('T')[0];
    }
    const selectedWing = activeWings.find((w) => w.wingDetailId === targetWingId);
    const wingLabel = selectedWing?.wingName || (targetWingId ? `Wing ${targetWingId}` : 'Wing');
    confirmTitle = t('building.confirmDeleteWingCertTitle') || 'Delete Wing Level Certificate';
    detailsLines = [
      t('building.levelToDeleteWing', { wing: wingLabel ? `Wing ${wingLabel}` : 'Wing' }) || `Level to Delete: WING LEVEL (Wing: ${wingLabel})`,
      t('building.impactScopeWing', { wing: wingLabel ? `Wing ${wingLabel}` : 'this wing' }) || `Cascading Impact: Deleting will remove this certificate from ${wingLabel ? `Wing ${wingLabel}` : 'this wing'} and ALL units covered by this wing.`,
      t('building.certificateLabel', { name: certTypeName }) || `Certificate: ${certTypeName}`,
    ];
    deletePayload = { certificateTypeId: selectedTypeId, documentGuid: docGuid, propertyCertificateId: certId, level: 'Wing', entityType: 'W', selectedWingDetailId: targetWingId, societyDetailId: targetSocietyDetailId };
  } else if (level === 'Unit') {
    confirmTitle = t('building.confirmDeleteUnitCertTitle') || 'Delete Unit Level Certificate';
    if (isApartmentIndividual) {
      detailsLines = [
        t('building.impactScopeUnit') || 'Cascading Impact: Deleting will remove this certificate only for this property.',
        t('building.certificateLabel', { name: certTypeName }) || `Certificate: ${certTypeName}`,
      ];
      deletePayload = { certificateTypeId: selectedTypeId, documentGuid: docGuid, propertyCertificateId: certId, level: 'Unit', entityType: 'P', propertyDetailsId: (initialData as unknown as { propertyDetailsId?: number })?.propertyDetailsId || (propertyId ? Number(propertyId) : undefined), societyDetailId: targetSocietyDetailId };
    } else {
      const directEntries = deleteAccessInfo.targetDirectUnits || [];
      const directPropIds = directEntries.map((e) => e.unit.propertyId).filter((id): id is number => id != null && id > 0);
      const directPropDetailsId = directEntries[0]?.unit.propertyDetailsId;
      const directCert = directEntries[0]?.stat.certificate || activeCertificate;
      const directUnitNames = directEntries.map((e) => e.unit.unitNo).filter(Boolean).join(', ');
      docGuid = directCert?.documentGuid || docGuid;
      certId = directCert?.propertyCertificateId || certId;
      certNum = directCert?.certificateNumber || certNum;
      fileName = directCert?.fileName || fileName;
      issueDt = (directCert?.certificateDate || issueDt || '').split('T')[0];

      detailsLines = [
        t('building.levelToDeleteUnit', { unit: directUnitNames || 'Selected Unit' }) || `Level to Delete: UNIT LEVEL (${directUnitNames})`,
        t('building.impactScopeUnit') || 'Cascading Impact: Deleting will remove this certificate only for the selected unit(s).',
        t('building.certificateLabel', { name: certTypeName }) || `Certificate: ${certTypeName}`,
      ];
      deletePayload = { certificateTypeId: selectedTypeId, documentGuid: docGuid, propertyCertificateId: certId, level: 'Unit', entityType: 'P', selectedUnitIds: directPropIds.length > 0 ? directPropIds : undefined, propertyDetailsId: directPropDetailsId, societyDetailId: targetSocietyDetailId };
    }
  }

  if (certNum) detailsLines.push(t('building.certNoLabel', { number: certNum }) || `Cert No: #${certNum}`);
  if (issueDt) detailsLines.push(t('building.dateLabel', { date: issueDt }) || `Date: ${issueDt}`);
  if (fileName) detailsLines.push(t('building.documentLabel', { name: fileName }) || `Document: ${fileName}`);

  return { confirmTitle, detailsLines, deletePayload };
}
