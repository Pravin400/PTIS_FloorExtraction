"use client";

import { TrendingUp } from "lucide-react";

interface RateCompletionProgressProps {
  completionPercentage: number;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function RateCompletionProgress({
  completionPercentage,
  t,
}: RateCompletionProgressProps) {
  return (
    <div className="mt-4 bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Left - Progress Label with Icon */}
          <div className="flex items-center gap-2 min-w-fit">
            <TrendingUp size={14} className="text-[#4169E1]" />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              {t('sections.matrixCompletion')}
            </span>
          </div>

          {/* Center - Progress Bar */}
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${completionPercentage}%`, backgroundColor: '#4169E1' }}
            />
          </div>

          {/* Right - Percentage Badge */}
          <div 
            className="px-3 py-1 text-white text-sm font-semibold rounded-full min-w-15 text-center" 
            style={{ backgroundColor: '#4169E1' }}
          >
            {completionPercentage}%
          </div>
        </div>
      </div>
    </div>
  );
}
