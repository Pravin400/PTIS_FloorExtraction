"use client";

import { useState, useCallback } from "react";
import { FloorFactorCVMaster } from "@/types/floor-cv-weightageMaster.types";

interface UseFloorCvSessionTrackingParams {
    data: FloorFactorCVMaster[];
}

/**
 * Hook for tracking user edits and newly created records within the current session for Floor CV.
 */
export const useFloorCvSessionTracking = ({ data }: UseFloorCvSessionTrackingParams) => {
    const [editableRows, setEditableRows] = useState<Record<string, FloorFactorCVMaster>>({});
    const [sessionCreatedUids, setSessionCreatedUids] = useState<Set<string>>(new Set());

    // Helper function to generate unique row identifier
    const getRowUid = useCallback((row: FloorFactorCVMaster): string => {
        return `${row.id}-${row.floorId}-${row.yearRangeCVID || row.yearRangeCVId || "noYear"}-${row.fromYear}-${row.toYear}`;
    }, []);

    // Helper function to find row by UID
    const findRowByUid = useCallback((uid: string): FloorFactorCVMaster | undefined => {
        return data.find((row) => getRowUid(row) === uid);
    }, [data, getRowUid]);

    return {
        editableRows,
        setEditableRows,
        sessionCreatedUids,
        setSessionCreatedUids,
        getRowUid,
        findRowByUid,
    };
};
