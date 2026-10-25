'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Eye, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DocumentThumbnail } from '@/components/common';
import type { PropertySocialDetailItem } from '@/types/ptis.types';
import { getDiscountTheme } from './discount-theme';
import { resolveDiscountScopeBadge, isStatusValue } from './discount-tab-helpers';
import type { DiscountCardProps } from './types';

function renderValueBadge(item: PropertySocialDetailItem, appliedLabel: string, noLabel: string) {
  if (item.intValue !== null && item.intValue !== undefined) {
    return <span className="font-bold text-slate-800 text-xs">{item.intValue}</span>;
  }
  if (item.decimalValue !== null && item.decimalValue !== undefined) {
    return <span className="font-bold text-slate-800 text-xs">{item.decimalValue}</span>;
  }
  if (item.dateValue && item.dateValue.trim() !== '') {
    return <span className="font-medium text-slate-700 text-xs">{item.dateValue}</span>;
  }
  if (item.textValue && item.textValue.trim() !== '' && item.textValue.trim().toLowerCase() !== 'string') {
    const isYes = item.textValue.trim().toLowerCase() === 'yes' || item.textValue.trim().toLowerCase() === 'true';
    return isYes ? (
      <span className="font-semibold text-emerald-700 text-xs">{appliedLabel}</span>
    ) : (
      <span className="font-medium text-slate-800 text-xs truncate max-w-[120px]">{item.textValue}</span>
    );
  }
  if (item.bitValue !== null && item.bitValue !== undefined) {
    return (
      <span className={cn('font-semibold text-xs', item.bitValue ? 'text-emerald-700' : 'text-slate-500')}>
        {item.bitValue ? appliedLabel : noLabel}
      </span>
    );
  }
  return item.isActive ? (
    <span className="font-semibold text-emerald-700 text-xs">{appliedLabel}</span>
  ) : (
    <span className="text-slate-400 text-xs">-</span>
  );
}

export const DiscountCard: React.FC<DiscountCardProps> = ({
  item, rowKey, index, isViewingThis, isEditingThis, propertyNo, wingName,
  isApartmentScreen = true, onViewDocument, onEdit,
}) => {
  const t = useTranslations('ptis');
  const tRedesign = useTranslations('ptisRedesign');
  const tTable = useTranslations('ptisRedesign.discountTable');

  const hasDoc = Boolean(item.documentGuid);
  const theme = getDiscountTheme(item.socialAttributeName, item.socialAttributeCode, item.isDiscountApplicable !== false);
  const scopeBadge = resolveDiscountScopeBadge(item, propertyNo, wingName, isApartmentScreen, (k) => tRedesign(k as never));

  const attrName = (item.socialAttributeName || item.socialAttributeCode || `Attribute #${item.socialAttributeId}`).trim();
  const appliedLabel = t('fields.applied') || 'Applied';
  const noLabel = t('fields.no') || 'No';

  const isStatus = isStatusValue(item);
  const valueOrStatusLabel = isStatus
    ? (t('fields.status') || tTable('status') || 'Status')
    : (t('fields.value') || tTable('value') || 'Value');

  return (
    <motion.div
      key={rowKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02, ease: 'easeOut' }}
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
            fileName={(item as unknown as { fileName?: string }).fileName}
            alt={attrName}
            onClick={() => { if (hasDoc && !isViewingThis) onViewDocument(item, rowKey); }}
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
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-colors', theme.iconBg)}>
                <theme.icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  className="font-semibold text-slate-800 text-xs leading-tight truncate tracking-tight group-hover:text-blue-900 transition-colors"
                  title={attrName}
                >
                  {attrName}
                </h4>
              </div>
            </div>

            {scopeBadge && (
              <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 tracking-wide shadow-2xs leading-none', scopeBadge.className)}>
                <scopeBadge.icon className="w-2.5 h-2.5 shrink-0" />
                <span>{scopeBadge.label}</span>
              </span>
            )}
          </div>

          {/* Middle: Value & Remark */}
          <div className="flex flex-col gap-0.5 my-1.5">
            <div className="flex items-center gap-1 min-w-0 flex-wrap text-[11px]">
              <span className="font-medium text-slate-400 shrink-0">
                {valueOrStatusLabel}:
              </span>
              <div className="inline-flex items-center gap-1 min-w-0">
                {renderValueBadge(item, appliedLabel, noLabel)}
              </div>
            </div>

            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 truncate">
              <span className="font-medium text-slate-400 shrink-0">
                {tTable('remark') || 'Remark'}:
              </span>
              <span className="truncate text-slate-600" title={item.remark || '-'}>
                {item.remark || '-'}
              </span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={!hasDoc || isViewingThis}
              onClick={(e) => { e.stopPropagation(); onViewDocument(item, rowKey); }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all flex items-center gap-1 shadow-2xs',
                isViewingThis
                  ? 'bg-blue-600 text-white border-blue-600 cursor-wait'
                  : hasDoc
                  ? 'bg-blue-50 text-blue-600 border-blue-200/60 hover:bg-blue-600 hover:text-white hover:border-blue-600 cursor-pointer'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              )}
              title={hasDoc ? t('actions.viewDocument') || tTable('viewFile') || 'View Document' : t('building.noDocumentAttached') || tTable('noDocument') || 'No document attached'}
              aria-label={t('actions.viewDocument') || 'View Document'}
            >
              {isViewingThis ? <Loader2 className="w-3 h-3 animate-spin text-white shrink-0" /> : <Eye className="w-3 h-3 shrink-0" />}
              <span>{isViewingThis ? (t('building.loading') || 'Loading...') : (t('building.view') || 'View')}</span>
            </button>

            <button
              type="button"
              disabled={isEditingThis}
              onClick={(e) => { e.stopPropagation(); onEdit(item, rowKey); }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 shadow-2xs',
                isEditingThis
                  ? 'bg-amber-500 text-white border-amber-500 cursor-wait'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 cursor-pointer'
              )}
              title={t('actions.edit') || 'Edit'}
              aria-label={t('actions.edit') || 'Edit'}
            >
              {isEditingThis ? <Loader2 className="w-3 h-3 text-white animate-spin shrink-0" /> : <Pencil className="w-3 h-3 shrink-0" />}
              <span>{isEditingThis ? (t('building.editing') || 'Opening...') : (t('actions.edit') || 'Edit')}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
