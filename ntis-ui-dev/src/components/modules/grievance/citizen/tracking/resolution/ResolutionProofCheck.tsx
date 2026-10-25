'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Wrench,
  Calendar,
  Phone,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ResolutionProof, CitizenFeedback, TrackingOfficer } from '@/types/grievance';
import { ResolutionImageSlider } from './ResolutionImageSlider';
import { ResolutionFeedbackForm } from './ResolutionFeedbackForm';

interface ResolutionProofCheckProps {
  proof: ResolutionProof;
  assignedOfficer?: TrackingOfficer;
  initialFeedback?: CitizenFeedback;
  onFeedbackSubmit?: (feedback: CitizenFeedback) => void;
  className?: string;
}

export function ResolutionProofCheck({
  proof,
  assignedOfficer,
  initialFeedback,
  onFeedbackSubmit,
  className = '',
}: ResolutionProofCheckProps) {
  const t = useTranslations('grievance');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; isAfter: boolean } | null>(null);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 select-none shadow-2xs ${className}`}>
      {/* 1. Header with Wrench Icon & Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 mt-0.5">
            <Wrench className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">{t('resolutionReadyTitle')}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t('resolutionReadyDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{proof.completedAt}</span>
          </span>
        </div>
      </div>

      {/* 2. Before & After Photo Comparison Block */}
      <div className="space-y-3">
        <ResolutionImageSlider
          proof={proof}
          onPreviewImage={setPreviewImage}
        />

        {/* 3. Officer Note & Assigned Field Officer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Officer's note */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                alt="Field Officer"
                width={40}
                height={40}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                {t('officersNote')}
              </span>
              <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
                {proof.workSummary || 'Pothole filled and road surface levelled.'}
              </p>
            </div>
          </div>

          {/* Assigned field officer & Call CTA */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                <Image
                  src={assignedOfficer?.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"}
                  alt="Field Supervisor"
                  width={40}
                  height={40}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                  {t('assignedFieldOfficer')}
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {assignedOfficer?.name || 'Sandeep More'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  {assignedOfficer?.designation || 'Field Supervisor, PWD'}
                </span>
              </div>
            </div>

            <a
              href={`tel:${assignedOfficer?.phone || '07212550100'}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
              title="Contact Officer directly via Phone"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('contactOfficer')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Citizen Confirmation Action Banner */}
      <ResolutionFeedbackForm
        initialFeedback={initialFeedback}
        onFeedbackSubmit={onFeedbackSubmit}
      />

      {/* 5. Full-Screen HD Lightbox Modal (Triggered on Tap/Click) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-900/90 border-b border-white/10 text-white">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  previewImage.isAfter ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {previewImage.isAfter ? t('afterResolution') : t('beforeResolution')}
              </span>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                aria-label="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-black flex items-center justify-center">
              <Image
                src={previewImage.url}
                alt={previewImage.title}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
