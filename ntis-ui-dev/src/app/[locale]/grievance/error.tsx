'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function GrievanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  useEffect(() => {
    console.error('Grievance route error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-rose-100 rounded-3xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">
        {t('errorTitle')}
      </h2>

      <p className="text-sm text-slate-500 max-w-md mb-6">
        {error.message || t('errorMessage')}
      </p>

      {error.digest && (
        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md mb-6">
          {t('digestLabel', { digest: error.digest })}
        </span>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('tryAgain')}</span>
        </button>

        <Link
          href={`/${locale}/grievance`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>{t('grievanceHome')}</span>
        </Link>
      </div>
    </div>
  );
}
