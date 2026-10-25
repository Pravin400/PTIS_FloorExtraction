'use client';

/**
 * GatewayHeroSection
 * Clean hero section with headline, CTA, and secondary quick actions.
 * Strictly under 200 lines.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Activity, Building2, MapPin } from 'lucide-react';

interface GatewayHeroSectionProps {
  deptCount: number;
  onSelectDepartment: () => void;
  onTrackRequestClick?: () => void;
  onViewMapClick?: () => void;
}

export function GatewayHeroSection({
  deptCount,
  onSelectDepartment,
  onTrackRequestClick,
  onViewMapClick,
}: GatewayHeroSectionProps) {
  const locale = useLocale();
  const t = useTranslations('grievance');
  const router = useRouter();

  return (
    <div className="relative max-w-4xl mx-auto flex flex-col items-center z-10 px-2">
      {/* Main Hero Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.15] sm:leading-[1.12] max-w-3xl">
        {t('heroTitlePart1')} <br />
        <span className="text-blue-600">{t('heroTitleHighlight')}</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed">
        {t('heroSubtitle')}
      </p>

      {/* Primary Action Button */}
      <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
        <button
          type="button"
          id="landing-select-dept-cta"
          onClick={onSelectDepartment}
          className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-500/35 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer select-none"
        >
          <span>{t('fileComplaint')}</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <span className="text-xs font-semibold text-slate-400">
          {t('deptsAvailableNotice', { count: deptCount })}
        </span>
      </div>

      {/* Secondary Quick Action Row */}
      <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
        <button
          type="button"
          onClick={() => {
            if (onTrackRequestClick) onTrackRequestClick();
            else router.push(`/${locale}/grievance/track`);
          }}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{t('trackGrievance')}</span>
        </button>
        <span className="text-slate-300">•</span>
        <Link
          href={`/${locale}/grievance/dashboard`}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:underline"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{t('exploreAllDepts')}</span>
        </Link>
        {onViewMapClick && (
          <>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={onViewMapClick}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:underline cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('liveCivicMap')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
