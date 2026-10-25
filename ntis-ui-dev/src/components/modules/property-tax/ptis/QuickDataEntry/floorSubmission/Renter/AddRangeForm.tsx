"use client";
import React, { useRef } from 'react';


import { Label } from "@/components/common/label";
import { Input, Select, Button } from "@/components/common";
import { Plus, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { addDays } from "@/lib/utils/renter/renterUtils";

const toDisplayDate = (val: string) => {
    if (!val) return '';
    const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`;
    const parts = val.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return val;
};

const toValueDate = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (
        parts.length === 3 &&
        parts[0].length === 2 &&
        parts[1].length === 2 &&
        parts[2].length === 4
    ) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return val;
};

const formatManualDate = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let res = '';
    if (digits.length > 0) res += digits.slice(0, 2);
    if (digits.length > 2) res += '-' + digits.slice(2, 4);
    if (digits.length > 4) res += '-' + digits.slice(4, 8);
    return res;
};

const triggerDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
        try {
            if (typeof ref.current.showPicker === 'function') ref.current.showPicker();
            else ref.current.click();
        } catch (_e) {
            ref.current.click();
        }
    }
};

const fieldLabelClassName = "text-xs leading-snug tracking-normal !font-semibold text-slate-700";

interface NewRangeData {
    fromDate: string;
    toDate: string;
    incrementType: 'Percentage' | 'Fixed';
    incrementValue: string | number;
    calculationMethod: 'Base Value' | 'Incremented Value';
}

interface AddRangeFormProps {
    newRangeData: NewRangeData;
    setNewRangeData: React.Dispatch<React.SetStateAction<NewRangeData>> | ((data: NewRangeData) => void);
    onAdd: () => void;
    agreementStart: string;
    agreementEnd: string;
    minFromDate: string;
    errors: Record<string, string>;
    hasValidationError: boolean;
    markRangeTouched: (field: string) => void;
}

export const AddRangeForm = ({ 
    newRangeData, 
    setNewRangeData, 
    onAdd, 
    agreementStart, 
    agreementEnd,
    minFromDate,
    errors,
    hasValidationError: _hasValidationError,
    markRangeTouched
}: AddRangeFormProps) => {
    const t = useTranslations('quickDataEntry');
    const effectiveMinFrom = minFromDate || agreementStart;
    const minToDate = newRangeData.fromDate ? addDays(newRangeData.fromDate, 1) : effectiveMinFrom;
    
    const fromDateRef = useRef<HTMLInputElement>(null);
    const toDateRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-white border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    {t('floor.renterSection.addNewDateRange')}
                </div>
            </div>
            
            <div className="flex items-start gap-4 flex-wrap lg:flex-nowrap">
                <div className="flex-1 min-w-[140px] space-y-1.5 relative">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.fromDate')} *</Label>
                    <div className={`flex items-center bg-white border rounded-md px-2.5 h-8 ${errors.fromDate ? 'border-red-400' : 'border-gray-300'}`}>
                        <Input
                            type="text"
                            placeholder="dd-mm-yyyy"
                            naked
                            maxLength={10}
                            value={toDisplayDate(newRangeData.fromDate)}
                            onChange={(e) => {
                                const formatted = formatManualDate(e.target.value).slice(0, 10);
                                setNewRangeData({ ...newRangeData, fromDate: toValueDate(formatted) });
                                if (formatted.length === 10) {
                                    markRangeTouched('fromDate');
                                }
                            }}
                            onBlur={() => markRangeTouched('fromDate')}
                            className="border-none bg-transparent h-7 p-0 text-xs font-bold flex-1 outline-none min-w-0 text-slate-800 placeholder:text-slate-400"
                        />
                        <Calendar
                            className="w-3.5 h-3.5 text-gray-400 cursor-pointer shrink-0 hover:text-blue-600"
                            tabIndex={-1}
                            onClick={() => triggerDatePicker(fromDateRef)}
                        />
                    </div>
                    <Input
                        type="date"
                        ref={fromDateRef}
                        naked
                        tabIndex={-1}
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        min={effectiveMinFrom}
                        max={agreementEnd}
                        value={newRangeData.fromDate}
                        onChange={(e) => {
                            setNewRangeData({ ...newRangeData, fromDate: e.target.value });
                            markRangeTouched('fromDate');
                        }}
                    />
                    {errors.fromDate && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.fromDate}</p>}
                </div>

                <div className="flex-1 min-w-[140px] space-y-1.5 relative">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.toDate')} *</Label>
                    <div className={`flex items-center bg-white border rounded-md px-2.5 h-8 ${errors.toDate ? 'border-red-400' : 'border-gray-300'}`}>
                        <Input
                            type="text"
                            placeholder="dd-mm-yyyy"
                            naked
                            maxLength={10}
                            value={toDisplayDate(newRangeData.toDate)}
                            onChange={(e) => {
                                const formatted = formatManualDate(e.target.value).slice(0, 10);
                                setNewRangeData({ ...newRangeData, toDate: toValueDate(formatted) });
                                if (formatted.length === 10) {
                                    markRangeTouched('toDate');
                                }
                            }}
                            onBlur={() => markRangeTouched('toDate')}
                            className="border-none bg-transparent h-7 p-0 text-xs font-bold flex-1 outline-none min-w-0 text-slate-800 placeholder:text-slate-400"
                        />
                        <Calendar
                            className="w-3.5 h-3.5 text-gray-400 cursor-pointer shrink-0 hover:text-blue-600"
                            tabIndex={-1}
                            onClick={() => triggerDatePicker(toDateRef)}
                        />
                    </div>
                    <Input
                        type="date"
                        ref={toDateRef}
                        naked
                        tabIndex={-1}
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        min={minToDate}
                        max={agreementEnd}
                        value={newRangeData.toDate}
                        onChange={(e) => {
                            setNewRangeData({ ...newRangeData, toDate: e.target.value });
                            markRangeTouched('toDate');
                        }}
                    />
                    {errors.toDate && <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.toDate}</p>}
                </div>

                <div className="flex-1 min-w-[150px] space-y-1.5">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.incrementType')} *</Label>
                    <Select
                        value={newRangeData.incrementType}
                        onChange={(_, val) => setNewRangeData({ ...newRangeData, incrementType: val as 'Percentage' | 'Fixed' })}
                        options={[
                            { label: `${t('floor.renterSection.percentage')} %`, value: "Percentage" }, 
                            { label: `${t('floor.renterSection.fixedAmount')} ₹`, value: "Fixed" }
                        ]}
                        className="h-8 text-xs font-bold"
                    />
                </div>

                <div className="flex-1 min-w-[100px] space-y-1.5">
                    <Label className={fieldLabelClassName}>{newRangeData.incrementType === 'Percentage' ? `${t('floor.renterSection.value')} (%)` : `${t('floor.renterSection.amount')} (₹)`} *</Label>
                    <Input
                        type="text"
                        inputMode={newRangeData.incrementType === 'Percentage' ? 'numeric' : 'decimal'}
                        maxLength={newRangeData.incrementType === 'Percentage' ? 3 : 8}
                        value={newRangeData.incrementValue}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (newRangeData.incrementType === 'Percentage') {
                                val = val.replace(/[^0-9]/g, '').slice(0, 3);
                            } else {
                                if (val !== "" && !/^\d*(\.\d{0,2})?$/.test(val)) return; // Block negative, positive, more than 2 decimal places, and non-numeric
                                const integerPart = val.split('.')[0];
                                if (integerPart.length > 5) return; // Prevent typing more than 5 digits before decimal
                            }
                            setNewRangeData({ ...newRangeData, incrementValue: val });
                            markRangeTouched('incrementValue');
                        }}
                        onBlur={() => markRangeTouched('incrementValue')}
                        placeholder={newRangeData.incrementType === 'Percentage' ? '10' : '500'}
                        error={errors.incrementValue}
                        className="h-8 text-xs font-bold"
                    />
                </div>

                <div className="flex-1 min-w-[150px] space-y-1.5">
                    <Label className={fieldLabelClassName}>{t('floor.renterSection.method')} *</Label>
                    <Select
                        value={newRangeData.calculationMethod}
                        onChange={(_, val) => setNewRangeData({ ...newRangeData, calculationMethod: val as 'Base Value' | 'Incremented Value' })}
                        options={[
                            { label: t('floor.renterSection.baseValueLinear'), value: "Base Value" }, 
                            { label: t('floor.renterSection.incrementedCompounding'), value: "Incremented Value" }
                        ]}
                        className="h-8 text-xs font-bold"
                    />
                </div>

                <div className="pt-[22px]">
                    <Button
                        disabled={!newRangeData.fromDate || !newRangeData.toDate || !newRangeData.incrementValue}
                        onClick={onAdd}
                        className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
                    >
                        <Plus className="w-3.5 h-3.5" /> {t('floor.renterSection.add')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
