'use client';

import { CheckCircle2, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface UploadFooterCountsProps {
    totalMatched?: number | string;
    totalUnmatched?: number | string;
    t?: (key: string) => string;
    className?: string;
}

export function UploadFooterCounts({
    totalMatched = 0,
    totalUnmatched = 0,
    t,
    className,
}: UploadFooterCountsProps) {
    const matchedLabel = t ? t("uploadDownloadDrawer.matched") : "Matched";
    const unmatchedLabel = t ? t("uploadDownloadDrawer.unmatched") : "Unmatched";

    return (
        <div className={cn("flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap", className)}>
            {/* Matched Count */}
            <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 sm:px-3 text-emerald-800 shadow-2xs transition-all hover:bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-700">
                    {matchedLabel}:
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-950">
                    {totalMatched}
                </span>
            </div>

            {/* Unmatched Count */}
            <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50/90 px-2.5 sm:px-3 text-rose-800 shadow-2xs transition-all hover:bg-rose-50">
                <CircleX className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-rose-700">
                    {unmatchedLabel}:
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-950">
                    {totalUnmatched}
                </span>
            </div>
        </div>
    );
}
