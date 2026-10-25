/**
 * On-The-Go Success Feedback Modal (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/admin/on-the-go/OnTheGoSuccessModal.tsx
 *
 * Post-submission dialog displaying assigned officer and tracking token.
 * Line ceiling: <= 300 lines.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Copy, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common';
import type { OnTheGoSubmissionResult } from '@/types/grievance/on-the-go.types';

interface OnTheGoSuccessModalProps {
  result: OnTheGoSubmissionResult | null;
  onReset: () => void;
  onTrackGrievance?: () => void;
}

export function OnTheGoSuccessModal({ result, onReset, onTrackGrievance }: OnTheGoSuccessModalProps) {
  const t = useTranslations('grievance');
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = () => {
    if (result.grievanceNo) {
      navigator.clipboard.writeText(result.grievanceNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-6 relative animate-in zoom-in-95 duration-150">
        {/* 1. Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* 2. Title & Subtitle */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('grievanceAssignedSuccess')}
          </h3>
          <p className="text-sm text-slate-500">
            {t('assignedNotificationSent')}
          </p>
        </div>

        {/* 3. Ticket Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('trackingNumber')}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('copied') : t('copy')}</span>
            </button>
          </div>
          <div className="text-lg font-black text-slate-900 tracking-wide font-mono">
            {result.grievanceNo}
          </div>
        </div>

        {/* 4. Action Buttons using Common Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onReset}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('submitAnother')}</span>
          </Button>

          <Button
            variant="primary"
            onClick={onTrackGrievance}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/15 transition-all cursor-pointer"
          >
            <span>{t('trackGrievanceLive')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
