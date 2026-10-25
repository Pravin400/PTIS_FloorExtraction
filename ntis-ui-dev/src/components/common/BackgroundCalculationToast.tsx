'use client';

import React, { useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Calculator,
  Clock,
  Sparkles,
  Pause,
  Play,
  Square,
  Ban,
  Minimize2,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useTaxCalculationNotifications } from '@/hooks/useTaxCalculationNotifications';
import { cn } from '@/lib/utils/cn';

export function BackgroundCalculationToast(): React.ReactElement | null {
  const pathname = usePathname();
  const t = useTranslations('common');
  const { jobsList, dismissJob, pauseJob, resumeJob, cancelJob } =
    useTaxCalculationNotifications();
  const [isMinimized, setIsMinimized] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Record<string, 'pause' | 'resume' | 'cancel' | null>>({});

  if (pathname?.includes('/login') || jobsList.length === 0) {
    return null;
  }

  // Identify the primary active or most recent job
  const primaryJob = jobsList.find((j) => !j.isCompleted) || jobsList[0];
  const isPrimaryFinished = primaryJob.isCompleted;
  const isPrimaryCancelled = primaryJob.isCancelled || primaryJob.status === 'Cancelled';
  const hasPrimaryFailed = (primaryJob.isCompleted && !primaryJob.isSuccess && !isPrimaryCancelled) || primaryJob.status === 'Failed';
  const isPrimaryPaused = !isPrimaryFinished && (primaryJob.isPaused || primaryJob.status === 'Paused');
  const primaryTotal = primaryJob.totalUnits || 0;
  const primaryProcessed = primaryJob.processedUnits || 0;
  const primaryPercent = Math.min(100, Math.max(0, primaryJob.percentComplete || 0));

  const handlePause = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setLoadingActions((prev) => ({ ...prev, [jobId]: 'pause' }));
    try {
      await pauseJob(jobId);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [jobId]: null }));
    }
  };

  const handleResume = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setLoadingActions((prev) => ({ ...prev, [jobId]: 'resume' }));
    try {
      await resumeJob(jobId);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [jobId]: null }));
    }
  };

  const handleCancel = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setLoadingActions((prev) => ({ ...prev, [jobId]: 'cancel' }));
    try {
      await cancelJob(jobId);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [jobId]: null }));
    }
  };

  const handleHeaderClose = (jobId: string, isJobCompleted?: boolean) => {
    if (isJobCompleted) {
      dismissJob(jobId);
    } else {
      // For in-progress/paused jobs, minimize so the user can easily re-access it anytime
      setIsMinimized(true);
    }
  };

  // ==========================================
  // 1. MINIMIZED FLOATING DOCK CAPSULE
  // ==========================================
  if (isMinimized) {
    return (
      <div
        role="region"
        aria-live="polite"
        aria-label={t('taxCalculation.backgroundTitle')}
        className="fixed bottom-20 right-4 sm:right-6 md:bottom-22 z-[99999] pointer-events-none select-none transition-all duration-300"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsMinimized(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsMinimized(false);
            }
          }}
          title={t('taxCalculation.minimizedHint')}
          className={cn(
            'pointer-events-auto group relative flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white border shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-md',
            hasPrimaryFailed
              ? 'border-rose-300 hover:border-rose-400 text-rose-800 shadow-[0_8px_24px_rgba(244,63,94,0.18)]'
              : isPrimaryCancelled
              ? 'border-slate-300 hover:border-slate-400 text-slate-800 shadow-[0_8px_24px_rgba(100,116,139,0.18)]'
              : isPrimaryFinished
              ? 'border-emerald-300 hover:border-emerald-400 text-emerald-800 shadow-[0_8px_24px_rgba(16,185,129,0.18)]'
              : isPrimaryPaused
              ? 'border-amber-300 hover:border-amber-400 text-amber-900 shadow-[0_8px_24px_rgba(245,158,11,0.18)]'
              : 'border-blue-300 hover:border-blue-400 text-blue-900 shadow-[0_8px_24px_rgba(59,130,246,0.18)]'
          )}
        >
          {/* Status Icon */}
          <div className="flex items-center justify-center">
            {hasPrimaryFailed ? (
              <AlertCircle className="w-4 h-4 text-rose-600 animate-bounce" />
            ) : isPrimaryCancelled ? (
              <Ban className="w-4 h-4 text-slate-600" />
            ) : isPrimaryFinished ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : isPrimaryPaused ? (
              <Pause className="w-4 h-4 fill-amber-600 text-amber-600" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          {/* Quick status text & counters */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span>
              {hasPrimaryFailed
                ? t('taxCalculation.failed')
                : isPrimaryCancelled
                ? t('taxCalculation.cancelled')
                : isPrimaryFinished
                ? t('taxCalculation.completed')
                : isPrimaryPaused
                ? t('taxCalculation.paused')
                : t('taxCalculation.inProgress')}
            </span>

            {primaryTotal > 0 && (
              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isPrimaryFinished
                  ? `${primaryJob.succeededCount ?? primaryTotal}/${primaryTotal}`
                  : `${primaryProcessed}/${primaryTotal}`}
              </span>
            )}

            {!isPrimaryFinished && (
              <span className="font-mono text-[11px] text-blue-600 font-bold">
                {`${primaryPercent}%`}
              </span>
            )}

            {jobsList.length > 1 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                +{jobsList.length - 1}
              </span>
            )}
          </div>

          {/* Quick inline Pause / Resume control on pill */}
          {!isPrimaryFinished && (
            <div className="flex items-center pl-1 border-l border-slate-200">
              {isPrimaryPaused ? (
                <button
                  type="button"
                  onClick={(e) => handleResume(e, primaryJob.jobId)}
                  title={t('taxCalculation.resume')}
                  className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handlePause(e, primaryJob.jobId)}
                  title={t('taxCalculation.pause')}
                  className="p-1 rounded-full text-amber-700 hover:bg-amber-50 transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          )}

          {/* Expand icon */}
          <div className="pl-0.5 text-slate-400 group-hover:text-slate-700 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. EXPANDED FULL CARD VIEW
  // ==========================================
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={t('taxCalculation.backgroundTitle')}
      className="fixed bottom-20 right-4 sm:right-6 md:bottom-22 z-[99999] flex flex-col gap-3 max-w-[440px] w-[calc(100vw-2rem)] sm:w-full pointer-events-none select-none transition-all duration-300"
    >
      {jobsList.map((job) => {
        const isFinished = job.isCompleted;
        const isCancelled = job.isCancelled || job.status === 'Cancelled';
        const hasFailed = (job.isCompleted && !job.isSuccess && !isCancelled) || job.status === 'Failed';
        const isPaused = !isFinished && (job.isPaused || job.status === 'Paused');
        const total = job.totalUnits || 0;
        const processed = job.processedUnits || 0;
        const percent = Math.min(100, Math.max(0, job.percentComplete || 0));
        const actionLoading = loadingActions[job.jobId];

        return (
          <div
            key={job.jobId}
            className={cn(
              'pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border transition-all duration-300 backdrop-blur-xl bg-white/95',
              hasFailed
                ? 'border-rose-300 shadow-[0_16px_40px_rgba(244,63,94,0.18),0_2px_8px_rgba(0,0,0,0.06)]'
                : isCancelled
                ? 'border-slate-300 shadow-[0_16px_40px_rgba(100,116,139,0.15),0_2px_8px_rgba(0,0,0,0.06)]'
                : isFinished
                ? 'border-emerald-300 shadow-[0_16px_40px_rgba(16,185,129,0.18),0_2px_8px_rgba(0,0,0,0.06)]'
                : isPaused
                ? 'border-amber-300 shadow-[0_16px_40px_rgba(245,158,11,0.18),0_2px_8px_rgba(0,0,0,0.06)]'
                : 'border-blue-300 shadow-[0_16px_40px_rgba(59,130,246,0.18),0_2px_8px_rgba(0,0,0,0.06)]'
            )}
          >
            {/* Ambient top glowing line */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-[3px]',
                hasFailed
                  ? 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-600'
                  : isCancelled
                  ? 'bg-gradient-to-r from-slate-400 via-zinc-400 to-slate-500'
                  : isFinished
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
                  : isPaused
                  ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 animate-pulse'
              )}
            />

            {/* Header row with status badges, minimize & close */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                {/* Status Badge */}
                {hasFailed ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    {t('taxCalculation.failed')}
                  </span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    <Ban className="w-3.5 h-3.5 text-slate-600" />
                    {t('taxCalculation.cancelled')}
                  </span>
                ) : isFinished ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {t('taxCalculation.completed')}
                  </span>
                ) : isPaused ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    <Pause className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                    {t('taxCalculation.paused')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                    </span>
                    {t('taxCalculation.inProgress')}
                  </span>
                )}

                {/* Units counter badge */}
                {total > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {isFinished
                      ? `${job.succeededCount ?? total} ${t('taxCalculation.units')}`
                      : `${processed}/${total} ${t('taxCalculation.units')}`}
                  </span>
                )}
              </div>

              {/* Header Action Buttons: Minimize & Close */}
              <div className="flex items-center gap-1">
                {/* Minimize button */}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title={t('taxCalculation.minimize')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-300 cursor-pointer"
                  aria-label={t('taxCalculation.minimize')}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => handleHeaderClose(job.jobId, isFinished)}
                  title={isFinished ? t('taxCalculation.close') : t('taxCalculation.minimize')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-300 cursor-pointer"
                  aria-label={t('taxCalculation.dismiss')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Body */}
            <div className="mt-2.5 flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {hasFailed ? (
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                ) : isCancelled ? (
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                    <Ban className="w-5 h-5" />
                  </div>
                ) : isFinished ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                ) : isPaused ? (
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                    <Pause className="w-4 h-4 fill-amber-600" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 relative shadow-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <Calculator className="w-2.5 h-2.5 absolute text-blue-800" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {hasFailed
                    ? t('taxCalculation.failedTitle')
                    : isCancelled
                    ? t('taxCalculation.cancelledTitle')
                    : isFinished
                    ? t('taxCalculation.completedTitle')
                    : isPaused
                    ? t('taxCalculation.pausedTitle')
                    : t('taxCalculation.backgroundTitle')}
                </h4>
                <p className="text-xs text-slate-600 font-normal leading-relaxed mt-1 line-clamp-2">
                  {job.message ||
                    (isPaused
                      ? t('taxCalculation.pausedMessage')
                      : isFinished
                      ? t('taxCalculation.recalculatedUnits', { count: job.succeededCount || total })
                      : t('taxCalculation.processingUnits', { processed, total }))}
                </p>
              </div>
            </div>

            {/* Progress Bar when In-Progress or Paused */}
            {!isFinished && (
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                  <span className="text-slate-500">{t('taxCalculation.progress')}</span>
                  <span
                    className={cn(
                      'font-mono font-bold',
                      isPaused ? 'text-amber-600' : 'text-blue-600'
                    )}
                  >
                    {`${percent}%`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-slate-200/80 p-[1px]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300 ease-out shadow-xs',
                      isPaused
                        ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400'
                    )}
                    style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons Toolbar for Active / Paused jobs */}
            {!isFinished && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Pause / Resume Button */}
                  {isPaused ? (
                    <button
                      type="button"
                      disabled={actionLoading === 'resume'}
                      onClick={(e) => handleResume(e, job.jobId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === 'resume' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      {t('taxCalculation.resume')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading === 'pause'}
                      onClick={(e) => handlePause(e, job.jobId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === 'pause' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                      ) : (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      )}
                      {t('taxCalculation.pause')}
                    </button>
                  )}

                  {/* Terminate / Cancel Button */}
                  <button
                    type="button"
                    disabled={actionLoading === 'cancel'}
                    onClick={(e) => handleCancel(e, job.jobId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading === 'cancel' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Square className="w-3 h-3 fill-current" />
                    )}
                    {t('taxCalculation.terminate')}
                  </button>
                </div>

                {/* Minimize / Close Button */}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  {t('taxCalculation.minimize')}
                </button>
              </div>
            )}

            {/* Finished metadata duration & close if available */}
            {isFinished && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                {job.durationMs ? (
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {`${(job.durationMs / 1000).toFixed(1)}s`}
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-semibold">{t('taxCalculation.ready')}</span>
                  <button
                    type="button"
                    onClick={() => dismissJob(job.jobId)}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    {t('taxCalculation.close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
