'use client';

import React from 'react';
import type { WaybackRelease } from '@/lib/api/wayback.service';

interface TimelineTrackProps {
  releases: WaybackRelease[];
  activeIdx: number;
  onSelectYear: (index: number) => void;
}

export function TimelineTrack({
  releases,
  activeIdx,
  onSelectYear,
}: TimelineTrackProps): React.ReactElement | null {
  if (releases.length === 0) {
    return (
      <div className="tl-bar relative bg-slate-950 border-b border-slate-900 px-6 py-2 flex items-center justify-center min-h-[56px]">
        <div className="h-4 w-48 bg-slate-800 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="tl-bar relative bg-slate-950 border-b border-slate-900 px-6 py-2 flex items-center justify-between overflow-x-auto overflow-y-hidden min-h-[56px] gap-2 scrollbar-none">
      {/* Connecting line track */}
      <div className="absolute left-10 right-10 top-[29px] h-[2px] bg-slate-800 pointer-events-none" />

      {releases.map((rel, i) => {
        const isPlayed = i <= activeIdx;
        const isActive = i === activeIdx;

        return (
          <div key={rel.releaseId} className="relative z-10 flex flex-col items-center gap-1.5">
            <span
              onClick={() => onSelectYear(i)}
              className={`text-sm font-extrabold font-sans tracking-wider transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-blue-400 font-black scale-105'
                  : isPlayed
                  ? 'text-blue-400 font-bold hover:text-blue-300'
                  : 'text-white hover:text-blue-300'
              }`}
            >
              {rel.year}
            </span>
            <button
              type="button"
              onClick={() => onSelectYear(i)}
              className="relative flex items-center justify-center p-0 w-6 h-6 bg-transparent border-none outline-none focus:outline-none cursor-pointer hover:scale-110 transition-transform"
              title={`${rel.year} (${rel.date}) - ${isActive ? 'Current Active Year' : isPlayed ? 'Played Year' : 'Upcoming Year'}`}
              aria-label={`Jump to satellite imagery from ${rel.year}`}
            >
              {isActive ? (
                <>
                  <span className="absolute w-5 h-5 rounded-full bg-blue-400/40 animate-ping" />
                  <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-md z-10" />
                </>
              ) : (
                <span
                  className={`w-3 h-3 rounded-full border transition-all duration-300 shadow-sm ${
                    isPlayed
                      ? 'bg-blue-600 border-blue-500 hover:bg-blue-500'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-600 hover:border-slate-500'
                  }`}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
