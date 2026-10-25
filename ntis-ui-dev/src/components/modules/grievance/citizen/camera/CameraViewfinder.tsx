'use client';

import { type RefObject } from 'react';
import Image from 'next/image';
import { AlertCircle, Upload, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CameraViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  capturedImage: string | null;
  facingMode: 'environment' | 'user';
  isLoading: boolean;
  error: string | null;
  onFallback: () => void;
  onRetry: () => void;
}

export function CameraViewfinder({
  videoRef,
  capturedImage,
  facingMode,
  isLoading,
  error,
  onFallback,
  onRetry,
}: CameraViewfinderProps) {
  const t = useTranslations('grievance');

  return (
    <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Live Video Stream */}
      {!capturedImage && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />
      )}

      {/* Captured Image Review Preview */}
      {capturedImage && (
        <Image
          src={capturedImage}
          alt="PWA Captured Evidence"
          fill
          unoptimized
          className="object-cover"
        />
      )}

      {/* Viewfinder Targeting Overlays when in live mode */}
      {!capturedImage && !error && !isLoading && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
          {/* Corner Brackets Guide */}
          <div className="relative w-full aspect-square max-w-[280px] border-2 border-white/30 rounded-2xl">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

            {/* Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="w-6 h-[1.5px] bg-white" />
              <div className="h-6 w-[1.5px] bg-white absolute" />
            </div>
          </div>

          <div className="mt-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10.5px] font-bold text-white/90">
            {t('cameraHint')}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2.5 text-white z-10">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold">{t('initializingCamera')}</p>
        </div>
      )}

      {/* Error Message & Fallback Option */}
      {error && (
        <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center gap-4 text-white z-20">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h4 className="text-sm font-black">{t('cameraError')}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
            <button
              type="button"
              onClick={onFallback}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>{t('selectGallery')}</span>
            </button>

            <button
              type="button"
              onClick={onRetry}
              className="w-full py-2 px-4 rounded-xl border border-slate-600 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('retryCamera')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
