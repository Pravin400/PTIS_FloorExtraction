/* eslint-disable i18next/no-literal-string */
'use client';

import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { useLocale } from 'next-intl';

interface PtisIndividualErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PtisIndividualError({ error, reset }: PtisIndividualErrorProps) {
  const locale = useLocale();

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center p-4 font-sans bg-slate-50">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Animated Error Badge */}
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-rose-600 shadow-xs">
          <AlertCircle className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Unable to Load Property Assessment
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-md">
          We encountered an issue while retrieving property assessment details. Please verify the Ward and Property numbers or try refreshing.
        </p>

        {/* Technical Details Preview (in development) */}
        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="w-full mb-6 p-3 bg-slate-100 border border-slate-200 rounded-lg text-left text-xs font-mono text-slate-700 break-words max-h-32 overflow-y-auto">
            <span className="font-bold text-rose-700">Error: </span>
            {error.message}
            {error.digest && (
              <div className="text-[10px] text-slate-500 mt-1">Digest: {error.digest}</div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/property-tax/ptis`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-slate-600" />
            <span>Go to Search</span>
          </Link>

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
