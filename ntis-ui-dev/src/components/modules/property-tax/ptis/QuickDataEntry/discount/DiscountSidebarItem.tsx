"use client";

import React, { useMemo } from "react";
import { ShieldCheck, AlertCircle, EyeOff } from "lucide-react";
import { ToggleSwitch, Badge } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { toast } from "sonner";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { getLocalizedName } from "@/lib/utils/social-details";
import { calculateDiscountDeleteAccess } from "@/lib/utils/discount-delete-access";

interface DiscountSidebarItemProps {
    discount: DiscountAttributeState;
    isSelected: boolean;
    hasError: boolean;
    errorMsg?: string;
    isActive: boolean;
    level?: 'Apartment' | 'Wing' | 'Unit';
    isSociety?: boolean;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    savedDiscountState?: DiscountState;
    wingDetailId?: number | null;
    editingUnitId?: number | null;
    onSelect: () => void;
    onToggleEnabled: (checked: boolean) => void;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const DiscountSidebarItem: React.FC<DiscountSidebarItemProps> = ({
    discount, isSelected, hasError, errorMsg, isActive, level, isSociety = true,
    savedPropertyDetails, savedDiscountState, wingDetailId, editingUnitId,
    onSelect, onToggleEnabled, t,
}) => {
    const isApplied = useMemo(() => {
        if (savedDiscountState) {
            const savedItem = savedDiscountState[discount.id];
            if (!savedItem) return false;
            const isSavedActive = savedItem.dataType.toUpperCase() === "BIT" ? savedItem.bitValue === true : savedItem.enabled === true;
            if (!isSavedActive) return false;
            const hasDbRecord = (typeof savedItem.propertySocialDetailId === "number" && savedItem.propertySocialDetailId > 0) ||
                                (typeof savedItem.documentBindingId === "number" && savedItem.documentBindingId > 0);
            return hasDbRecord || Boolean(savedItem.isInherited);
        }
        if (!isActive) return false;
        return (typeof discount.propertySocialDetailId === "number" && discount.propertySocialDetailId > 0) ||
               (typeof discount.documentBindingId === "number" && discount.documentBindingId > 0) ||
               Boolean(discount.isInherited);
    }, [savedDiscountState, discount, isActive]);

    const deleteAccess = useMemo(() => {
        if (!isApplied) return null;
        const savedItem = savedDiscountState ? savedDiscountState[discount.id] : discount;
        const itemLevel = (level === 'Apartment' || level === 'Wing' || level === 'Unit') ? level : undefined;
        return calculateDiscountDeleteAccess({
            attributeId: discount.id,
            level: itemLevel,
            isSociety,
            isInherited: savedItem?.isInherited ?? discount.isInherited,
            inheritedFrom: savedItem?.inheritedFrom ?? discount.inheritedFrom,
            isOverridden: savedItem?.isOverridden ?? discount.isOverridden,
            savedPropertyDetails,
            directRecordId: savedItem?.propertySocialDetailId ?? discount.propertySocialDetailId,
            editingUnitId,
            wingDetailId,
            isItemFilled: true,
            itemType: 'discount',
            t,
        });
    }, [isApplied, savedDiscountState, discount, level, isSociety, savedPropertyDetails, editingUnitId, wingDetailId, t]);

    const toggleTooltip = useMemo(() => {
        if (!isApplied) return undefined;
        if (isSociety) {
            if (deleteAccess && !deleteAccess.canDelete && deleteAccess.deleteTooltip) {
                return deleteAccess.deleteTooltip;
            }
            return typeof t.has === "function" && t.has("discount.cannotToggleOffApplied")
                ? t("discount.cannotToggleOffApplied")
                : "Applied discount cannot be turned off directly. Please use 'Delete Discount & Data' to delete.";
        }
        const indKey = "discount.cannotToggleOffAppliedIndividual";
        return typeof t.has === "function" && t.has(indKey)
            ? t(indKey)
            : (typeof t.has === "function" && t.has("discount.cannotToggleOffApplied")
                ? t("discount.cannotToggleOffApplied")
                : "Applied discount cannot be turned off directly. Please use 'Delete Discount & Data' to delete.");
    }, [isApplied, isSociety, deleteAccess, t]);

    const statusBadge = useMemo(() => {
        if (!isActive) {
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
        const isDocReq = discount.isDocumentRequired === true;
        const hasDoc = (discount.documentGuid?.trim() ?? "") !== "" || !!discount.documentBindingId;
        const isDocCompleted = !isDocReq || hasDoc;
        const dataTypeUpper = (discount.dataType || "").toUpperCase();

        let hasValue = true;
        if (dataTypeUpper === "INT" && (discount.intValue === null || discount.intValue === undefined || String(discount.intValue).trim() === "")) hasValue = false;
        else if (dataTypeUpper === "DECIMAL" && (discount.decimalValue === null || discount.decimalValue === undefined || String(discount.decimalValue).trim() === "")) hasValue = false;
        else if (dataTypeUpper === "VARCHAR" && (!discount.textValue || discount.textValue.trim() === "")) hasValue = false;
        else if (dataTypeUpper === "DATE" && (!discount.dateValue || discount.dateValue.trim() === "")) hasValue = false;

        if (isDocCompleted && hasValue) {
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
    }, [isActive, errorMsg, discount, t]);

    const displayName = getLocalizedName(discount.socialAttributeCode, discount.socialAttributeName, t);

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
            <ToggleSwitch checked={isActive} onChange={onToggleEnabled} showPopup={false} disabled={isApplied} />
        </div>
    );

    return (
        <div
            data-certificate-id={discount.id}
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

            <div className="flex flex-wrap items-center gap-1.5 pl-1.5">
                {statusBadge}
            </div>
        </div>
    );
};
