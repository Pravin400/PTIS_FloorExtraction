"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FloorFactorCVMaster } from "@/types/asset-masters/floor-cv-weightageMaster.types";
import { useFloorCvRowOps } from "./useFloorCvRowOps";
import { useFloorCvBulkOps } from "./useFloorCvBulkOps";
import { useFloorCvToasts } from "./useFloorCvToasts";
import { useFloorCvSessionTracking } from "./useFloorCvSessionTracking";
import type { Option } from "@/components/common";

export interface UseFloorCvWeightageProps {
    data: FloorFactorCVMaster[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    floorOptions: Option[];
    sortBy?: string;
    sortOrder?: string;
}

export function useFloorCvWeightage({
    data,
    pageNumber,
    pageSize,
    totalCount,
    floorOptions,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
}: UseFloorCvWeightageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const tCommon = useTranslations("common");
    const t = useTranslations("assetWeightageMaster.floor");
    const tW = useTranslations("assetWeightageMaster");

    const currentSelectedYear = searchParams.get("selectedYearRange") || "";
    const [selectedYear, setSelectedYear] = useState<string>(currentSelectedYear);
    const { toasts, addToast, removeToast } = useFloorCvToasts();
    
    const {
        editableRows,
        setEditableRows,
        sessionCreatedUids,
        setSessionCreatedUids,
        getRowUid,
        findRowByUid,
    } = useFloorCvSessionTracking({ data });

    // Filter states
    const [fromFloor, setFromFloor] = useState<string>("");
    const [toFloor, setToFloor] = useState<string>("");
    const [liftStatus, setLiftStatus] = useState<string>("both");
    const [factorValue, setFactorValue] = useState<string>("0.00");

    const newRecords = data.filter(row => row.id === 0 && !sessionCreatedUids.has(getRowUid(row)));
    const hasNewRecords = newRecords.length > 0;
    const newRecordsCount = newRecords.length;

    // Loading states
    const [isUpdating, setIsUpdating] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);

    const currentSearchTerm = searchParams.get("q") || "";

    const hasShownWarningRef = useRef(false);

    useEffect(() => {
        if (hasNewRecords && !hasShownWarningRef.current) {
            addToast("warning", tW("common.messages.pendingRecordsWarning"));
            hasShownWarningRef.current = true;
        } else if (!hasNewRecords) {
            hasShownWarningRef.current = false;
        }
    }, [hasNewRecords, tW, addToast]);

    const handleFromFloorChange = (value: string) => {
        if (value && toFloor && floorOptions.length > 0) {
            const fromIndex = floorOptions.findIndex(o => o.value === value);
            const toIndex = floorOptions.findIndex(o => o.value === toFloor);
            if (fromIndex > -1 && toIndex > -1 && fromIndex > toIndex) {
                addToast("error", t("messages.fromFloorGreaterError"));
                setToFloor("");
            }
        }
        setFromFloor(value);
    };

    const handleToFloorChange = (value: string) => {
        if (fromFloor && value && floorOptions.length > 0) {
            const fromIndex = floorOptions.findIndex(o => o.value === fromFloor);
            const toIndex = floorOptions.findIndex(o => o.value === value);
            if (fromIndex > -1 && toIndex > -1 && fromIndex > toIndex) {
                addToast("error", t("messages.fromFloorGreaterError"));
                return;
            }
        }
        setToFloor(value);
    };

    const refreshPage = () => router.refresh();

    // Lift status options
    const liftStatusOptions = [
        { label: t("liftStatusOptions.both"), value: "both" },
        { label: t("liftStatusOptions.withLift"), value: "withLift" },
        { label: t("liftStatusOptions.withoutLift"), value: "withoutLift" },
    ];

    // Helper function to clear all filters
    const clearFilters = () => {
        setFromFloor("");
        setToFloor("");
        setLiftStatus("both");
        setFactorValue("0.00");
    };

    // Row-level CRUD operations
    const { handleCellChange, handleUpdate, handleCancel } = useFloorCvRowOps({
        data,
        editableRows,
        setEditableRows,
        setSessionCreatedUids,
        setIsUpdating,
        getRowUid,
        findRowByUid,
        addToast,
        refreshPage,
        clearFilters,
    });

    // Bulk operations
    const { handleApplyFilter, handleBulkUpdate, handleGenerateAll } = useFloorCvBulkOps({
        data,
        editableRows,
        setEditableRows,
        sessionCreatedUids,
        setSessionCreatedUids,
        setIsBulkUpdating,
        setIsGeneratingAll,
        selectedYear,
        fromFloor,
        toFloor,
        liftStatus,
        factorValue,
        getRowUid,
        findRowByUid,
        addToast,
        refreshPage,
        clearFilters,
        floorOptions,
    });

