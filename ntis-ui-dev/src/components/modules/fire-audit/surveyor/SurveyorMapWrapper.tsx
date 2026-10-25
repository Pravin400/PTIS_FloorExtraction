'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Flame, Loader2 } from 'lucide-react';
import type { SurveyorInspectionItem } from '@/types/fire-audit';

function SurveyorMapSkeleton() {
  const t = useTranslations('fireAuditSurveyor.map');

  return (
    <div
      aria-label={t('loadingMap')}
      className="relative w-full h-full min-h-0 flex-1 rounded-none lg:rounded-3xl border-0 lg:border border-slate-300/80 bg-slate-100 shadow-none lg:shadow-[0_6px_24px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden animate-pulse flex flex-col items-center justify-center select-none"
    >
      {/* Top placeholder badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200">
        <div className="w-5 h-5 rounded-lg bg-orange-100 flex items-center justify-center">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
        </div>
        <div className="w-36 h-3.5 bg-slate-200 rounded-md" />
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1 p-1 rounded-xl bg-white/80 border border-slate-200">
        <div className="w-14 h-6 bg-slate-200 rounded-lg" />
        <div className="w-14 h-6 bg-slate-200 rounded-lg" />
      </div>

      {/* Center Spinner & Status */}
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 text-orange-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          {t('loadingMap')}
        </span>
      </div>
    </div>
  );
}

const SurveyorMapView = dynamic(
  () =>
    import('./SurveyorMapView').then((mod) => mod.SurveyorMapView),
  {
    ssr: false,
    loading: () => <SurveyorMapSkeleton />,
  }
);

export interface SurveyorMapWrapperProps {
  inspections?: SurveyorInspectionItem[];
}

export function SurveyorMapWrapper({ inspections }: SurveyorMapWrapperProps = {}) {
  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col">
      <SurveyorMapView inspections={inspections} />
    </div>
  );
}
