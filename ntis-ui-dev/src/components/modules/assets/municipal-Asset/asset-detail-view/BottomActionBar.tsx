'use client';
import type { BottomActionBarProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { Edit2, ChevronDown, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/common';
import { useRouter, useParams } from 'next/navigation';

type QaStatusOption = 'Approved' | 'Pending' | 'Rejected';

const QA_OPTIONS: { value: QaStatusOption; label: string; icon: React.ReactElement; color: string }[] = [
  { value: 'Approved', label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, color: 'text-green-600' },
  { value: 'Pending', label: 'Pending', icon: <Clock className="w-3 h-3" />, color: 'text-orange-500' },
  { value: 'Rejected', label: 'Rejected', icon: <XCircle className="w-3 h-3" />, color: 'text-red-600' },
];

export function BottomActionBar({ data }: BottomActionBarProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const [qaOpen, setQaOpen] = useState(false);
  const [selectedQa, setSelectedQa] = useState<QaStatusOption>('Pending');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  const handleEditAsset = () => {
    if (!data?.numericId) {
      return;
    }
    const searchParams = new URLSearchParams({
      mode: 'edit',
      category: data.category || 'Building Assets',
      categoryId: data.categoryId || '0',
      assetType: data.assetType || '',
      typeId: data.typeId || '0',
      assetId: String(data.numericId)
    });
    router.push("/" + locale + "/assets/municipal-Asset/new-add-new-asset?" + searchParams.toString());
  };

  const selectedOption = QA_OPTIONS.find((o) => o.value === selectedQa) ?? QA_OPTIONS[1];

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {/* Edit button */}
      <Button
        variant="secondary"
        onClick={handleEditAsset}
        className="!flex !items-center !justify-center !px-2.5 !py-1.5 !rounded-md !bg-blue-50 !border-none !text-blue-600 hover:!bg-blue-100 !transition-colors !shadow-sm !w-full !h-auto"
        aria-label={t('editLabel')}
      >
        <div className="flex items-center justify-center gap-2 font-bold text-[11px]">
          <div className="w-5 h-5 flex items-center justify-center rounded bg-blue-600 text-white">
            <Edit2 className="w-3 h-3" />
          </div>
          {t('editLabel')}
        </div>
      </Button>

      {/* QA Status dropdown */}
      <div className="relative w-full">
        <Button
          variant="secondary"
          onClick={() => setQaOpen((o) => !o)}
          className="!flex !items-center !justify-center !px-2.5 !py-1.5 !rounded-md !bg-purple-50 !border-none !text-purple-600 hover:!bg-purple-100 !transition-colors !shadow-sm !w-full !h-auto"
          aria-haspopup="listbox"
          aria-expanded={qaOpen}
          aria-label={t('qaStatus')}
        >
          <div className="flex items-center justify-between w-full font-bold text-[11px] gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 flex items-center justify-center rounded bg-purple-600 text-white flex-shrink-0">
                {selectedOption.icon}
              </div>
              <span className="truncate">
                {t('qaStatus')}: {selectedOption.label}
              </span>
            </div>
            <ChevronDown className={cn('w-3 h-3 transition-transform flex-shrink-0', qaOpen && 'rotate-180')} />
          </div>
        </Button>

        {qaOpen && (
          <>
            {/* Invisible backdrop to detect clicks outside */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setQaOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden"
              role="listbox"
              aria-label={t('qaStatus')}
            >
              {QA_OPTIONS.map((opt) => (
                <Button
                  variant="ghost"
                  key={opt.value}
                  role="option"
                  aria-selected={selectedQa === opt.value}
                  onClick={() => {
                    setSelectedQa(opt.value);
                    setQaOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-start gap-2 w-full px-3 py-2 text-[11px] font-bold transition-colors hover:bg-slate-50 !h-auto !min-h-0 !border-0 !rounded-none',
                    selectedQa === opt.value ? 'bg-blue-50' : '',
                    opt.color,
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
