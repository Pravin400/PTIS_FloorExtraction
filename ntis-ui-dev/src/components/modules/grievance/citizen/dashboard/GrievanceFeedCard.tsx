'use client';

import { useState } from 'react';
import { MapPin, ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BeforeAfterSlider } from '@/components/common';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import type { PublicGrievancePhoto } from '@/types/grievance/public-dashboard.types';

export interface CivicComparisonItem {
  id: string;
  grievanceNo?: string;
  wardNumber: number;
  wardName: string;
  wardNameMr?: string;
  zoneName?: string;
  title: string;
  titleMr?: string;
  departmentName?: string;
  departmentNameLocal?: string;
  roadLandmark?: string;
  status: 'Cleaned' | 'In Progress' | 'Hazardous' | 'Reported' | 'Pending';
  statusMr?: string;
  beforeImage: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  photoBadge?: string;
  photos?: (GrievancePhotoItem | PublicGrievancePhoto)[];
  upvotes: number;
  lat: number;
  lng: number;
  daysOpen?: number;
  isResolved?: boolean;
}

interface CivicFeedCardProps {
  item: CivicComparisonItem;
  onSelect?: (item: CivicComparisonItem) => void;
  onDetailsClick?: (item: CivicComparisonItem) => void;
  isActive?: boolean;
  className?: string;
}

export function CivicFeedCard({
  item,
  onSelect,
  onDetailsClick,
  isActive = false,
  className = '',
}: CivicFeedCardProps) {
  const t = useTranslations('grievance');

  const [votes, setVotes] = useState(item?.upvotes || 0);
  const [hasVoted, setHasVoted] = useState(false);

  if (!item) {
    return null;
  }

  const handleVoteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted) {
      setVotes((v) => v - 1);
      setHasVoted(false);
    } else {
      setVotes((v) => v + 1);
      setHasVoted(true);
    }
  };

  const getStatusLabel = (status: CivicComparisonItem['status']) => {
    switch (status) {
      case 'Cleaned':
        return t('statusCleaned');
      case 'Hazardous':
        return t('statusHazardous');
      case 'Pending':
        return t('statusPending');
      case 'In Progress':
        return t('statusInProgress');
      case 'Reported':
        return t('statusSubmitted');
      default:
        return status;
    }
  };

  const statusColorClass =
    item.status === 'Cleaned'
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      : item.status === 'Hazardous'
      ? 'bg-rose-100 text-rose-800 border border-rose-200'
      : item.status === 'Pending'
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-sky-100 text-sky-800 border border-sky-200';

  return (
    <div
      onClick={() => onSelect?.(item)}
      className={`w-full min-w-0 bg-white rounded-2xl p-2.5 sm:p-3 shadow-md border transition-all duration-300 ease-out cursor-pointer select-none ${
        isActive
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/15 scale-[1.02] z-10'
          : 'border-slate-200 hover:border-slate-300 shadow-md hover:shadow-lg'
      } ${className}`}
    >
      {/* Card Header: Ward & Status Badge matching Screenshot */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            {item.wardName ? item.wardName : `${t('wardPrefix')} ${item.wardNumber}`}
          </span>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${statusColorClass}`}>
          {getStatusLabel(item.status)}
        </span>
      </div>

      {/* Complaint Title & Sub-location */}
      <div className="mb-2.5">
        <h4 className="text-xs sm:text-[13px] font-black text-slate-900 leading-snug line-clamp-1">
          {item.title}
        </h4>
        {item.roadLandmark && (
          <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
            {item.roadLandmark}
          </p>
        )}
      </div>

      {/* Interactive Before/After Split Comparison Slider */}
      <div className="mb-2.5">
        <BeforeAfterSlider
          beforeImage={item.beforeImage}
          afterImage={item.afterImage}
          beforeLabel={item.beforeLabel || t('beforeLabel')}
          afterLabel={item.afterLabel || (item.status === 'Cleaned' ? t('afterLabel') : t('statusInProgress'))}
          photoBadge={item.photoBadge || (item.photos && item.photos.length > 1 ? t('photosCountBadge', { count: item.photos.length }) : undefined)}
          aspectRatioClassName="h-24 sm:h-28"
          alt={item.title}
        />
      </div>

      {/* Card Footer: [✓ 56 Votes] and [Details →] matching Screenshot */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleVoteToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            hasVoted
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>
            {votes} {t('votes')}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDetailsClick?.(item);
          }}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer px-2 py-1"
        >
          <span>{t('details')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
