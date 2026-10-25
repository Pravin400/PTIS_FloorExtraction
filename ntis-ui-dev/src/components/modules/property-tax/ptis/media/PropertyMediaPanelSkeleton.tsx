'use client';

import React from 'react';
import { ImageIcon } from 'lucide-react';

/**
 * PropertyMediaPanelSkeleton
 * High-performance, lightweight card skeleton for PropertyMediaPanel.
 * Displays animated skeleton card placeholders that mirror the layout of MediaImageCards.
 */
export function PropertyMediaPanelSkeleton(): React.ReactElement {
  return (
    <div
      aria-label="Loading media panel"
      className="h-auto lg:h-full w-full flex flex-col bg-white rounded-lg shadow-xl border border-slate-200 relative overflow-hidden p-2 gap-2"
    >
      {[1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="relative flex-1 min-h-[105px] lg:min-h-0 lg:h-0 w-full bg-slate-100/90 rounded-lg border-2 border-slate-200/90 overflow-hidden flex flex-col justify-between p-2.5 animate-pulse"
        >
          {/* Top header badge placeholder */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-slate-200/90 rounded-md" />
            <div className="h-4 w-4 bg-slate-200/70 rounded-full" />
          </div>

          {/* Center icon placeholder */}
          <div className="flex items-center justify-center my-auto">
            <div className="w-8 h-8 rounded-lg bg-slate-200/80 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-4 h-4 opacity-60" />
            </div>
          </div>

          {/* Bottom tag placeholder */}
          <div className="flex items-center justify-between pt-1">
            <div className="h-3 w-16 bg-slate-200/90 rounded" />
            <div className="h-3 w-8 bg-slate-200/70 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PropertyMediaPanelSkeleton;
