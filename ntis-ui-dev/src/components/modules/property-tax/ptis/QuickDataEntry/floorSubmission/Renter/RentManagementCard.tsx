"use client";

import React, { useState, useRef } from "react";
import { TrendingUp } from "lucide-react";
import { Input, Select } from "@/components/common";
import { Label } from "@/components/common/label";
import { useTranslations } from "next-intl";

import { RentIncrementCalculator } from "./RentIncrementCalculator";
import { DurationWiseRentDetails } from "./DurationWiseRentDetails";
import { CustomDateRangeManager } from "./CustomDateRangeManager";
import { RenterFormData, RenterFormDataDetails } from "@/types/renter/renter.types";
import { validateRenterForm } from "@/lib/utils/renter/renter-validation";
import { DateUtils } from "@/lib/utils/date-helpers";

const fieldLabelClassName =
    'text-xs leading-snug tracking-normal !font-semibold text-slate-700';

const errorClassName = 'text-[10px] text-red-500 font-medium mt-0.5 animate-in fade-in duration-200';
const errorBorderClassName = 'border-red-400 focus:ring-red-100';

const SummaryItem = ({ label, value, highlight = false, highlightColor = "text-orange-600" }: { label: string, value: string, highlight?: boolean, highlightColor?: string }) => (
    <div className="flex flex-col gap-0.5 min-w-[90px]">
        <span className="text-xs font-semibold text-slate-600 leading-snug tracking-normal">{label}</span>
        <span className={`text-xs font-bold leading-snug ${highlight ? highlightColor : "text-slate-900"}`}>{value}</span>
    </div>
);

interface RentManagementCardProps {
    formData: RenterFormData;
    setFormData: React.Dispatch<React.SetStateAction<RenterFormData>>;
}

