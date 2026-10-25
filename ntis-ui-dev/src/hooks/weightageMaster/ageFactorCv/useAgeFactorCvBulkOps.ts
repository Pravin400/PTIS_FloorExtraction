"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import type { Option } from "@/components/common/select";
import {
    bulkCreateAgeFactorCVMasterAction,
    bulkUpdateAgeFactorCVMasterAction
} from "@/app/[locale]/property-tax/weightage-master/age-weightage/action";
import { getUserIdFromCookie } from "@/lib/utils/cookie";
import { buildGenerateAllPayload, prepareBulkUpdatePayloads } from "@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvBulkHelpers";
import { validateFactorValue, matchesFilterCriteria } from "@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation";

interface UseAgeFactorCvBulkOpsParams {
    selectionState: {
        selectedYear: string;
        constructionType: string[];
        selectedAgeRange: string[];
        ageFrom: string;
        ageTo: string;
        factorValue: string;
    };
    masterData: {
        data: AgeFactorCVMaster[];
        allAgeFactors: AgeFactorCVMaster[];
        constructionTypeOptions: Option[];
        ageRangeOptions: Option[];
    };
    sessionState: {
        editableRows: Record<string, AgeFactorCVMaster>;
        setEditableRows: Dispatch<SetStateAction<Record<string, AgeFactorCVMaster>>>;
        sessionCreatedUids: Set<string>;
        getRowUid: (row: AgeFactorCVMaster) => string;
        findRowByUid: (uid: string) => AgeFactorCVMaster | undefined;
    };
    callbacks: {
        addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
        clearFilters: () => void;
    };
}

/**
 * Main hook for handling bulk operations for Age Factor CV.
 * Refactored to use modular helper functions for payload building and validation.
 * Parameters are grouped into cohesive objects to reduce coupling.
 */
export const useAgeFactorCvBulkOps = ({
    selectionState,
    masterData,
    sessionState,
    callbacks,
}: UseAgeFactorCvBulkOpsParams) => {
    const { 
        selectedYear, 
        constructionType, 
        selectedAgeRange, 
        ageFrom, 
        ageTo, 
        factorValue 
    } = selectionState;
    
    const { 
        data, 
        allAgeFactors, 
        constructionTypeOptions, 
        ageRangeOptions 
    } = masterData;
    
    const { 
        editableRows, 
        setEditableRows, 
        sessionCreatedUids, 
        getRowUid, 
        findRowByUid 
    } = sessionState;
    
    const { addToast, clearFilters } = callbacks;

    const t = useTranslations('ageFactorMaster');
    const tW = useTranslations('weightageMaster');
    const locale = useLocale();
    const router = useRouter();
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);

    const handleApplyFilter = (): void => {
        const { isValid, factor } = validateFactorValue(factorValue);
        if (!isValid) {
            addToast('warning', t('messages.invalidFactorValue'));
            return;
        }

        const updatedRows: Record<string, AgeFactorCVMaster> = {};
        let updatedCount = 0;

        data.forEach((row) => {
            // Inactive records are non-editable — leave them untouched by bulk factor apply.
            if (row.isActive === false) return;
            if (matchesFilterCriteria(row, { constructionType, selectedAgeRange, ageFrom, ageTo, selectedYear })) {
                const rowUid = getRowUid(row);
                updatedRows[rowUid] = {
                    ...row,
                    ...editableRows[rowUid],
                    factor: factor,
                };
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            setEditableRows(prev => ({ ...prev, ...updatedRows }));
            addToast('success', tW('common.messages.factorApplied', { factor, count: updatedCount }));
        } else {
            addToast('warning', t('messages.noRecordsMatch'));
        }
    };

    const handleBulkUpdate = async (): Promise<void> => {
        const updatedEntries = Object.entries(editableRows);
        if (updatedEntries.length === 0) return;

        setIsBulkUpdating(true);
        try {
            const userId = getUserIdFromCookie() || 1;
            const { creates, updates } = prepareBulkUpdatePayloads(updatedEntries, findRowByUid, selectedYear, userId);

            if (creates.length > 0) {
                await bulkCreateAgeFactorCVMasterAction(creates);
            }
            if (updates.length > 0) {
                await bulkUpdateAgeFactorCVMasterAction(updates);
            }

            addToast('success', t('messages.bulkOperationSuccess'));
            setEditableRows({});
            clearFilters();
            router.push(`/${locale}/property-tax/weightage-master/age-weightage`);
        } catch (_error) {
            addToast('error', t('messages.bulkOperationFailed'));
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleGenerateAll = async (): Promise<void> => {
        if (!selectedYear) {
            addToast('warning', t('messages.assessmentYearMissing'));
            return;
        }

        if (constructionTypeOptions.length === 0) {
            addToast('warning', t('messages.noConstructionTypes'));
            return;
        }

        setIsGeneratingAll(true);
        try {
            const userId = getUserIdFromCookie() || 1;
            const defaultFactor = parseFloat(factorValue) || 0.00;
            
            const ageFactors = buildGenerateAllPayload({
                selectedYear,
                selectedAgeRange,
                ageRangeOptions,
                data,
                constructionType,
                constructionTypeOptions,
                allAgeFactors,
                editableRows,
                defaultFactor,
                userId,
                sessionCreatedUids,
                getRowUid,
            });

            if (ageFactors.length === 0) {
                addToast('info', t('messages.allRecordsExist'));
                setIsGeneratingAll(false);
                return;
            }

            const result = await bulkCreateAgeFactorCVMasterAction(ageFactors);
            
            if (result.success) {
                addToast('success', t('messages.recordsGeneratedSuccess', { count: ageFactors.length }));
                setEditableRows({});
                clearFilters();
                router.push(`/${locale}/property-tax/weightage-master/age-weightage`);
            } else {
                addToast('error', result.message || t('messages.generationFailed'));
            }
        } catch (_error) {
            addToast('error', t('messages.errorGeneratingRecords'));
        } finally {
            setIsGeneratingAll(false);
        }
    };

    return {
        isBulkUpdating,
        isGeneratingAll,
        handleApplyFilter,
        handleBulkUpdate,
        handleGenerateAll,
    };
};
