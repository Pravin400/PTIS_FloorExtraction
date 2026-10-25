"use client";

import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { validateDateRange, getNextCustomRangeFromDate, parseDateOnly } from "@/lib/utils/renter/renterUtils";
import { calculateRangeTotal } from "./CustomDateRangeUtils";
import { AddRangeForm } from "./AddRangeForm";
import { CustomRangesTable } from "./CustomRangesTable";
import { CustomRangesSummary } from "./CustomRangesSummary";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useTranslations } from "next-intl";
import { RenterFormData, CustomDateRange } from "@/types/renter/renter.types";

interface CustomDateRangeManagerProps {
    formData: RenterFormData;
    setFormData: React.Dispatch<React.SetStateAction<RenterFormData>>;
    showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

type NewRangeData = {
    fromDate: string;
    toDate: string;
    incrementType: 'Percentage' | 'Fixed';
    incrementValue: string | number;
    calculationMethod: 'Base Value' | 'Incremented Value';
};

const EMPTY_RANGE: NewRangeData = {
    fromDate: '',
    toDate: '',
    incrementType: 'Percentage',
    incrementValue: '',
    calculationMethod: 'Base Value',
};

export const CustomDateRangeManager = memo(({ formData, setFormData }: CustomDateRangeManagerProps) => {
    const t = useTranslations('quickDataEntry');
    const { confirm } = useConfirm();
    const AGREEMENT_FROM_DATE = formData?.renterDetails?.agreementDateFrom || '';
    const AGREEMENT_TO_DATE = formData?.renterDetails?.agreementDateTo || '';
    const originalBaseRent = parseFloat(String(formData?.renterDetails?.rentAmount ?? "0"));
    const customDateRanges = useMemo(
        () => (formData?.renterDetails?.customDateRanges || []) as CustomDateRange[],
        [formData?.renterDetails?.customDateRanges]
    );

    const [newRangeData, setNewRangeData] = useState<NewRangeData>(EMPTY_RANGE);
    const [dateRangeErrors, setDateRangeErrors] = useState<Record<string, string>>({ fromDate: '', toDate: '', incrementValue: '', general: '' });
    const [hasValidationError, setHasValidationError] = useState(false);

    // ─── Touch and Real-time Validation States for Range Form ───────────────
    const [rangeTouched, setRangeTouched] = useState<Record<string, boolean>>({});

    const markRangeTouched = React.useCallback((field: string) => {
        setRangeTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const agreementStartDate = useMemo(
        () => parseDateOnly(AGREEMENT_FROM_DATE) ?? new Date(AGREEMENT_FROM_DATE),
        [AGREEMENT_FROM_DATE]
    );
    const agreementEndDate = useMemo(
        () => parseDateOnly(AGREEMENT_TO_DATE) ?? new Date(AGREEMENT_TO_DATE),
        [AGREEMENT_TO_DATE]
    );
    const minFromDate = useMemo(
        () => getNextCustomRangeFromDate(customDateRanges, AGREEMENT_FROM_DATE),
        [customDateRanges, AGREEMENT_FROM_DATE]
    );

    useEffect(() => {
        if (!AGREEMENT_FROM_DATE) return;
        const nextFrom = getNextCustomRangeFromDate(customDateRanges, AGREEMENT_FROM_DATE);
        setNewRangeData(prev => ({ ...prev, fromDate: nextFrom }));
    }, [AGREEMENT_FROM_DATE, customDateRanges]);

    // Centralized reactive hook for custom date range form inputs
    useEffect(() => {
        const isFromEmpty = !newRangeData.fromDate;
        const isToEmpty = !newRangeData.toDate;
        const isIncEmpty = !newRangeData.incrementValue;

        // If everything is untouched and empty, hide validation errors
        if (isFromEmpty && isToEmpty && isIncEmpty && Object.keys(rangeTouched).length === 0) {
            setDateRangeErrors({ fromDate: '', toDate: '', incrementValue: '', general: '' });
            setHasValidationError(false);
            return;
        }

        const validation = validateDateRange({
            newRangeData,
            agreementStart: agreementStartDate,
            agreementEnd: agreementEndDate,
            existingRanges: customDateRanges
        });

        const nextErrors: Record<string, string> = { fromDate: '', toDate: '', incrementValue: '', general: '' };

        if (validation.errors.fromDate && rangeTouched.fromDate) {
            nextErrors.fromDate = validation.errors.fromDate;
        }
        if (validation.errors.toDate && rangeTouched.toDate) {
            nextErrors.toDate = validation.errors.toDate;
        }
        if (validation.errors.incrementValue && rangeTouched.incrementValue) {
            nextErrors.incrementValue = validation.errors.incrementValue;
        }
        if (validation.errors.general) {
            nextErrors.general = validation.errors.general;
        }

        setDateRangeErrors(nextErrors);
        setHasValidationError(!!(nextErrors.fromDate || nextErrors.toDate || nextErrors.incrementValue || nextErrors.general));
    }, [newRangeData, rangeTouched, agreementStartDate, agreementEndDate, customDateRanges]);

    const activeRangesTableData = useMemo(() => customDateRanges.map((range: CustomDateRange, index: number) => {
        const { durationMonths, durationTotal } = calculateRangeTotal(range, index, customDateRanges, originalBaseRent);
        return { id: range.id, rowIndex: index + 1, durationMonths, durationTotal, range, incrementSource: range, methodSource: range };
    }), [customDateRanges, originalBaseRent]);

    const summaryData = useMemo(() => {
        if (activeRangesTableData.length === 0 || originalBaseRent <= 0) return { grandTotal: 0, totalRanges: 0, baseRent: originalBaseRent };
        let grandTotal = 0;
        activeRangesTableData.forEach((row) => {
            grandTotal += row.durationTotal;
        });
        return { grandTotal, totalRanges: activeRangesTableData.length, baseRent: originalBaseRent };
    }, [activeRangesTableData, originalBaseRent]);

    const handleAddRange = () => {
        // Mark all fields as touched to reveal any validation errors immediately
        setRangeTouched({ fromDate: true, toDate: true, incrementValue: true });

        const validation = validateDateRange({
            newRangeData,
            agreementStart: agreementStartDate,
            agreementEnd: agreementEndDate,
            existingRanges: customDateRanges
        });

        if (!validation.isValid) {
            setDateRangeErrors(validation.errors as unknown as Record<string, string>);
            setHasValidationError(true);
            return;
        }

        const newRange: CustomDateRange = {
            ...newRangeData,
            id: Date.now().toString(),
            incrementValue: parseFloat(String(newRangeData.incrementValue)),
        };
        const updatedRanges = [...customDateRanges, newRange].sort(
            (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
        );
        setFormData(prev => {
            return { ...prev, renterDetails: { ...prev.renterDetails, customDateRanges: updatedRanges } };
        });
        const nextFrom = getNextCustomRangeFromDate(updatedRanges, AGREEMENT_FROM_DATE);
        setNewRangeData({ ...EMPTY_RANGE, fromDate: nextFrom });
        setRangeTouched({});
        setDateRangeErrors({ fromDate: '', toDate: '', incrementValue: '', general: '' });
        setHasValidationError(false);
        toast.success(t('floor.renterSection.add'));
    };

    const handleDeleteRange = useCallback((id: string) => {
        confirm({
            variant: "delete",
            title: `${t('floor.renterSection.confirmDeletion')}?`,
            description: t('floor.renterSection.areYouSureDeleteRange'),
            confirmText: t('floor.renterSection.delete'),
            cancelText: t('floor.renterSection.cancel'),
            onConfirm: () => {
                setFormData(prev => ({
                    ...prev,
                    renterDetails: {
                        ...prev.renterDetails,
                        customDateRanges: (prev.renterDetails?.customDateRanges || []).filter(r => r.id !== id)
                    }
                }));
                toast.success(t('floor.renterSection.deleted'));
            }
        });
    }, [confirm, setFormData, t]);

    return (
        <div className={`space-y-4 bg-white/60 border border-gray-200 rounded-xl p-4 shadow-sm ${hasValidationError ? "ring-2 ring-red-400 border-red-300" : ""}`}>
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> 
                    {t('floor.renterSection.customDateRanges')}
                </h4>
            </div>
            {dateRangeErrors.general && <div className="bg-red-100 border-2 border-red-500 rounded-lg px-4 py-2 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-600" /><span className="text-xs text-red-800 font-bold">{dateRangeErrors.general}</span></div>}
            <AddRangeForm newRangeData={newRangeData} setNewRangeData={setNewRangeData} onAdd={handleAddRange} agreementStart={AGREEMENT_FROM_DATE} agreementEnd={AGREEMENT_TO_DATE} minFromDate={minFromDate} errors={dateRangeErrors} hasValidationError={hasValidationError} markRangeTouched={markRangeTouched} />
            {customDateRanges.length > 0 && (
                <div className="space-y-3">
                    <CustomRangesTable data={activeRangesTableData} onDelete={handleDeleteRange} />
                    <CustomRangesSummary summaryData={summaryData} />
                </div>
            )}
        </div>
    );
});
CustomDateRangeManager.displayName = 'CustomDateRangeManager';
