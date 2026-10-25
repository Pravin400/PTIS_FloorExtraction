'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, AlertCircle, Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { getGrievancePhotoViewUrl } from '@/lib/utils/grievance';

interface TrackerPhotoGalleryProps {
  photos: GrievancePhotoItem[];
  isLoadingPhotos: boolean;
}

export function TrackerPhotoGallery({
  photos,
  isLoadingPhotos,
}: TrackerPhotoGalleryProps) {
  const t = useTranslations('grievance');
  const [activeZoomPhoto, setActiveZoomPhoto] = useState<GrievancePhotoItem | null>(null);

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('uploadedEvidencePhotos')}</span>
        </span>
      </div>

      {isLoadingPhotos ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>{t('loadingEvidencePhotos')}</span>
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActiveZoomPhoto(photo)}
              className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:scale-[1.02]"
            >
              <Image
                src={getGrievancePhotoViewUrl(photo.id)}
                alt={photo.fileName || 'Evidence Photo'}
                fill
                unoptimized
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-bold">
                <Eye className="w-4 h-4" />
                <span>{t('viewPhoto')}</span>
              </div>
              <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-white font-medium truncate">
                {photo.fileName || `Photo #${photo.id}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{t('noPhotoEvidence')}</span>
        </div>
      )}

      {/* Lightbox Full-Screen Modal for Photo Zoom */}
      {activeZoomPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveZoomPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs truncate">
                {activeZoomPhoto.fileName || `Photo #${activeZoomPhoto.id}`}
              </span>
              <button
                type="button"
                onClick={() => setActiveZoomPhoto(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                aria-label={t('close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
              <Image
                src={getGrievancePhotoViewUrl(activeZoomPhoto.id)}
                alt={activeZoomPhoto.fileName || 'Evidence'}
                width={800}
                height={600}
                unoptimized
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            {activeZoomPhoto.remarks && (
              <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800">{t('remarks')} </span>
                {activeZoomPhoto.remarks}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
