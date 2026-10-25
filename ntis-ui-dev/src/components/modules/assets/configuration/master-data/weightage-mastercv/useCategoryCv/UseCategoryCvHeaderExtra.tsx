"use client";

import { SearchSelect } from "@/components/common/SearchSelect";
import { Input } from "@/components/common/Input";
import { ApplyButton, ClearButton, UpdateButton, CancelButton, AddButton } from "@/components/common/ActionButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Option } from "@/components/common/select";
import { POSITIVE_DECIMAL_INVALID_KEYS, sanitizePositiveDecimal } from "@/lib/utils/validation";

interface UseCategoryCvHeaderExtraProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, values?: Record<string, any>) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string;
    assessmentYearOptions: Option[];
    typeOfUseOptions: Option[];
    selectedYear: string;
    typeOfUseId: string;
    factorValue: string;
    setFactorValue: (val: string) => void;
    handleAssessmentYearChange: (val: string) => void;
    handleTypeOfUseChange: (val: string) => void;
    handleApplyFilter: () => void;
    handleClearAll: () => void;
    handleBulkUpdate: () => void;
    handleGenerateAll: () => void;
    newRecordsCount: number;
    hasNewRecords: boolean;
    isApplyDisabled: boolean;
    isBulkUpdateDisabled: boolean;
    isGeneratingAll: boolean;
    isBulkUpdating: boolean;
    isUpdating: boolean;
}

export function UseCategoryCvHeaderExtra({
    t,
    tW,
    assessmentYearOptions,
    typeOfUseOptions,
    selectedYear,
    typeOfUseId,
    factorValue,
    setFactorValue,
    handleAssessmentYearChange,
    handleTypeOfUseChange,
    handleApplyFilter,
    handleClearAll,
    handleBulkUpdate,
    handleGenerateAll,
    newRecordsCount,
    hasNewRecords,
    isApplyDisabled,
    isBulkUpdateDisabled,
    isGeneratingAll,
    isBulkUpdating,
    isUpdating,
}: UseCategoryCvHeaderExtraProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#DCEAFF] p-4 flex flex-wrap items-end gap-4 w-full">
            <div className="min-w-[140px] z-30">
                <SearchSelect
                    name="assessmentYear"
                    options={assessmentYearOptions}
                    value={selectedYear}
                    onChange={(_, value) => handleAssessmentYearChange(value)}
                    label={t('filters.assessmentYear')}
                    placeholder={t('placeholders.selectAssessmentYear')}
                />
            </div>
            <div className="min-w-[200px] z-30">
                <SearchSelect
                    name="typeOfUse"
                    options={typeOfUseOptions}
                    value={typeOfUseId}
                    onChange={(_, value) => handleTypeOfUseChange(value)}
                    label={t('filters.typeOfUse')}
                    placeholder={t('placeholders.selectTypeOfUse')}
                />
            </div>
            <div className="min-w-[100px]">
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999.99"
                    value={factorValue}
                    onChange={(e) => {
                        const sanitized = sanitizePositiveDecimal(e.target.value, 2);
                        if (sanitized === '' || (!isNaN(parseFloat(sanitized)) && parseFloat(sanitized) >= 0 && parseFloat(sanitized) <= 999.99)) {
                            setFactorValue(sanitized);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (POSITIVE_DECIMAL_INVALID_KEYS.test(e.key)) {
                            e.preventDefault();
                        }
                    }}
                    label={t('filters.factor')}
                    placeholder={t('placeholders.factor')}
                    className="h-8"
                />
            </div>
            <div className="flex items-center gap-2">
                {hasNewRecords && (
                    <div className="flex items-center">
                        <StatusBadge
                            variant="pending"
                            label={tW('common.labels.pendingRecordCreates', { count: newRecordsCount })}
                            className="px-3 py-1.5"
                        />
                    </div>
                )}
                <AddButton
                    label={isGeneratingAll ? tW('common.buttons.generating') : tW('common.buttons.generateAll')}
                    size="sm"
                    onClick={handleGenerateAll}
                    disabled={!hasNewRecords || isGeneratingAll || isBulkUpdating || isUpdating}
                    className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
                />
                <ApplyButton
                    label={tW('common.buttons.apply')}
                    size="sm"
                    onClick={handleApplyFilter}
                    disabled={isApplyDisabled}
                />
                <ClearButton
                    label={tW('common.buttons.clear')}
                    size="sm"
                    onClick={handleClearAll}
                />
                <UpdateButton
                    label={isBulkUpdating ? tW('common.buttons.updating') : tW('common.buttons.update')}
                    size="sm"
                    onClick={handleBulkUpdate}
                    disabled={isBulkUpdateDisabled}
                />
                <CancelButton
                    label={tW('common.buttons.cancel')}
                    size="sm"
                    onClick={handleClearAll}
                />
            </div>
        </div>
    );
}
