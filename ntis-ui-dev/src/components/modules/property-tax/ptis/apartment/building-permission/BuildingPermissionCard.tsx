'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Pencil, Eye, Loader2, Check, Copy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DocumentThumbnail } from '@/components/common';
import type { BuildingPermissionRecord } from '@/types/property-tax/apartment/building-permission-records.types';
import { getCertificateTheme } from './certificate-theme';
import { BuildingPermissionLevelBadge } from './BuildingPermissionLevelBadge';
import { formatCertificateNumberDisplay } from './building-permission-helpers';

export interface BuildingPermissionCardProps {
  row: BuildingPermissionRecord;
  rowKey: string;
  index: number;
  isViewingThis: boolean;
  isEditingThis?: boolean;
  isCopied: boolean;
  onViewDocument: (row: BuildingPermissionRecord, rowKey: string) => void;
  onCopyNumber: (e: React.MouseEvent, num: string | null | undefined, key: string) => void;
  onEditRecord: (row: BuildingPermissionRecord, rowKey?: string) => void;
}

export const BuildingPermissionCard: React.FC<BuildingPermissionCardProps> = ({
  row, rowKey, index, isViewingThis, isEditingThis, isCopied,
  onViewDocument, onCopyNumber, onEditRecord,
}) => {
  const t = useTranslations('ptisRedesign');
  const hasDoc = Boolean(row.documentGuid);
  const theme = getCertificateTheme(row.certificateTypeName || row.certificateTypeCode);

  const rawCode = (row.certificateTypeCode || '').trim();
  const rawName = (row.certificateTypeName || '').trim();
  const isNotice = rawName.toLowerCase().includes('notice') || rawCode.toLowerCase().includes('notice');
  const displayCode = rawCode.toUpperCase() === 'POSSESSION_CERTIFICATE' ? 'PC' : rawCode;
  const showCodeBadge = Boolean(displayCode && !isNotice && displayCode.toLowerCase() !== rawName.toLowerCase());

  return (
    <motion.div
      key={rowKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02, ease: 'easeOut' }}
      onClick={() => { if (hasDoc && !isViewingThis) onViewDocument(row, rowKey); }}
      className={cn(
        'group relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 p-2.5 flex flex-col justify-between overflow-hidden select-none before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1',
        theme.accentBar,
        hasDoc ? 'cursor-pointer hover:border-blue-400' : 'cursor-default'
      )}
    >
      <div className="flex items-stretch gap-2.5">
        {/* Left Column: Document Thumbnail */}
        <div className="w-14 h-18 rounded-lg border border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden relative group/thumb cursor-pointer">
          <DocumentThumbnail
            documentGuid={row.documentGuid}
            fileName={row.fileName}
            alt={row.permitNo || 'Certificate Document'}
            onClick={() => { if (hasDoc && !isViewingThis) onViewDocument(row, rowKey); }}
            className="w-full h-full"
          />
          {isViewingThis && (
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Right Details Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Header Row: Icon + Title + Code + Scope Badge */}
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-colors', theme.iconBg)}>
                <theme.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <h4
                    className="font-semibold text-slate-800 text-xs leading-tight truncate tracking-tight group-hover:text-blue-900 transition-colors"
                    title={rawName || t('buildingPermission.columns.certificate') || 'Certificate'}
                  >
                    {rawName || t('buildingPermission.columns.certificate') || 'Certificate'}
                  </h4>
                  {showCodeBadge && (
                    <span className="px-1 py-0.2 rounded text-[8.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {displayCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <BuildingPermissionLevelBadge row={row} />
          </div>

          {/* Certificate Number (up to 30 chars) & Date */}
          <div className="flex flex-col gap-0.5 my-1.5">
            <div className="flex items-center gap-1 min-w-0 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {t('buildingPermission.certificateNo') || 'Certificate No.'}:
              </span>
              <span className="inline-flex items-center gap-1 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocument(row, rowKey);
                  }}
                  className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline break-all cursor-pointer text-left bg-transparent border-0 p-0"
                  title={row.permitNo || '-'}
                  aria-label={row.permitNo}
                >
                  {formatCertificateNumberDisplay(row.permitNo, 25)}
                </button>
                {row.permitNo && row.permitNo !== '-' && (
                  <button
                    type="button"
                    onClick={(e) => onCopyNumber(e, row.permitNo, rowKey)}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                    title={isCopied ? (t('buildingPermission.actions.copied') || 'Copied!') : (t('buildingPermission.copyCertificateNo') || 'Copy Certificate No.')}
                    aria-label={t('buildingPermission.copyCertificateNo') || 'Copy Certificate No.'}
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </span>
            </div>

            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {t('buildingPermission.issueDate') || 'Issue Date'}:
              </span>
              <span>{row.sanctionDate || '-'}</span>
            </div>
          </div>

          {/* Action Buttons: Footer Row */}
          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={!hasDoc || isViewingThis}
              onClick={(e) => {
                e.stopPropagation();
                onViewDocument(row, rowKey);
              }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1 shadow-2xs',
                isViewingThis
                  ? 'bg-blue-600 text-white border-blue-600 cursor-wait'
                  : hasDoc
                    ? 'bg-blue-50 text-blue-600 border-blue-200/60 hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              )}
              title={row.documentGuid ? t('buildingPermission.actions.viewDocument') || 'View Document' : t('buildingPermission.noDocumentAttached') || 'No document attached'}
              aria-label={`View document ${row.permitNo}`}
            >
              {isViewingThis ? (
                <Loader2 className="w-3 h-3 animate-spin text-white shrink-0" />
              ) : (
                <Eye className="w-3 h-3 shrink-0" />
              )}
              <span>{isViewingThis ? (t('buildingPermission.actions.loading') || 'Loading...') : (t('buildingPermission.actions.view') || 'View')}</span>
            </button>

            <button
              type="button"
              disabled={isEditingThis}
              onClick={(e) => {
                e.stopPropagation();
                onEditRecord(row, rowKey);
              }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 shadow-2xs',
                isEditingThis
                  ? 'bg-amber-500 text-white border-amber-500 cursor-wait'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 cursor-pointer'
              )}
              title={t('buildingPermission.actions.edit') || 'Edit'}
              aria-label={`Edit ${row.permitNo}`}
            >
              {isEditingThis ? (
                <Loader2 className="w-3 h-3 text-white animate-spin shrink-0" />
              ) : (
                <Pencil className="w-3 h-3 shrink-0" />
              )}
              <span>{isEditingThis ? (t('buildingPermission.actions.editing') || 'Opening...') : (t('buildingPermission.actions.edit') || 'Edit')}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
