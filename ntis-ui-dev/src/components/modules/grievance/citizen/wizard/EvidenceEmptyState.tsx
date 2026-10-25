'use client';

import { type RefObject } from 'react';
import { motion } from 'framer-motion';
import { Camera, ArrowRight, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';

interface EvidenceEmptyStateProps {
  isDragOver: boolean;
  setIsDragOver: (val: boolean) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef?: RefObject<HTMLInputElement | null>;
  isLoadingPhotos: boolean;
  onSkip: () => void;
}

export function EvidenceEmptyState({
  isDragOver,
  setIsDragOver,
  handleDrop,
  fileInputRef,
  cameraInputRef,
  isLoadingPhotos,
  onSkip,
}: EvidenceEmptyStateProps) {
  const t = useTranslations('grievance');

  const handleTriggerCamera = () => {
    if (cameraInputRef?.current) {
      cameraInputRef.current.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleTriggerGallery = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      animate={{
        scale: isDragOver ? 1.02 : 1,
        borderColor: isDragOver ? '#16a34a' : '#cbd5e1',
        backgroundColor: isDragOver ? 'rgba(240, 253, 244, 0.9)' : 'rgba(248, 250, 252, 0.85)',
      }}
      transition={{ duration: 0.2 }}
      className="flex-1 p-6 rounded-2xl border-2 border-dashed shadow-xs text-center flex flex-col items-center justify-center space-y-3 cursor-pointer group min-h-[260px]"
      onClick={handleTriggerCamera}
    >
      <motion.div
        animate={{ scale: isDragOver ? 1.15 : 1 }}
        className="w-12 h-12 mx-auto rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-md shadow-green-500/20 active:scale-95 transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          handleTriggerCamera();
        }}
      >
        <Camera className="w-6 h-6" />
      </motion.div>

      <div>
        <h3 className="text-xs sm:text-sm font-black text-slate-900">{t('evidencePhotos')}</h3>
        <p className="text-[10.5px] text-slate-500 mt-0.5">{t('photoCaptureHint')}</p>
      </div>

      {isLoadingPhotos ? (
        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
          <span>{t('loadingPhotosFromDb')}</span>
        </div>
      ) : (
        <div className="pt-1 flex items-center justify-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="success"
            onClick={handleTriggerCamera}
            icon={Camera}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all px-3.5 py-2 cursor-pointer"
          >
            {t('cameraPwa')}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerGallery}
            icon={Upload}
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold shadow-xs active:scale-95 transition-all px-3.5 py-2 cursor-pointer"
          >
            {t('uploadPhoto')}
          </Button>
        </div>
      )}

      <div className="pt-1">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          icon={ArrowRight}
          iconPosition="right"
          className="text-[11px] font-bold text-slate-500 hover:text-green-600 hover:bg-transparent cursor-pointer p-0 h-auto active:scale-95 transition-all"
        >
          {t('skip')}
        </Button>
      </div>
    </motion.div>
  );
}
