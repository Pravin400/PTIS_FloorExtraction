"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ClerkDashboardData, ClerkApplicationItem } from "@/types/fire-audit/clerk.types";
import { AdvancedFilterValues } from "@/components/modules/fire-audit/staff/clerk/ClerkAdvancedFilter";
import { proceedClerkApplicationAction } from "@/lib/actions/fire-audit/staff";

export function useClerkDashboard(data: ClerkDashboardData) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Drawer and Modal UI state
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isFullActivityOpen, setIsFullActivityOpen] = useState(false);
    const [selectedAppForModal, setSelectedAppForModal] = useState<ClerkApplicationItem | null>(null);

    // URL as Single Source of Truth
    const activeTab = (searchParams.get("tab") as "all" | "today") || "all";
    const searchQuery = searchParams.get("q") || "";
    const selectedOccupancy = searchParams.get("occupancy") || "all";
    const activeStatusFilter = searchParams.get("status") || "all";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    // Active advanced filters derived from URL
    const activeFilters: Partial<AdvancedFilterValues> = useMemo(() => ({
        appType: searchParams.get("appType") || "all",
        occupancyType: selectedOccupancy,
        node: searchParams.get("node") || "all",
        sector: searchParams.get("sector") || "all",
        wardNo: searchParams.get("wardNo") || "all",
        appDate: searchParams.get("appDate") || "all",
        riskCategory: searchParams.get("riskCategory") || "all",
    }), [searchParams, selectedOccupancy]);

    // URL parameter helper
    const updateUrlParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!value || value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        if (key !== "page") {
            params.delete("page");
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Filter handlers
    const handleTabChange = (tab: "all" | "today") => updateUrlParam("tab", tab);
    const handleSearchChange = (q: string) => updateUrlParam("q", q);
    const handleOccupancyChange = (occ: string) => updateUrlParam("occupancy", occ);
    const handleStatusFilterChange = (status: string) => {
        const nextStatus = activeStatusFilter === status && status !== "all" ? "all" : status;
        updateUrlParam("status", nextStatus);
    };
    const handlePageChange = (page: number) => updateUrlParam("page", page > 1 ? String(page) : "");

    const handleAdvancedFilterChange = (adv: AdvancedFilterValues) => {
        const params = new URLSearchParams(searchParams.toString());
        const syncParam = (key: string, val: string) => {
            if (!val || val === "all") params.delete(key);
            else params.set(key, val);
        };

        if (adv.search.trim()) params.set("q", adv.search.trim());
        else params.delete("q");

        syncParam("appType", adv.appType);
        syncParam("occupancy", adv.occupancyType);
        syncParam("node", adv.node);
        syncParam("sector", adv.sector);
        syncParam("wardNo", adv.wardNo);
        syncParam("appDate", adv.appDate);
        syncParam("riskCategory", adv.riskCategory);
        params.delete("page");

        router.replace(`${pathname}?${params.toString()}`);
    };

    // Modal & Navigation handlers
    const handleOpenProceedModal = (app: ClerkApplicationItem) => setSelectedAppForModal(app);
    const handleCloseProceedModal = () => setSelectedAppForModal(null);
    const handleConfirmProceedModal = async (app: ClerkApplicationItem) => {
        setSelectedAppForModal(null);
        try {
            await proceedClerkApplicationAction(app.id, app.status);
        } catch {
            // Safe fallback
        }
        router.push(`${pathname}/applications/${app.id}`);
    };

    const handleStartScrutiny = (id: string) => router.push(`${pathname}/applications/${id}`);
    const handleViewHistory = (id: string) => router.push(`${pathname}/applications/${id}?view=history`);
    const handleViewDocs = (id: string) => router.push(`${pathname}/applications/${id}?view=documents`);

    // Reactive filter calculations
    const filteredApplications = useMemo(() => {
        return (data.applications || []).filter((app) => {
            if (activeStatusFilter && activeStatusFilter !== "all") {
                if (app.status !== activeStatusFilter) return false;
            }
            if (activeTab === "today") {
                if (!app.isToday && !app.submissionDate?.includes("Today")) {
                    return false;
                }
            }
            if (selectedOccupancy && selectedOccupancy !== "all") {
                if (app.occupancyGroup !== selectedOccupancy && app.occupancyName !== selectedOccupancy) {
                    return false;
                }
            }
            if (activeFilters.appType && activeFilters.appType !== "all") {
                if (app.appType !== activeFilters.appType) return false;
            }
            if (activeFilters.node && activeFilters.node !== "all") {
                const nodeMatch = app.node === activeFilters.node ||
                    app.modalDetail?.address?.toLowerCase().includes(activeFilters.node.toLowerCase());
                if (!nodeMatch) return false;
            }
            if (activeFilters.sector && activeFilters.sector !== "all") {
                const sectorLabel = activeFilters.sector.replace("sec_", "Sector ");
                const sectorMatch = app.sector === activeFilters.sector ||
                    app.modalDetail?.address?.toLowerCase().includes(sectorLabel.toLowerCase());
                if (!sectorMatch) return false;
            }
            if (activeFilters.wardNo && activeFilters.wardNo !== "all") {
                const wardLabel = activeFilters.wardNo.replace("ward_", "Ward ");
                const wardMatch = app.wardNo === activeFilters.wardNo ||
                    app.modalDetail?.address?.toLowerCase().includes(wardLabel.toLowerCase());
                if (!wardMatch) return false;
            }
            if (activeFilters.riskCategory && activeFilters.riskCategory !== "all") {
                const riskMatch = app.riskCategory === activeFilters.riskCategory ||
                    app.modalDetail?.complianceInfo?.toLowerCase().includes(activeFilters.riskCategory.toLowerCase());
                if (!riskMatch) return false;
            }
            if (activeFilters.appDate && activeFilters.appDate !== "all") {
                if (app.appDate !== activeFilters.appDate && !app.submissionDate?.toLowerCase().includes(activeFilters.appDate.toLowerCase())) {
                    return false;
                }
            }
            if (searchQuery.trim()) {
                const query = searchQuery.trim().toLowerCase();
                const matches =
                    app.id?.toLowerCase().includes(query) ||
                    app.appId?.toLowerCase().includes(query) ||
                    app.buildingName?.toLowerCase().includes(query) ||
                    app.applicantName?.toLowerCase().includes(query) ||
                    app.councilCode?.toLowerCase().includes(query) ||
                    app.occupancyName?.toLowerCase().includes(query);
                if (!matches) return false;
            }
            return true;
        });
    }, [data.applications, activeStatusFilter, activeTab, selectedOccupancy, searchQuery, activeFilters]);

    return {
        // State
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
        // Handlers
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
    };
}

