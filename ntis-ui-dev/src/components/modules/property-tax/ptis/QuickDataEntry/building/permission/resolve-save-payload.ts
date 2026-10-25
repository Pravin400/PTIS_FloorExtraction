import type { ApplicationLevel, CertificateData } from '@/types/building-permission.types';
import type { UnitStatusResolution } from '@/lib/utils/certificate-grid-mapper';
import type { CertificateItem } from './building-permission.types';

interface ResolveSavePayloadParams {
  level: ApplicationLevel;
  selectedTypeId: number;
  selectedUnitIds: Set<number>;
  unitStatusMap: Map<number | string, UnitStatusResolution>;
  existingDocumentGuid: string | null;
  existingFileName: string | null;
  existingPropertyCertificateId: number | null;
  activeCertificate?: CertificateItem | null;
  activeUnitStat?: UnitStatusResolution;
  isApartmentIndividual: boolean;
  initialData?: CertificateData | null;
  attachedFiles: File[];
  removedAttachmentTypeIds: Set<number>;
  hasExistingDocument: boolean;
}

export function resolveSavePayload(params: ResolveSavePayloadParams) {
  const {
    level,
    selectedTypeId,
    selectedUnitIds,
    unitStatusMap,
    existingDocumentGuid,
    existingFileName,
    existingPropertyCertificateId,
    activeCertificate,
    activeUnitStat,
    isApartmentIndividual,
    initialData,
    attachedFiles,
    removedAttachmentTypeIds,
    hasExistingDocument,
  } = params;

  const isFileExplicitlyDeleted = removedAttachmentTypeIds.has(selectedTypeId);
  const isNewFileAttached = attachedFiles.length > 0;
  const isFileModified = isNewFileAttached || isFileExplicitlyDeleted;

  let resolvedDocGuid: string | null = null;
  let resolvedFileName: string | null = null;
  let resolvedCertId: number | null = null;

  if (!isFileExplicitlyDeleted) {
    if (level === 'Unit' && selectedUnitIds.size === 1) {
      const unitId = Array.from(selectedUnitIds)[0];
      const unitStat = unitStatusMap.get(unitId);
      if (unitStat?.status === 'direct' && unitStat.certificate) {
        resolvedDocGuid = existingDocumentGuid || unitStat.certificate.documentGuid || null;
        resolvedFileName = existingFileName || unitStat.certificate.fileName || null;
        resolvedCertId = existingPropertyCertificateId || unitStat.certificate.propertyCertificateId || null;
      } else {
        resolvedDocGuid = existingDocumentGuid || null;
        resolvedFileName = existingFileName || null;
        resolvedCertId = existingPropertyCertificateId || null;
      }
    } else if (level === 'Unit' && selectedUnitIds.size > 1) {
      resolvedDocGuid = existingDocumentGuid || activeCertificate?.documentGuid || activeUnitStat?.documentGuid || null;
      resolvedFileName = existingFileName || activeCertificate?.fileName || activeUnitStat?.fileName || null;
      resolvedCertId = existingPropertyCertificateId || null;
    } else {
      resolvedDocGuid = existingDocumentGuid || activeCertificate?.documentGuid || (isApartmentIndividual ? initialData?.documentGuid : null) || null;
      resolvedFileName = existingFileName || activeCertificate?.fileName || (isApartmentIndividual ? initialData?.fileName : null) || null;
      resolvedCertId = existingPropertyCertificateId || activeCertificate?.propertyCertificateId || (isApartmentIndividual ? initialData?.propertyCertificateId : null) || null;
    }
  }

  if (isNewFileAttached && attachedFiles[0]?.name) {
    resolvedFileName = attachedFiles[0].name;
  }

  const hasDoc = Boolean(resolvedDocGuid || activeCertificate?.hasDocument || hasExistingDocument);

  return {
    resolvedDocGuid,
    resolvedFileName,
    resolvedCertId,
    isFileModified,
    isNewFileAttached,
    hasDoc,
  };
}
