/* eslint-disable i18next/no-literal-string */
'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Info, CheckCircle2, Clock } from 'lucide-react';
import { useApartmentStatusMetrics } from '@/hooks/property-tax/apartment';
import { PtisStatusBadgeItem, DEFAULT_STATUS_BADGES } from '@/lib/utils/ptis/ptisStatusMetrics.utils';
import {
  ApartmentQCTopSectionBelowFlexResponseDto,
  ApartmentQCTopSectionBelowFlexItemsDto,
} from '@/types/property-tax/apartment';

export type { PtisStatusBadgeItem };
export { DEFAULT_STATUS_BADGES };

export interface PtisStatusMetricsHeaderProps {
  /** Resolved propertyId — API only fires when this is a valid positive number */
  propertyId?: number | string | null;
  badges?: PtisStatusBadgeItem[];
  initialData?: ApartmentQCTopSectionBelowFlexResponseDto | ApartmentQCTopSectionBelowFlexItemsDto | Record<string, unknown> | null;
  isLoading?: boolean;
}

export const PtisStatusMetricsHeader: React.FC<PtisStatusMetricsHeaderProps> = ({
  propertyId,
  badges: initialBadges,
  initialData,
  isLoading = false,
}) => {
  const { badges, scrollContainerRef, handleScroll, isLoading: hookLoading } = useApartmentStatusMetrics({
    propertyId,
    badges: initialBadges,
    initialData,
  });

  const [selectedBadge, setSelectedBadge] = useState<PtisStatusBadgeItem | null>(null);

  // Only show skeleton while actively loading and badges have not arrived yet
  const showSkeleton = (isLoading || hookLoading) && badges.length === 0;


  return (
    <>
      <div className="w-full bg-white rounded-xl border border-zinc-200 shadow-xs py-1 px-1.5 flex items-center gap-1.5 min-h-[36px] font-sans select-none overflow-hidden">
        {/* Highlighted Left Scroll Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-xs active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={badges.length === 0}
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Scrollable Badges Area with Zero Scrollbar */}
        <div
          ref={scrollContainerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden flex items-center gap-1 min-w-0"
        >
          {showSkeleton ? (
            <div className="flex items-center gap-3 animate-pulse py-0.5 px-2 w-full overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center gap-1.5 shrink-0">
                  <div className="w-5.5 h-5.5 rounded-full bg-slate-200" />
                  <div className="flex flex-col gap-1">
                    <div className="h-2 w-14 bg-slate-200 rounded" />
                    <div className="h-2.5 w-10 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : badges.length > 0 ? (
            badges.map((item, idx) => {
              const tooltipText = [
                `${item.label}${item.code ? ` (${item.code})` : ''}: ${item.value}`,
                item.certificateNo ? `Cert No: ${item.certificateNo}` : null,
                item.issueDateFormatted ? `Issue Date: ${item.issueDateFormatted}` : null,
                item.createdByName ? `Created By: ${item.createdByName}` : null,
                item.createdDateFormatted ? `Created: ${item.createdDateFormatted}` : null,
                item.updatedByName ? `Updated By: ${item.updatedByName}` : null,
                item.description ? `Description: ${item.description}` : null,
              ]
                .filter(Boolean)
                .join(' | ');

              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && <div className="h-5 w-px bg-zinc-200 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(item)}
                    title={tooltipText}
                    className="group relative flex items-center gap-1.5 px-2 py-0.5 text-left min-w-max rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {/* Circular icon badge container */}
                    <div
                      className={`w-6 h-6 rounded-full ${item.iconBgClass} ${item.iconColorClass} shrink-0 flex items-center justify-center transition-transform group-hover:scale-105`}
                    >
                      {item.icon}
                    </div>

                    <div className="flex flex-col leading-none whitespace-nowrap">
                      {/* Title in bold dark blue */}
                      <span className="text-[10px] font-bold text-[#1e3a8a] flex items-center gap-1">
                        {item.label}
                        {item.code && (
                          <span className="text-[8.5px] font-semibold text-slate-400">
                            [{item.code}]
                          </span>
                        )}
                      </span>

                      {/* Value and rich secondary tags */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10.5px] font-black ${item.valueColorClass}`}>
                          {item.value}
                        </span>

                        {item.secondaryValue && (
                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.secondaryValue}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </React.Fragment>
              );
            })
          ) : null}
        </div>

        {/* Highlighted Right Scroll Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-xs active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={badges.length === 0}
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Detail Dialog / Modal when badge is clicked to display ALL API fields */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${selectedBadge.iconBgClass} ${selectedBadge.iconColorClass} flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {selectedBadge.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedBadge.label}
                    {selectedBadge.code && (
                      <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {selectedBadge.code}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {selectedBadge.type === 'stage' ? 'Workflow Stage Details' : 'Certificate Record Details'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with Full API Data */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-sans text-xs">
              {/* Status Banner */}
              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  selectedBadge.isCompletedOrIssued
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {selectedBadge.isCompletedOrIssued ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                  <span>Status:</span>
                  <span className={selectedBadge.valueColorClass}>{selectedBadge.value}</span>
                </div>
              </div>

              {/* Description */}
              {selectedBadge.description && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1 text-[11px]">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Description</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[12px]">{selectedBadge.description}</p>
                </div>
              )}

              {/* Certificate Specific Details */}
              {selectedBadge.type === 'certificate' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Certificate No</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedBadge.certificateNo || 'Not Available'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Issue Date</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedBadge.issueDateFormatted || 'Not Available'}
                    </span>
                  </div>
                </div>
              )}

              {/* Audit Information (Created / Updated) */}
              <div className="border-t border-zinc-200 pt-3 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  Audit History
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Created By:</span>
                    <span className="font-medium text-slate-800">
                      {selectedBadge.createdByName || (selectedBadge.createdBy ? `User #${selectedBadge.createdBy}` : '-')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Created Date:</span>
                    <span className="font-medium text-slate-800">
                      {selectedBadge.createdDateFormatted || '-'}
                    </span>
                  </div>
                  {selectedBadge.updatedByName && (
                    <>
                      <div>
                        <span className="text-slate-500 block">Updated By:</span>
                        <span className="font-medium text-slate-800">{selectedBadge.updatedByName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Updated Date:</span>
                        <span className="font-medium text-slate-800">
                          {selectedBadge.updatedDateFormatted || '-'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white border border-zinc-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
