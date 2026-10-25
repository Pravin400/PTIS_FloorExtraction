import React from "react";
import { Option } from "@/components/common/select";
import { SearchSelect } from "@/components/common/SearchSelect";
import { MultiSelect } from "@/components/common/MultiSelect";
import { Input } from "@/components/common/Input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { X } from "lucide-react";
import {
    UpdateButton,
    ClearButton,
    ApplyButton,
    CancelButton,
    AddButton
} from "@/components/common/ActionButtons";
import { POSITIVE_DECIMAL_INVALID_KEYS, sanitizePositiveDecimal } from "@/lib/utils/validation";
import { toast } from "sonner";
import { useOptionTooltips } from "@/hooks/weightageMaster/useOptionTooltips";

interface AgeFactorCvHeaderExtraProps {
    t: (key: string, values?: Record<string, string | number>) => string;
    tW: (key: string, values?: Record<string, string | number>) => string;
    assessmentYearOptions: Option[];
    constructionTypeOptions: Option[];
    ageRangeOptions: Option[];
    selectedYear: string;
    constructionType: string[];
    selectedAgeRange: string[];
    ageFrom: string;
    ageTo: string;
    factorValue: string;
    hasNewRecords: boolean;
    newRecordsCount: number;

    isGeneratingAll: boolean;
    isBulkUpdating: boolean;
    isUpdating: boolean;
    isAddYearRangeModalOpen: boolean;
    setIsAddYearRangeModalOpen: (open: boolean) => void;
    handleAssessmentYearChange: (value: string) => void;
    handleConstructionTypeChange: (values: string[]) => void;
    handleAgeRangeChange: (values: string[]) => void;
    setAgeFrom: (value: string) => void;
    setAgeTo: (value: string) => void;
    setFactorValue: (value: string) => void;
    handleAddAgeRange: () => void;
    handleApplyFilter: () => void;
    handleClearAll: () => void;
    handleBulkUpdate: () => void;
    handleGenerateAll: () => void;
    editableRowsCount: number;
    aliases?: Record<string, string>;
}

