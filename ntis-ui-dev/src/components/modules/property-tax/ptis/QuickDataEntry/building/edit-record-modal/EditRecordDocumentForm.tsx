import React from 'react';
import { EditRecordTypeSidebar } from './EditRecordTypeSidebar';
import { EditRecordDocumentInputs } from './EditRecordDocumentInputs';
import type {
  CertificateTypeMasterOption,
  CertificateStatus,
} from '@/types/building-permission.types';

interface EditRecordDocumentFormProps {
  activeCertificateTypes: CertificateTypeMasterOption[];
  selectedTypeId: number;
  setSelectedTypeId: (id: number) => void;
  activeCertificateType?: CertificateTypeMasterOption;
  certificateDate: string;
  setCertificateDate: (date: string) => void;
  certificateNumber: string;
  setCertificateNumber: (num: string) => void;
  effectiveConstructionYear: number | null;
  dateError: string | null;
  setDateError: (err: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachedFiles: File[];
  handleRemoveFile: (index: number) => void;
  status: CertificateStatus;
  setStatus: (status: CertificateStatus) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const EditRecordDocumentForm: React.FC<EditRecordDocumentFormProps> = ({
  activeCertificateTypes,
  selectedTypeId,
  setSelectedTypeId,
  activeCertificateType,
  certificateDate,
  setCertificateDate,
  certificateNumber,
  setCertificateNumber,
  effectiveConstructionYear,
  dateError,
  setDateError,
  fileInputRef,
  handleFileChange,
  attachedFiles,
  handleRemoveFile,
  status,
  setStatus,
  t,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#5B50E6] text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
            2
          </span>
          <span>{t('building.addDocumentDetails') || 'ADD DOCUMENT DETAILS'}</span>
        </div>
        <span className="text-xs text-indigo-100 font-normal">
          {t('building.selectTypeFromLeft') || 'Select a type from the left'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <EditRecordTypeSidebar
          activeCertificateTypes={activeCertificateTypes}
          selectedTypeId={selectedTypeId}
          setSelectedTypeId={setSelectedTypeId}
        />

        <EditRecordDocumentInputs
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
      </div>
    </div>
  );
};
