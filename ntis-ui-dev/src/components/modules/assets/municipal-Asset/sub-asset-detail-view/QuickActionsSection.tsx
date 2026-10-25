'use client';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { History, ClipboardCheck, MessageSquare, PlusCircle } from 'lucide-react';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import { CollectionHistoryDrawer } from './CollectionHistoryDrawer';
import type { QuickActionsSectionProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import { fetchCollectionHistoryData } from '@/app/[locale]/assets/municipal-Asset/sub-asset-detail-view/[subAssetId]/actions';
import type { HistoryItem } from '@/types/asset/municipal-Asset/sub-asset-detail-api.types';
export function QuickActionsSection({ subAssetId, rentFrequency }: QuickActionsSectionProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyTotals, setHistoryTotals] = useState<Record<string, number> | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleOpenCollectionHistory = async () => {
    setIsDrawerOpen(true);
    setIsLoadingHistory(true);
    try {
      const res = await fetchCollectionHistoryData(subAssetId);
      if (res.success && res.data && !Array.isArray(res.data) && Array.isArray(res.data.items)) {
        setHistoryData(res.data.items as HistoryItem[]);
        setHistoryTotals(res.data.totals);
      } else {
        setHistoryData([]);
        setHistoryTotals(null);
      }
    } catch (_err) {
      setHistoryData([]);
      setHistoryTotals(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const ACTIONS = [
    { label: t('collectionHistoryBtn') || 'Collection History', originalLabel: 'Collection History', Icon: History, color: '!text-emerald-600', bg: '!bg-emerald-50 !border-emerald-200 hover:!bg-emerald-100' },
    { label: t('auditBtn') || 'Audit', originalLabel: 'Audit', Icon: ClipboardCheck, color: '!text-indigo-600', bg: '!bg-indigo-50 !border-indigo-200 hover:!bg-indigo-100' },
    { label: t('raiseGrievance') || 'Raise Grievance', originalLabel: 'Raise Grievance', Icon: PlusCircle, color: '!text-rose-600', bg: '!bg-rose-50 !border-rose-200 hover:!bg-rose-100' },
    { label: t('grievanceHistoryBtn') || 'Grievance History', originalLabel: 'Grievance History', Icon: MessageSquare, color: '!text-red-600', bg: '!bg-red-50 !border-red-200 hover:!bg-red-100' },
  ] as const;

  return (
    <>
      <div className="grid grid-cols-4 gap-2 w-full">
        {ACTIONS.map(({ label, originalLabel, Icon, color, bg }) => (
          <Button
            key={originalLabel}
            type="button"
            variant="outline"
            aria-label={label}
            disabled={originalLabel !== 'Collection History'}
            onClick={() => originalLabel === 'Collection History' ? handleOpenCollectionHistory() : undefined}
            className={cn('flex items-center justify-center gap-1.5 px-1 py-2 rounded-lg border text-[11px] font-bold transition-colors h-10', bg, color, `hover:${color}`)}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn('w-4 h-4', color)} aria-hidden="true" />
              <span className="whitespace-nowrap truncate">{label}</span>
            </div>
          </Button>
        ))}
      </div>

      <CollectionHistoryDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={historyData}
        totals={historyTotals}
        loading={isLoadingHistory}
        rentFrequency={rentFrequency}
      />
    </>
  );
}

