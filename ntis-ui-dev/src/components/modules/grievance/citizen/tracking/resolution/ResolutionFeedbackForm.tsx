'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import type { CitizenFeedback } from '@/types/grievance';

interface ResolutionFeedbackFormProps {
  initialFeedback?: CitizenFeedback;
  onFeedbackSubmit?: (feedback: CitizenFeedback) => void;
}

export function ResolutionFeedbackForm({
  initialFeedback,
  onFeedbackSubmit,
}: ResolutionFeedbackFormProps) {
  const t = useTranslations('grievance');
  const [feedbackState, setFeedbackState] = useState<'unsubmitted' | 'satisfied' | 'reopen_prompt' | 'reopened'>(
    initialFeedback?.state || 'unsubmitted'
  );
  const [reopenReason, setReopenReason] = useState('');

  const handleSatisfied = () => {
    setFeedbackState('satisfied');
    onFeedbackSubmit?.({ state: 'satisfied', submittedAt: new Date().toISOString() });
  };

  const handleConfirmReopen = () => {
    if (!reopenReason.trim()) return;
    setFeedbackState('reopened');
    onFeedbackSubmit?.({ state: 'reopened', comment: reopenReason, submittedAt: new Date().toISOString() });
  };

  return (
    <div className="pt-3 border-t border-slate-100">
      {feedbackState === 'unsubmitted' && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h5 className="text-sm font-black text-slate-900 leading-snug">{t('hasIssueBeenResolved')}</h5>
              <p className="text-xs text-slate-500 font-medium">{t('reviewWorkConfirmation')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <Button
              variant="primary"
              size="md"
              onClick={handleSatisfied}
              className="flex-1 md:flex-initial !bg-emerald-600 hover:!bg-emerald-700 !text-white font-black text-xs rounded-xl shadow-xs px-4 py-2.5 cursor-pointer"
            >
              <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>{t('yesResolveTicket')}</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setFeedbackState('reopen_prompt')}
              className="flex-1 md:flex-initial border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl px-4 py-2.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>{t('reopenIssue')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Reopen prompt with reason textarea */}
      {feedbackState === 'reopen_prompt' && (
        <div className="space-y-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-200">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{t('tellWhyNotResolved')}</span>
          </div>
          <textarea
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder={t('reopenReasonPlaceholder')}
            rows={2}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-rose-500 bg-white"
          />
          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={handleConfirmReopen} disabled={!reopenReason.trim()} className="font-bold text-xs rounded-xl">
              {t('confirmAndReopen')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setFeedbackState('unsubmitted')} className="font-bold text-xs rounded-xl">
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmed Satisfied State */}
      {feedbackState === 'satisfied' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-extrabold">{t('thankYouTicketResolved')}</div>
            <div className="text-[11px] text-emerald-700 font-medium">{t('amcClosedTicket')}</div>
          </div>
        </div>
      )}

      {/* Confirmed Reopened State */}
      {feedbackState === 'reopened' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-extrabold">{t('ticketReopenedEscalated')}</div>
            <div className="text-[11px] text-amber-700 font-medium">{t('fieldSupervisorReinspect')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
