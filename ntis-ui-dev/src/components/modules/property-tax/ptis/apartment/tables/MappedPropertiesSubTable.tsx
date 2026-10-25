'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MappedNewPropertyItem } from '@/types/property-mapping';
import { ChevronDown, ChevronRight, Loader2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ImageWithFallback } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import { SelectedPropertyTaxBreakdown, TaxAmountItem } from './SelectedPropertyTaxBreakdown';

import { useTranslations } from 'next-intl';

interface MappedPropertiesSubTableProps {
  items: MappedNewPropertyItem[];
  selectedPropId: number | null;
  onSelectProperty: (id: number) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isLoadingMore?: boolean;
  variant?: 'survey' | 'existing';
  onViewDocument?: (guid: string, title?: string) => void;
  loadingTax?: boolean;
  loadingRv?: boolean;
  loadingCv?: boolean;
  rvTaxes?: TaxAmountItem[];
  rvTotal?: number | null;
  cvTaxes?: TaxAmountItem[];
  cvTotal?: number | null;
  wingDetailsId?: number | string | null;
  societyDetailId?: number | string | null;
}

export const MappedPropertiesSubTable: React.FC<MappedPropertiesSubTableProps> = ({
  items,
  selectedPropId,
  onSelectProperty,
  onScroll,
  isLoadingMore = false,
  variant = 'survey',
  onViewDocument,
  loadingTax,
  loadingRv = false,
  loadingCv = false,
  rvTaxes = [],
  rvTotal = null,
  cvTaxes = [],
  cvTotal = null,
  wingDetailsId,
  societyDetailId,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('ptisRedesign.subTables');
  const isExisting = variant === 'existing';

  const handleRedirectToQuickDataEntry = (item: MappedNewPropertyItem) => {
    const rawItem = item as unknown as Record<string, unknown>;
    const propId = item.id || item.pdnId || (rawItem.propertyId ? Number(rawItem.propertyId) : null);
    if (!propId) return;

    const params = new URLSearchParams();

    const parentPropId = searchParams.get('parentPropertyId') || searchParams.get('propertyId');
    if (parentPropId) params.set('parentPropertyId', String(parentPropId));

    const wardNo = item.wardNo || searchParams.get('wardNo');
    if (wardNo) params.set('wardNo', String(wardNo));

    const wardId = item.wardId || searchParams.get('wardId');
    if (wardId) params.set('wardId', String(wardId));

    const propertyNo = item.propertyNo || searchParams.get('propertyNo');
    if (propertyNo) params.set('propertyNo', String(propertyNo));

    const rawPart = (
      item.partitionNo ??
      (rawItem.partitionNo as string | number | undefined) ??
      (rawItem.partNo as string | number | undefined) ??
      (rawItem.partition as string | number | undefined) ??
      searchParams.get('partitionNo') ??
      ''
    ).toString().trim();
    const partNo = rawPart !== '' && rawPart !== '-' ? rawPart : '';
    if (partNo) params.set('partitionNo', partNo);

    const resolvedWingDetailId =
      item.wingDetailId ??
      (rawItem.wingDetailId as string | number | undefined) ??
      (rawItem.wingDetailsId as string | number | undefined) ??
      wingDetailsId ??
      searchParams.get('wingDetailId') ??
      searchParams.get('wingDetailsId') ??
      searchParams.get('WingDetailsId') ??
      searchParams.get('wingdetailid');
    if (resolvedWingDetailId) {
      params.set('wingDetailId', String(resolvedWingDetailId));
      params.set('wingdetailid', String(resolvedWingDetailId));
    }

    const resolvedWingId = searchParams.get('wingId');
    if (resolvedWingId) {
      params.set('wingId', String(resolvedWingId));
    }

    const resolvedWingName =
      (item as unknown as { wingName?: string })?.wingName ??
      (rawItem.wingName as string | undefined) ??
      (item as unknown as { wing?: string })?.wing ??
      (rawItem.wing as string | undefined) ??
      searchParams.get('wingName') ??
      searchParams.get('wingname');
    if (resolvedWingName) {
      params.set('wingName', String(resolvedWingName));
    }

    const resolvedSocietyDetailId =
      (rawItem.societyDetailId as string | number | undefined) ??
      (rawItem.societydetailid as string | number | undefined) ??
      (rawItem.societyId as string | number | undefined) ??
      societyDetailId ??
      searchParams.get('societyDetailId') ??
      searchParams.get('societydetailid') ??
      searchParams.get('societyId');
    if (resolvedSocietyDetailId) {
      params.set('societydetailid', String(resolvedSocietyDetailId));
      params.set('societyDetailId', String(resolvedSocietyDetailId));
      params.set('societyId', String(resolvedSocietyDetailId));
    }

    params.set('propertyId', String(propId));
    params.set('returnTab', 'apartment');
    params.set('from', 'apartment');
    params.set('hideWing', 'true');
    params.set('hideSociety', 'true');
    params.set('fromFooterEdit', 'true');

    router.push(`/${locale}/property-tax/ptis/QuickDataEntry/${propId}/Property?${params.toString()}`);
  };

  return (
    <div
      onScroll={onScroll}
      className={cn(
        'overflow-x-auto overflow-y-auto rounded-md border bg-white shadow-2xs ios-scrollbar w-fit max-w-full',
        selectedPropId ? 'max-h-[420px]' : 'h-auto max-h-[288px]',
        isExisting ? 'border-emerald-200' : 'border-sky-200'
      )}
    >
      <table className="w-max text-left border-collapse text-[10.5px] leading-tight">
        <thead className={cn(
          'sticky top-0 font-bold border-b z-20 text-[10px] uppercase tracking-wider shadow-2xs',
          isExisting ? 'bg-emerald-50 text-emerald-950 border-emerald-200' : 'bg-sky-50 text-sky-950 border-sky-200'
        )}>
          <tr className="h-8">
            <th className={cn('px-2 py-1 text-center w-16 min-w-[64px] sticky left-0 z-30', isExisting ? 'bg-emerald-50' : 'bg-sky-50')}>#</th>
            <th
              className={cn(
                'px-2.5 py-1 whitespace-nowrap sticky left-16 z-30 border-r w-28 min-w-[100px] max-w-[125px]',
                isExisting ? 'bg-emerald-50 border-emerald-200' : 'bg-sky-50 border-sky-200'
              )}
              title="Property Number / Partition Number / Flat Number"
            >
              {t('propNo') || 'Prop No'}
            </th>
            <th className="px-2.5 py-1 whitespace-nowrap">{t('wingFlr') || 'Floor'}</th>
            <th className="px-2.5 py-1 whitespace-nowrap">{t('type') || 'Type'}</th>
            <th className="px-2.5 py-1 whitespace-nowrap">{t('use') || 'Use'}</th>
            <th className="px-2.5 py-1 whitespace-nowrap">{t('constType') || 'Const Type'}</th>
            <th className="px-2.5 py-1 text-center whitespace-nowrap">{t('year') || 'Year'}</th>
            <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('carpet') || 'Carpet'}</th>
            <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('builtup') || 'Builtup'}</th>
            <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('rv') || 'RV (₹)'}</th>
            <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('cv') || 'CV (₹)'}</th>
            <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('tax') || 'Tax (₹)'}</th>
            <th className="px-2.5 py-1 whitespace-nowrap">{t('owner') || 'Owner'}</th>
            <th className="px-1.5 py-1 text-center whitespace-nowrap">{t('img') || 'IMG'}</th>
            <th className="px-1.5 py-1 text-center whitespace-nowrap">{t('plan') || 'PLAN'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
          {items.map((m, idx) => {
            const isSelected = selectedPropId === m.id;
            const propPhotoGuid = m.propertyPhotoDocumentGuid || (m.photos as Array<{ photoTypeCode?: string; documentGuid?: string }> | undefined)?.find((p) => p.photoTypeCode === 'PROPERTY_PHOTO')?.documentGuid || null;
            const planPhotoGuid = m.planPhotoDocumentGuid || (m.photos as Array<{ photoTypeCode?: string; documentGuid?: string }> | undefined)?.find((p) => p.photoTypeCode === 'PLAN_PHOTO')?.documentGuid || null;
            const rawItem = m as unknown as Record<string, unknown>;
            const propNo = (
              m.propertyNo ||
              (rawItem.propertyNo as string | undefined) ||
              (rawItem.propNo as string | undefined) ||
              ''
            ).toString().trim();
            const rawPart = (
              m.partitionNo ??
              (rawItem.partitionNo as string | number | undefined) ??
              (rawItem.partNo as string | number | undefined) ??
              (rawItem.partition as string | number | undefined) ??
              (rawItem.partitionNumber as string | number | undefined) ??
              ''
            ).toString().trim();
            const partNo = rawPart !== '' && rawPart !== '-' ? rawPart : '';
            const flatNo = (
              m.flatOrShopNo ??
              m.flatOrShopNoEnglish ??
              m.flatOrShopName ??
              m.flatOrShopNameEnglish ??
              (rawItem.flatNo as string | number | undefined) ??
              (rawItem.shopNo as string | number | undefined) ??
              (rawItem.flatOrShopNo as string | number | undefined) ??
              (rawItem.flatOrShopName as string | number | undefined) ??
              ''
            ).toString().trim();

            const subParts: string[] = [];
            if (propNo) subParts.push(propNo);
            if (partNo && partNo !== propNo) subParts.push(partNo);
            if (flatNo && flatNo !== '-' && flatNo !== partNo && flatNo !== propNo) subParts.push(flatNo);
            const propLabel = subParts.length > 0 ? subParts.join(' - ') : (flatNo || propNo || String(m.id));

            const taxVal = isExisting
              ? (m.totalTax ?? m.oldTotalTax ?? m.newTaxTotal ?? null)
              : (m.newTaxTotal ?? m.totalTax ?? null);

            return (
              <React.Fragment key={`${m.id}-${idx}`}>
                <tr
                  onClick={() => onSelectProperty(m.id)}
                  className={cn(
                    'cursor-pointer transition-colors h-8',
                    isExisting ? 'hover:bg-emerald-50/80' : 'hover:bg-sky-50/80',
                    isSelected && (isExisting
                      ? 'bg-emerald-100/90 font-bold text-emerald-950 border-l-4 border-l-emerald-600'
                      : 'bg-sky-100/90 font-bold text-sky-950 border-l-4 border-l-sky-600'
                    )
                  )}
                >
                  <td className={cn('px-1.5 py-1 text-center font-bold sticky left-0 z-10 align-middle w-16 min-w-[64px]', isSelected ? (isExisting ? 'bg-emerald-100' : 'bg-sky-100') : 'bg-white')}>
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={(e) => { e.stopPropagation(); onSelectProperty(m.id); }} className="p-0.5 rounded-sm hover:bg-zinc-200 text-zinc-600 cursor-pointer">
                        {isSelected ? (
                          <ChevronDown className={cn('w-3 h-3', isExisting ? 'text-emerald-700' : 'text-sky-700')} />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                        )}
                      </button>
                      <span className="text-zinc-600 font-semibold text-[11px] min-w-[14px]">{idx + 1}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedirectToQuickDataEntry(m);
                        }}
                        className={cn(
                          'p-1 rounded-md transition-all border cursor-pointer',
                          isExisting
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300'
                            : 'bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300'
                        )}
                        title={t('editInQuickEntry') || 'Edit in Quick Data Entry'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td
                    className={cn(
                      'px-2.5 py-1 font-bold text-zinc-900 whitespace-nowrap sticky left-16 z-10 border-r align-middle w-28 min-w-[100px] max-w-[125px]',
                      isSelected ? (isExisting ? 'bg-emerald-100' : 'bg-sky-100') : 'bg-white',
                      isExisting ? 'border-emerald-200' : 'border-sky-200'
                    )}
                    title={`Property No: ${propNo || '-'} | Partition: ${partNo || '-'} | Flat No: ${flatNo || '-'}`}
                  >
                    {propLabel}
                  </td>
                  <td
                    className={cn('px-2.5 py-1 font-semibold whitespace-nowrap align-middle', isExisting ? 'text-emerald-700' : 'text-blue-700')}
                    title={m.floor || undefined}
                  >
                    {m.floorCode || m.floor || '-'}
                  </td>
                  <td className="px-2.5 py-1 whitespace-nowrap align-middle">{m.apartmentType || m.propertyTypeName || m.type || '-'}</td>
                  <td className="px-2.5 py-1 whitespace-nowrap align-middle" title={m.typeOfUse || undefined}>{m.typeOfUseCode || m.typeOfUse || m.subTypeOfUse || '-'}</td>
                  <td className="px-2.5 py-1 whitespace-nowrap align-middle" title={m.constructionType || undefined}>{m.constructionCode || m.constructionType || '-'}</td>
                  <td className="px-2.5 py-1 text-center whitespace-nowrap align-middle">{m.constructionYear || m.assessmentYear || '-'}</td>
                  <td className="px-2.5 py-1 text-right font-mono whitespace-nowrap align-middle">{m.carpetASqFt ?? m.carpetASqMtr ?? '-'}</td>
                  <td className="px-2.5 py-1 text-right font-mono whitespace-nowrap align-middle">{m.builtupASqFt ?? m.builtupASqMtr ?? '-'}</td>
                  <td className="px-2.5 py-1 text-right font-mono font-bold text-emerald-700 whitespace-nowrap align-middle">{m.rateableValue != null ? `₹${Number(m.rateableValue).toLocaleString()}` : '-'}</td>
                  <td className="px-2.5 py-1 text-right font-mono font-bold whitespace-nowrap align-middle">{m.capitalValue != null ? `₹${Number(m.capitalValue).toLocaleString()}` : '-'}</td>
                  <td className={cn('px-2.5 py-1 text-right font-mono font-bold whitespace-nowrap align-middle', isExisting ? 'text-emerald-950' : 'text-sky-950')}>{taxVal != null ? `₹${Number(taxVal).toLocaleString()}` : '-'}</td>
                  <td className="px-2.5 py-1 truncate max-w-[120px] whitespace-nowrap align-middle" title={m.ownerName || m.ownerNameEnglish || '-'}>{m.ownerName || m.ownerNameEnglish || '-'}</td>

                  <td className="px-1.5 py-1 text-center whitespace-nowrap align-middle">
                    {propPhotoGuid ? (
                      <div
                        onClick={(e) => { e.stopPropagation(); onViewDocument?.(propPhotoGuid, `Unit ${propLabel} - Property Photo`); }}
                        className="w-5.5 h-5.5 mx-auto rounded border border-zinc-300 overflow-hidden shadow-2xs cursor-pointer hover:scale-105 transition-all bg-zinc-100 flex items-center justify-center"
                        title="View Property Photo"
                      >
                        <ImageWithFallback src="" documentGuid={propPhotoGuid} alt="Prop" className="w-full h-full object-cover" />
                      </div>
                    ) : <span className="text-zinc-300">-</span>}
                  </td>

                  <td className="px-1.5 py-1 text-center whitespace-nowrap align-middle">
                    {planPhotoGuid ? (
                      <div
                        onClick={(e) => { e.stopPropagation(); onViewDocument?.(planPhotoGuid, `Unit ${propLabel} - Floor Plan`); }}
                        className="w-5.5 h-5.5 mx-auto rounded border border-zinc-300 overflow-hidden shadow-2xs cursor-pointer hover:scale-105 transition-all bg-zinc-100 flex items-center justify-center"
                        title="View Floor Plan"
                      >
                        <ImageWithFallback src="" documentGuid={planPhotoGuid} alt="Plan" className="w-full h-full object-cover" />
                      </div>
                    ) : <span className="text-zinc-300">-</span>}
                  </td>
                </tr>

                {isSelected && (
                  <tr className={cn('border-b transition-all', isExisting ? 'bg-emerald-50/60 border-emerald-200' : 'bg-sky-50/60 border-sky-200')}>
                    <td colSpan={15} className="p-1.5 align-middle">
                      <div className="sticky left-1 max-w-[calc(100vw-120px)] w-fit">
                        <SelectedPropertyTaxBreakdown
                          selectedPropId={m.id}
                          loadingTax={loadingTax}
                          loadingRv={loadingRv}
                          loadingCv={loadingCv}
                          rvTaxes={rvTaxes}
                          rvTotal={rvTotal}
                          cvTaxes={cvTaxes}
                          cvTotal={cvTotal}
                          propertyLabel={propLabel}
                          variant={variant}
                          fallbackTax={taxVal != null ? Number(taxVal) : (m.newTaxTotal ?? 0)}
                          onClose={() => onSelectProperty(m.id)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {isLoadingMore && (
        <div className="py-1.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 bg-slate-50 border-t border-zinc-100">
          <Loader2 className={cn('w-3 h-3 animate-spin', isExisting ? 'text-emerald-600' : 'text-sky-600')} />
          <span>{t('loadingMore') || 'Loading more records...'}</span>
        </div>
      )}
    </div>
  );
};
