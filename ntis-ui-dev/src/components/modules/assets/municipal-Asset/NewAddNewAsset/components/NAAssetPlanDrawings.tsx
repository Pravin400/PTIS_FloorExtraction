'use client';
import type { NAAssetPlanDrawingsProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import React, { useState } from 'react';
import { Download, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';



export function NAAssetPlanDrawings({ documents }: NAAssetPlanDrawingsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log('File selected:', e.target.files[0].name);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const [_planPage, setPlanPage] = useState(0);

  return (
    <div className="border border-orange-300 rounded-xl bg-[#FFFBF7] flex flex-col shadow-sm overflow-hidden h-full">
      <div className="p-3 flex flex-col justify-between flex-1 min-h-0 gap-y-2">

        {/* ── Asset Photo Plan Section ── */}
        <div className="shrink-0 flex flex-col gap-1.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Document/Plan Icon matching Image 1 */}
              <div className="w-4 h-4 flex items-center justify-center text-blue-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="text-[12px] font-black text-[#101b87]">{'Asset Photo Plan'}</h3>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-md text-[9.5px] font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
            >{'Upload Plan'}</button>
          </div>

          {/* Plan preview container matching Image 1 */}
          <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
            <div className="w-full flex items-center justify-center bg-[#FAFBFD] p-2 relative" style={{ height: '90px' }}>
              <span className="text-[11px] font-semibold text-slate-400">{'No Floor Plan Uploaded'}</span>

              {/* Prev/Next arrows centered vertically */}
              <button
                onClick={() => setPlanPage(p => Math.max(0, p - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPlanPage(p => p + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan label + actions inline row */}
            <div className="px-2.5 py-1.5 flex items-center justify-between border-t border-slate-100 bg-[#FAFBFD] shrink-0">
              <div>
                <div className="text-[10px] font-bold text-slate-800 leading-tight">{'Master Plan - Ground Floor'}</div>
                <div className="text-[8px] text-slate-400 leading-none mt-0.5">{'PDF - 2.4 MB'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
                <button className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-orange-200/60 shrink-0" />

        {/* ── Asset Documents Section (grow) ── */}
        <div className="flex-1 min-h-0 flex flex-col justify-start gap-y-1.5">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 flex items-center justify-center text-blue-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-[12px] font-black text-[#101b87]">{'Asset Documents'}</h3>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-md text-[9.5px] font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
            >{'Upload Documents'}</button>
          </div>

          {/* Documents list - scrollable internally, no overflow overlap */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1 flex flex-col justify-start custom-scrollbar pr-0.5">
            {documents?.map((doc) => (
              <div 
                key={doc.id || doc.fileName || doc.documentGuid} 
                className="flex items-center justify-between bg-white rounded-md border border-slate-100 px-2 py-1 hover:border-slate-200 transition-colors h-[36px] min-h-[36px] shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Subtle, compact blue document icon matching Image 1 */}
                  <div className="w-5 h-5 flex items-center justify-center text-blue-600 shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-800 leading-tight truncate">{doc.name || doc.fileName || "Document"}</div>
                    <div className="text-[8px] text-slate-400 leading-none mt-0.5">{doc.size || ""}</div>
                  </div>
                </div>
                {/* Aligned action icons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                  <button className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
                  <button className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* View all (anchored closely below the list, shrink-0) */}
          <button className="mt-1 shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-[#2435c2] transition-colors cursor-pointer self-start">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            {'View All Documents (6)'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
          />
        </div>

      </div>
    </div>
  );
}