    const buildFloorUrl = (params: {
        page?: number;
        pageSize?: number;
        year?: string;
        q?: string;
        sortBy?: string;
        sortOrder?: string;
    }): string => {
        const urlParams = new URLSearchParams();
        urlParams.set("page", String(params.page ?? 1));
        urlParams.set("pageSize", String(params.pageSize ?? pageSize));
        
        const q = params.q ?? currentSearchTerm;
        if (q) urlParams.set("q", q);
        
        const year = params.year ?? selectedYear;
        if (year) urlParams.set("selectedYearRange", year);

        // Preserve sort params across navigations
        const sb = "sortBy" in params ? params.sortBy : initialSortBy;
        const so = "sortOrder" in params ? params.sortOrder : initialSortOrder;
        if (sb) urlParams.set("sortBy", sb);
        if (so) urlParams.set("sortOrder", so);
        
        return `/${locale}/assets/configuration/master-data/weightage-master?${urlParams.toString()}`;
    };

    // Handle clear all changes and filters
    const handleClearAll = () => {
        setEditableRows({});
        clearFilters();
        setSelectedYear("");

        router.push(buildFloorUrl({ page: 1, year: "" }));
        addToast("info", tW("common.messages.allClearedInfo"));
    };

    /* ================= PAGINATION ================= */
    const changePage = (p: number): void => {
        router.push(buildFloorUrl({ page: p }));
    };

    const changePageSize = (size: number): void => {
        router.push(buildFloorUrl({ page: 1, pageSize: size }));
    };

    const handleAssessmentYearChange = (value: string) => {
        setSelectedYear(value);
        router.push(buildFloorUrl({ page: 1, year: value }));
    };

    /* ================= SORT ================= */
    const handleSort = (columnKey: string): void => {
        // Toggle order if same column, default to asc for new column
        const newSortOrder =
            initialSortBy === columnKey && initialSortOrder === "asc" ? "desc" : "asc";
        router.push(
            buildFloorUrl({ page: 1, sortBy: columnKey, sortOrder: newSortOrder })
        );
    };

    // Derived states for button enable/disable logic
    // Apply button should be disabled unless all filter values are selected/valid
    // Assessment year MUST be selected before bulk factor can be applied
    // It stays enabled for open-ended ranges and only rejects explicitly invalid bounded ranges
    const { isRangeInvalid, isApplyDisabled, isBulkUpdateDisabled } = useMemo(() => {
        const fromNum = parseInt(fromFloor, 10);
        const toNum = parseInt(toFloor, 10);
        const rangeInvalid = !!fromFloor && !!toFloor && !isNaN(fromNum) && !isNaN(toNum) && fromNum > toNum;
        const applyDisabled =
            !selectedYear ||
            !liftStatus ||
            parseFloat(factorValue) < 0 ||
            rangeInvalid;
        const bulkUpdateDisabled = Object.keys(editableRows).length === 0 || isBulkUpdating;
        return {
            isRangeInvalid: rangeInvalid,
            isApplyDisabled: applyDisabled,
            isBulkUpdateDisabled: bulkUpdateDisabled,
        };
    }, [fromFloor, toFloor, selectedYear, liftStatus, factorValue, editableRows, isBulkUpdating]);

    return {
        // Translations
        t,
        tW,
        tCommon,
        // State
        selectedYear,
        editableRows,
        fromFloor,
        setFromFloor: handleFromFloorChange,
        toFloor,
        setToFloor: handleToFloorChange,
        liftStatus,
        setLiftStatus,
        factorValue,
        setFactorValue,
        toasts,
        isUpdating,
        isBulkUpdating,
        isGeneratingAll,
        newRecordsCount,
        hasNewRecords,
        totalCount,
        pageSize,
        pageNumber,
        // Sort
        sortBy: initialSortBy,
        sortOrder: initialSortOrder,
        handleSort,
        // Derived
        isRangeInvalid,
        isApplyDisabled,
        isBulkUpdateDisabled,
        liftStatusOptions,
        // Helpers
        getRowUid,
        addToast,
        removeToast,
        // Handlers
        handleCellChange,
        handleUpdate,
        handleCancel,
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
        handleClearAll,
        changePage,
        changePageSize,
        handleAssessmentYearChange,
    };
}
