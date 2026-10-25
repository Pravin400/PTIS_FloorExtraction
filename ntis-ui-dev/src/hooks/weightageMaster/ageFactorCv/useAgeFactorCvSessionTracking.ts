import { useState, useCallback } from "react";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import { getAgeFactorRowUid } from "@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation";

interface UseAgeFactorCvSessionTrackingParams {
    data: AgeFactorCVMaster[];
}

/**
 * Hook for tracking user edits and newly created records within the current session.
 */
export const useAgeFactorCvSessionTracking = ({ data }: UseAgeFactorCvSessionTrackingParams) => {
    const [editableRows, setEditableRows] = useState<Record<string, AgeFactorCVMaster>>({});
    const [sessionCreatedUids, setSessionCreatedUids] = useState<Set<string>>(new Set());

    const getRowUid = useCallback((row: AgeFactorCVMaster): string => {
        return getAgeFactorRowUid(row);
    }, []);

    const findRowByUid = useCallback((uid: string): AgeFactorCVMaster | undefined => {
        return data.find(row => getAgeFactorRowUid(row) === uid);
    }, [data]);

    return {
        editableRows,
        setEditableRows,
        sessionCreatedUids,
        setSessionCreatedUids,
        getRowUid,
        findRowByUid,
    };
};
