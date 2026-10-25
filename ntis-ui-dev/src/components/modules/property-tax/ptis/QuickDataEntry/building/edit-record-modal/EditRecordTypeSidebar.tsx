import React from 'react';
import { BADGE_COLORS } from './edit-certificate-record-modal.types';
import type { CertificateTypeMasterOption } from '@/types/building-permission.types';

interface EditRecordTypeSidebarProps {
  activeCertificateTypes: CertificateTypeMasterOption[];
  selectedTypeId: number;
  setSelectedTypeId: (id: number) => void;
}

export const EditRecordTypeSidebar: React.FC<EditRecordTypeSidebarProps> = ({
  activeCertificateTypes,
  selectedTypeId,
  setSelectedTypeId,
}) => {
  return (
    <div className="md:col-span-4 space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50 max-h-72 overflow-y-auto">
      {activeCertificateTypes.map((type) => {
        const isSelected = selectedTypeId === type.certificateTypeId;
        const colors = BADGE_COLORS[type.badgeCode] || {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
        };

        return (
          <button
            key={type.certificateTypeId}
            type="button"
            onClick={() => setSelectedTypeId(type.certificateTypeId)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
              isSelected
                ? 'border-blue-500 bg-blue-50/80 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full ${colors.bg} ${colors.text} border ${colors.border} flex items-center justify-center text-xs font-bold shrink-0`}
            >
              {type.badgeCode}
            </div>
            <span className="text-xs font-bold text-slate-800 truncate">
              {type.certificateTypeName}
            </span>
          </button>
        );
      })}
    </div>
  );
};
