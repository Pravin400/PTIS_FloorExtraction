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
    const [selectedYear, setSelectedYear] = useState<string>(currentSelectedYear);
    const [editableRows, setEditableRows] = useState<Record<string, UseFactorCVMaster>>({});
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(currentTypeOfUse ? Number(currentTypeOfUse) : null);
    const [typeOfUseId, setTypeOfUseId] = useState<string>(currentTypeOfUse);
    const [factorValue, setFactorValue] = useState<string>("1.00");

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
