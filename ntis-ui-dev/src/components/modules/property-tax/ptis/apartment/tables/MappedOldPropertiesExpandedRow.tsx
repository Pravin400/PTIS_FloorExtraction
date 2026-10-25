'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchMappedOldPropertiesAction } from '@/app/[locale]/property-tax/ptis/apartment/action';
import { MappedOldPropertyItem } from '@/types/property-mapping';
import { Loader2, History, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SelectedPropertyTaxBreakdown, TaxAmountItem } from './SelectedPropertyTaxBreakdown';
import { EmptyMappedPropertiesState } from './EmptyMappedPropertiesState';

import { useTranslations } from 'next-intl';

interface MappedOldPropertiesExpandedRowProps {
  propertyId?: number | null;
}

export const MappedOldPropertiesExpandedRow: React.FC<MappedOldPropertiesExpandedRowProps> = ({
  propertyId,
}) => {
  const t = useTranslations('ptisRedesign.subTables');
  const [loading, setLoading] = useState(() => Boolean(propertyId && propertyId > 0));
  const [items, setItems] = useState<MappedOldPropertyItem[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (!propertyId || propertyId <= 0) return;
    let isMounted = true;

    fetchMappedOldPropertiesAction({ propertyId, pageNumber: 1, pageSize: 25 })
      .then((res) => {
        if (!isMounted) return;
        const data = res.success ? res.data : null;
        setItems(data?.items || []);
        setTotalCount(data?.totalCount || data?.items?.length || 0);
        setHasNext(Boolean(data?.totalCount && data.totalCount > 25));
        setPageNumber(1);
        setSelectedPropId(null);
      })
      .catch(() => { if (isMounted) setItems([]); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [propertyId]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40 && hasNext && !loadingMoreRef.current && propertyId) {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const nextPage = pageNumber + 1;
      fetchMappedOldPropertiesAction({ propertyId, pageNumber: nextPage, pageSize: 25 })
        .then((res) => {
          if (res.success && res.data?.items?.length) {
            setItems((prev) => [...prev, ...(res.data?.items || [])]);
            setPageNumber(nextPage);
            setHasNext(Boolean(res.data.items.length === 25));
          } else { setHasNext(false); }
        })
        .catch(() => setHasNext(false))
        .finally(() => { loadingMoreRef.current = false; setLoadingMore(false); });
    }
  }, [hasNext, propertyId, pageNumber]);

  if (!propertyId || propertyId <= 0) {
    return (
      <EmptyMappedPropertiesState
        message={t('noNewProp') || 'No New Property associated with this unit.'}
        theme="emerald"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 text-xs font-sans rounded-md border shadow-2xs sticky left-1 w-fit bg-emerald-50/80 border-emerald-200 text-emerald-900">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
        <span>{t('loading') || 'Loading mapped properties...'}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyMappedPropertiesState
        message={t('noMappedOld') || 'No mapped properties found'}
        theme="emerald"
      />
    );
  }

  const totalSuffix = totalCount > items.length ? (t('ofTotal', { total: totalCount }) || ` of ${totalCount}`) : '';
  const headerTitle = t('mappedOldTitle', { count: items.length, totalSuffix }) || `Mapped Old Properties (${items.length}${totalSuffix})`;

  return (
    <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs font-sans shadow-2xs space-y-1.5 select-none w-fit max-w-[calc(100vw-100px)] sticky left-1">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-950">
          <History className="w-3.5 h-3.5 text-emerald-700" />
          <span>{headerTitle}</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-medium">{t('clickHint') || 'Click any row to show/hide tax breakdown'}</span>
      </div>

      <div
        onScroll={handleScroll}
        className={cn(
          'overflow-x-auto overflow-y-auto rounded-md border border-emerald-200/90 bg-white shadow-2xs ios-scrollbar w-fit max-w-full',
          selectedPropId ? 'max-h-[420px]' : 'h-auto max-h-[288px]'
        )}
      >
        <table className="w-max text-left border-collapse text-[10.5px] leading-tight">
          <thead className="sticky top-0 bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200 z-20 text-[10px] uppercase tracking-wider shadow-2xs">
            <tr className="h-8">
              <th className="px-2 py-1 text-center w-12 min-w-[48px] sticky left-0 bg-emerald-50 z-30">#</th>
              <th className="px-2.5 py-1 whitespace-nowrap sticky left-12 bg-emerald-50 z-30 border-r border-emerald-200 w-28 min-w-[100px] max-w-[125px]">{t('oldPropertyNo') || 'Old Property No'}</th>
              <th className="px-2.5 py-1 whitespace-nowrap">{t('wingFlr') || 'Floor'}</th>
              <th className="px-2.5 py-1 whitespace-nowrap">{t('use') || 'Use'}</th>
              <th className="px-2.5 py-1 whitespace-nowrap">{t('constType') || 'Const Type'}</th>
              <th className="px-2.5 py-1 text-center whitespace-nowrap">{t('year') || 'Year'}</th>
              <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('areaSqft') || 'Area (sqft)'}</th>
              <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('oldRv') || 'Old RV (₹)'}</th>
              <th className="px-2.5 py-1 text-right whitespace-nowrap">{t('oldTax') || 'Old Tax (₹)'}</th>
              <th className="px-2.5 py-1 whitespace-nowrap">{t('owner') || 'Owner'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
            {items.map((m, idx) => {
              const isSelected = selectedPropId === m.id;
              const rawItem = m as unknown as Record<string, unknown>;
              const oldPropNo = (m.oldPropertyNo || m.propertyNo || '').trim();
              const rawOldPart = (
                m.oldPartitionNo ??
                (rawItem.oldPartitionNo as string | number | undefined) ??
                (rawItem.partitionNo as string | number | undefined) ??
                (rawItem.partNo as string | number | undefined) ??
                (rawItem.partition as string | number | undefined) ??
                ''
              ).toString().trim();
              const oldPartNo = rawOldPart !== '' && rawOldPart !== '-' ? rawOldPart : '';
              const oldFlatNo = (m.flatOrShopNo || '').trim();

              const oldParts: string[] = [];
              if (oldPropNo) oldParts.push(oldPropNo);
              if (oldPartNo && oldPartNo !== oldPropNo) oldParts.push(oldPartNo);
              if (oldFlatNo && oldFlatNo !== '-' && oldFlatNo !== oldPartNo && oldFlatNo !== oldPropNo) oldParts.push(oldFlatNo);
              const propertyLabel = oldParts.length > 0 ? oldParts.join(' - ') : (oldFlatNo || oldPropNo || String(m.id));

              const oldHeads: TaxAmountItem[] = (m.oldTaxDetails || []).map((h) => ({
                taxName: h.taxName || undefined,
                taxAmount: h.taxAmount ?? undefined,
              }));

              return (
                <React.Fragment key={`${m.id}-${idx}`}>
                  <tr
                    onClick={() => setSelectedPropId((prev) => (prev === m.id ? null : m.id))}
                    className={cn(
                      'cursor-pointer transition-colors h-8 hover:bg-emerald-50/80',
                      isSelected ? 'bg-emerald-100/90 font-bold text-emerald-950 border-l-4 border-l-emerald-600' : ''
                    )}
                  >
                    <td className={cn('px-1.5 py-1 text-center font-bold sticky left-0 z-10 align-middle w-12 min-w-[48px]', isSelected ? 'bg-emerald-100' : 'bg-white')}>
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedPropId((prev) => (prev === m.id ? null : m.id)); }} className="p-0.5 rounded-sm hover:bg-emerald-200/60 text-emerald-800 cursor-pointer">
                          {isSelected ? <ChevronDown className="w-3 h-3 text-emerald-700" /> : <ChevronRight className="w-3 h-3 text-zinc-400" />}
                        </button>
                        <span className="text-zinc-600 font-semibold text-[11px] min-w-[14px]">{idx + 1}</span>
                      </div>
                    </td>
                    <td
                      className={cn('px-2.5 py-1 font-bold text-zinc-900 whitespace-nowrap sticky left-12 z-10 border-r border-zinc-100 align-middle', isSelected ? 'bg-emerald-100' : 'bg-white')}
                      title={`Old Property No: ${oldPropNo || '-'} | Partition: ${oldPartNo || '-'} | Flat No: ${oldFlatNo || '-'}`}
                    >
                      {propertyLabel}
                    </td>
                    <td
                      className="px-2.5 py-1 text-emerald-700 font-semibold whitespace-nowrap align-middle"
                      title={m.floor || undefined}
                    >
                      {m.floorCode || m.floor || '-'}
                    </td>
                    <td className="px-2.5 py-1 whitespace-nowrap align-middle" title={m.typeOfUse || undefined}>{m.typeOfUseCode || m.typeOfUse || '-'}</td>
                    <td className="px-2.5 py-1 whitespace-nowrap align-middle" title={m.constructionType || undefined}>{m.constructionCode || m.constructionType || '-'}</td>
                    <td className="px-2.5 py-1 text-center whitespace-nowrap align-middle">{m.constructionYear || m.oldAssessmentYear || '-'}</td>
                    <td className="px-2.5 py-1 text-right font-mono whitespace-nowrap align-middle">{m.builtupASqFt ?? m.constructionArea ?? m.carpetASqFt ?? '-'}</td>
                    <td className="px-2.5 py-1 text-right font-mono font-bold text-emerald-800 whitespace-nowrap align-middle">{m.rateableValue != null ? `₹${Number(m.rateableValue).toLocaleString()}` : '-'}</td>
                    <td className="px-2.5 py-1 text-right font-mono font-bold text-emerald-950 whitespace-nowrap align-middle">{(m.totalTax ?? m.oldTotalTax) != null ? `₹${Number(m.totalTax ?? m.oldTotalTax).toLocaleString()}` : '-'}</td>
                    <td className="px-2.5 py-1 truncate max-w-[120px] whitespace-nowrap align-middle" title={m.ownerName || m.ownerNameEnglish || '-'}>{m.ownerName || m.ownerNameEnglish || '-'}</td>
                  </tr>

                  {isSelected && (
                    <tr className="border-b transition-all bg-emerald-50/60 border-emerald-200">
                      <td colSpan={10} className="p-1.5 align-middle">
                        <div className="sticky left-1 max-w-[calc(100vw-120px)] w-fit">
                          <SelectedPropertyTaxBreakdown
                            selectedPropId={m.id}
                            loadingRv={false}
                            rvTaxes={oldHeads}
                            rvTotal={(m.totalTax ?? m.oldTotalTax) ?? null}
                            propertyLabel={propertyLabel}
                            variant="existing"
                            fallbackTax={(m.totalTax ?? m.oldTotalTax) ?? undefined}
                            onClose={() => setSelectedPropId(null)}
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
        {loadingMore && (
          <div className="py-1.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 bg-slate-50 border-t border-zinc-100">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
            <span>{t('loadingMore') || 'Loading more records...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
