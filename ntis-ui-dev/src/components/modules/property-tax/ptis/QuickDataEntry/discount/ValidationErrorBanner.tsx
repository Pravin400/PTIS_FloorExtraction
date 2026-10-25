"use client";

import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { getLocalizedName } from "@/lib/utils/social-details";

interface IncompleteDiscount {
    id: number;
    name: string;
    code?: string;
}

interface ValidationErrorBannerProps {
    incompleteDiscounts: IncompleteDiscount[];
    onTagClick: (id: number) => void;
    t: {
        (key: string, values?: Record<string, string | number>): string;
        has?: (key: string) => boolean;
    };
}

/**
 * Renders a banner above the form listing clickable tags for
 * each discount attribute that has missing required fields.
 * Clicking a tag scrolls to and selects that discount in the sidebar.
 */
export const ValidationErrorBanner: React.FC<ValidationErrorBannerProps> = ({
    incompleteDiscounts,
    onTagClick,
    t,
}) => {
    if (incompleteDiscounts.length === 0) return null;

    return (
        <div
            className="mb-3 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5 animate-in fade-in slide-in-from-top-2 duration-300"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-2">
                <AlertTriangle
                    size={16}
                    className="text-red-600 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-800 mb-1">
                        {t("discount.incompleteCertificates") ||
                            "The following attributes have incomplete required fields"}
                    </p>
                    <p className="text-xs text-red-700/90 font-semibold mb-2 flex items-center gap-1">
                        {t("discount.bannerNavigationHint") ||
                            "Click a tag to navigate directly to its fields."}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {incompleteDiscounts.map((discount) => {
                            const displayName = getLocalizedName(
                                discount.code,
                                discount.name,
                                t as unknown as Parameters<typeof getLocalizedName>[2]
                            );
                            return (
                                <button
                                    key={discount.id}
                                    type="button"
                                    onClick={() => onTagClick(discount.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold
                                        bg-red-100 text-red-800 border border-red-300
                                        hover:bg-red-200 hover:border-red-400 hover:text-red-900
                                        active:bg-red-300
                                        cursor-pointer transition-all duration-150
                                        focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                    aria-label={t("discount.bannerTagAriaLabel", { name: displayName })}
                                    title={t("discount.bannerTagTooltip", { name: displayName })}
                                >
                                    {displayName}
                                    <ChevronRight size={10} className="opacity-60 ml-0.5" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
