import { validateDocumentNumber, validateDocumentDate, parseDateString } from '@/lib/validation/building/validation-rules';
import type { ApplicationLevel, CertificateData, CertificateTypeMasterOption } from '@/types/building-permission.types';
import type { FieldErrors, CertificateItem } from './building-permission.types';

interface ValidateFormInput {
  certificateNumber: string;
  certificateDate: string;
  activeCertificateType?: CertificateTypeMasterOption;
  effectiveConstructionYear: number | null;
  attachedFiles: File[];
  level: ApplicationLevel;
  initialData?: CertificateData | null;
  removedAttachmentTypeIds: Set<number>;
  selectedTypeId: number;
  activeCertificate?: CertificateItem | null;
  gridRecords: CertificateItem[];
  existingDocumentGuid: string | null;
  isApartmentIndividual: boolean;
  selectedWingDetailId: number | null;
  selectedUnitIds: Set<number>;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function validateBuildingPermissionForm(input: ValidateFormInput): FieldErrors {
  const {
    certificateNumber,
    certificateDate,
    activeCertificateType,
    effectiveConstructionYear,
    attachedFiles,
    level,
    initialData,
    removedAttachmentTypeIds,
    selectedTypeId,
    activeCertificate,
    gridRecords,
    existingDocumentGuid,
    isApartmentIndividual,
    selectedWingDetailId,
    selectedUnitIds,
    t,
  } = input;

  const errors: FieldErrors = {};

  // 1. Certificate Number validation
  if (!certificateNumber || certificateNumber.trim() === '') {
    errors.certificateNumber = t('building.errors.cannotEnableWithoutNumber') || 'Document number is required.';
  } else {
    const numError = validateDocumentNumber(
      certificateNumber,
      activeCertificateType?.certificateTypeName,
      activeCertificateType?.certificateTypeCode
    );
    if (numError) {
      errors.certificateNumber = t(numError.key, numError.params) || 'Invalid document number.';
    }
  }

  // 2. Certificate Date validation
  if (!certificateDate || certificateDate.trim() === '') {
    errors.certificateDate = t('building.errors.cannotEnableWithoutDate') || 'Issue date is required.';
  } else {
    const dateError = validateDocumentDate(certificateDate);
    if (dateError) {
      errors.certificateDate = t(dateError.key) || 'Invalid issue date.';
    } else if (effectiveConstructionYear) {
      const certDate = parseDateString(certificateDate);
      if (certDate && certDate.getFullYear() < effectiveConstructionYear) {
        errors.certificateDate =
          t('validation.dateBeforeConstructionYear', { year: effectiveConstructionYear }) ||
          `Date must be greater than or equal to construction year (${effectiveConstructionYear})`;
      }
    }
  }

  // 3. Document attachment validation
  if (attachedFiles.length === 0 && !(level === 'Apartment' && initialData?.documentGuid && !removedAttachmentTypeIds.has(selectedTypeId))) {
    const activeGridMatch = activeCertificate || gridRecords.find((r) => r.certificateTypeId === selectedTypeId);
    if (removedAttachmentTypeIds.has(selectedTypeId) || (!activeGridMatch?.hasDocument && !activeGridMatch?.documentGuid && !existingDocumentGuid)) {
      errors.document = t('common.validation.documentRequired') || 'Certificate document attachment is required.';
    }
  }

  // 4. Scope-specific validation
  if (!isApartmentIndividual && level === 'Wing' && !selectedWingDetailId) {
    errors.wing = t('building.errors.wingRequired') || 'Please select a wing.';
  }
  if (!isApartmentIndividual && level === 'Unit' && selectedUnitIds.size === 0) {
    if (!selectedWingDetailId) {
      errors.wing = t('building.errors.wingRequired') || 'Please select a wing.';
    }
  }

  return errors;
}
