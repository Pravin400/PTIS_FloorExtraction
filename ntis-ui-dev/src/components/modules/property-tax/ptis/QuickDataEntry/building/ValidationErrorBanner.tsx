"use client";

import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { mapTypeNameToKey } from "@/lib/utils/building-helpers";

interface IncompleteCertificate {
    id: number;
    name: string;
}

interface ValidationErrorBannerProps {
    incompleteCertificates: IncompleteCertificate[];
    onTagClick: (certificateTypeId: number) => void;
    t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Renders a banner above the form listing clickable tags for
 * each certificate that has missing required fields.
 * Clicking a tag scrolls to and selects that certificate in the sidebar.
 */
export const ValidationErrorBanner: React.FC<ValidationErrorBannerProps> = ({
    incompleteCertificates,
    onTagClick,
    t,
}) => {
    if (incompleteCertificates.length === 0) return null;

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
                        {t("building.incompleteCertificates") ||
                            "The following documents have incomplete required fields"}
                    </p>
                    <p className="text-xs text-red-700/90 font-semibold mb-2 flex items-center gap-1">
                        {t("building.bannerNavigationHint") ||
                            "Click a document tag to navigate directly to its fields."}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {incompleteCertificates.map((cert) => {
                            const key = mapTypeNameToKey(cert.name || "");
                            const displayName = key && t(`building.${key}`) && t(`building.${key}`) !== `building.${key}`
                                ? t(`building.${key}`)
                                : cert.name;
                            return (
                                <button
                                    key={cert.id}
                                    type="button"
                                    onClick={() => onTagClick(cert.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold
                                        bg-red-100 text-red-800 border border-red-300
                                        hover:bg-red-200 hover:border-red-400 hover:text-red-900
                                        active:bg-red-300
                                        cursor-pointer transition-all duration-150
                                        focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                    aria-label={t("building.bannerTagAriaLabel", { name: displayName })}
                                    title={t("building.bannerTagTooltip", { name: displayName })}
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

