'use client';

import { useState } from 'react';
import {
  Search,
  Phone,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileSearch,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  addRecentTrackedToken,
} from '@/lib/services/grievance';
import {
  trackGrievanceTicketAction,
} from '@/lib/actions/grievance/citizen/track-grievance.actions';
import type { TrackingTicket } from '@/types/grievance';
import { Button } from '@/components/common';

interface TrackComplaintLookupCardProps {
  onTicketFound: (ticket: TrackingTicket) => void;
  initialNumber?: string;
}

/**
 * Civic search card for tracking grievances by number & mobile without mock data.
 */
export function TrackComplaintLookupCard({
  onTicketFound,
  initialNumber = '',
}: TrackComplaintLookupCardProps) {
  const t = useTranslations('grievance');
  const [grievanceNo, setGrievanceNo] = useState(initialNumber);
  const [mobileNo, setMobileNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNo = grievanceNo.trim();
    if (!cleanNo) {
      setErrorMsg('Please enter a valid Grievance Number');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const cleanMobile = mobileNo.trim() || undefined;
      const res = await trackGrievanceTicketAction(cleanNo, cleanMobile);

      if (res.success && res.data) {
        addRecentTrackedToken(res.data.token || res.data.id || cleanNo);
        onTicketFound(res.data);
      } else {
        setErrorMsg(
          res.message ||
            `No grievance found matching "${cleanNo}". Please verify the complaint number and mobile number registered with Amravati Municipal Corporation.`
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : t('networkConnectionError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80 shadow-2xs">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('trackStatusTitle')}</h2>
            <p className="text-xs text-slate-500 font-medium">
              {t('trackStatusDesc')}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('tokenNumberLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={grievanceNo}
                onChange={(e) => setGrievanceNo(e.target.value)}
                placeholder="e.g. GRV-2026-000006 or 1002"
                required
                className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('registeredMobileOptional')}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="10-digit registered mobile"
                maxLength={10}
                className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !grievanceNo.trim()}
            className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('connectingLiveBackend')}
              </>
            ) : (
              <>
                {t('trackStatusButton')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Civic Badge Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('amcGrievanceRedressal')}</span>
        </div>
      </div>
    </div>
  );
}
