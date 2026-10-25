"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchInput, Button, Badge } from "@/components/common";
import { ChevronDown, Filter, X } from "lucide-react";
import { ClerkAdvancedFilter, AdvancedFilterValues } from "./ClerkAdvancedFilter";

interface ClerkRegistryFiltersProps {
    activeTab: "all" | "today";
    totalAllCount: number;
    totalTodayCount: number;
    searchQuery: string;
    selectedOccupancy?: string;
    activeStatusFilter?: string;
    onClearStatusFilter?: () => void;
    activeFilters?: Partial<AdvancedFilterValues>;
    onTabChange: (tab: "all" | "today") => void;
    onSearchChange: (query: string) => void;
    onOccupancyChange?: (occupancy: string) => void;
    onAdvancedFilterChange?: (filters: AdvancedFilterValues) => void;
}

export function ClerkRegistryFilters({
    activeTab,
    totalAllCount,
    totalTodayCount,
    searchQuery,
    selectedOccupancy = "all",
    activeStatusFilter = "all",
    onClearStatusFilter,
    activeFilters,
    onTabChange,
    onSearchChange,
    onOccupancyChange,
    onAdvancedFilterChange,
}: ClerkRegistryFiltersProps) {
    const t = useTranslations("fireAudit.clerk.registry");
    const tMetrics = useTranslations("fireAudit.clerk.metrics");
    const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

    // Map active status key to localized label
    const STATUS_LABEL_MAP: Record<string, string> = {
        scrutiny_pending: tMetrics("scrutinyPending"),
        survey_scheduled: tMetrics("surveyScheduled"),
        review_forward: tMetrics("reviewForward"),
        compliance_pending: tMetrics("compliancePending"),
        reinspection: tMetrics("reinspectionCases"),
        certified: tMetrics("certifiedCleared"),
        rejected: tMetrics("rejectedApplications"),
    };
    const activeStatusLabel = activeStatusFilter && activeStatusFilter !== "all"
        ? STATUS_LABEL_MAP[activeStatusFilter]
        : undefined;

    // Dynamic styling mapped to match the active KPI card's color theme
    const STATUS_STYLE_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
        scrutiny_pending: { bg: "!bg-amber-50/80 hover:!bg-amber-100", text: "!text-amber-800", border: "!border-amber-300", dot: "bg-amber-500" },
        survey_scheduled: { bg: "!bg-sky-50/80 hover:!bg-sky-100", text: "!text-sky-800", border: "!border-sky-300", dot: "bg-sky-500" },
        review_forward: { bg: "!bg-purple-50/80 hover:!bg-purple-100", text: "!text-purple-800", border: "!border-purple-300", dot: "bg-purple-500" },
        compliance_pending: { bg: "!bg-orange-50/80 hover:!bg-orange-100", text: "!text-orange-800", border: "!border-orange-300", dot: "bg-orange-500" },
        reinspection: { bg: "!bg-amber-50/80 hover:!bg-amber-100", text: "!text-amber-800", border: "!border-amber-300", dot: "bg-amber-500" },
        certified: { bg: "!bg-emerald-50/80 hover:!bg-emerald-100", text: "!text-emerald-800", border: "!border-emerald-300", dot: "bg-emerald-500" },
        rejected: { bg: "!bg-rose-50/80 hover:!bg-rose-100", text: "!text-rose-800", border: "!border-rose-300", dot: "bg-rose-500" },
    };
    const currentStatusStyle = activeStatusFilter ? STATUS_STYLE_MAP[activeStatusFilter] : undefined;

    // URL Single Source of Truth — derive active filter count directly
    const appliedFiltersCount =
        (activeFilters
            ? Object.entries(activeFilters).filter(
                ([key, val]) => key !== "search" && val && val !== "all"
            ).length
            : 0) + (activeStatusFilter && activeStatusFilter !== "all" ? 1 : 0);

    const handleApplyAdvancedFilters = (advFilters: AdvancedFilterValues) => {
        if (advFilters.search !== searchQuery) {
            onSearchChange(advFilters.search);
        }
        if (advFilters.occupancyType && advFilters.occupancyType !== selectedOccupancy) {
            onOccupancyChange?.(advFilters.occupancyType);
        }
        onAdvancedFilterChange?.(advFilters);
    };

    return (
        <div className="w-full space-y-2">
            {/* Collapsible Filter Panel */}
            <ClerkAdvancedFilter
                key={isAdvancedFilterOpen ? "open" : "closed"}
                isOpen={isAdvancedFilterOpen}
                onClose={() => setIsAdvancedFilterOpen(false)}
                onApplyFilters={handleApplyAdvancedFilters}
                initialSearch={searchQuery}
                initialFilters={{ ...activeFilters, occupancyType: selectedOccupancy }}
            />

            {/* Registry Filter Toolbar */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-sky-200/70 pb-2.5">
                {/* Registry Tabs using common Button primitive with exact original colors */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTabChange("all")}
                        className={`rounded-xl sm:rounded-lg px-4 py-2 sm:px-3.5 sm:py-1.5 text-xs font-semibold transition-all !border-0 shadow-none cursor-pointer ${activeTab === "all"
                            ? "!bg-[#153746] hover:!bg-[#0f2732] !text-white shadow-xs"
                            : "!bg-sky-100/60 !text-slate-700 hover:!bg-sky-100"
                            }`}
                    >
                        {t("tabAll", { count: totalAllCount })}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTabChange("today")}
                        className={`rounded-xl sm:rounded-lg px-4 py-2 sm:px-3.5 sm:py-1.5 text-xs font-semibold transition-all !border-0 shadow-none cursor-pointer ${activeTab === "today"
                            ? "!bg-[#153746] hover:!bg-[#0f2732] !text-white shadow-xs"
                            : "!bg-sky-100/60 !text-slate-700 hover:!bg-sky-100"
                            }`}
                    >
                        {t("tabToday", { count: totalTodayCount })}
                    </Button>

                    {/* Active KPI Status Chip (Positioned beside tabs, color-matched to the card) */}
                    {activeStatusLabel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={X}
                            iconPosition="right"
                            onClick={onClearStatusFilter}
                            className={`!h-8.5 px-3 rounded-xl sm:rounded-lg !border text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 ${currentStatusStyle
                                ? `${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`
                                : "!bg-slate-100 !text-slate-700 !border-slate-300"
                                }`}
                            title={t("clearStatusFilter")}
                        >
                            <span className={`w-2 h-2 rounded-full ${currentStatusStyle?.dot || "bg-slate-400"} shrink-0`} />
                            <span>{activeStatusLabel}</span>
                        </Button>
                    )}
                </div>

                {/* Common SearchInput + Filter Button */}
                {!isAdvancedFilterOpen && (
                    <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in duration-150">
                        <SearchInput
                            value={searchQuery}
                            onChange={onSearchChange}
                            placeholder={t("searchPlaceholder")}
                            className="mb-0 w-full sm:w-64"
                            inputClassName="py-1 text-xs h-8.5 rounded-xl sm:rounded-lg"
                        />

                        {/* Filter Trigger Button using common Button & Badge */}
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Filter}
                            onClick={() => setIsAdvancedFilterOpen(true)}
                            className="!h-8.5 !rounded-full !border !border-sky-300 !bg-white !text-[#1A86E8] hover:!bg-sky-50/80 px-3.5 text-xs font-semibold shrink-0 gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <span>{t("btnFilter")}</span>
                                {appliedFiltersCount > 0 && (
                                    <Badge
                                        size="sm"
                                        className="!bg-[#1A86E8] !text-white border-transparent px-1.5 py-0 h-4 min-w-4 text-[10px] font-bold rounded-full"
                                    >
                                        {appliedFiltersCount}
                                    </Badge>
                                )}
                                <ChevronDown className="h-3.5 w-3.5 text-[#1A86E8] stroke-[2.2]" />
                            </span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
