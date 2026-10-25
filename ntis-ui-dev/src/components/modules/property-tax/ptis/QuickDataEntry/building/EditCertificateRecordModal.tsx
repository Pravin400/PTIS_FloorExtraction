'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useCertificateModalState } from '@/hooks/useCertificateModalState';
import { EditCertificateRecordModalProps } from './edit-record-modal/edit-certificate-record-modal.types';
import { useEditCertificateRecordState } from './edit-record-modal/useEditCertificateRecordState';
import { EditRecordModalHeader } from './edit-record-modal/EditRecordModalHeader';
import { EditRecordLevelSelector } from './edit-record-modal/EditRecordLevelSelector';
import { EditRecordUnitSelector } from './edit-record-modal/EditRecordUnitSelector';
import { EditRecordDocumentForm } from './edit-record-modal/EditRecordDocumentForm';
import { EditRecordModalFooter } from './edit-record-modal/EditRecordModalFooter';

export type { EditCertificateRecordModalProps };

export function EditCertificateRecordModal({
  open,
  onClose,
  onSave,
  propertyId,
  wings = [],
  units = [],
  certificateTypes = [],
  initialLevel = 'Apartment',
  initialCertificateTypeId = 3,
  initialData = null,
  isLoading = false,
  propertyConstructionYear,
}: EditCertificateRecordModalProps): React.ReactElement | null {
  const t = useTranslations('quickDataEntry');

  const {
    level,
    setLevel,
    selectedWingDetailId,
    setSelectedWingDetailId,
    unitSearchQuery,
    setUnitSearchQuery,
    wingFilter,
    setWingFilter,
    selectedUnitIds,
    selectedTypeId,
    setSelectedTypeId,
    activeCertificateType,
    certificateDate,
    setCertificateDate,
    certificateNumber,
    setCertificateNumber,
    status,
    setStatus,
    remarks,
    attachedFiles,
    setAttachedFiles,
    certificateTypes: activeCertificateTypes,
    filteredUnits,
    isAllUnitsSelected,
    toggleUnitSelection,
    toggleAllUnits,
  } = useCertificateModalState({
    propertyId,
    wings,
    units,
    certificateTypes,
    initialLevel,
    initialCertificateTypeId,
    initialData,
  });

  const {
    fileInputRef,
    dateError,
    setDateError,
    effectiveConstructionYear,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
  } = useEditCertificateRecordState({
    level,
    selectedWingDetailId,
    selectedUnitIds,
    units,
    propertyConstructionYear,
    certificateDate,
    certificateNumber,
    selectedTypeId,
    status,
    remarks,
    attachedFiles,
    setAttachedFiles,
    onSave,
    t,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 max-h-[90vh]">
        <EditRecordModalHeader onClose={onClose} t={t} />

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <EditRecordLevelSelector
            level={level}
            setLevel={setLevel}
            selectedWingDetailId={selectedWingDetailId}
            setSelectedWingDetailId={setSelectedWingDetailId}
            wings={wings}
            wingFilter={wingFilter}
            setWingFilter={setWingFilter}
            t={t}
          />

          {level === 'Unit' && (
            <EditRecordUnitSelector
              selectedUnitIds={selectedUnitIds}
              unitSearchQuery={unitSearchQuery}
              setUnitSearchQuery={setUnitSearchQuery}
              wingFilter={wingFilter}
              setWingFilter={setWingFilter}
              wings={wings}
              setSelectedWingDetailId={setSelectedWingDetailId}
              isAllUnitsSelected={isAllUnitsSelected}
              toggleAllUnits={toggleAllUnits}
              filteredUnits={filteredUnits}
              toggleUnitSelection={toggleUnitSelection}
              t={t}
            />
          )}

          <EditRecordDocumentForm
            activeCertificateTypes={activeCertificateTypes}
            selectedTypeId={selectedTypeId}
            setSelectedTypeId={setSelectedTypeId}
            activeCertificateType={activeCertificateType}
            certificateDate={certificateDate}
            setCertificateDate={setCertificateDate}
            certificateNumber={certificateNumber}
            setCertificateNumber={setCertificateNumber}
            effectiveConstructionYear={effectiveConstructionYear}
            dateError={dateError}
            setDateError={setDateError}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            attachedFiles={attachedFiles}
            handleRemoveFile={handleRemoveFile}
            status={status}
            setStatus={setStatus}
            t={t}
          />

          <EditRecordModalFooter onClose={onClose} isLoading={isLoading} t={t} />
        </form>
      </div>
    </div>
  );
}
