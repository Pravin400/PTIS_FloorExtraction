'use client';

import { FileText, Loader2 } from 'lucide-react';
import type { ReportWorkspaceCopy } from '@/types/report.types';

interface ReportGeneratingOverlayProps {
  copy: ReportWorkspaceCopy;
  onCancel: () => void;
}

export function ReportGeneratingOverlay({ copy, onCancel }: ReportGeneratingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090d16]/75 backdrop-blur-md p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100">
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 animate-pulse" />
          <div className="absolute inset-2 rounded-full border-4 border-t-[#004c8c] border-r-[#004c8c] border-b-transparent border-l-transparent animate-spin duration-1000" />
          <div className="absolute inset-4 rounded-full bg-blue-50 flex items-center justify-center shadow-inner">
            <FileText className="w-7 h-7 text-[#004c8c] animate-bounce" />
          </div>
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800 tracking-wide">{copy.generating.title}</h3>
          <div className="text-xs text-slate-500 mt-2 space-y-1.5 font-medium">
            <p className="text-[#004c8c] font-semibold flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {copy.toast.generatingPreview}
            </p>
            <p className="text-slate-400">{copy.generating.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-3 py-3 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150 shadow-sm"
        >
          {copy.generating.cancel}
        </button>
      </div>
    </div>
  );
}
