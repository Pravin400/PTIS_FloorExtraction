"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { UseFactorCVMaster, UseType } from "@/types/useCategoryCvFactor.types";
import { useCategoryCvRowOps } from "./useCategoryCvRowOps";
import { useCategoryCvBulkOps } from "./useCategoryCvBulkOps";
import { useCategoryCvState } from "./useCategoryCvState";
import { useCategoryCvPagination } from "./useCategoryCvPagination";

export interface UseCategoryCvProps {
    data: UseFactorCVMaster[];
    pageSize: number;
    pageNumber: number;
    typeOfUsePageSize: number;
    typeOfUsePageNumber: number;
    sortBy?: string;
    sortOrder?: string;
    leftSortBy?: string;
    leftSortOrder?: string;
}

/**
 * Main hook for the Use Category CV Master module.
 * Orchestrates state, pagination, and various business operations (row and bulk).
 */
export function useCategoryCv({
    data,
    pageSize,
    pageNumber,
    typeOfUsePageSize,
    typeOfUsePageNumber,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
    leftSortBy: initialLeftSortBy,
    leftSortOrder: initialLeftSortOrder,
}: UseCategoryCvProps) {
    const t = useTranslations("assetWeightageMaster.subType");
    const tW = useTranslations("assetWeightageMaster");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();

    const currentSelectedYear = searchParams.get("selectedYearRange") || "";
    const currentTypeOfUse = searchParams.get("typeOfUseId") || "";

    // 1. Core State management
    const state = useCategoryCvState(currentSelectedYear, currentTypeOfUse);
    const { 
        selectedYear, setSelectedYear,
        editableRows, setEditableRows,
        selectedTypeId, setSelectedTypeId,
        typeOfUseId, setTypeOfUseId,
        factorValue, setFactorValue,
        isUpdating, setIsUpdating,
        isBulkUpdating, setIsBulkUpdating,
        isGeneratingAll, setIsGeneratingAll,
        toasts, addToast, removeToast,
        hasShownWarningRef
    } = state;

    // Sorting states
    const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
    const [sortOrder, setSortOrder] = useState<string | undefined>(initialSortOrder);
    const [leftSortBy, setLeftSortBy] = useState<string | undefined>(initialLeftSortBy);
    const [leftSortOrder, setLeftSortOrder] = useState<string | undefined>(initialLeftSortOrder);

    // 2. Pagination and Navigation
    const pagination = useCategoryCvPagination(
        pageNumber, 
        pageSize, 
        typeOfUsePageNumber, 
        typeOfUsePageSize,
        sortBy,
        sortOrder,
        leftSortBy,
        leftSortOrder
    );
    const { buildUrl, ...paginationHandlers } = pagination;

    const newRecordsCount = data.filter(row => row.id === 0).length;
    const hasNewRecords = newRecordsCount > 0;

    const getRowUid = useCallback((row: UseFactorCVMaster): string => 
        `${row.id}-${row.typeOfUseId}-${row.subTypeOfUseId}-${row.yearRangeCVId || 'noYear'}`, []);

    const findRowByUid = (uid: string): UseFactorCVMaster | undefined => {
        return data.find(row => getRowUid(row) === uid);
    };

    // Auto-warning for pending records
    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (hasNewRecords && !hasShownWarningRef.current) {
            hasShownWarningRef.current = true;
            timerId = setTimeout(() => {
                addToast('warning', tW('common.messages.pendingRecordsWarning'));
            }, 0);
        } else if (!hasNewRecords) {
            hasShownWarningRef.current = false;
        }
        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [hasNewRecords, tW, addToast, hasShownWarningRef]);

    const refreshPage = (): void => router.refresh();

    // Specific change handlers
    const handleAssessmentYearChange = (value: string): void => {
        setSelectedYear(value);
        router.push(buildUrl({ page: 1, selectedYearRange: value }));
    };

    const handleTypeOfUseChange = (value: string): void => {
        setTypeOfUseId(value);
        setSelectedTypeId(Number(value));
        router.push(buildUrl({ page: 1, typeOfUseId: value }));
    };

    const handleTypeRowClick = (row: UseType): void => {
        setSelectedTypeId(row.id);
        setTypeOfUseId(String(row.id));
        router.push(buildUrl({ page: 1, typeOfUseId: String(row.id) }));
    };

    const handleSort = (columnKey: string) => {
        let newOrder: "asc" | "desc" = "asc";
        if (sortBy === columnKey) {
            newOrder = sortOrder === "asc" ? "desc" : "asc";
        }
        setSortBy(columnKey);
        setSortOrder(newOrder);
        router.push(buildUrl({ page: 1, sortBy: columnKey, sortOrder: newOrder }));
    };

    const handleLeftSort = (columnKey: string) => {
        let newOrder: "asc" | "desc" = "asc";
        if (leftSortBy === columnKey) {
            newOrder = leftSortOrder === "asc" ? "desc" : "asc";
        }
        setLeftSortBy(columnKey);
        setLeftSortOrder(newOrder);
        router.push(buildUrl({ leftPage: 1, leftSortBy: columnKey, leftSortOrder: newOrder }));
    };

    const handleClearAll = (): void => {
        setEditableRows({});
        setFactorValue("0.00");
        setTypeOfUseId("");
        setSelectedTypeId(null);
        setSelectedYear("");
        setSortBy(undefined);
        setSortOrder(undefined);
        setLeftSortBy(undefined);
        setLeftSortOrder(undefined);
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/sub-type-weightage?page=1&pageSize=${pageSize}&leftPage=1&leftPageSize=${typeOfUsePageSize}`);
        addToast('info', tW('common.messages.allClearedInfo'));
    };

    // 3. Row-level Operations
    const rowOps = useCategoryCvRowOps({
        editableRows,
        setEditableRows,
        setIsUpdating,
        getRowUid,
        findRowByUid,
        addToast,
        refreshPage,
        tW,
    });

    // 4. Bulk Operations
    const bulkOps = useCategoryCvBulkOps({
        data,
        editableRows,
        setEditableRows,
        setIsBulkUpdating,
        setIsGeneratingAll,
        factorValue,
        getRowUid,
        findRowByUid,
        addToast,
        refreshPage,
        tW,
    });

    const parsedFactorValue = parseFloat(factorValue);
    const isApplyDisabled = Number.isNaN(parsedFactorValue) || parsedFactorValue < 0 || (!selectedYear && !typeOfUseId);
    const isBulkUpdateDisabled = Object.keys(editableRows).length === 0 || isBulkUpdating;

    return {
        t, tW, tCommon,
        selectedYear, typeOfUseId, factorValue, setFactorValue,
        editableRows, selectedTypeId,
        isUpdating, isBulkUpdating, isGeneratingAll,
        newRecordsCount, hasNewRecords,
        toasts,
        isApplyDisabled, isBulkUpdateDisabled,
        addToast, removeToast,
        getRowUid, ...rowOps,
        handleAssessmentYearChange, handleTypeOfUseChange, handleTypeRowClick,
        ...bulkOps, handleClearAll,
        ...paginationHandlers,
        sortBy, sortOrder, leftSortBy, leftSortOrder,
        handleSort, handleLeftSort
    };
}
