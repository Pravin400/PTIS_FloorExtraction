'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, History } from 'lucide-react';
import { MappedPropertySocietyWiseItem } from '@/types/property-mapping/property-mapping-society-wise.types';
import { getMappedPropertiesSocietyWiseAction } from '@/lib/api/property-mapping/property-mapping-society-wise.service';
import { OldDetailsTable } from './OldDetailsTable';
import { matchesFloor } from '@/lib/utils/ptis-floor.utils';
import { useTranslations } from 'next-intl';

export interface OldDetailsPanelProps {
  wingDetailsId?: number | null;
  societyDetailId?: number | null;
  wingName?: string | null;
  selectedFloor?: string | null;
  onClose?: () => void;
}

const PAGE_SIZE = 100;

export const OldDetailsPanel: React.FC<OldDetailsPanelProps> = ({
  wingDetailsId,
  societyDetailId,
  wingName,
  selectedFloor,
  onClose,
}) => {
  const t = useTranslations('ptisRedesign.oldDetails');
  const [items, setItems] = useState<MappedPropertySocietyWiseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const filteredItems = React.useMemo(() => {
    if (!selectedFloor) return items;
    return items.filter((item) => matchesFloor(item.oldFloor, selectedFloor));
  }, [items, selectedFloor]);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      if (!wingDetailsId && !societyDetailId) {
        if (!cancelled) {
          setItems([]);
          setTotalCount(0);
          setIsLoading(false);
          setHasMore(false);
        }
        return;
      }

      setIsLoading(true);
      setPageNumber(1);
      setHasMore(true);

      try {
        const res = await getMappedPropertiesSocietyWiseAction({
          wingDetailsId: wingDetailsId ?? undefined,
          societyDetailId: societyDetailId ?? undefined,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
        });

        if (cancelled) return;

        if (res && Array.isArray(res.items)) {
          setItems(res.items);
          const total = res.totalCount ?? res.items.length;
          setTotalCount(total);
          setHasMore(res.items.length < total && res.items.length === PAGE_SIZE);
        } else {
          setItems([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [wingDetailsId, societyDetailId]);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || isLoading || isLoadingMore || !hasMore) return;
    if (!wingDetailsId && !societyDetailId) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = pageNumber + 1;

    try {
      const res = await getMappedPropertiesSocietyWiseAction({
        wingDetailsId: wingDetailsId ?? undefined,
        societyDetailId: societyDetailId ?? undefined,
        pageNumber: nextPage,
        pageSize: PAGE_SIZE,
      });

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setItems((prev) => [...prev, ...res.items]);
        setPageNumber(nextPage);
        const total = res.totalCount ?? (items.length + res.items.length);
        setTotalCount(total);
        if (items.length + res.items.length >= total || res.items.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [isLoading, isLoadingMore, hasMore, wingDetailsId, societyDetailId, pageNumber, items.length]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        loadMore();
      }
    },
    [loadMore]
  );

  return (
    <div className="w-full bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col overflow-hidden transition-all duration-200 mt-2">
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-100/90 border-b border-blue-200 text-blue-950 shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-800" />
          <div>
            <h3 className="text-xs font-bold tracking-tight">{t('title') || 'Mapped Properties (Society / Wing Wise)'}</h3>
            <p className="text-[10px] text-blue-800/80">
              {wingName ? `${t('wing') || 'Wing'}: ${wingName}` : (t('allWings') || 'All Wings (Entire Society)')}
              {selectedFloor ? ` • ${t('floor') || 'Floor'}: ${selectedFloor}` : ''}
              {wingDetailsId ? ` • ${t('wingDetailsId') || 'Wing Details ID'}: ${wingDetailsId}` : ''}
              {totalCount > 0 ? ` • ${t('records', { count: filteredItems.length, total: totalCount }) || `${filteredItems.length} of ${totalCount} Records`}` : ''}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-blue-200 text-blue-900 transition-colors cursor-pointer"
            aria-label="Close"
            title={t('closeTitle') || 'Close Old Details Table'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="max-h-80 flex flex-col overflow-hidden">
        <OldDetailsTable
          items={filteredItems}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
};
