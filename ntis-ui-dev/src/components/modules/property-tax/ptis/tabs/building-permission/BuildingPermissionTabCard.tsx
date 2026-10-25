'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Eye, Pencil, Loader2, Calendar, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DocumentThumbnail } from '@/components/common';
import type { BuildingPermissionItem } from '@/types/ptis.types';
import { getCertificateTheme } from './types';
import {
  formatCertificateDate,
  formatCertificateNumberDisplay,
  resolveScopeBadge,
} from './building-permission-tab-helpers';

export interface BuildingPermissionTabCardProps {
  item: BuildingPermissionItem;
  rowKey: string;
  index: number;
  partitionNo?: string | null;
  societyDetailId?: number | string | null;
  categoryId?: number | null;
  isViewingThis: boolean;
  isEditingThis?: boolean;
  isCopied: boolean;
  onViewDocument: (item: BuildingPermissionItem, rowKey: string) => void;
  onCopyNumber: (e: React.MouseEvent, num: string | null | undefined, key: string) => void;
  onEditCertificate: (e: React.MouseEvent, item: BuildingPermissionItem, rowKey?: string) => void;
}

export const BuildingPermissionTabCard: React.FC<BuildingPermissionTabCardProps> = ({
  item, rowKey, index, partitionNo, societyDetailId, categoryId,
  isViewingThis, isEditingThis, isCopied, onViewDocument, onCopyNumber, onEditCertificate,
}) => {
  const t = useTranslations('ptis');
  const hasDoc = Boolean(item.documentGuid);
  const theme = getCertificateTheme(item.certificateTypeName);
  const scopeBadge = resolveScopeBadge(item, partitionNo, societyDetailId, categoryId, t);

  const rawName = (item.certificateTypeName || '').trim();
  const isNotice = rawName.toLowerCase().includes('notice');
  const rawItem = item as unknown as { certificateTypeCode?: string; CertificateTypeCode?: string };
  const rawCode = (rawItem.certificateTypeCode || rawItem.CertificateTypeCode || '').trim();
  const displayCode = rawCode.toUpperCase() === 'POSSESSION_CERTIFICATE' ? 'PC' : rawCode;
  const showCodeBadge = Boolean(displayCode && !isNotice && displayCode.toLowerCase() !== rawName.toLowerCase());

  return (
    <motion.div
      key={rowKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04, ease: 'easeOut' }}
      onClick={() => { if (hasDoc && !isViewingThis) onViewDocument(item, rowKey); }}
      className={cn(
        'group relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 p-2.5 flex flex-col justify-between overflow-hidden select-none before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1',
        theme.accentBar,
        hasDoc ? 'cursor-pointer hover:border-blue-400' : 'cursor-default'
      )}
    >
      <div className="flex items-stretch gap-2.5">
        {/* Left: Thumbnail Preview */}
        <div className="w-14 h-18 rounded-lg border border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden relative group/thumb cursor-pointer">
          <DocumentThumbnail
            documentGuid={item.documentGuid}
            fileName={item.fileName}
            alt={item.certificateNo || t('building.certificateDocument') || 'Certificate Document'}
            onClick={() => { if (hasDoc && !isViewingThis) onViewDocument(item, rowKey); }}
            className="w-full h-full"
          />
          {isViewingThis && (
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Right: Card Details & Actions */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Header: Icon + Title + Code + Scope Badge */}
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-colors', theme.iconBg)}>
                <theme.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <h4
                    className="font-semibold text-slate-800 text-xs leading-tight truncate tracking-tight group-hover:text-blue-900 transition-colors"
                    title={rawName || t('building.certificateName') || 'Certificate'}
                  >
                    {rawName || t('building.certificateName') || 'Certificate'}
                  </h4>
                  {showCodeBadge && (
                    <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {displayCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 tracking-wide shadow-2xs leading-none', scopeBadge.className)}>
              {scopeBadge.label}
            </span>
          </div>

          {/* Middle: Certificate Number (up to 30 chars) & Date */}
          <div className="flex flex-col gap-0.5 my-1.5">
            <div className="flex items-center gap-1 min-w-0 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {t('building.certificateNo') || 'Certificate No.'}:
              </span>
              <span className="inline-flex items-center gap-1 min-w-0">
                <span
                  className="font-mono text-xs font-semibold text-blue-600 break-all"
                  title={item.certificateNo || '-'}
                >
                  {formatCertificateNumberDisplay(item.certificateNo, 25)}
                </span>
                {item.certificateNo && item.certificateNo !== '-' && (
                  <button
                    type="button"
                    onClick={(e) => onCopyNumber(e, item.certificateNo, rowKey)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                    title={isCopied ? (t('building.copied') || 'Copied!') : (t('building.copyCertificateNo') || 'Copy Certificate No.')}
                    aria-label={t('building.copyCertificateNo') || 'Copy Certificate No.'}
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </span>
            </div>

            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {t('building.issueDate') || 'Issue Date'}:
              </span>
              <span>{formatCertificateDate(item.issueDate)}</span>
            </div>
          </div>

          {/* Footer: Action Buttons */}
          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDocument(item, rowKey);
              }}
              disabled={!hasDoc || isViewingThis}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1 shadow-2xs',
                isViewingThis
                  ? 'bg-blue-600 text-white border-blue-600 cursor-wait'
                  : hasDoc
                    ? 'bg-blue-50 text-blue-600 border-blue-200/60 hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              )}
              title={hasDoc ? t('building.viewDocument') || 'View Document' : t('building.noDocumentAttached') || 'No document attached'}
              aria-label={t('building.viewDocument') || 'View Document'}
            >
              {isViewingThis ? <Loader2 className="w-3 h-3 animate-spin text-white shrink-0" /> : <Eye className="w-3 h-3 shrink-0" />}
              <span>{isViewingThis ? (t('building.loading') || 'Loading...') : (t('building.view') || 'View')}</span>
            </button>

            <button
              type="button"
              disabled={isEditingThis}
              onClick={(e) => onEditCertificate(e, item, rowKey)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 shadow-2xs',
                isEditingThis
                  ? 'bg-amber-500 text-white border-amber-500 cursor-wait'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 cursor-pointer'
              )}
              title={t('building.editCertificate') || 'Edit Certificate'}
              aria-label={t('building.editCertificate') || 'Edit Certificate'}
            >
              {isEditingThis ? <Loader2 className="w-3 h-3 text-white animate-spin shrink-0" /> : <Pencil className="w-3 h-3 shrink-0" />}
              <span>{isEditingThis ? (t('building.editing') || 'Opening...') : (t('building.edit') || 'Edit')}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
