"use client";

import React, { useMemo } from "react";
import { Filter } from "lucide-react";
import { ToggleSwitch, SearchInput, Label } from "@/components/common";
import { CertificateData } from "@/types/building-permission.types";
import { BuildingSidebarItem } from "./sidebar/BuildingSidebarItem";
import { isCertificateActive } from "./sidebar/sidebar.helpers";

interface BuildingSidebarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    showActiveFirst: boolean;
    onShowActiveChange: (checked: boolean) => void;
    certificates: CertificateData[];
    selectedTypeId: number | null;
    onSelect: (typeId: number) => void;
    onToggleEnabled: (typeId: number, checked: boolean) => void;
    validationErrors?: Record<number, string>;
    t: (key: string) => string;
}

export const BuildingSidebar: React.FC<BuildingSidebarProps> = ({
    searchTerm,
    onSearchChange,
    showActiveFirst,
    onShowActiveChange,
    certificates,
    selectedTypeId,
    onSelect,
    onToggleEnabled,
    validationErrors,
    t,
}) => {
    const displayedCertificates = useMemo(() => {
        let list = [...certificates];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter((cert) => {
                const displayName = cert.certificateTypeName || "";
                return displayName.toLowerCase().includes(term) || (cert.number?.toLowerCase().includes(term) ?? false);
            });
        }
        if (showActiveFirst) {
            list.sort((a, b) => {
                const aActive = isCertificateActive(a) ? 1 : 0;
                const bActive = isCertificateActive(b) ? 1 : 0;
                if (bActive !== aActive) {
                    return bActive - aActive;
                }
                return (a.displayOrder || 0) - (b.displayOrder || 0);
            });
        }
        return list;
    }, [certificates, searchTerm, showActiveFirst]);

    return (
        <div className="flex flex-col h-full min-h-0 border-r border-blue-100 pr-2">
            {/* Search and Filters */}
            <div className="space-y-3 mb-3 flex-shrink-0">
                <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder={t("building.searchPlaceholder") || "Search certificates..."}
                    className="w-full mb-0 shadow-sm"
                />

                <div 
                    className="flex items-center justify-between px-1.5 py-1 bg-blue-50/40 rounded-lg border border-blue-50 cursor-pointer select-none"
                    onClick={() => onShowActiveChange(!showActiveFirst)}
                >
                    <Label className="text-xs font-bold text-blue-800 flex items-center gap-1.5 cursor-pointer">
                        <Filter size={12} className="text-blue-600" />
                        {t("building.showActiveFirst") || "Show Active First"}
                    </Label>
                    <div onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                        <ToggleSwitch
                            checked={showActiveFirst}
                            onChange={onShowActiveChange}
                            showPopup={false}
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-blue-100">
                {displayedCertificates.length === 0 ? (
                    <Label className="text-center py-8 text-sm font-semibold text-gray-400 block">
                        {t("building.noCertificatesFound") || "No certificates found"}
                    </Label>
                ) : (
                    displayedCertificates.map((cert) => (
                        <BuildingSidebarItem
                            key={cert.certificateTypeId}
                            cert={cert}
                            isSelected={selectedTypeId === cert.certificateTypeId}
                            validationErrors={validationErrors}
                            onSelect={onSelect}
                            onToggleEnabled={onToggleEnabled}
                            t={t}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
