"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { NatureFactorCVMaster } from "@/types/natureofbuilding-cv-weightageMaster.types";
import { useNatureFactorCvRowOps } from "./useNatureFactorCvRowOps";
import { useNatureFactorCvBulkOps } from "./useNatureFactorCvBulkOps";
import { fetchNatureFactorCVMasterPagedServerAction } from "@/app/[locale]/property-tax/weightage-master/nature-weightage/actions";

export interface UseNatureFactorCvProps {
    data: NatureFactorCVMaster[];
    pageSize: number;
    sortBy?: string;
    sortOrder?: string;
}

export function useNatureFactorCv({
    data,
    pageSize,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
}: UseNatureFactorCvProps) {
    const t = useTranslations("natureFactorCVMaster");
    const tW = useTranslations("weightageMaster");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();

    const currentSelectedYear = searchParams.get("selectedYearRange") || "";
    const currentConstructionType = searchParams.get("constructionType") || "";
    const [selectedYear, setSelectedYear] = useState<string>(currentSelectedYear);
    const [editableRows, setEditableRows] = useState<Record<string, NatureFactorCVMaster>>({});

    const [constructionType, setConstructionType] = useState<string>(currentConstructionType);
    const [factorValue, setFactorValue] = useState<string>("1.00");

    const [isUpdating, setIsUpdating] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);

    const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
    const [sortOrder, setSortOrder] = useState<string | undefined>(initialSortOrder);

    // Total missing (Construction Type x Year) combinations for the current
    // selection, not just whatever happens to be on the current page — otherwise
    // this badge/count is just coincidentally equal to the page size. When no
    // year is selected yet, this covers every year (matching the unfiltered grid
    // shown in that state). Refetched whenever the selection changes, and again
    // after a successful Generate All / Bulk Update / row Create.
    const [newRecordsCount, setNewRecordsCount] = useState(0);
    const hasNewRecords = newRecordsCount > 0;

    const refreshMissingCount = useCallback(async () => {
        try {
            const result = await fetchNatureFactorCVMasterPagedServerAction(
                1,
                -1,
                undefined,
                selectedYear,
                constructionType,
                undefined,
                undefined
            );
            setNewRecordsCount(result.items.filter(row => row.id === 0).length);
        } catch (_error) {
            setNewRecordsCount(0);
        }
    }, [selectedYear, constructionType]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshMissingCount();
    }, [refreshMissingCount]);

    const [toasts, setToasts] = useState<Array<{ id: string; type: "success" | "error" | "info" | "warning"; message: string }>>([]);

    const currentSearchTerm = searchParams.get("q") || "";

    const getRowUid = useCallback((row: NatureFactorCVMaster): string =>
        `${row.id}-${row.constructionTypeId}-${row.yearRangeCVId || 'noYear'}-${row.fromYear}-${row.toYear}`, []);

    const findRowByUid = (uid: string): NatureFactorCVMaster | undefined => {
        return data.find(row => getRowUid(row) === uid);
    };

    const addToast = useCallback((type: "success" | "error" | "info" | "warning", message: string): void => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    const removeToast = (id: string): void => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const hasShownWarningRef = useRef(false);

    useEffect(() => {
        if (hasNewRecords && !hasShownWarningRef.current) {
            const timer = setTimeout(() => {
                addToast('warning', tW('common.messages.pendingRecordsWarning'));
            }, 0);
            hasShownWarningRef.current = true;
            return () => clearTimeout(timer);
        } else if (!hasNewRecords) {
            hasShownWarningRef.current = false;
        }
    }, [hasNewRecords, tW, addToast]);

    const refreshPage = (): void => router.refresh();

    const clearFilters = (): void => {
        setFactorValue("1.00");
        setConstructionType("");
        // Synchronize with URL to ensure server-side filtering is also cleared
        router.push(buildNatureFactorUrl({ page: 1, type: "" }));
    };

    // Row-level CRUD operations
    const { handleCellChange, handleUpdate, handleCancel } = useNatureFactorCvRowOps({
        data,
        editableRows,
        setEditableRows,
        setIsUpdating,
        getRowUid,
        findRowByUid,
        addToast,
        refreshPage,
        clearFilters,
        onDataChanged: refreshMissingCount,
    });

    // Bulk operations
    const { handleApplyFilter, handleBulkUpdate, handleGenerateAll } = useNatureFactorCvBulkOps({
        data,
        editableRows,
        setEditableRows,
        setIsBulkUpdating,
        setIsGeneratingAll,
        selectedYear,
        constructionType,
        factorValue,
        getRowUid,
        findRowByUid,
        addToast,
        refreshPage,
        clearFilters,
        onDataChanged: refreshMissingCount,
    });

    const buildNatureFactorUrl = (params: {
        page?: number;
        pageSize?: number;
        year?: string;
        type?: string;
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
        
        const type = params.type ?? constructionType;
        if (type) urlParams.set("constructionType", type);
        
        const sb = params.sortBy !== undefined ? params.sortBy : sortBy;
        const so = params.sortOrder !== undefined ? params.sortOrder : sortOrder;
        if (sb) urlParams.set("sortBy", sb);
        if (so) urlParams.set("sortOrder", so);
        
        return `/${locale}/property-tax/weightage-master/nature-weightage?${urlParams.toString()}`;
    };

    const changePage = (page: number): void => {
        router.push(buildNatureFactorUrl({ page }));
    };

    const changePageSize = (size: number): void => {
        router.push(buildNatureFactorUrl({ page: 1, pageSize: size }));
    };

    const handleAssessmentYearChange = (value: string): void => {
        setSelectedYear(value);
        router.push(buildNatureFactorUrl({ page: 1, year: value }));
    };

    const handleConstructionTypeChange = (value: string): void => {
        setConstructionType(value);
        router.push(buildNatureFactorUrl({ page: 1, type: value }));
    };

    const handleSort = (columnKey: string) => {
        let newOrder: "asc" | "desc" = "asc";
        if (sortBy === columnKey) {
            newOrder = sortOrder === "asc" ? "desc" : "asc";
        }
        setSortBy(columnKey);
        setSortOrder(newOrder);
        router.push(buildNatureFactorUrl({ page: 1, sortBy: columnKey, sortOrder: newOrder }));
    };

    const handleClearAll = (): void => {
        setEditableRows({});
        clearFilters();
        setSelectedYear("");
        setSortBy(undefined);
        setSortOrder(undefined);
        router.push(buildNatureFactorUrl({ page: 1, year: "", type: "", sortBy: "", sortOrder: "" }));
        addToast('info', tW('common.messages.allClearedInfo'));
    };

    const isApplyDisabled = (!selectedYear && !constructionType);
    const isBulkUpdateDisabled = Object.keys(editableRows).length === 0 || isBulkUpdating;

    return {
        t, tW, tCommon,
        selectedYear, constructionType, factorValue,
        editableRows,
        isUpdating, isBulkUpdating, isGeneratingAll,
        newRecordsCount, hasNewRecords,
        toasts,
        isApplyDisabled, isBulkUpdateDisabled,
        sortBy, sortOrder,
        addToast, removeToast,
        getRowUid, handleCellChange, handleUpdate, handleCancel,
        handleAssessmentYearChange, handleConstructionTypeChange, setFactorValue,
        handleApplyFilter, handleBulkUpdate, handleGenerateAll, handleClearAll,
        changePage, changePageSize, handleSort
    };
}
