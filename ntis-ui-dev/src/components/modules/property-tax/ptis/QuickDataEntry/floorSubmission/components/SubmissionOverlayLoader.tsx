'use client';

import React from 'react';

interface SubmissionOverlayLoaderProps {
  isLoading: boolean;
  t: (key: string) => string;
}

export const SubmissionOverlayLoader: React.FC<SubmissionOverlayLoaderProps> = ({ isLoading, t }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/15 backdrop-blur-[3px] transition-all duration-300">
      <div className="bg-white/95 border border-slate-100 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3.5 max-w-[280px] text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {t('floor.saving')}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {t('floor.pleaseWait')}
          </p>
        </div>
      </div>
    </div>
  );
};
