'use client';

import React, { useState, memo } from 'react';
import { Copy, Check, Pencil, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@/components/common/Tooltip';

interface IndividualMasterHeaderProps {
  propertyNo: string;
  upicId: string;
  ownerName: string;
  onEdit?: () => void;
  onPrefetch?: () => void;
}

export const IndividualMasterHeader: React.FC<IndividualMasterHeaderProps> = memo(({
  propertyNo,
  upicId,
  ownerName,
  onEdit,
  onPrefetch,
}) => {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('individual');

  const handleCopyUpic = () => {
    if (!upicId || upicId === '-') return;
    navigator.clipboard.writeText(upicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-x-2 xl:gap-x-3 gap-y-0.5 border-b border-slate-100 pb-1 min-w-0">
      <div className="flex items-center gap-x-2.5 xl:gap-x-4 gap-y-1 text-xs xl:text-[13px] min-w-0 flex-1 flex-wrap sm:flex-nowrap">
        {/* PROPERTY NO */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-slate-400 font-bold text-xs">#</span>
          <span className="text-slate-600 font-bold text-xs">{t('header.propertyNo') || 'PROPERTY NO.:'}</span>
          <span className="font-black text-red-500 text-[12px] xl:text-[13px] tracking-tight">{propertyNo}</span>
        </div>

        {/* UPIC ID */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-blue-500 font-bold text-xs">#</span>
          <span className="text-slate-600 font-bold text-xs">{t('header.upicId') || 'UPIC ID:'}</span>
          <span className="font-black text-red-500 text-[12px] xl:text-[13px] tracking-tight">{upicId}</span>
          {upicId !== '-' && (
            <button
              type="button"
              onClick={handleCopyUpic}
              className="text-blue-500 hover:text-blue-700 transition-colors p-0.5 ml-0.5 cursor-pointer"
              title={t('header.copyUpic') || 'Copy UPIC'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* OWNER NAME */}
        <div className="flex items-center gap-1 min-w-0 flex-1 max-w-[280px] lg:max-w-[380px] xl:max-w-[480px]">
          <User className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-slate-400 shrink-0" />
          <span className="text-slate-600 font-bold text-xs shrink-0">{t('header.ownerName') || 'OWNER NAME:'}</span>
          {ownerName && ownerName !== '-' ? (
            <Tooltip
              content={<span className="font-semibold text-xs break-words">{ownerName}</span>}
              placement="bottom"
              className="bg-slate-900 text-white border-slate-700 max-w-[360px] px-2.5 py-1 text-left"
            >
              <span className="font-black text-red-500 text-[12.5px] xl:text-[13px] tracking-tight truncate cursor-default" title={ownerName}>
                {ownerName}
              </span>
            </Tooltip>
          ) : (
            <span className="font-black text-red-500 text-[12.5px] xl:text-[13px] tracking-tight truncate" title={ownerName}>
              {ownerName}
            </span>
          )}
        </div>
      </div>

      {/* Edit Action Button */}
      <button
        type="button"
        onClick={onEdit}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all shrink-0 cursor-pointer text-[11px] font-bold shadow-2xs active:scale-95 ml-1"
        title={t('header.editOwner') || 'Edit Property / Owner Details'}
      >
        <Pencil className="w-3 h-3 text-blue-600" />
        <span>{t('header.edit') || 'Edit'}</span>
      </button>
    </div>
  );
});

IndividualMasterHeader.displayName = 'IndividualMasterHeader';