export const AgeFactorCvHeaderExtra: React.FC<AgeFactorCvHeaderExtraProps> = ({
    t,
    tW,
    assessmentYearOptions,
    constructionTypeOptions,
    ageRangeOptions,
    selectedYear,
    constructionType,
    selectedAgeRange,
    ageFrom,
    ageTo,
    factorValue,
    hasNewRecords,
    newRecordsCount,

    isGeneratingAll,
    isBulkUpdating,
    isUpdating,
    isAddYearRangeModalOpen,
    setIsAddYearRangeModalOpen,
    handleAssessmentYearChange,
    handleConstructionTypeChange,
    handleAgeRangeChange,
    setAgeFrom,
    setAgeTo,
    setFactorValue,
    handleAddAgeRange,
    handleApplyFilter,
    handleClearAll,
    handleBulkUpdate,
    handleGenerateAll,
    editableRowsCount,
    aliases,
}) => {
    const { containerRef: optionTooltipsRef, tooltip } = useOptionTooltips<HTMLDivElement>();
    return (
        <div ref={optionTooltipsRef} className="contents">
            {tooltip}
            {/* Assessment Year */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-gray-600 ml-0.5">{t('filters.assessmentYear', aliases)}</span>
                <div className="w-[140px] z-30">
                    <SearchSelect
                        name="assessmentYear"
                        options={assessmentYearOptions}
                        value={selectedYear}
                        onChange={(_, val) => handleAssessmentYearChange(val)}
                        placeholder={t('placeholders.select')}
                    />
                </div>
            </div>

            {/* Construction Type */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-gray-600 ml-0.5">{t('filters.constructionType', aliases)}</span>
                <div className="w-[280px] z-30">
                    <MultiSelect
                        name="constructionType"
                        options={constructionTypeOptions}
                        value={constructionType}
                        onChange={handleConstructionTypeChange}
                        selectSize="sm"
                        placeholder={t('placeholders.select')}
                    />
                </div>
            </div>

            {/* Year Range */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-gray-600 ml-0.5">{t('filters.ageRange')}</span>
                <div className="flex gap-2">
                    <div className="w-[140px] z-30">
                        <MultiSelect
                            name="ageRange"
                            options={ageRangeOptions}
                            value={selectedAgeRange}
                            onChange={handleAgeRangeChange}
                            selectSize="sm"
                            placeholder={t('placeholders.selectRange')}
                        />
                    </div>
                    {/* Add Range Button & Modal */}
                    <div className="relative">
                        <AddButton
                            size="sm"
                            label={t('buttons.addAge')}
                            onClick={() => setIsAddYearRangeModalOpen(!isAddYearRangeModalOpen)}
                        />

                        {isAddYearRangeModalOpen && (
                            <div className="absolute top-12 left-0 z-50 w-72 bg-white rounded-xl shadow-2xl border border-[#DCEAFF] p-5 animate-in fade-in zoom-in duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-[#1E3A8A]">{t('labels.addAgeRange')}</h3>
                                    <button
                                        onClick={() => setIsAddYearRangeModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title={t('labels.close')}
                                        aria-label={t('labels.close')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold text-gray-500">{t('labels.minYear')}</label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={t('placeholders.minYear')}
                                            value={ageFrom}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                if (value.length <= 3) {
                                                    setAgeFrom(value);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                                                const isDigit = /^[0-9]$/.test(e.key);
                                                const isCtrlCmd = e.ctrlKey || e.metaKey;
                                                if (isCtrlCmd && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                                                if (!isDigit && !allowedKeys.includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            maxLength={3}
                                            className="h-9 text-sm border-[#DCEAFF]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold text-gray-500">{t('labels.maxYear')}</label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={t('placeholders.maxYear')}
                                            value={ageTo}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                if (value.length <= 3) {
                                                    setAgeTo(value);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                                                const isDigit = /^[0-9]$/.test(e.key);
                                                const isCtrlCmd = e.ctrlKey || e.metaKey;
                                                if (isCtrlCmd && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                                                if (!isDigit && !allowedKeys.includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            maxLength={3}
                                            className="h-9 text-sm border-[#DCEAFF]"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <AddButton
                                        size="sm"
                                        className="flex-1 h-9 bg-blue-600"
                                        onClick={handleAddAgeRange}
                                        label={tW('common.buttons.add')}
                                    />
                                    <CancelButton
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() => setIsAddYearRangeModalOpen(false)}
                                        label={tW('common.buttons.cancel')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Factor */}
            <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-gray-600 ml-0.5">{t('filters.factor')}</span>
                <Input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="100"
                    value={factorValue}
                    onChange={(e) => {
                        const sanitized = sanitizePositiveDecimal(e.target.value, 2);
                        if (sanitized === '') {
                            setFactorValue(sanitized);
                        } else if (parseFloat(sanitized) > 100) {
                            toast.error(tW('common.messages.factorPercentageExceedsMax'));
                        } else if (parseFloat(sanitized) >= 0) {
                            setFactorValue(sanitized);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (POSITIVE_DECIMAL_INVALID_KEYS.test(e.key)) {
                            e.preventDefault();
                        }
                    }}
                    className="h-[34px] w-[80px] text-sm border-[#DCEAFF]"
                    placeholder="0.00"
                />
            </div>

            {/* Status Badge */}
            {hasNewRecords && (
                <div className="mb-0.5 mt-6">
                    <StatusBadge
                        variant="pending"
                        label={tW('common.labels.pendingRecordCreates', { count: newRecordsCount })}
                        className="px-3 py-1.5 h-[34px] text-[11px] font-bold bg-[#FFF4E5] text-[#B76E00] border-none"
                    />
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-0.5 mt-6">
                <AddButton
                    size="sm"
                    onClick={handleGenerateAll}
                    disabled={!hasNewRecords || isGeneratingAll || isBulkUpdating || isUpdating}
                    className="h-[34px] px-4 font-bold bg-[#0052CC]"
                    label={isGeneratingAll ? tW('common.buttons.generating') : tW('common.buttons.generateAll')}
                />
                <ApplyButton
                    size="sm"
                    label={tW('common.buttons.apply')}
                    onClick={handleApplyFilter}
                    disabled={!selectedYear && constructionType.length === 0 && selectedAgeRange.length === 0}
                    className="h-[34px] px-4 font-bold bg-[#52C41A]"
                />
                <ClearButton
                    size="sm"
                    label={tW('common.buttons.clear')}
                    onClick={handleClearAll}
                    className="h-[34px] px-4 font-bold border-[#DCEAFF] text-[#1E3A8A]"
                />
                <UpdateButton
                    size="sm"
                    label={isBulkUpdating ? tW('common.buttons.updating') : tW('common.buttons.update')}
                    onClick={handleBulkUpdate}
                    disabled={editableRowsCount === 0 || isBulkUpdating}
                    className="h-[34px] px-4 font-bold bg-[#69C0FF]"
                />
                <CancelButton
                    size="sm"
                    label={tW('common.buttons.cancel')}
                    onClick={handleClearAll}
                    className="h-[34px] px-4 font-bold border-[#DCEAFF] text-[#1E3A8A]"
                />
            </div>
        </div>
    );
};
