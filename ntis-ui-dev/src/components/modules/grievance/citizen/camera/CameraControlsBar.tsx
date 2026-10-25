'use client';

import { Upload, Sparkles, RotateCcw, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CameraControlsBarProps {
  capturedImage: string | null;
  isLoading: boolean;
  hasError: boolean;
  onFallback: () => void;
  onSnapPhoto: () => void;
  onRetake: () => void;
  onAcceptPhoto: () => void;
}

export function CameraControlsBar({
  capturedImage,
  isLoading,
  hasError,
  onFallback,
  onSnapPhoto,
  onRetake,
  onAcceptPhoto,
}: CameraControlsBarProps) {
  const t = useTranslations('grievance');

  return (
    <div className="p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between gap-3 text-white z-20">
      {!capturedImage ? (
        <>
          <button
            type="button"
            onClick={onFallback}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 flex flex-col items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            title={t('uploadFallback')}
          >
            <Upload className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">{t('uploadLabel')}</span>
          </button>

          {/* Central Large Shutter Button */}
          <button
            type="button"
            onClick={onSnapPhoto}
            disabled={isLoading || hasError}
            className="relative w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform cursor-pointer disabled:opacity-40 disabled:pointer-events-none group"
            title={t('capture')}
          >
            <div className="w-14 h-14 rounded-full bg-white group-hover:bg-slate-200 transition-colors shadow-lg" />
          </button>

          {/* AI Auto-Detection Helper Badge */}
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex flex-col items-center justify-center text-emerald-300">
            <Sparkles className="w-4 h-4" />
            <span className="text-[7.5px] font-black uppercase">{t('aiMatchLabel')}</span>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 w-full animate-in fade-in duration-150">
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 py-3 px-4 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('retake')}</span>
          </button>

          <button
            type="button"
            onClick={onAcceptPhoto}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t('useThisPhoto')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
