'use client';

import { useTranslations } from 'next-intl';
import { Image as ImageIcon } from 'lucide-react';
import { AddButton } from '@/components/common';
import type { ULBImageGalleryProps } from '@/types/ulbconfig-master.types';
import { ImageWithFallback } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';



export function ULBImageGallery({
  unselectedLogos,
  unselectedBackgrounds,
  isUploading,
  onTriggerUpload,
  onSetAsBackground,
  onLogoChange,
  onDeleteLogoOrBackground,
}: ULBImageGalleryProps) {
  const t = useTranslations('ulb_configuration');

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
          <ImageIcon className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
          {t('sections.imageGallery') || 'ULB Image Gallery'}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <AddButton
            label={isUploading ? t('messages.uploading') || 'Uploading...' : t('buttons.addImages')}
            onClick={onTriggerUpload}
            disabled={isUploading}
            className="h-8 rounded-lg px-4 text-xs font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Section 1: Logo Library */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('sections.logoLibrary', { count: unselectedLogos.length })}
          </span>
          {unselectedLogos.length === 0 ? (
            <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-[10px] font-medium text-slate-400">
              {t('messages.noOtherLogos')}
            </div>
          ) : (
             <div className="flex flex-wrap gap-2 pr-1">
              {unselectedLogos.map((logo) => (
                <div key={logo.id} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all hover:scale-105 duration-200">
                  <button
                    type="button"
                    onClick={() => onLogoChange(logo.url)}
                    className="h-full w-full p-2"
                    title="Select as active logo"
                  >
                    <ImageWithFallback
                      src={logo.url}
                      alt="Logo option"
                      width={80}
                      height={80}
                      className="h-full w-full object-contain"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLogoOrBackground(logo.id, 'Logo')}
                    className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 group-hover:flex transition-transform active:scale-95"
                    title="Delete logo"
                  >
                    <span className="text-xs font-bold leading-none">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100" />

        {/* Section 2: Background Library */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('sections.backgroundLibrary', { count: unselectedBackgrounds.length })}
          </span>
          {unselectedBackgrounds.length === 0 ? (
            <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-[10px] font-medium text-slate-400">
              {t('messages.noOtherBackgrounds')}
            </div>
          ) : (
             <div className="flex flex-wrap gap-2 pr-1">
              {unselectedBackgrounds.map((bg) => (
                <div key={bg.id} className="group relative h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all hover:scale-105 duration-200">
                  <button
                    type="button"
                    onClick={() => onSetAsBackground(bg.id)}
                    className="h-full w-full"
                    title="Select as active background"
                  >
                    <ImageWithFallback
                      src={bg.url}
                      alt="Background option"
                      width={128}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLogoOrBackground(bg.id, 'Background')}
                    className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 group-hover:flex transition-transform active:scale-95"
                    title="Delete background"
                  >
                    <span className="text-xs font-bold leading-none">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
