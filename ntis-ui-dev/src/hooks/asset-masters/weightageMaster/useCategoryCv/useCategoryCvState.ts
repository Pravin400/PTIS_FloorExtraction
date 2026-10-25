import { useState, useRef, useCallback } from "react";
import { UseFactorCVMaster } from "@/types/useCategoryCvFactor.types";

/**
 * Custom hook to manage the UI state for the Use Category CV module.
 * Centralizes state for selections, editable rows, loading states, and toasts.
 */
export function useCategoryCvState(
    currentSelectedYear: string, 
    currentTypeOfUse: string
) {
    const [userYear, setUserYear] = useState<string | null>(null);
    const [prevCurrentYear, setPrevCurrentYear] = useState<string>(currentSelectedYear);

    if (prevCurrentYear !== currentSelectedYear) {
        setPrevCurrentYear(currentSelectedYear);
        setUserYear(null);
    }

    const selectedYear = userYear ?? currentSelectedYear;
    const setSelectedYear = useCallback((year: string | ((prev: string) => string)) => {
        setUserYear((prev) => typeof year === "function" ? year(prev ?? currentSelectedYear) : year);
    }, [currentSelectedYear]);

    const [editableRows, setEditableRows] = useState<Record<string, UseFactorCVMaster>>({});
    
    const [userTypeOfUseId, setUserTypeOfUseId] = useState<string | null>(null);
    const [prevCurrentTypeOfUse, setPrevCurrentTypeOfUse] = useState<string>(currentTypeOfUse);

    if (prevCurrentTypeOfUse !== currentTypeOfUse) {
        setPrevCurrentTypeOfUse(currentTypeOfUse);
        setUserTypeOfUseId(null);
    }

    const typeOfUseId = userTypeOfUseId ?? currentTypeOfUse;
    const setTypeOfUseId = useCallback((val: string | ((prev: string) => string)) => {
        setUserTypeOfUseId((prev) => typeof val === "function" ? val(prev ?? currentTypeOfUse) : val);
    }, [currentTypeOfUse]);

    const selectedTypeId = typeOfUseId ? Number(typeOfUseId) : null;
    const setSelectedTypeId = useCallback((val: number | null | ((prev: number | null) => number | null)) => {
        setUserTypeOfUseId((prev) => {
            const currentNum = prev ? Number(prev) : (currentTypeOfUse ? Number(currentTypeOfUse) : null);
            const nextNum = typeof val === "function" ? val(currentNum) : val;
            return nextNum ? String(nextNum) : "";
        });
    }, [currentTypeOfUse]);

    const [factorValue, setFactorValue] = useState<string>("0.00");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; type: "success" | "error" | "info" | "warning"; message: string }>>([]);

    const hasShownWarningRef = useRef(false);

    const addToast = useCallback((type: "success" | "error" | "info" | "warning", message: string): void => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    const removeToast = useCallback((id: string): void => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return {
        selectedYear, setSelectedYear,
        editableRows, setEditableRows,
        selectedTypeId, setSelectedTypeId,
        typeOfUseId, setTypeOfUseId,
        factorValue, setFactorValue,
        isUpdating, setIsUpdating,
        isBulkUpdating, setIsBulkUpdating,
        isGeneratingAll, setIsGeneratingAll,
        toasts, setToasts,
        addToast, removeToast,
        hasShownWarningRef
    };
}
