'use client';

/**
 * Complaint Evidence Table Cell Component
 * Path: src/components/modules/grievance/admin/complaints/ComplaintEvidenceCell.tsx
 *
 * Renders an interactive Before & After preview thumbnail in the Complaints table.
 * If only the citizen Before photo exists, shows the Before photo with "Pending Fix" placeholder.
 * If the officer resolution photo exists, shows full Before vs. After split comparison.
 * Line ceiling: <= 300 lines.
 */

import { CameraOff, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BeforeAfterSlider } from '@/components/common';
import type { AdminGrievanceRecord } from '@/types/grievance/admin-complaints.types';
import { extractGrievancePhotoUrl } from '@/lib/utils/grievance';

interface ComplaintEvidenceCellProps {
  complaint: AdminGrievanceRecord;
  onEnlarge?: (complaint: AdminGrievanceRecord) => void;
}

export function ComplaintEvidenceCell({
  complaint,
  onEnlarge,
}: ComplaintEvidenceCellProps) {
  const t = useTranslations('grievance');

  const photos = complaint.photos || [];

  const beforePhoto = photos.find(
    (p) => p.photoTypeId === 1 || p.photoTypeCode?.toLowerCase() === 'before'
  );
  const afterPhoto = photos.find(
    (p) =>
      p.photoTypeId === 2 ||
      p.photoTypeId === 3 ||
      p.photoTypeCode === 'RESOLUTION_PROOF' ||
      p.photoTypeCode?.toLowerCase() === 'after'
  );

  const beforeUrl =
    complaint.beforeImageUrl || (beforePhoto ? extractGrievancePhotoUrl(beforePhoto) : '');
  const hasAfter = Boolean(complaint.afterImageUrl || afterPhoto);
  const afterUrl =
    complaint.afterImageUrl ||
    (afterPhoto ? extractGrievancePhotoUrl(afterPhoto) : beforeUrl ? 'placeholder:in-progress' : undefined);

  // Fallback state: No citizen evidence photos attached
  if (!beforeUrl && !hasAfter) {
    return (
      <div
        className="inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-400 text-[11px] font-medium"
        title={t('noPhotoAttached')}
      >
        <CameraOff className="w-3.5 h-3.5 text-slate-300" />
        <span className="whitespace-nowrap">{t('noPhotoAttached')}</span>
      </div>
    );
  }

  return (
    <div
      className="relative isolate inline-flex items-center justify-center group cursor-pointer select-none"
      onClick={(e) => {
        e.stopPropagation();
        onEnlarge?.(complaint);
      }}
      title={t('inspectEvidence')}
    >
      <div className="w-36 sm:w-40 h-16 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs group-hover:shadow-md group-hover:border-emerald-300 transition-all">
        <BeforeAfterSlider
          beforeImage={beforeUrl}
          afterImage={afterUrl}
          beforeLabel={t('beforeLabel')}
          afterLabel={hasAfter ? t('afterLabel') : t('pendingFix')}
          aspectRatioClassName="h-16 w-full"
          className="rounded-none border-0"
        />
        {photos.length > 1 && (
          <span className="absolute bottom-1 left-1 z-10 px-1.5 py-0.2 rounded bg-black/75 backdrop-blur-xs text-white text-[8.5px] font-bold tracking-tight">
            📷 {photos.length}
          </span>
        )}
      </div>

      {/* Floating Hover Enlarge Button */}
      <button
        type="button"
        aria-label={t('inspectEvidence')}
        onClick={(e) => {
          e.stopPropagation();
          onEnlarge?.(complaint);
        }}
        className="absolute top-1 right-1 z-10 p-1 rounded-md bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
        title={t('inspectEvidence')}
      >
        <Maximize2 className="w-3 h-3" />
      </button>
    </div>
  );
}
