import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import {
  SurveyKpiCards,
  SurveyorMapWrapper,
} from '@/components/modules/fire-audit/surveyor';
import {
  SURVEYOR_DEFAULT_PINS,
  SURVEYOR_DEFAULT_KPI_COUNTS,
} from '@/lib/constants/fire-audit';
import SurveyorLoading from './loading';

export default async function SurveyorQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col lg:gap-3.5 overflow-hidden">
      {/* 1. Full-Screen Background Map on Mobile/Tablet (absolute inset-0 z-0), Framed on Desktop (lg:static lg:flex-1 lg:order-2) */}
      <div className="absolute inset-0 z-0 lg:static lg:flex-1 lg:w-full lg:h-full lg:min-h-0 lg:order-2 overflow-hidden">
        <SurveyorMapWrapper inspections={SURVEYOR_DEFAULT_PINS} />
      </div>

      {/* 2. KPI Cards: Floating Top Overlay on Mobile/Tablet (absolute top-0 inset-x-0 z-10 pointer-events-none), Document Flow on Desktop (lg:static lg:shrink-0 lg:order-1) */}
      <div className="absolute top-0 inset-x-0 z-10 pointer-events-none px-2.5 pt-2 sm:px-4 sm:pt-3 lg:static lg:shrink-0 lg:px-0 lg:pt-0 lg:pb-0 lg:pointer-events-auto lg:order-1">
        <div className="pointer-events-auto">
          <Suspense fallback={<SurveyorLoading />}>
            <SurveyKpiCards counts={SURVEYOR_DEFAULT_KPI_COUNTS} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

