'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { DepartmentGatewayView } from '@/components/modules/grievance/shared/department';
import { GrievanceLandingView } from './GrievanceLandingView';

export function GrievanceOverviewClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('grievance');
  const [viewMode, setViewMode] = useState<'landing' | 'map'>('landing');

  if (viewMode === 'map') {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden">
        {/* Quick Return to Landing View Button */}
        <div className="absolute top-4 left-4 z-40">
          <button
            type="button"
            onClick={() => setViewMode('landing')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 font-bold text-xs shadow-lg border border-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>{t('backToDashboard')}</span>
          </button>
        </div>

        <GrievanceLandingView
          onTrackRequestClick={() => router.push(`/${locale}/grievance/track`)}
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex-1 flex flex-col overflow-y-auto custom-scrollbar">
      <DepartmentGatewayView
        onTrackRequestClick={() => router.push(`/${locale}/grievance/track`)}
        onViewMapClick={() => setViewMode('map')}
        className="w-full flex-1"
      />
    </div>
  );
}
