import React from "react";
import { Option } from "@/components/common/select";
import { SearchSelect } from "@/components/common/SearchSelect";
import { Input } from "@/components/common/Input";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
    UpdateButton,
    ClearButton,
    ApplyButton,
    CancelButton,
    AddButton
} from "@/components/common/ActionButtons";
import { POSITIVE_DECIMAL_INVALID_KEYS, sanitizePositiveDecimal } from "@/lib/utils/validation";
import { Label } from "@/components/common/label";
import { AnimatedDigitInput } from "@/components/common/AnimatedDigitInput";
import { Modal } from "@/components/common/Modal";

interface AgeFactorCvHeaderExtraProps {
    t: (key: string, values?: Record<string, string | number>) => string;
    tW: (key: string, values?: Record<string, string | number>) => string;
    assessmentYearOptions: Option[];
    constructionTypeOptions: Option[];
    ageRangeOptions: Option[];
    selectedYear: string;
    constructionType: string;
    selectedAgeRange: string;
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
    handleConstructionTypeChange: (value: string) => void;
    handleAgeRangeChange: (value: string) => void;
    setAgeFrom: (value: string) => void;
    setAgeTo: (value: string) => void;
    setFactorValue: (value: string) => void;
    handleAddAgeRange: () => void;
    handleApplyFilter: () => void;
    handleClearAll: () => void;
    handleBulkUpdate: () => void;
    handleGenerateAll: () => void;
    editableRowsCount: number;
}

export const AgeFactorCvHeaderExtra: React.FC<AgeFactorCvHeaderExtraProps> = React.memo(({
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
}) => {
    return (
        <>
            {/* Assessment Year */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] text-gray-600 ml-0.5">{t('filters.assessmentYear')}</Label>
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
                <Label className="text-[12px] text-gray-600 ml-0.5">{t('filters.constructionType')}</Label>
                <div className="w-[280px] z-30">
                    <SearchSelect
                        name="constructionType"
                        options={constructionTypeOptions}
                        value={constructionType}
                        onChange={(_, val) => handleConstructionTypeChange(val)}
                        placeholder={t('placeholders.select')}
                    />
                </div>
            </div>

            {/* Year Range */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] text-gray-600 ml-0.5">{t('filters.ageRange')}</Label>
                <div className="flex gap-2">
                    <div className="w-[140px] z-30">
                        <SearchSelect
                            name="ageRange"
                            options={ageRangeOptions}
                            value={selectedAgeRange}
                            onChange={(_, val) => handleAgeRangeChange(val)}
                            placeholder={t('placeholders.selectRange')}
                        />
                    </div>
                    {/* Add Range Button & Modal */}
                    <div>
                        <AddButton
                            size="sm"
                            label={t('buttons.addAge')}
                            onClick={() => setIsAddYearRangeModalOpen(true)}
                            className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
                        />

                        <Modal
                            open={isAddYearRangeModalOpen}
                            onClose={() => setIsAddYearRangeModalOpen(false)}
                            title={t('labels.addAgeRange')}
                            maxWidth="sm"
                            footer={
                                <>
                                    <CancelButton
                                        size="sm"
                                        onClick={() => setIsAddYearRangeModalOpen(false)}
                                        label={tW('common.buttons.cancel')}
                                    />
                                    <AddButton
                                        size="sm"
                                        className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
                                        onClick={() => {
                                            handleAddAgeRange();
                                        }}
                                        label={tW('common.buttons.add')}
                                    />
                                </>
                            }
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] text-gray-500">{t('labels.minYear')}</Label>
                                    <AnimatedDigitInput
                                        value={ageFrom}
                                        onChange={setAgeFrom}
                                        maxLength={2}
                                        placeholder={t('placeholders.minYear')}
                                        className="border-[#DCEAFF]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] text-gray-500">{t('labels.maxYear')}</Label>
                                    <AnimatedDigitInput
                                        value={ageTo}
                                        onChange={setAgeTo}
                                        maxLength={3}
                                        placeholder={t('placeholders.maxYear')}
                                        className="border-[#DCEAFF]"
                                    />
                                </div>
                            </div>
                        </Modal>
                    </div>
                </div>
            </div>

            {/* Factor */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-[12px] text-gray-600 ml-0.5">{t('filters.factor')}</Label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999.99"
                    value={factorValue}
                    onChange={(e) => {
                        const sanitized = sanitizePositiveDecimal(e.target.value, 2);
                        if (sanitized === '' || (parseFloat(sanitized) >= 0 && parseFloat(sanitized) <= 999.99)) {
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
                    className="h-[34px] px-4 font-bold !bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
                    label={isGeneratingAll ? tW('common.buttons.generating') : tW('common.buttons.generateAll')}
                />
                <ApplyButton
                    size="sm"
                    label={tW('common.buttons.apply')}
                    onClick={handleApplyFilter}
                    disabled={!selectedYear && !constructionType && !selectedAgeRange}
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
        </>
    );
});
AgeFactorCvHeaderExtra.displayName = "AgeFactorCvHeaderExtra";