export const RentManagementCard = React.memo(({
    formData,
    setFormData
}: RentManagementCardProps) => {
    const t = useTranslations('quickDataEntry');
    const [selectedFYFilter, setSelectedFYFilter] = useState<string | null>(null);
    const rentCalculatorRef = useRef<HTMLDivElement>(null);
    const renterDetails = formData?.renterDetails;

    // ─── Local Touched & Validation Logic ────────────────────────────────────
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    const markTouched = React.useCallback((field: string) => {
        setTouchedFields(prev => ({ ...prev, [field]: true }));
    }, []);

    React.useEffect(() => {
        if (!renterDetails) return;

        const validationErrors = validateRenterForm(renterDetails);
        const nextErrors: Record<string, string> = {};
        const fields = ['incrementFrequency', 'incrementType', 'incrementValue'];

        fields.forEach(field => {
            const err = validationErrors.find(e => e.field === field);
            if (err) {
                const val = renterDetails[field as keyof RenterFormDataDetails];
                const isEmpty = val === undefined || val === null || String(val).trim() === "" || val === 'No Increment';
                if (isEmpty) {
                    if (touchedFields[field]) nextErrors[field] = err.message;
                } else {
                    nextErrors[field] = err.message;
                }
            }
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFieldErrors(nextErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        renterDetails?.incrementFrequency, 
        renterDetails?.incrementType, 
        renterDetails?.incrementValue, 
        touchedFields
    ]);

    React.useEffect(() => {
        if (renterDetails?.incrementFrequency !== "Half-Yearly") return;
        setFormData((prev) => {
            return {
                ...prev,
                renterDetails: { ...prev.renterDetails, incrementFrequency: "Yearly" },
            };
        });
    }, [renterDetails?.incrementFrequency, setFormData]);

    return (
        <div id="rent-management-card" className="shrink-0 bg-gradient-to-br from-white via-blue-50/20 to-white rounded-xl border-2 border-gray-300 shadow-sm p-4 space-y-3 transition-all duration-500 origin-top group/card relative overflow-hidden animate-[fadeIn_0.3s_ease-out] hover:border-blue-400 focus-within:border-blue-500 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.2)] scroll-mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 tracking-tight">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    {t('floor.renterSection.rentManagementEngine')}
                </h3>
            </div>

            {/* Main Controls - Aligned with the fields above */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 pb-1">
                {/* Frequency Selection */}
                <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.incrementFrequency')}</Label>
                    <Select 
                        value={renterDetails?.incrementFrequency || "No Increment"}
                        onChange={(_, val) => {
                            markTouched('incrementFrequency');
                            setFormData((prev) => {
                                const frequency = val as RenterFormDataDetails['incrementFrequency'];
                                return {
                                    ...prev, 
                                    renterDetails: {
                                        ...prev.renterDetails, 
                                        incrementFrequency: frequency, 
                                        incrementValue: "",
                                        customDateRanges: frequency === "Custom Date" ? (prev.renterDetails?.customDateRanges || []) : []
                                    }
                                };
                            });
                        }}
                        onBlur={() => markTouched('incrementFrequency')}
                        options={[
                            { label: t('floor.renterSection.noIncrement'), value: "No Increment" },
                            { label: t('floor.renterSection.monthly'), value: "Monthly" },
                            { label: t('floor.renterSection.quarterly'), value: "Quarterly" },
                            { label: t('floor.renterSection.yearly'), value: "Yearly" },
                            { label: t('floor.renterSection.customDates'), value: "Custom Date" }
                        ]}
                        error={fieldErrors.incrementFrequency ? " " : undefined}
                        className="h-10 font-medium text-slate-950 text-xs rounded-md w-full"
                    />
                    {fieldErrors.incrementFrequency && <p className={errorClassName}>{fieldErrors.incrementFrequency}</p>}
                </div>

                {/* Increment Type Selection */}
                <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.incrementType')}</Label>
                    <Select 
                        value={renterDetails?.incrementType || "Percentage"}
                        onChange={(_, val) => {
                            markTouched('incrementType');
                            setFormData((prev) => {
                                return {...prev, renterDetails: {...prev.renterDetails, incrementType: val as RenterFormDataDetails['incrementType'], incrementValue: ""}};
                            });
                        }}
                        onBlur={() => markTouched('incrementType')}
                        options={[
                            { label: "Percentage (%)", value: "Percentage" },
                            { label: t('floor.renterSection.fixedAmount'), value: "Fixed" }
                        ]}
                        error={fieldErrors.incrementType ? " " : undefined}
                        className="h-10 font-medium text-slate-950 text-xs rounded-md w-full"
                    />
                    {fieldErrors.incrementType && <p className={errorClassName}>{fieldErrors.incrementType}</p>}
                </div>

                {/* Increment Value Input */}
                <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.incrementValue')}</Label>
                    <div className="relative">
                        <Input 
                            type="text" 
                            inputMode={renterDetails?.incrementType === "Percentage" ? "numeric" : "decimal"}
                            maxLength={renterDetails?.incrementType === "Percentage" ? 3 : 8}
                            value={renterDetails?.incrementValue || ""} 
                            onChange={e => {
                                let val = e.target.value;
                                if (renterDetails?.incrementType === "Percentage") {
                                    val = val.replace(/[^0-9]/g, '').slice(0, 3);
                                } else {
                                    if (val !== "" && !/^\d*(\.\d{0,2})?$/.test(val)) return; // Block negative, positive, more than 2 decimal places, and non-numeric
                                    const integerPart = val.split('.')[0];
                                    if (integerPart.length > 5) return; // Prevent typing more than 5 digits before decimal
                                }
                                setFormData((prev) => {
                                    return {...prev, renterDetails: {...prev.renterDetails, incrementValue: val}};
                                });
                                markTouched('incrementValue');
                            }}
                            onBlur={() => markTouched('incrementValue')}
                            placeholder="e.g. 5"
                            className={`h-10 bg-white rounded-md font-medium text-slate-950 focus:ring-4 focus:ring-blue-50/50 transition-all pr-8 text-xs w-full ${fieldErrors.incrementValue ? errorBorderClassName : 'border-gray-200'}`}
                        />
                        {renterDetails?.incrementType !== "Fixed" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                                {"%"}
                            </span>
                        )}
                    </div>
                    {fieldErrors.incrementValue && <p className={errorClassName}>{fieldErrors.incrementValue}</p>}
                </div>
            </div>

            {/* Custom Date Ranges Section - Only show when Custom Date is selected */}
            {renterDetails?.incrementFrequency === "Custom Date" && (
                <div className="mt-4">
                    <CustomDateRangeManager 
                        formData={formData} 
                        setFormData={setFormData} 
                    />
                </div>
            )}

            {/* Enhanced Summary Bar - Aligned with the fields above */}
            <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl px-4 py-2 shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-2">
                    <SummaryItem label={t('floor.renterSection.baseRent')} value={`₹ ${parseFloat(String(renterDetails?.rentAmount || "0")).toLocaleString("en-IN")}`} />
                </div>
                <div className="lg:col-span-2">
                    <SummaryItem 
                        label={renterDetails?.incrementType === "Fixed" ? "Fixed Amount Increment" : t('floor.renterSection.increment')} 
                        value={renterDetails?.incrementType === "Fixed" 
                            ? `₹ ${parseFloat(String(renterDetails?.incrementValue || "0")).toLocaleString("en-IN")}`
                            : `${renterDetails?.incrementValue || "0"}%`
                        } 
                        highlight 
                    />
                </div>
                <div className="lg:col-span-2">
                    <SummaryItem label={t('floor.renterSection.type')} value={renterDetails?.incrementType?.toLowerCase()?.includes("percent") ? t('floor.renterSection.percentage') : t('floor.renterSection.fixedAmount')} />
                </div>
                <div className="lg:col-span-2">
                    <SummaryItem label={t('floor.renterSection.frequency')} value={renterDetails?.incrementFrequency || t('floor.renterSection.noIncrement')} />
                </div>
                <div className="lg:col-span-2">
                    <SummaryItem 
                        label={t('floor.renterSection.duration')} 
                        value={DateUtils.calculateDurationYearsMonths(
                            renterDetails?.agreementDateFrom,
                            renterDetails?.agreementDateTo
                        )} 
                    />
                </div>
                <div className="lg:col-span-2 text-right lg:text-left">
                    <SummaryItem 
                        label={t('floor.renterSection.baseAnnual')} 
                        value={`₹ ${parseFloat(String(Number(renterDetails?.rentAmount || 0) * 12)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} 
                        highlightColor="text-blue-600" 
                        highlight
                    />
                </div>
            </div>

            {/* Financial Year Breakdown Table */}
            <div className="mt-4" ref={rentCalculatorRef}>
                <RentIncrementCalculator 
                    formData={formData} 
                    setFormData={setFormData} 
                    selectedFYFilter={selectedFYFilter}
                    onClearFilter={() => setSelectedFYFilter(null)}
                />
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
                 <DurationWiseRentDetails 
                    formData={formData} 
                    onViewDetails={(fy) => {
                        setSelectedFYFilter(fy);
                        rentCalculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                 />
            </div>
        </div>
    );
});

RentManagementCard.displayName = 'RentManagementCard';
