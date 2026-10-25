"use client";

import React, { useMemo } from "react";
import { ShieldCheck, AlertCircle, EyeOff } from "lucide-react";
import { ToggleSwitch, Badge } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { toast } from "sonner";
import { FlatSocialAttributeState, getLocalizedName } from "@/lib/utils/social-details";
import { checkCompleteness, hasAnyError } from "@/lib/utils/social-guidelines";
import { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { calculateDiscountDeleteAccess } from "@/lib/utils/discount-delete-access";

interface SocialSidebarItemProps {
    attr: FlatSocialAttributeState;
    socialData: Record<number, FlatSocialAttributeState>;
    isSelected: boolean;
    validationErrors?: Record<number, string>;
    level?: 'Apartment' | 'Wing' | 'Unit' | string | null;
    isSociety?: boolean;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    savedSocialState?: Record<number, FlatSocialAttributeState>;
    wingDetailId?: number | null;
    editingUnitId?: number | null;
    onSelect: () => void;
    onToggleEnabled: (checked: boolean) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const SocialSidebarItem: React.FC<SocialSidebarItemProps> = ({
    attr, socialData, isSelected, validationErrors, level, isSociety = true,
    savedPropertyDetails, savedSocialState, wingDetailId, editingUnitId,
    onSelect, onToggleEnabled, t,
}) => {
    const errorMsg = useMemo(() => hasAnyError(attr, socialData, validationErrors), [attr, socialData, validationErrors]);
    const isEnabled = attr.bitValue === true;
    const hasError = isEnabled && !!errorMsg;
    const displayName = getLocalizedName(attr.socialAttributeCode, attr.socialAttributeName, t);

    const isApplied = useMemo(() => {
        if (savedSocialState) {
            const savedItem = savedSocialState[attr.socialAttributeId];
            if (!savedItem) return false;
            const isSavedActive = savedItem.bitValue === true;
            if (!isSavedActive) return false;
            const hasDbRecord = (typeof savedItem.id === "number" && savedItem.id > 0) ||
                                (typeof savedItem.documentBindingId === "number" && savedItem.documentBindingId > 0);
            return hasDbRecord || Boolean(savedItem.isInherited);
        }
        if (!isEnabled) return false;
        return (typeof attr.id === "number" && attr.id > 0) ||
               (typeof attr.documentBindingId === "number" && attr.documentBindingId > 0) ||
               Boolean(attr.isInherited);
    }, [savedSocialState, attr, isEnabled]);

    const deleteAccess = useMemo(() => {
        if (!isApplied) return null;
        const savedItem = savedSocialState ? savedSocialState[attr.socialAttributeId] : attr;
        const itemLevel = (level === 'Apartment' || level === 'Wing' || level === 'Unit') ? level : undefined;
        return calculateDiscountDeleteAccess({
            attributeId: attr.socialAttributeId,
            level: itemLevel,
            isSociety,
            isInherited: savedItem?.isInherited ?? attr.isInherited,
            inheritedFrom: savedItem?.inheritedFrom ?? attr.inheritedFrom,
            isOverridden: savedItem?.isOverridden ?? attr.isOverridden,
            savedPropertyDetails,
            directRecordId: savedItem?.id ?? attr.id,
            editingUnitId,
            wingDetailId,
            isItemFilled: true,
            itemType: 'social',
            t,
        });
    }, [isApplied, savedSocialState, attr, level, isSociety, savedPropertyDetails, editingUnitId, wingDetailId, t]);

    const toggleTooltip = useMemo(() => {
        if (!isApplied) return undefined;
        if (isSociety) {
            if (deleteAccess && !deleteAccess.canDelete && deleteAccess.deleteTooltip) {
                return deleteAccess.deleteTooltip;
            }
            return typeof t.has === "function" && t.has("discount.cannotToggleOffAppliedSocial")
                ? t("discount.cannotToggleOffAppliedSocial")
                : "Applied social detail cannot be turned off directly. Please use 'Delete Social & Data' to delete.";
        }
        const indKey = "discount.cannotToggleOffAppliedSocialIndividual";
        return typeof t.has === "function" && t.has(indKey)
            ? t(indKey)
            : (typeof t.has === "function" && t.has("discount.cannotToggleOffAppliedSocial")
                ? t("discount.cannotToggleOffAppliedSocial")
                : "Applied social detail cannot be turned off directly. Please use 'Delete Social & Data' to delete.");
    }, [isApplied, isSociety, deleteAccess, t]);

    const statusBadge = useMemo(() => {
        if (!isEnabled) {
            return (
                <Badge variant="secondary" size="sm" icon={EyeOff}>
                    {t("discount.statusDisabled") || "Disabled"}
                </Badge>
            );
        }
        if (errorMsg) {
            return (
                <Badge variant="destructive" size="sm" icon={AlertCircle} className="bg-red-50 text-red-700 border-red-200 animate-pulse font-bold">
                    {errorMsg}
                </Badge>
            );
        }
        if (checkCompleteness(attr, socialData)) {
            return (
                <Badge variant="success" size="sm" icon={ShieldCheck} className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {t("discount.statusActiveUploaded") || "Active & Uploaded"}
                </Badge>
            );
        }
        return (
            <Badge variant="warning" size="sm" icon={AlertCircle} className="bg-amber-50 text-amber-700 border-amber-200">
                {t("discount.statusIncomplete") || "Incomplete"}
            </Badge>
        );
    }, [isEnabled, errorMsg, attr, socialData, t]);

    const cardClass = isSelected
        ? hasError ? "bg-red-50/60 border-red-600 shadow-sm ring-1 ring-red-600/30" : "bg-blue-50/60 border-blue-600 shadow-sm ring-1 ring-blue-600/30"
        : hasError ? "bg-red-50/10 border-red-200 hover:border-red-300" : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/10";

    const toggleButton = (
        <div
            onClick={(e) => {
                e.stopPropagation();
                if (isApplied && toggleTooltip) {
                    toast.info(toggleTooltip);
                }
            }}
            className={isApplied ? "cursor-not-allowed" : "cursor-pointer"}
            title={toggleTooltip}
        >
            <ToggleSwitch checked={isEnabled} onChange={onToggleEnabled} showPopup={false} disabled={isApplied} />
        </div>
    );

    return (
        <div
            data-certificate-id={attr.socialAttributeId}
            onClick={onSelect}
            className={`group p-3 border rounded-xl cursor-pointer transition-all duration-200 flex flex-col gap-2 relative ${cardClass}`}
        >
            {isSelected && <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${hasError ? "bg-red-600" : "bg-blue-600"}`} />}

            <div className="flex justify-between items-start gap-2 pl-1.5">
                <span className={`text-sm font-bold transition-colors line-clamp-2 flex-1 cursor-pointer select-none ${
                    isSelected ? (hasError ? "text-red-900" : "text-blue-900") : (hasError ? "text-red-800 hover:text-red-900" : "text-gray-700 group-hover:text-blue-800")
                }`}>
                    {displayName}
                </span>
                {toggleTooltip ? (
                    <Tooltip content={toggleTooltip} placement="left">
                        {toggleButton}
                    </Tooltip>
                ) : (
                    toggleButton
                )}
            </div>

            <div className="flex justify-between items-center gap-1.5 pl-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {statusBadge}
                    {level && level !== 'Apartment' && attr.isOverridden && (
                        <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                            {t("discount.overridden") || "Overridden"}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};
