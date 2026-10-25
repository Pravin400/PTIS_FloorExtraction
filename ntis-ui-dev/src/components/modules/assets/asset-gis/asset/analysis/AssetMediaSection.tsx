'use client';

import { Camera, FileText, Loader2, ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@/components/common';
import { ImageWithFallback } from '@/components/modules/assets/municipal-Asset/add-New-Asset/basic-Info/media/ImageWithFallback';
import type { AssetMediaSectionProps } from '@/types/asset-gis.types';

export function AssetMediaSection({
  realPhotos,
  isLoadingRealPhotos,
  documents,
  isLoadingDocuments,
  onOpenImageModal,
  onOpenDocModal,
}: AssetMediaSectionProps) {
  const t = useTranslations('assetGis');
  const photosCount = realPhotos.length;
  const docsCount = documents?.length ?? 0;
  const primaryPhoto = realPhotos[0]?.url;

  return (
    <div className="p-3.5 bg-slate-50 border-b border-slate-200">
      <div className="flex items-center gap-3">
        {/* Photo Thumbnail */}
        <div
          onClick={() => primaryPhoto && onOpenImageModal(primaryPhoto)}
          className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shadow-sm shrink-0 cursor-pointer group"
        >
          {isLoadingRealPhotos ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : primaryPhoto ? (
            <>
              <ImageWithFallback
                src={primaryPhoto}
                alt="Asset Primary Photo"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Camera className="w-5 h-5 text-white drop-shadow" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold">{t('details.noPhoto')}</span>
            </div>
          )}
        </div>

        {/* Media Counts & Action Buttons */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => primaryPhoto && onOpenImageModal(primaryPhoto)}
            disabled={photosCount === 0}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group disabled:opacity-60 disabled:pointer-events-none shadow-xs cursor-pointer h-auto"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">{t('details.photos') || 'Photos'}</span>
            </div>
            <Badge variant="default" size="sm" className="font-mono font-bold">
              {photosCount}
            </Badge>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onOpenDocModal}
            disabled={docsCount === 0 && !isLoadingDocuments}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group disabled:opacity-60 disabled:pointer-events-none shadow-xs cursor-pointer h-auto"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-700">{t('details.documents') || 'Documents'}</span>
            </div>
            <Badge variant="default" size="sm" className="font-mono font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
              {isLoadingDocuments ? <Loader2 className="w-3 h-3 animate-spin" /> : docsCount}
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
}
