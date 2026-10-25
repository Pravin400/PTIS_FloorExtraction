"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import { useAgeFactorCvRowOps } from "./useAgeFactorCvRowOps";
import { useAgeFactorCvBulkOps } from "./useAgeFactorCvBulkOps";
import { useAgeFactorCvToasts } from "./useAgeFactorCvToasts";
import { useAgeFactorCvFilters } from "./useAgeFactorCvFilters";
import { useAgeFactorCvSessionTracking } from "./useAgeFactorCvSessionTracking";
import { checkAgeRangeOverlap } from "@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation";
import type { Option } from "@/components/common/select";

interface UseAgeFactorCvWeightageParams {
    paginationData: {
        data: AgeFactorCVMaster[];
        pageNumber: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
    options: {
        constructionTypeOptions: Option[];
        initialAgeRangeOptions: Option[];
    };
    allAgeFactors: AgeFactorCVMaster[];
    sortBy?: string;
    sortOrder?: string;
}

/**
 * Main orchestration hook for Age Factor CV Weightage Master.
 * Composes specialized sub-hooks for filters, toasts, and session tracking.
 */
export const useAgeFactorCvWeightage = ({
    paginationData,
    options,
    allAgeFactors,
    sortBy,
    sortOrder,
}: UseAgeFactorCvWeightageParams) => {
    const { data, pageSize } = paginationData;
    const { constructionTypeOptions, initialAgeRangeOptions } = options;

    const t = useTranslations('ageFactorMaster');
    const tW = useTranslations('weightageMaster');
    const tCommon = useTranslations('common');

    const [isAddYearRangeModalOpen, setIsAddYearRangeModalOpen] = useState(false);

    const { toasts, addToast, removeToast } = useAgeFactorCvToasts();
    
    const {
        editableRows,
        setEditableRows,
        sessionCreatedUids,
        setSessionCreatedUids,
        getRowUid,
        findRowByUid,
    } = useAgeFactorCvSessionTracking({ data });

    const {
        selectedYear,
        constructionType,
        factorValue,
        setFactorValue,
        ageFrom,
        setAgeFrom,
        ageTo,
        setAgeTo,
        selectedAgeRange,
        setSelectedAgeRange,
        setUserAddedAgeRanges,
        ageRangeOptions,

        setIsAgeRangeAdded,
        clearFilters,
        handleAgeRangeChange,
        handleAssessmentYearChange,
        handleConstructionTypeChange,
        changePage,
        changePageSize,
        handleClearAll,

        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
        handleSort,
        getMissingRecordsCount,
    } = useAgeFactorCvFilters({
        initialAgeRangeOptions,
        initialSortBy: sortBy,
        initialSortOrder: sortOrder,
    });

    // Whether the *currently selected* Assessment Year + Age Range(s) + Construction
    // Type(s) combination is missing from the database (not just whether the current
    // page happens to contain placeholder rows). This is what actually drives whether
    // "Generate All" has anything to create — e.g. a brand-new age range the user just
    // added via "Add Age Range" has no rows anywhere yet, so this correctly reports it
    // as missing and enables the button, even though it won't appear in `data` at all.
    const newRecordsCount = getMissingRecordsCount(constructionTypeOptions, allAgeFactors);
    const hasNewRecords = newRecordsCount > 0;
    const hasShownWarningRef = useRef(false);

    useEffect(() => {
        if (hasNewRecords && !hasShownWarningRef.current) {
            addToast('warning', tW('common.messages.pendingRecordsWarning'));
            hasShownWarningRef.current = true;
        } else if (!hasNewRecords) {
            hasShownWarningRef.current = false;
        }
    }, [hasNewRecords, tW, addToast]);





    const {
        isUpdating,
        handleUpdate,
        handleCancelRow,
    } = useAgeFactorCvRowOps({
        selectedYear,
        editableRows,
        setEditableRows,
        setSessionCreatedUids,
        addToast,
        getRowUid,
    });

    const {
        isBulkUpdating,
        isGeneratingAll,
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
    } = useAgeFactorCvBulkOps({
        selectionState: {
            selectedYear,
            constructionType,
            selectedAgeRange,
            ageFrom,
            ageTo,
            factorValue,
        },
        masterData: {
            data,
            allAgeFactors,
            constructionTypeOptions,
            ageRangeOptions,
        },
        sessionState: {
            editableRows,
            setEditableRows,
            sessionCreatedUids,
            getRowUid,
            findRowByUid,
        },
        callbacks: {
            addToast,
            clearFilters,
        }
    });

    const handleCellChange = (rowId: string, columnId: string, value: number): void => {
        if (value < 0) {
            addToast('error', tW('common.messages.negativeValuesNotAllowed'));
            return;
        }
        if (value > 999999) {
            addToast('error', tW('common.messages.valueExceedsMax'));
            return;
        }

        setEditableRows((prev) => {
            const originalRow = findRowByUid(rowId);
            if (!originalRow) return prev;

            const existingEdit = prev[rowId];
            const updatedRow: AgeFactorCVMaster = {
                ...originalRow,
                ...(existingEdit || {}),
                [columnId]: value,
            };
            return { ...prev, [rowId]: updatedRow };
        });
    };

    const handleAddAgeRange = (): void => {
        if (!ageFrom || !ageTo) {
            addToast('warning', t('messages.provideBothAges'));
            return;
        }
        
        const fromValue = parseInt(ageFrom);
        const toValue = parseInt(ageTo);
        
        if (fromValue > toValue) {
            addToast('error', t('messages.fromAgeGreaterError'));
            return;
        }
        
        const newRange = `${ageFrom}-${ageTo}`;
        
        // Check if exact range already exists
        if (ageRangeOptions.find(opt => opt.value === newRange)) {
            addToast('info', t('messages.ageRangeExists'));
            return;
        }
        
        // Check for overlapping ranges
        const existingRangeValues = ageRangeOptions.map(opt => opt.value);
        const { hasOverlap, overlappingRange } = checkAgeRangeOverlap(fromValue, toValue, existingRangeValues);
        
        if (hasOverlap) {
            addToast('error', t('messages.ageRangeOverlap', { 
                newRange, 
                existingRange: overlappingRange || '' 
            }));
            return;
        }
        
        setUserAddedAgeRanges(prev => [...prev, { label: newRange, value: newRange }]);
        setSelectedAgeRange([newRange]);
        addToast('success', t('messages.ageRangeAdded', { from: ageFrom, to: ageTo }));
        setIsAgeRangeAdded(true);
        setIsAddYearRangeModalOpen(false);
        setAgeFrom("");
        setAgeTo("");
    };

    return {
        t,
        tW,
        tCommon,
        selectedYear,
        editableRows,
        constructionType,
        selectedAgeRange,
        ageFrom,
        setAgeFrom,
        ageTo,
        setAgeTo,
        ageRangeOptions,
        factorValue,
        setFactorValue,
        isAddYearRangeModalOpen,
        setIsAddYearRangeModalOpen,
        toasts,
        isUpdating,
        isBulkUpdating,
        isGeneratingAll,
        hasNewRecords,
        newRecordsCount,

        getRowUid,
        addToast,
        removeToast,
        handleCellChange,
        handleUpdate,
        handleCancelRow,
        handleAddAgeRange,
        handleAgeRangeChange,
        handleAssessmentYearChange,
        handleConstructionTypeChange,
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
        handleClearAll: () => {
            handleClearAll(addToast, tW);
            setEditableRows({});
        },
        changePage: (page: number) => changePage(page, pageSize),
        changePageSize,
        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
        handleSort,
    };
};
