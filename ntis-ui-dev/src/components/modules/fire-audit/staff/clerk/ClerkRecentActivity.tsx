"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ClerkRecentActivityItem } from "@/types/fire-audit/clerk.types";
import { Button } from "@/components/common";
import {
    FileText,
    UserCheck,
    Calendar,
    Clock,
    X,
    ChevronRight,
    ExternalLink,
    RotateCw,
} from "lucide-react";

interface ClerkRecentActivityProps {
    activities: ClerkRecentActivityItem[];
    isOpen: boolean;
    onClose: () => void;
    onViewAll?: () => void;
    onRefresh?: () => void;
    isMobilePopover?: boolean;
    isFullColumn?: boolean;
}

export function ClerkRecentActivity({
    activities,
    isOpen,
    onClose,
    onViewAll,
    onRefresh,
    isMobilePopover = false,
    isFullColumn = false,
}: ClerkRecentActivityProps) {
    const t = useTranslations("fireAudit.clerk.activity");
    const [activeTab, setActiveTab] = useState<"all" | "today" | "week">("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (!isOpen) return null;

    const handleRefresh = () => {
        setIsRefreshing(true);
        if (onRefresh) {
            onRefresh();
        }
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const CATEGORY_STYLES = {
        application: { icon: FileText, bg: "bg-sky-50", color: "text-sky-600" },
        scrutiny: { icon: UserCheck, bg: "bg-amber-50", color: "text-amber-600" },
        survey: { icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
        general: { icon: FileText, bg: "bg-slate-50", color: "text-slate-600" },
    };

    const getActivityStyle = (act: ClerkRecentActivityItem) => {
        if (act.category && CATEGORY_STYLES[act.category]) {
            return CATEGORY_STYLES[act.category];
        }
        const lower = act.title.toLowerCase();
        if (lower.includes("scrutiny") || lower.includes("assigned")) return CATEGORY_STYLES.scrutiny;
        if (lower.includes("survey") || lower.includes("schedule")) return CATEGORY_STYLES.survey;
        return CATEGORY_STYLES.application;
    };

    // Filter activities based on typed timePeriod enum (with legacy string fallback)
    const todayActivities = activities.filter((act) => {
        if (act.timePeriod) return act.timePeriod === "today";
        const time = act.timestamp.toLowerCase();
        return time.includes("min") || time.includes("hour") || time.includes("today");
    });

    const weekActivities = activities.filter((act) => {
        if (act.timePeriod) return act.timePeriod === "today" || act.timePeriod === "week";
        const time = act.timestamp.toLowerCase();
        return (
            time.includes("min") ||
            time.includes("hour") ||
            time.includes("today") ||
            time.includes("yesterday") ||
            time.includes("day")
        );
    });


    const filteredActivities =
        activeTab === "today"
            ? todayActivities
            : activeTab === "week"
                ? weekActivities
                : activities;

    // 1. Mobile Floating Popover (< sm)
    if (isMobilePopover) {
        return (
            <div className="w-[300px] rounded-2xl bg-white shadow-2xl border border-slate-100 p-3.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-800">
                        {t("title")}
                    </span>
                    <Button
                        variant="ghost"
                        size="xs"
                        icon={X}
                        onClick={onClose}
                        className="!rounded-full !p-1 !text-slate-400 hover:!bg-slate-100 hover:!text-slate-700 !border-0 !bg-transparent shadow-none cursor-pointer"
                        aria-label={t("close")}
                    />
                </div>

                {/* Popover Items / Empty */}
                <div className="max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                            <Clock className="h-6 w-6 mb-2 opacity-50" />
                            <p className="text-xs font-medium">{t("noActivity")}</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {activities.map((act) => {
                                const itemStyle = getActivityStyle(act);

                                const Icon = itemStyle.icon;
                                return (
                                    <div
                                        key={act.id}
                                        className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <div
                                            className={`rounded-xl p-2 shrink-0 ${itemStyle.bg} ${itemStyle.color}`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-800 leading-tight">
                                                {act.title}
                                            </p>
                                            <p className="truncate text-[11px] font-medium text-slate-500 mt-0.5">
                                                {act.building}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {act.timestamp}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* "View All Activity" Button using common Button primitive */}
                <Button
                    variant="ghost"
                    size="sm"
                    icon={ExternalLink}
                    iconPosition="right"
                    onClick={onViewAll}
                    className="!w-full mt-3 !bg-sky-50/70 py-2.5 px-3 text-xs font-semibold !text-[#1A86E8] hover:!bg-sky-100/80 transition-colors !border-0 !rounded-xl cursor-pointer shadow-none"
                >
                    {t("viewAllActivity")}
                </Button>
            </div>
        );
    }

    // 2. Full Vertical Column Layout - Used for both Mobile Sheet & Desktop Sidebar
    return (
        <aside
            className={`flex flex-col h-full bg-slate-50/70 ${isFullColumn ? "w-full" : "w-80 shrink-0 border-l border-slate-200 min-h-screen p-4"
                }`}
        >
            {/* Top Filter Tabs & Close Button using common Button primitives */}
            <div className="flex items-center justify-between gap-1.5 pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-none ${activeTab === "all"
                            ? "!bg-[#153746] hover:!bg-[#0f2834] !text-white shadow-xs !border-0"
                            : "!bg-white !text-slate-600 hover:!bg-slate-100 !border !border-slate-200/60"
                            }`}
                    >
                        {t("tabAll", { count: activities.length })}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("today")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-none ${activeTab === "today"
                            ? "!bg-[#153746] hover:!bg-[#0f2834] !text-white shadow-xs !border-0"
                            : "!bg-white !text-slate-600 hover:!bg-slate-100 !border !border-slate-200/60"
                            }`}
                    >
                        {t("tabToday", { count: todayActivities.length })}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("week")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-none ${activeTab === "week"
                            ? "!bg-[#153746] hover:!bg-[#0f2834] !text-white shadow-xs !border-0"
                            : "!bg-white !text-slate-600 hover:!bg-slate-100 !border !border-slate-200/60"
                            }`}
                    >
                        {t("tabThisWeek", { count: weekActivities.length })}
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="xs"
                    icon={X}
                    onClick={onClose}
                    className="!rounded-lg p-1.5 !text-slate-400 hover:!bg-slate-200 hover:!text-slate-700 transition-colors !border-0 !bg-transparent shadow-none cursor-pointer"
                    aria-label={t("close")}
                />
            </div>

            {/* Central Content Area (Card or List) */}
            <div className="flex-1 flex flex-col my-2">
                {filteredActivities.length === 0 ? (
                    <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-2xs">
                        <div className="rounded-full bg-sky-50 p-4 text-[#1A86E8] mb-4 inline-flex items-center justify-center">
                            <Clock className="h-8 w-8 stroke-[1.5]" />
                        </div>
                        <p className="text-base font-bold text-slate-900 leading-snug">
                            {t("noActivity")}
                        </p>
                        <p className="text-xs text-slate-500 max-w-[260px] mt-2 leading-relaxed">
                            {t("noActivityDesc")}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3 overflow-y-auto space-y-2">
                        {filteredActivities.map((act) => {
                            const itemStyle = getActivityStyle(act);

                            const Icon = itemStyle.icon;
                            return (
                                <div
                                    key={act.id}
                                    className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors border border-slate-100"
                                >
                                    <div
                                        className={`rounded-xl p-2 shrink-0 ${itemStyle.bg} ${itemStyle.color}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                                            {act.title}
                                        </p>
                                        <p className="truncate text-[11px] font-medium text-slate-500 mt-0.5">
                                            {act.building}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {act.timestamp}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Refresh Button using common Button primitive with exact Deep Navy */}
            <div className="pt-2">
                <Button
                    variant="primary"
                    size="md"
                    icon={RotateCw}
                    isLoading={isRefreshing}
                    onClick={handleRefresh}
                    className="!w-full !rounded-xl !bg-[#153746] hover:!bg-[#0f2834] py-3 px-4 text-xs sm:text-sm font-semibold !text-white shadow-xs transition-colors !border-0 cursor-pointer"
                >
                    {t("refresh")}
                </Button>
            </div>
        </aside>
    );
}
