"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface SocialSelectPromptProps {
    t: (key: string) => string;
}

export const SocialSelectPrompt: React.FC<SocialSelectPromptProps> = ({ t }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] lg:h-full bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
            <AlertCircle size={36} className="text-gray-400 mb-3" />
            <p className="text-sm font-bold text-gray-500">
                {t("discount.selectDiscountPrompt") || "Select a social attribute from the sidebar to edit details"}
            </p>
        </div>
    );
};

interface SocialDisabledPromptProps {
    displayName: string;
    t: (key: string) => string;
}

export const SocialDisabledPrompt: React.FC<SocialDisabledPromptProps> = ({
    displayName,
    t,
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] lg:h-full bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <AlertCircle size={36} className="text-blue-500 mb-3" />
            <h4 className="text-base font-bold text-gray-800 mb-2">{displayName}</h4>
            <p className="text-sm font-semibold text-gray-500 max-w-sm">
                {t("discount.enableDiscountPrompt") || "This attribute is currently disabled. Toggle it active in the sidebar list to edit details and attach photos."}
            </p>
        </div>
    );
};

interface DisabledBannerProps {
    t: (key: string) => string;
}

export const DisabledBanner: React.FC<DisabledBannerProps> = ({ t }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-800">
                {t("discount.disabledWithDataNote") || "This attribute is currently disabled. Toggle it active to edit details."}
            </span>
        </div>
    );
};

interface SocialFooterProps {
    t: (key: string) => string;
}

export const SocialFooter: React.FC<SocialFooterProps> = ({ t }) => {
    return (
        <div className="pt-4 border-t border-blue-50 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("discount.verifyDetailsNote") || "Verify details & photo attachment before saving changes."}
            </span>
        </div>
    );
};
