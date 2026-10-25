'use client';

/**
 * Bilateral Evidence Ribbon Selector Component
 * Path: src/components/modules/grievance/admin/complaints/EvidenceRibbonSelector.tsx
 * Line ceiling: <= 300 lines.
 */

import Image from 'next/image';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import type { PublicGrievancePhoto } from '@/types/grievance/public-dashboard.types';
import { extractGrievancePhotoUrl } from '@/lib/utils/grievance';

export const extractPhotoUrl = extractGrievancePhotoUrl;

interface EvidenceRibbonSelectorProps {
  title: string;
  indicatorColor: string;
  photos: (GrievancePhotoItem | PublicGrievancePhoto)[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  emptyNotice?: string;
  actionHint?: string;
  tooltip: string;
}

export function EvidenceRibbonSelector({
  title,
  indicatorColor,
  photos,
  selectedIdx,
  onSelect,
  emptyNotice,
  actionHint,
  tooltip,
}: EvidenceRibbonSelectorProps) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${indicatorColor}`} />
          {title}
        </span>
        {actionHint && <span className="text-[9.5px] text-slate-400">{actionHint}</span>}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {photos.length > 0 ? (
          photos.map((photo, idx) => (
            <button
              key={photo.id || idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                selectedIdx === idx
                  ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
              title={tooltip}
            >
              <Image src={extractGrievancePhotoUrl(photo)} alt={tooltip} fill unoptimized className="object-cover" />
            </button>
          ))
        ) : (
          <div className="h-12 flex items-center justify-center text-[10.5px] text-slate-400 italic py-1">
            {emptyNotice}
          </div>
        )}
      </div>
    </div>
  );
}
