'use client';

import { useState, useEffect, useRef, type Dispatch, type SetStateAction, type RefObject } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants, type PanInfo } from 'framer-motion';
import { Camera, Upload, X, Loader2, ChevronLeft, ChevronRight, Sparkles, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { GrievanceAiAnalysisDto } from '@/types/grievance/grievance-ai.types';
import { EvidenceEmptyState } from './EvidenceEmptyState';
import { HudImageScanner } from './HudImageScanner';

interface PhotoItem {
  id: string;
  photoId: number;
  url: string;
  isDb: boolean;
}

interface GrievanceStepEvidenceProps {
  allPhotos: PhotoItem[];
  selectedPhotoIdx: number;
  setSelectedPhotoIdx: Dispatch<SetStateAction<number>>;
  isLoadingPhotos: boolean;
  deletingPhotoId: number | null;
  handleDeletePhoto: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  handleFilesDropped: (files: FileList | File[]) => void;
  onContinue: (force?: boolean) => void;
  onContinueManual?: () => void;
  onContinueAi?: () => void;
  onReplacePhoto?: () => void;
  onSkip: () => void;
  isAiAnalyzing?: boolean;
  aiConfidence?: number | null;
  aiAnalysis?: GrievanceAiAnalysisDto | null;
}

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0, scale: 0.98 }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { x: { type: 'spring', stiffness: 340, damping: 32 }, opacity: { duration: 0.22 }, scale: { duration: 0.22 } },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.98,
    transition: { x: { type: 'spring', stiffness: 340, damping: 32 }, opacity: { duration: 0.2 } },
  }),
};

