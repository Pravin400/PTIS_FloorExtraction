"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
    AgeFactorCVMaster,
    AgeFactorCVMasterCreate,
    AgeFactorCVMasterUpdate
} from "@/types/ageFactorCv.types";
import {
    createAgeFactorCVMasterAction,
    updateAgeFactorCVMasterAction
} from "@/app/[locale]/property-tax/weightage-master/age-weightage/action";
import { getUserIdFromCookie } from "@/lib/utils/cookie";

interface UseAgeFactorCvRowOpsParams {
    selectedYear: string;
    editableRows: Record<string, AgeFactorCVMaster>;
    setEditableRows: Dispatch<SetStateAction<Record<string, AgeFactorCVMaster>>>;
    setSessionCreatedUids: Dispatch<SetStateAction<Set<string>>>;
    addToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
    getRowUid: (row: AgeFactorCVMaster) => string;
}

export const useAgeFactorCvRowOps = ({
    selectedYear,
    editableRows,
    setEditableRows,
    setSessionCreatedUids,
    addToast,
    getRowUid,
}: UseAgeFactorCvRowOpsParams) => {
    const t = useTranslations('ageFactorMaster');
    const tW = useTranslations('weightageMaster');
    const locale = useLocale();
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async (row: AgeFactorCVMaster): Promise<void> => {
        const rowUid = getRowUid(row);
        const updatedData = editableRows[rowUid];

        if (!updatedData) {
            addToast('warning', tW('common.messages.noChangesToUpdate'));
            return;
        }

        const hasChanges = updatedData.factor !== row.factor;

        if (!hasChanges) {
            addToast('warning', tW('common.messages.noChangesDetected'));
            return;
        }

        const factorValue = updatedData.factor ?? row.factor;
        if (factorValue < 0.1) {
            addToast("error", tW('common.messages.validFactorRequired') || "Please enter a valid factor value greater than 0");
            return;
        }
        if (factorValue > 100) {
            addToast("error", tW('common.messages.factorPercentageExceedsMax'));
            return;
        }

        setIsUpdating(true);
        try {
            let result;
            const userId = getUserIdFromCookie() || 1;
            const yearId = Number(parseInt(selectedYear) || row.yearRangeCVId || row.yearRangeCVID || 0);

            if (row.id === 0) {
                if (!yearId) {
                    addToast('warning', t('messages.selectYearAndRange'));
                    setIsUpdating(false);
                    return;
                }
                const createPayload: AgeFactorCVMasterCreate = {
                    isActive: row.isActive,
                    createdBy: userId,
                    constructionTypeId: row.constructionTypeId,
                    ageFrom: row.ageFrom,
                    ageTo: row.ageTo,
                    factor: updatedData.factor,
                    yearRangeCVId: yearId,
                };
                result = await createAgeFactorCVMasterAction(createPayload);
            } else {
                const updatePayload: AgeFactorCVMasterUpdate = {
                    isActive: row.isActive,
                    updatedBy: userId,
                    constructionTypeId: row.constructionTypeId,
                    ageFrom: row.ageFrom,
                    ageTo: row.ageTo,
                    factor: updatedData.factor,
                    yearRangeCVId: yearId,
                };
                result = await updateAgeFactorCVMasterAction(row.id, updatePayload);
            }

            if (result.success) {
                addToast('success', t('messages.recordSavedSuccess'));
                if (row.id === 0) {
                    setSessionCreatedUids(prev => new Set([...prev, rowUid]));
                }
                setEditableRows({});
                router.push(`/${locale}/property-tax/weightage-master/age-weightage`);
            } else {
                addToast('error', result.message || t('messages.actionFailed'));
            }
        } catch (_error) {
            addToast('error', t('messages.failedToSaveRow'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelRow = (row: AgeFactorCVMaster): void => {
        const rowUid = getRowUid(row);
        setEditableRows((prev) => {
            const updated = { ...prev };
            delete updated[rowUid];
            return updated;
        });
        addToast('info', tW('common.messages.changesDiscarded'));
    };

    return {
        isUpdating,
        handleUpdate,
        handleCancelRow,
    };
};
