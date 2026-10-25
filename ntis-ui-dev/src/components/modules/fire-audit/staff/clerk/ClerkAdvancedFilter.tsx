"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdvanceFilter, Button } from "@/components/common";
import {
    Search, Filter, ChevronDown, FileText, Building2, Network, Map, MapPin,
    Calendar as CalendarIcon, RotateCcw, ShieldAlert,
} from "lucide-react";
import { ClerkDateFilterPopover } from "./ClerkDateFilterPopover";
import { ClerkMobileFilterSheet, FilterCardConfig } from "./ClerkMobileFilterSheet";

export interface AdvancedFilterValues {
    search: string;
    appType: string;
    occupancyType: string;
    node: string;
    sector: string;
    wardNo: string;
    appDate: string;
    riskCategory: string;
}

interface ClerkAdvancedFilterProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: AdvancedFilterValues) => void;
    initialSearch?: string;
    initialFilters?: Partial<AdvancedFilterValues>;
}

export const DEFAULT_FILTERS: AdvancedFilterValues = {
    search: "",
    appType: "all",
    occupancyType: "all",
    node: "all",
    sector: "all",
    wardNo: "all",
    appDate: "all",
    riskCategory: "all",
};

export function ClerkAdvancedFilter({
    isOpen,
    onClose,
    onApplyFilters,
    initialSearch = "",
    initialFilters,
}: ClerkAdvancedFilterProps) {
    const t = useTranslations("fireAudit.clerk.registry.advanced");
    const tFilter = useTranslations("fireAudit.clerk.registry");

    const [filters, setFilters] = useState<AdvancedFilterValues>(() => ({
        ...DEFAULT_FILTERS,
        ...initialFilters,
        search: initialSearch,
    }));
    const [openKey, setOpenKey] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFilterChange = (key: keyof AdvancedFilterValues, val: string) => setFilters((p) => ({ ...p, [key]: val }));
    const handleReset = () => { setFilters(DEFAULT_FILTERS); onApplyFilters(DEFAULT_FILTERS); };
    const handleApply = () => { onApplyFilters(filters); onClose(); };

    const activeCount = Object.entries(filters).filter(([k, v]) => (k === "search" ? v.trim() !== "" : v !== "all")).length;

    const filterCards: FilterCardConfig[] = [
        {
            key: "appType", label: t("appType"), icon: FileText, bg: "bg-sky-50 text-sky-500",
            options: ["all", "new", "renewal", "reinspection"].map((v) => ({ value: v, label: t(`options.appType.${v}`) })),
        },
        {
            key: "occupancyType", label: t("occupancyType"), icon: Building2, bg: "bg-purple-50 text-purple-500",
            options: [
                { value: "all", label: t("options.occupancyType.all") },
                { value: "Group A", label: t("options.occupancyType.groupA") },
                { value: "Group E", label: t("options.occupancyType.groupE") },
                { value: "Group F", label: t("options.occupancyType.groupF") },
                { value: "Group G", label: t("options.occupancyType.groupG") },
            ],
        },
        {
            key: "node", label: t("node"), icon: Network, bg: "bg-emerald-50 text-emerald-500",
            options: ["all", "central", "north", "south", "east", "west"].map((v) => ({ value: v, label: t(`options.node.${v}`) })),
        },
        {
            key: "sector", label: t("sector"), icon: Map, bg: "bg-amber-50 text-amber-500",
            options: ["all", "sec_1", "sec_2"].map((v) => ({ value: v, label: t(`options.sector.${v}`) })),
        },
        {
            key: "wardNo", label: t("wardNo"), icon: MapPin, bg: "bg-rose-50 text-rose-500",
            options: ["all", "ward_1", "ward_2", "ward_3"].map((v) => ({ value: v, label: t(`options.wardNo.${v}`) })),
        },
        {
            key: "riskCategory", label: t("riskCategory"), icon: ShieldAlert, bg: "bg-orange-50 text-orange-500",
            options: ["all", "high", "medium", "low"].map((v) => ({ value: v, label: t(`options.riskCategory.${v}`) })),
        },
        { key: "appDate", label: t("appDate"), icon: CalendarIcon, bg: "bg-blue-50 text-blue-500", options: [] },
    ];

    return (
        <>
            {/* Desktop View (>= 640px) */}
            <div className="hidden sm:block w-full space-y-1.5 mb-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <span>{t("searchLabel")}</span>
                    </span>
                    <Button
                        variant="ghost"
                        size="xs"
                        icon={Filter}
                        onClick={onClose}
                        className="!h-8 !rounded-full !border !border-sky-300 !bg-sky-50 !text-[#1A86E8] hover:!bg-sky-100/70 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-none transition-all active:scale-95"
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <span>{tFilter("btnFilter")}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-[#1A86E8] rotate-180 stroke-[2.2]" />
                        </span>
                    </Button>
                </div>
                <AdvanceFilter
                    search={filters.search}
                    onSearchChange={(val) => handleFilterChange("search", val)}
                    searchPlaceholder={t("searchPlaceholder")}
                    className="!p-3 !rounded-2xl !border-slate-200/90 !space-y-2.5 shadow-2xs [&>div:first-child]:!flex-col [&>div:first-child]:!items-stretch [&>div:first-child]:!gap-2.5 [&>div:first-child>div:first-child]:!max-w-none [&>div:first-child>div:first-child]:!w-full [&_input]:!h-8.5 [&_input]:!rounded-xl [&_input]:focus:!border-[#1A86E8] [&_input]:focus:!ring-[#1A86E8]/20"
                >
                    <div className="flex flex-wrap items-center gap-2 w-full">
                        {filterCards.map((card) => {
                            if (card.key === "appDate") {
                                return (
                                    <ClerkDateFilterPopover
                                        key={card.key}
                                        value={filters.appDate}
                                        onChange={(val) => handleFilterChange("appDate", val)}
                                        isOpen={openKey === "desktopDate"}
                                        onToggle={() => setOpenKey((prev) => (prev === "desktopDate" ? null : "desktopDate"))}
                                        onClose={() => setOpenKey(null)}
                                        t={t}
                                    />
                                );
                            }

                            const Icon = card.icon;
                            return (
                                <div key={card.key} className="relative flex-1 min-w-[110px] max-w-[170px]">
                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${card.bg}`}>
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <select
                                        value={filters[card.key]}
                                        onChange={(e) => handleFilterChange(card.key, e.target.value)}
                                        aria-label={card.label}
                                        className="w-full bg-slate-50/80 hover:bg-slate-50 text-xs font-medium pl-7.5 pr-6 py-1 h-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A86E8]/20 focus:border-[#1A86E8] transition-all shadow-2xs appearance-none cursor-pointer text-slate-800 truncate"
                                    >
                                        {card.options.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            );
                        })}

                        {/* Action buttons (Reset + Show Results) on the SAME LINE */}
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                            {activeCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={RotateCcw}
                                    onClick={handleReset}
                                    className="!h-8 px-2.5 !rounded-xl !text-[#1A86E8] hover:!bg-sky-50 hover:!text-[#1570c0] font-semibold text-xs transition-all shadow-none cursor-pointer shrink-0 active:scale-95 gap-1.5"
                                    title={t("btnReset")}
                                >
                                    <span>{t("btnReset")}</span>
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                size="sm"
                                icon={Search}
                                onClick={handleApply}
                                className="!h-8 !rounded-xl !bg-[#1A86E8] hover:!bg-[#1570c0] !text-white px-3.5 text-xs font-semibold shadow-xs whitespace-nowrap !border-transparent cursor-pointer shrink-0"
                            >
                                {t("btnShowResults")}
                            </Button>
                        </div>
                    </div>
                </AdvanceFilter>
            </div>

            {/* Mobile View (< 640px) Decomposed Bottom Sheet */}
            <ClerkMobileFilterSheet
                isOpen={isOpen}
                onClose={onClose}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                onApply={handleApply}
                openKey={openKey}
                setOpenKey={setOpenKey}
                filterCards={filterCards}
                activeCount={activeCount}
                t={t}
            />
        </>
    );
}
