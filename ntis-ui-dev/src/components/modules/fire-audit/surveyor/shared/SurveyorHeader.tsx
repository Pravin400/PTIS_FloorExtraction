'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Flame, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common';

export interface SurveyorHeaderProps {
  onSync?: () => void;
  syncCount?: number;
}

export function SurveyorHeader({ onSync, syncCount }: SurveyorHeaderProps) {
  const t = useTranslations('fireAuditSurveyor.header');
  const locale = useLocale();

  return (
    <header className="h-14 sm:h-16 w-full sticky top-0 z-40 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between select-none bg-[#E8EEF5] border-b border-slate-300/90 shadow-[0_3px_12px_rgba(15,23,42,0.05)] text-slate-900 shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <Link
          href={`/${locale}/fire-audit/surveyor`}
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/90 shadow-[2px_2px_6px_rgba(15,23,42,0.06),-1.5px_-1.5px_5px_rgba(255,255,255,0.95)] flex items-center justify-center p-1 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-lg bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(234,88,12,0.40)]">
              <Flame className="w-5 h-5 drop-shadow-xs" />
            </div>
          </div>

          <div className="min-w-0">
            <span className="text-sm sm:text-base lg:text-lg font-bold tracking-normal leading-normal truncate block text-slate-900">
              {t('title')}
            </span>
            <p className="text-xs font-medium text-slate-600 truncate mt-0.5 leading-normal">
              {t('subtitle')}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          className="h-9! sm:h-10! px-3! sm:px-3.5! rounded-xl bg-linear-to-b! from-white to-slate-50/90 text-slate-900! border border-slate-300/80! shadow-[2px_2px_6px_rgba(15,23,42,0.06),-1.5px_-1.5px_5px_rgba(255,255,255,0.95)] hover:border-slate-400! hover:shadow-[3px_3px_10px_rgba(15,23,42,0.09)] hover:-translate-y-0.5 active:translate-y-px active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.12)] font-bold! text-xs! sm:text-sm! transition-all cursor-pointer group shrink-0 select-none"
          title={t('syncTitle')}
        >
          <span className="inline-flex items-center gap-2 sm:gap-2.5 leading-normal">
            <RefreshCw className="w-4 h-4 text-cyan-700 group-hover:text-orange-600 group-hover:rotate-180 transition-all duration-500 ease-out shrink-0" />

            <span className="text-xs sm:text-sm font-bold tracking-normal whitespace-nowrap text-slate-900 group-hover:text-slate-950 transition-colors leading-normal">
              {t('syncButton')}
            </span>

            {Boolean(syncCount && syncCount > 0) && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs tabular-nums leading-none shrink-0 ml-0.5">
                {syncCount}
              </span>
            )}
          </span>
        </Button>
      </div>
    </header>
  );
}
