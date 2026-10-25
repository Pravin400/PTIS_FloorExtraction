'use client';

import React, { useState } from 'react';
import { Copy, Check, Pencil, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@/components/common/Tooltip';

interface PropertyMasterHeaderProps {
  propertyNo: string;
  upicId: string;
  societyName: string;
  onEdit?: () => void;
  onPrefetch?: () => void;
}

export const PropertyMasterHeader: React.FC<PropertyMasterHeaderProps> = ({
  propertyNo,
  upicId,
  societyName,
  onEdit,
  onPrefetch,
}) => {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('appartmentQC');

  const handleCopyUpic = () => {
    if (!upicId || upicId === '-') return;
    navigator.clipboard.writeText(upicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-x-2 xl:gap-x-3 gap-y-0.5 border-b border-slate-100 pb-1 min-w-0">
      <div className="flex items-center gap-x-2.5 xl:gap-x-4 gap-y-1 text-xs xl:text-[13px] min-w-0 flex-1">
        {/* PROPERTY NO */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-slate-400 font-bold text-xs">#</span>
          <span className="text-slate-600 font-bold text-xs">
            {t('header.propertyNo') || 'PROPERTY NO.:'}
          </span>
          <span className="font-black text-[#ef4444] text-[12px] xl:text-[13px] tracking-tight">
            {propertyNo}
          </span>
        </div>

        {/* UPIC ID */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-blue-500 font-bold text-xs">#</span>
          <span className="text-slate-600 font-bold text-xs">
            {t('header.upicId') || 'UPIC ID:'}
          </span>
          <span className="font-black text-[#ef4444] text-[12px] xl:text-[13px] tracking-tight">
            {upicId}
          </span>
          {upicId !== '-' && (
            <button
              type="button"
              onClick={handleCopyUpic}
              className="text-blue-500 hover:text-blue-700 transition-colors p-0.5 ml-0.5 cursor-pointer"
              title={t('header.copyUpic') || 'Copy UPIC'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* SOCIETY NAME */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Building2 className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-slate-500 shrink-0" />
          <span className="text-slate-700 font-bold text-xs shrink-0">
            {t('header.societyName') || 'SOCIETY NAME:'}
          </span>
          {societyName && societyName !== '-' ? (
            <Tooltip
              content={
                <div className="max-w-md whitespace-normal break-words font-semibold text-xs leading-relaxed">
                  {societyName}
                </div>
              }
              placement="top"
            >
              <span
                className="font-black text-[#ef4444] text-[13px] sm:text-sm lg:text-[14px] xl:text-[15px] tracking-tight truncate cursor-pointer hover:underline inline-block min-w-0 flex-1"
                title={societyName}
              >
                {societyName}
              </span>
            </Tooltip>
          ) : (
            <span className="font-black text-[#ef4444] text-[13px] sm:text-sm lg:text-[14px] xl:text-[15px] tracking-tight truncate min-w-0 flex-1">
              -
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons: Toggle Middle Section & Edit Society */}
      {/* Edit Action Button */}
      <button
        type="button"
        onClick={onEdit}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all shrink-0 cursor-pointer text-[11px] font-bold shadow-2xs active:scale-95 ml-1"
        title={t('header.editSociety') || 'Edit Society Details'}
      >
        <Pencil className="w-3 h-3 text-blue-600" />
        <span>{t('header.editSociety') || 'Edit Society'}</span>
      </button>
    </div>
  );
};
