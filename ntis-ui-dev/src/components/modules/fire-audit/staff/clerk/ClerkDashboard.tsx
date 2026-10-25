"use client";

import { ClerkDashboardData } from "@/types/fire-audit/clerk.types";
import { ClerkMetricCards } from "./ClerkMetricCards";
import { ClerkRegistryFilters } from "./ClerkRegistryFilters";
import { ClerkApplicationTable } from "./ClerkApplicationTable";
import { ClerkRecentActivity } from "./ClerkRecentActivity";
import { ClerkProceedApplicationModal } from "./ClerkProceedApplicationModal";
import { Button, Badge } from "@/components/common";
import { useTranslations } from "next-intl";
import { Radio } from "lucide-react";
import { useClerkDashboard } from "@/hooks/fire-audit/clerk";

interface ClerkDashboardProps {
    data: ClerkDashboardData;
}

export function ClerkDashboard({ data }: ClerkDashboardProps) {
    const t = useTranslations("fireAudit.clerk");

    const {
        router,
        activeTab,
        searchQuery,
        selectedOccupancy,
        activeStatusFilter,
        currentPage,
        activeFilters,
        isActivityOpen,
        isFullActivityOpen,
        selectedAppForModal,
        filteredApplications,
        setIsActivityOpen,
        setIsFullActivityOpen,
        handleTabChange,
        handleSearchChange,
        handleOccupancyChange,
        handleStatusFilterChange,
        handlePageChange,
        handleAdvancedFilterChange,
        handleOpenProceedModal,
        handleCloseProceedModal,
        handleConfirmProceedModal,
        handleStartScrutiny,
        handleViewHistory,
        handleViewDocs,
    } = useClerkDashboard(data);

    return (
        <div className="flex w-full min-w-0 min-h-full bg-[#F0F7FF]">
            {/* Main Dashboard (Automatically shrinks/expands to remaining space) */}
            <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-4">
                {/* Header & Metric Cards Banner with Full-Coverage Horizontal Illustration */}
                <div className="relative rounded-2xl border border-sky-200/70 bg-gradient-to-b from-[#EBF5FE] via-[#E1F0FD] to-[#D5EAFA] pt-5 sm:pt-6 pb-3.5 sm:pb-4.5 px-4 sm:px-6 shadow-xs space-y-4">
                    {/* Horizontal Full-Coverage Background Illustration */}
                    <div
                        className="pointer-events-none absolute inset-0 rounded-2xl bg-cover bg-top bg-no-repeat"
                        style={{ backgroundImage: "url('/assets/images/fire-audit/fire-audit-premium-background.svg')" }}
                    />

                    {/* Top Header with Live Feed Trigger Button */}
                    <div className="relative z-30 flex items-center justify-between">
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            {t("title")}
                        </h1>

                        {/* Common Button for Live Feed Toggle */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Radio}
                                onClick={() => setIsActivityOpen((prev) => !prev)}
                                className={`transition-colors cursor-pointer text-xs font-semibold rounded-lg ${isActivityOpen
                                    ? "!border !border-[#1A86E8] !text-[#1A86E8] !bg-sky-50/50 shadow-xs"
                                    : "!border !border-slate-200 !text-slate-700 !bg-white hover:!bg-slate-50 shadow-2xs"
                                    }`}
                            >
                                <span>{t("activity.title")}</span>
                                <Badge
                                    variant="secondary"
                                    size="sm"
                                    className="!bg-slate-100 !text-slate-600 !border-transparent px-1.5 py-0 h-4 text-[10px] font-medium"
                                >
                                    {data.recentActivity.length}
                                </Badge>
                            </Button>

                            {/* Mobile Floating Popover (< sm) */}
                            {isActivityOpen && (
                                <div className="sm:hidden absolute right-0 top-full mt-2 z-50">
                                    <ClerkRecentActivity
                                        activities={data.recentActivity}
                                        isOpen={isActivityOpen}
                                        onClose={() => setIsActivityOpen(false)}
                                        onRefresh={() => router.refresh()}
                                        onViewAll={() => {
                                            setIsActivityOpen(false);
                                            setIsFullActivityOpen(true);
                                        }}
                                        isMobilePopover
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Key Operations Metric Cards Carousel */}
                    <div className="relative z-10 w-full">
                        <p className="text-xs font-bold text-slate-700 mb-2 sm:hidden">
                            {t("keyOperations")}
                        </p>
                        <ClerkMetricCards
                            metrics={data.metrics}
                            activeStatusFilter={activeStatusFilter}
                            onSelectFilter={handleStatusFilterChange}
                        />
                    </div>
                </div>

                {/* Applications Registry */}
                <div className="w-full space-y-3.5">
                    <ClerkRegistryFilters
                        activeTab={activeTab}
                        totalAllCount={data.metrics.allApplications}
                        totalTodayCount={data.applications.filter((a) => a.isToday).length}
                        searchQuery={searchQuery}
                        selectedOccupancy={selectedOccupancy}
                        activeStatusFilter={activeStatusFilter}
                        onClearStatusFilter={() => handleStatusFilterChange("all")}
                        activeFilters={activeFilters}
                        onTabChange={handleTabChange}
                        onSearchChange={handleSearchChange}
                        onOccupancyChange={handleOccupancyChange}
                        onAdvancedFilterChange={handleAdvancedFilterChange}
                    />

                    <ClerkApplicationTable
                        applications={filteredApplications}
                        currentPage={currentPage}
                        pageSize={10}
                        totalCount={data.totalApplications || filteredApplications.length}
                        onPageChange={handlePageChange}
                        onStartScrutiny={handleStartScrutiny}
                        onViewHistory={handleViewHistory}
                        onViewDocs={handleViewDocs}
                        onOpenProceedModal={handleOpenProceedModal}
                    />
                </div>
            </div>

            {/* Proceed Application Modal */}
            <ClerkProceedApplicationModal
                application={selectedAppForModal}
                isOpen={Boolean(selectedAppForModal)}
                onClose={handleCloseProceedModal}
                onConfirm={handleConfirmProceedModal}
            />

            {/* Desktop Inline Sidebar (>= sm) */}
            <div className="hidden sm:block">
                <ClerkRecentActivity
                    activities={data.recentActivity}
                    isOpen={isActivityOpen}
                    onClose={() => setIsActivityOpen(false)}
                    onRefresh={() => router.refresh()}
                    isFullColumn
                />
            </div>

            {/* Mobile Full Vertical Column Slide-in Modal (< sm) */}
            {isFullActivityOpen && (
                <div className="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-xs p-4 sm:hidden flex flex-col animate-in fade-in duration-200">
                    <ClerkRecentActivity
                        activities={data.recentActivity}
                        isOpen={true}
                        onClose={() => setIsFullActivityOpen(false)}
                        onRefresh={() => router.refresh()}
                        isFullColumn
                    />
                </div>
            )}
        </div>
    );
}
