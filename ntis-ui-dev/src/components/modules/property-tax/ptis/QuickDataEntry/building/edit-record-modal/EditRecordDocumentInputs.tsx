import React from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Input } from '@/components/common';
import { BADGE_COLORS } from './edit-certificate-record-modal.types';
import {
  toLocalIsoDate,
  sanitizeCertificateNumber,
  getCertificateLengthRule,
} from '@/lib/validation/building/validation-rules';
import type {
  CertificateTypeMasterOption,
  CertificateStatus,
} from '@/types/building-permission.types';

interface EditRecordDocumentInputsProps {
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

export const EditRecordDocumentInputs: React.FC<EditRecordDocumentInputsProps> = ({
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
  const badgeStyle = BADGE_COLORS[activeCertificateType?.badgeCode || 'OC'] || {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  };

  const certName = activeCertificateType?.certificateTypeName || t('building.certificateDefaultName');
  const lengthRule = getCertificateLengthRule(activeCertificateType?.certificateTypeName, activeCertificateType?.badgeCode);
  const isNumericOnly = Boolean(activeCertificateType?.isNumericOnly);

  const getStatusLabel = (st: CertificateStatus) => {
    switch (st) {
      case 'Active':
        return t('building.statusActive');
      case 'Pending':
        return t('building.statusPending');
      case 'Expired':
        return t('building.statusExpired');
      default:
        return st;
    }
  };

  return (
    <div className="md:col-span-8 border border-slate-200 rounded-xl p-5 space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div
          className={`w-10 h-10 rounded-full ${badgeStyle.bg} ${badgeStyle.text} border ${badgeStyle.border} flex items-center justify-center font-bold text-sm shrink-0`}
        >
          {activeCertificateType?.badgeCode || 'DOC'}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">{certName}</h3>
          <p className="text-xs text-slate-400">
            {t('building.editRecordInputsHint')}{' '}
            <span className="text-blue-600 font-medium">
              {t('building.supportingFiles')}
            </span>.
          </p>
        </div>
      </div>

      {/* Inputs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            type="date"
            label={`${certName} ${t('building.date')}`}
            required
            min={effectiveConstructionYear ? `${effectiveConstructionYear}-01-01` : undefined}
            max={toLocalIsoDate()}
            value={certificateDate}
            error={dateError || undefined}
            onChange={(e) => {
              setCertificateDate(e.target.value);
              if (dateError) setDateError(null);
            }}
            className="text-xs text-slate-800"
          />
        </div>

        <div>
          <Input
            type="text"
            label={`${certName} ${t('building.number')}`}
            required
            placeholder={`${activeCertificateType?.badgeCode || 'DOC'}/2024/B-101`}
            value={certificateNumber}
            maxLength={lengthRule.max}
            onKeyDown={(e) => {
              if (e.key === ' ') e.preventDefault();
            }}
            onChange={(e) => {
              const val = sanitizeCertificateNumber(e.target.value, isNumericOnly);
              setCertificateNumber(val);
            }}
            className="text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Drag & Drop File Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer text-center group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-800">
          {t('building.supportingDocuments')}
        </span>
        <span className="text-[11px] text-slate-400 mt-0.5">
          {t('building.allowedFormatsMultiple')}
        </span>
      </div>

      {/* Uploaded files preview list */}
      {attachedFiles.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-600">
            {t('building.attachedFiles')}
          </span>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[150px]">{f.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(i);
                  }}
                  className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                  aria-label={t('common.actions.remove') || 'Remove'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Toggle */}
      <div className="pt-2 space-y-1">
        <label className="text-xs font-bold text-slate-700">
          {t('building.statusLabel')}
        </label>
        <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50 max-w-xs">
          {(['Active', 'Pending', 'Expired'] as CertificateStatus[]).map((st) => {
            const isSelected = status === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? st === 'Active'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : st === 'Pending'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {getStatusLabel(st)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
