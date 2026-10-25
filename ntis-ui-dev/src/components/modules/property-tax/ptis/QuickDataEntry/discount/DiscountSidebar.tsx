"use client";

import React, { useMemo, useCallback } from "react";
import { Filter } from "lucide-react";
import { ToggleSwitch, SearchInput } from "@/components/common";
import { DiscountAttributeState, DiscountState } from "@/types/discount.types";
import { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { getLocalizedName } from "@/lib/utils/social-details";
import { DiscountSidebarItem } from "./DiscountSidebarItem";

interface DiscountSidebarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    showActiveFirst: boolean;
    onShowActiveChange: (checked: boolean) => void;
    discounts: DiscountAttributeState[];
    discountData?: DiscountState;
    selectedId: number | null;
    onSelect: (id: number) => void;
    onToggleEnabled: (id: number, checked: boolean) => void;
    validationErrors?: Record<number, string>;
    level?: 'Apartment' | 'Wing' | 'Unit';
    isSociety?: boolean;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    savedDiscountState?: DiscountState;
    wingDetailId?: number | null;
    editingUnitId?: number | null;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

const hasAnyDiscountError = (
    item: DiscountAttributeState,
    discountState: DiscountState,
    validationErrors?: Record<number, string>
): string | null => {
    if (validationErrors?.[item.id]) {
        return validationErrors[item.id];
    }
    const children = Object.values(discountState).filter(x => x.parentAttributeId === item.id);
    for (const child of children) {
        const childErr = hasAnyDiscountError(child, discountState, validationErrors);
        if (childErr) return childErr;
    }
    return null;
};

export const DiscountSidebar: React.FC<DiscountSidebarProps> = ({
    searchTerm, onSearchChange, showActiveFirst, onShowActiveChange,
    discounts, discountData, selectedId, onToggleEnabled, onSelect, validationErrors,
    level, isSociety = true, savedPropertyDetails, savedDiscountState, wingDetailId, editingUnitId, t,
}) => {
    const isActiveDiscount = useCallback((discount: DiscountAttributeState) => {
        const isBitType = discount.dataType?.toUpperCase() === "BIT";
        return isBitType ? discount.bitValue === true : Boolean(discount.enabled);
    }, []);

    const displayedDiscounts = useMemo(() => {
        let list = [...discounts];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter((discount) => {
                const displayName = getLocalizedName(discount.socialAttributeCode, discount.socialAttributeName, t);
                return displayName.toLowerCase().includes(term);
            });
        }
        if (showActiveFirst) {
            list.sort((a, b) => {
                const aActive = isActiveDiscount(a) ? 1 : 0;
                const bActive = isActiveDiscount(b) ? 1 : 0;
                if (bActive !== aActive) return bActive - aActive;
                return (a.displayOrder || 0) - (b.displayOrder || 0);
            });
        }
        return list;
    }, [discounts, searchTerm, showActiveFirst, t, isActiveDiscount]);

    return (
        <div className="flex flex-col min-h-[300px] lg:h-full border-r border-blue-100 pr-2">
            <div className="space-y-2 mb-2.5">
                <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder={t("discount.searchPlaceholder") || "Search discount attributes..."}
                    className="w-full mb-0 shadow-sm"
                />

                <div 
                    className="flex items-center justify-between px-1.5 py-1 bg-blue-50/40 rounded-lg border border-blue-50 cursor-pointer select-none"
                    onClick={() => onShowActiveChange(!showActiveFirst)}
                >
                    <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                        <Filter size={12} className="text-blue-600" />
                        {t("discount.showActiveFirst") || "Show Active First"}
                    </span>
                    <div onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                        <ToggleSwitch checked={showActiveFirst} onChange={onShowActiveChange} showPopup={false} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-blue-100">
                {displayedDiscounts.length === 0 ? (
                    <div className="text-center py-8 text-sm font-semibold text-gray-400">
                        {t("discount.noDiscountsFound") || "No attributes found"}
                    </div>
                ) : (
                    displayedDiscounts.map((discount) => {
                        const errorMsg = hasAnyDiscountError(discount, discountData || savedDiscountState || {}, validationErrors);
                        const isDiscountActive = isActiveDiscount(discount);
                        return (
                            <DiscountSidebarItem
                                key={discount.id}
                                discount={discount}
                                isSelected={selectedId === discount.id}
                                hasError={isDiscountActive && !!errorMsg}
                                errorMsg={errorMsg || undefined}
                                isActive={isDiscountActive}
                                level={level}
                                isSociety={isSociety}
                                savedPropertyDetails={savedPropertyDetails}
                                savedDiscountState={savedDiscountState}
                                wingDetailId={wingDetailId}
                                editingUnitId={editingUnitId}
                                onSelect={() => onSelect(discount.id)}
                                onToggleEnabled={(checked) => onToggleEnabled(discount.id, checked)}
                                t={t}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};
