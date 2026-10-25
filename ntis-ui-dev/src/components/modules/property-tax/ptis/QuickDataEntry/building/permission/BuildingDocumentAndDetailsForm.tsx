import React from 'react';
import { Label } from '@/components/common';
import { DocumentAttachment } from '../DocumentAttachment';
import { BuildingCertificateInputs } from './BuildingCertificateInputs';
import type { ApplicationLevel, CertificateData, CertificateTypeMasterOption } from '@/types/building-permission.types';
import type { UnitStatusResolution } from '@/lib/utils/certificate-grid-mapper';
import type { FieldErrors, CertificateItem } from './building-permission.types';

interface BuildingDocumentAndDetailsFormProps {
  isApartmentIndividual: boolean;
  level: ApplicationLevel;
  selectedUnitNamesSummary: string;
  selectedUnitIds: Set<number>;
  isCurrentCertEnabled: boolean;
  activeWingName: string;
  activeCertificateType?: CertificateTypeMasterOption;
  activeCertificateDisplayName: string;
  attachedFiles: File[];
  setAttachedFiles: (files: File[]) => void;
  removedAttachmentTypeIds: Set<number>;
  setRemovedAttachmentTypeIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedTypeId: number;
  uploadedFileNamesMap: Record<number, string>;
  setUploadedFileNamesMap: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  existingDocumentGuid: string | null;
  existingFileName: string | null;
  activeCertificate?: CertificateItem | null;
  activeUnitStat?: UnitStatusResolution;
  initialData?: CertificateData | null;
  isFormDisabled: boolean;
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  setEnabledStateMap: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  certificateNumber: string;
  setCertificateNumber: (val: string) => void;
  lengthRule: { min: number; max: number };
  isNumericOnly: boolean;
  certificateDate: string;
  setCertificateDate: (val: string) => void;
  effectiveConstructionYear: number | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function BuildingDocumentAndDetailsForm(props: BuildingDocumentAndDetailsFormProps): React.ReactElement {
  const {
    isApartmentIndividual,
    level,
    selectedUnitNamesSummary,
    selectedUnitIds,
    isCurrentCertEnabled,
    activeWingName,
    activeCertificateType,
    activeCertificateDisplayName,
    attachedFiles,
    setAttachedFiles,
    removedAttachmentTypeIds,
    setRemovedAttachmentTypeIds,
    selectedTypeId,
    uploadedFileNamesMap,
    setUploadedFileNamesMap,
    existingDocumentGuid,
    existingFileName,
    activeCertificate,
    activeUnitStat,
    initialData,
    isFormDisabled,
    fieldErrors,
    setFieldErrors,
    setEnabledStateMap,
    certificateNumber,
    setCertificateNumber,
    lengthRule,
    isNumericOnly,
    certificateDate,
    setCertificateDate,
    effectiveConstructionYear,
    t,
  } = props;

  const documentGuid =
    attachedFiles.length > 0
      ? undefined
      : removedAttachmentTypeIds.has(selectedTypeId)
      ? undefined
      : (existingDocumentGuid ||
         activeCertificate?.documentGuid ||
         (level === 'Unit' && activeUnitStat?.documentGuid) ||
         (level === 'Apartment' && initialData?.certificateTypeId === selectedTypeId ? initialData?.documentGuid : undefined) ||
         undefined);

  const fileName =
    (removedAttachmentTypeIds.has(selectedTypeId)
      ? undefined
      : (attachedFiles[0]?.name ||
         (selectedTypeId ? uploadedFileNamesMap[selectedTypeId] : undefined) ||
         existingFileName ||
         activeCertificate?.fileName ||
         (level === 'Unit' && activeUnitStat?.fileName) ||
         (level === 'Apartment' && initialData?.certificateTypeId === selectedTypeId ? initialData?.fileName : undefined))) ||
    (activeCertificateType?.certificateTypeName
      ? `${activeCertificateType.certificateTypeName} Attachment`
      : 'Certificate Document');

  const hasDocumentBinding =
    !removedAttachmentTypeIds.has(selectedTypeId) &&
    Boolean(
      existingDocumentGuid ||
      activeCertificate?.documentGuid ||
      activeCertificate?.hasDocument ||
      (level === 'Unit' && (activeUnitStat?.documentGuid || activeUnitStat?.hasDocument)) ||
      (level === 'Apartment' && initialData?.certificateTypeId === selectedTypeId && initialData?.documentGuid) ||
      (selectedTypeId && uploadedFileNamesMap[selectedTypeId])
    );

  return (
    <>
      <div className="space-y-1.5">
        <Label required className="text-xs font-bold text-blue-900 flex items-center justify-between">
          <span>
            {!isApartmentIndividual && level === 'Unit' && selectedUnitNamesSummary
              ? `${activeCertificateType?.certificateTypeName || 'Certificate'} Attachment for Unit ${selectedUnitNamesSummary}`
              : (!isApartmentIndividual && level === 'Unit' && selectedUnitIds.size === 0 && isCurrentCertEnabled && activeWingName)
              ? (t('building.wingLevelAttachmentLabel', { name: activeCertificateType?.certificateTypeName || 'Certificate', wing: activeWingName }) || `${activeCertificateType?.certificateTypeName || 'Certificate'} Attachment (Wing Level - ${activeWingName})`)
              : (t('building.documentAttachment', { name: activeCertificateType?.certificateTypeName || 'Certificate' }) || `${activeCertificateType?.certificateTypeName || 'Certificate'} Attachment`)}
          </span>
          {!isApartmentIndividual && level === 'Unit' && selectedUnitIds.size > 1 && (
            <span className="text-[11px] font-normal text-blue-600 italic">
              {t('building.willLinkDocument', { count: selectedUnitIds.size })}
            </span>
          )}
        </Label>

        <DocumentAttachment
          documentGuid={documentGuid}
          fileName={fileName}
          hasDocumentBinding={hasDocumentBinding}
          isDisabled={isFormDisabled}
          isDocumentInvalid={!!fieldErrors.document}
          documentError={fieldErrors.document}
          onFileUpload={(file) => {
            setAttachedFiles([file]);
            if (selectedTypeId) setUploadedFileNamesMap((prev) => ({ ...prev, [selectedTypeId]: file.name }));
            setRemovedAttachmentTypeIds((prev) => {
              const next = new Set(prev);
              next.delete(selectedTypeId);
              return next;
            });
            if (selectedTypeId) setEnabledStateMap((prev) => ({ ...prev, [selectedTypeId]: true }));
            setFieldErrors((prev) => ({ ...prev, document: undefined }));
          }}
          onFileDelete={() => {
            setAttachedFiles([]);
            setRemovedAttachmentTypeIds((prev) => new Set(prev).add(selectedTypeId));
            if (selectedTypeId) {
              setUploadedFileNamesMap((prev) => {
                const next = { ...prev };
                delete next[selectedTypeId];
                return next;
              });
            }
          }}
          t={(key) => t(key)}
          label={activeCertificateDisplayName}
          pendingFile={attachedFiles[0]}
        />
      </div>

      <BuildingCertificateInputs
        activeCertificateDisplayName={activeCertificateDisplayName}
        isFormDisabled={isFormDisabled}
        certificateNumber={certificateNumber}
        setCertificateNumber={setCertificateNumber}
        lengthRule={lengthRule}
        isNumericOnly={isNumericOnly}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        certificateDate={certificateDate}
        setCertificateDate={setCertificateDate}
        effectiveConstructionYear={effectiveConstructionYear}
        t={t}
      />
    </>
  );
}
