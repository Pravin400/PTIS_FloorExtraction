"use client";

import React, { useMemo, useCallback } from "react";
import { Filter } from "lucide-react";
import { ToggleSwitch, SearchInput } from "@/components/common";
import { FlatSocialAttributeState } from "@/lib/utils/social-details";
import { getLocalizedName } from "@/lib/utils/social-details";
import { PropertySocialDetailsDto, SocialAttributeHierarchyDto } from "@/types/property-social-details.types";
import { SocialSidebarItem } from "./SocialSidebarItem";

interface SocialSidebarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    showActiveFirst: boolean;
    onShowActiveChange: (checked: boolean) => void;
    attributes: FlatSocialAttributeState[];
    socialData: Record<number, FlatSocialAttributeState>;
    selectedId: number | null;
    onSelect: (id: number) => void;
    onToggleEnabled: (id: number, checked: boolean) => void;
    validationErrors?: Record<number, string>;
    level?: 'Apartment' | 'Wing' | 'Unit' | string | null;
    isSociety?: boolean;
    savedPropertyDetails?: (PropertySocialDetailsDto | SocialAttributeHierarchyDto)[];
    savedSocialState?: Record<number, FlatSocialAttributeState>;
    wingDetailId?: number | null;
    editingUnitId?: number | null;
    t: {
        (key: string, values?: Record<string, string | number | Date>): string;
        has?: (key: string) => boolean;
    };
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({
    searchTerm, onSearchChange, showActiveFirst, onShowActiveChange,
    attributes, socialData, selectedId, onToggleEnabled, onSelect,
    validationErrors, level, isSociety = true, savedPropertyDetails, savedSocialState, wingDetailId, editingUnitId, t,
}) => {
    const isAttributeActive = useCallback((attr: FlatSocialAttributeState) => {
        return attr.bitValue === true;
    }, []);

    const displayedAttributes = useMemo(() => {
        let list = [...attributes];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter((attr) => {
                const displayName = getLocalizedName(attr.socialAttributeCode, attr.socialAttributeName, t);
                return displayName.toLowerCase().includes(term);
            });
        }
        if (showActiveFirst) {
            list.sort((a, b) => {
                const aActive = isAttributeActive(a) ? 1 : 0;
                const bActive = isAttributeActive(b) ? 1 : 0;
                if (bActive !== aActive) return bActive - aActive;
                return 0;
            });
        }
        return list;
    }, [attributes, searchTerm, showActiveFirst, t, isAttributeActive]);

    return (
        <div className="flex flex-col min-h-[300px] lg:h-full border-r border-blue-100 pr-2">
            <div className="space-y-2 mb-2.5">
                <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder={t("discount.searchPlaceholder") || "Search social attributes..."}
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
                {displayedAttributes.length === 0 ? (
                    <div className="text-center py-8 text-sm font-semibold text-gray-400">
                        {t("discount.noDiscountsFound") || "No attributes found"}
                    </div>
                ) : (
                    displayedAttributes.map((attr) => (
                        <SocialSidebarItem
                            key={attr.socialAttributeId}
                            attr={attr}
                            socialData={socialData}
                            isSelected={selectedId === attr.socialAttributeId}
                            validationErrors={validationErrors}
                            level={level}
                            isSociety={isSociety}
                            savedPropertyDetails={savedPropertyDetails}
                            savedSocialState={savedSocialState}
                            wingDetailId={wingDetailId}
                            editingUnitId={editingUnitId}
                            onSelect={() => onSelect(attr.socialAttributeId)}
                            onToggleEnabled={(checked) => onToggleEnabled(attr.socialAttributeId, checked)}
                            t={t}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