export function GrievanceStepEvidence({
  allPhotos,
  selectedPhotoIdx,
  setSelectedPhotoIdx,
  isLoadingPhotos,
  deletingPhotoId,
  handleDeletePhoto,
  fileInputRef,
  cameraInputRef,
  handleFilesDropped,
  onContinue,
  onContinueManual,
  onContinueAi,
  onReplacePhoto,
  onSkip,
  isAiAnalyzing = false,
  aiConfidence,
  aiAnalysis,
}: GrievanceStepEvidenceProps) {
  const t = useTranslations('grievance');
  const [isDragOver, setIsDragOver] = useState(false);
  const [direction, setDirection] = useState(1);
  const prevTotalRef = useRef(allPhotos.length);

  const totalPhotos = allPhotos.length;
  const hasPhotos = totalPhotos > 0;
  const activePhoto = allPhotos[selectedPhotoIdx] || allPhotos[0];

  useEffect(() => {
    if (totalPhotos > prevTotalRef.current) {
      setDirection(1);
      setSelectedPhotoIdx(totalPhotos - 1);
    }
    prevTotalRef.current = totalPhotos;
  }, [totalPhotos, setSelectedPhotoIdx]);

  const handleNext = () => {
    setDirection(1);
    setSelectedPhotoIdx((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setDirection(-1);
    setSelectedPhotoIdx((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) handleFilesDropped(e.dataTransfer.files);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -100 || offset.x < -60) handleNext();
    else if (swipe > 100 || offset.x > 60) handlePrev();
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-3 animate-in fade-in duration-200">
      {!hasPhotos ? (
        <EvidenceEmptyState
          isDragOver={isDragOver}
          setIsDragOver={setIsDragOver}
          handleDrop={handleDrop}
          fileInputRef={fileInputRef}
          cameraInputRef={cameraInputRef}
          isLoadingPhotos={isLoadingPhotos}
          onSkip={onSkip}
        />
      ) : (
        <div className="h-full flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="relative w-full">
              <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={activePhoto.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    drag={totalPhotos > 1 ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
                  >
                    <Image src={activePhoto.url} alt={t('evidencePhotos')} fill unoptimized className="object-cover pointer-events-none" />
                  </motion.div>
                </AnimatePresence>

                {totalPhotos > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-90 z-10 backdrop-blur-xs"
                      title={t('prev')}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-90 z-10 backdrop-blur-xs"
                      title={t('next')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={Boolean(activePhoto?.isDb && deletingPhotoId === activePhoto.photoId)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-colors z-10 backdrop-blur-xs"
                  title={t('deletePhotoConfirm')}
                >
                  {activePhoto?.isDb && deletingPhotoId === activePhoto.photoId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-4 h-4" />}
                </button>

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                  <div className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10.5px] font-bold flex items-center gap-1 shadow-xs">
                    <span className="font-mono">{selectedPhotoIdx + 1} / {totalPhotos}</span>
                    <span className="text-white/80 text-[10px]">{t('photos')}</span>
                  </div>
                  {aiConfidence != null && !isAiAnalyzing && (
                    <div className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shadow-xs backdrop-blur-xs">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{t('aiConfidence', { percent: aiConfidence })}</span>
                    </div>
                  )}
                </div>

                {isAiAnalyzing && (
                  <HudImageScanner label={t('aiScanning')} isScanning={isAiAnalyzing} />
                )}

                {totalPhotos > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-xs shadow-xs">
                    {allPhotos.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDirection(idx > selectedPhotoIdx ? 1 : -1);
                          setSelectedPhotoIdx(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === selectedPhotoIdx ? 'w-5 bg-white shadow-xs' : 'w-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center justify-center cursor-pointer ring-4 ring-white transition-all"
                  title={t('cameraPwa')}
                  aria-label={t('cameraPwa')}
                >
                  <Camera className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>

            {totalPhotos > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
                {allPhotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      setDirection(idx > selectedPhotoIdx ? 1 : -1);
                      setSelectedPhotoIdx(idx);
                    }}
                    className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === selectedPhotoIdx
                        ? 'border-green-600 ring-2 ring-green-500/30 scale-105 shadow-xs'
                        : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                    }`}
                  >
                    <Image src={photo.url} alt={`Thumbnail ${idx + 1}`} fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Non-Civic or Multi-Department Alert Banner */}
          {aiAnalysis && !aiAnalysis.isValidCivicIssue && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-amber-900">
                  {totalPhotos > 1 ? t('aiMultiDeptNoticeTitle') : t('aiNonCivicIssue')}
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  {totalPhotos > 1
                    ? t('aiMultiDeptNoticeDetail')
                    : (t('aiNonCivicFallbackNote') || t('aiNonCivicPhotoDetail') || aiAnalysis.rejectionReasonLocal || aiAnalysis.rejectionReason)}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
            {aiAnalysis && !aiAnalysis.isValidCivicIssue ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (onReplacePhoto) onReplacePhoto();
                    else fileInputRef.current?.click();
                  }}
                  icon={RefreshCw}
                  disabled={isAiAnalyzing}
                  className="text-xs font-bold border-slate-300 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer active:scale-95"
                >
                  {t('btnReplacePhoto')}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => (onContinueManual ? onContinueManual() : onContinue(true))}
                  disabled={isAiAnalyzing}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="font-bold text-xs bg-slate-800 hover:bg-slate-900 text-white shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  <span>{t('btnFillManuallyInstead')}</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={Upload}
                  disabled={isAiAnalyzing}
                  className="text-xs font-bold border-slate-200 cursor-pointer active:scale-95"
                >
                  {t('addMorePhotos')}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => (onContinueManual ? onContinueManual() : onContinue(false))}
                    disabled={isAiAnalyzing}
                    icon={ArrowRight}
                    iconPosition="right"
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-xs cursor-pointer active:scale-95 disabled:opacity-75"
                  >
                    <span>{t('btnFillManually')}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    onClick={() => (onContinueAi ? onContinueAi() : onContinue(false))}
                    disabled={isAiAnalyzing}
                    icon={isAiAnalyzing ? Loader2 : Sparkles}
                    iconPosition="left"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span className={isAiAnalyzing ? 'animate-pulse' : ''}>
                      {isAiAnalyzing ? t('aiScanning') : t('btnAutoFillAi')}
                    </span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
