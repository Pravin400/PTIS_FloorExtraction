"use client";

import React from "react";
import { Info } from "lucide-react";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";

interface SocialDetailHeaderProps {
    data: FlatSocialAttributeState;
    displayName: string;
    isAttributeOff: boolean;
    isUnitRequiredAndNotSelected: boolean;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const SocialDetailHeader: React.FC<SocialDetailHeaderProps> = ({
    data,
    displayName,
    isAttributeOff,
    isUnitRequiredAndNotSelected,
    t,
}) => {
    return (
        <div className="space-y-2">
            {data.isInherited && (
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        data.isOverridden
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : "bg-indigo-50 border-indigo-200 text-indigo-800"
                    }`}
                >
                    <Info size={16} className={data.isOverridden ? "text-amber-600 shrink-0" : "text-indigo-600 shrink-0"} />
                    <span className="text-xs font-semibold">
                        {data.isOverridden
                            ? (t("discount.overridePendingNote") || "You have modified this inherited attribute. Saving will create an override record exclusively for this level.")
                            : ((data.inheritedFrom || "").toUpperCase() === "APARTMENT" || (data.inheritedFrom || "").toUpperCase() === "SOCIETY" || (data.entityType || "").toUpperCase() === "S")
                                ? (t("discount.inheritedFromApartmentNote") || "This social attribute is inherited from Apartment level. Modifying details or toggling it off will create an override.")
                                : (t("discount.inheritedFromWingNote") || "This social attribute is inherited from Wing level. Modifying details or toggling it off will create an override.")}
                    </span>
                </div>
            )}

            {isAttributeOff && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs font-semibold">
                    <Info size={16} className="text-amber-600 shrink-0" />
                    <span>
                        {t("discount.enableDiscountPrompt") ||
                            "This social attribute is currently disabled. Toggle it active in the sidebar list to edit details and attach documents."}
                    </span>
                </div>
            )}

            {!isAttributeOff && isUnitRequiredAndNotSelected && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs font-semibold">
                    <Info size={16} className="text-amber-600 shrink-0" />
                    <span>
                        {t("discount.selectUnitToEditPrompt") ||
                            "Please select one or more units from the table above to configure details and attach documents."}
                    </span>
                </div>
            )}

            <div className="pb-2 border-b border-blue-50">
                <span className="text-[11px] font-bold tracking-wider text-blue-500 uppercase block mb-0.5">
                    {t("discount.editingDiscount") || "Social Attribute Details"}
                </span>
                <h4 className="text-base font-bold text-blue-900 leading-tight">{displayName}</h4>
            </div>
        </div>
    );
};
