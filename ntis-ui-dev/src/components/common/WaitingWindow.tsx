"use client";

import { Loader2 } from "lucide-react";

export interface WaitingWindowProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export function WaitingWindow({ isOpen, title = "Please Wait", message = "Processing your request. This may take a few moments..." }: WaitingWindowProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-blue-50 text-blue-600 p-4 rounded-full ring-4 ring-blue-50/50">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-slate-800">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-[250px] mx-auto">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
