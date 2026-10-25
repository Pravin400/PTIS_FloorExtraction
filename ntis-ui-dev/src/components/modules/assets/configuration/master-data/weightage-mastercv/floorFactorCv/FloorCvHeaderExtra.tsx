"use client";

import React from "react";
import { SearchSelect } from "@/components/common/SearchSelect";
import { Input } from "@/components/common/Input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ApplyButton, ClearButton, UpdateButton, AddButton } from "@/components/common/ActionButtons";
import { CancelButton } from "@/components/common";
import { FloorCvHeaderExtraProps } from "@/types/asset-masters/floor-cv-weightageMaster.types";
import { POSITIVE_DECIMAL_INVALID_KEYS, sanitizePositiveDecimal } from "@/lib/utils/validation";

export const FloorCvHeaderExtra: React.FC<FloorCvHeaderExtraProps> = React.memo(({
    t,
    tW,
    assessmentYearOptions,
    floorOptions,
    liftStatusOptions,
    selectedYear,
    fromFloor,
    toFloor,
    liftStatus,
    factorValue,
    isApplyDisabled,
    isBulkUpdateDisabled,
    isGeneratingAll,
    isBulkUpdating,
    isUpdating,
    hasNewRecords,
    newRecordsCount,
    handleAssessmentYearChange,
    setFromFloor,
    setToFloor,
    setLiftStatus,
    setFactorValue,
    handleApplyFilter,
    handleClearAll,
    handleBulkUpdate,
    handleGenerateAll,
    addToast,
}) => {
    return (
        <div className="w-full">
            <div className="flex items-end gap-4 mb-3 flex-wrap">

                <div className="min-w-[140px]">
                    <SearchSelect
                        options={assessmentYearOptions}
                        value={selectedYear}
                        onChange={(_, val) => handleAssessmentYearChange(val)}
                        label={t("filters.assessmentYear")}
                        placeholder={t("filters.assessmentYear")}
                    />
                </div>

                <div className="min-w-[180px]">
                    <SearchSelect
                        options={floorOptions}
                        value={fromFloor}
                        onChange={(_, val) => setFromFloor(val)}
                        label={t("filters.fromFloor")}
                        placeholder={t("filters.fromFloor")}
                    />
                </div>

                <div className="min-w-[180px]">
                    <SearchSelect
                        options={floorOptions}
                        value={toFloor}
                        onChange={(_, val) => setToFloor(val)}
                        label={t("filters.toFloor")}
                        placeholder={t("filters.toFloor")}
                    />
                </div>

                <div className="min-w-[120px]">
                    <SearchSelect
                        options={liftStatusOptions}
                        value={liftStatus}
                        onChange={(_, val) => setLiftStatus(val)}
                        label={t("filters.liftStatus")}
                        placeholder={t("filters.liftStatus")}
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
                            if (sanitized === "") {
                                setFactorValue(sanitized);
                                return;
                            }
                            const numValue = parseFloat(sanitized);
                            if (numValue < 0) {
                                addToast("error", tW("common.messages.negativeValuesNotAllowed"));
                            } else if (numValue > 999.99) {
                                addToast("error", tW("common.messages.valueExceedsMax"));
                            } else {
                                setFactorValue(sanitized);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (POSITIVE_DECIMAL_INVALID_KEYS.test(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        label={t("filters.factor")}
                        placeholder="0.00"
                        className="h-8"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {hasNewRecords && (
                        <div className="flex items-center">
                            <StatusBadge
                                variant="pending"
                                label={tW("common.labels.pendingRecordCreates", { count: newRecordsCount })}
                                className="px-3 py-1.5"
                            />
                        </div>
                    )}
                    <AddButton
                        label={isGeneratingAll ? tW("common.buttons.generating") : tW("common.buttons.generateAll")}
                        size="sm"
                        onClick={handleGenerateAll}
                        disabled={!hasNewRecords || isGeneratingAll || isBulkUpdating || isUpdating}
                        className="!bg-[#0f3d8a] hover:!bg-[#0b2f6b] !text-white"
                    />
                    <ApplyButton
                        label={tW("common.buttons.apply")}
                        size="sm"
                        onClick={handleApplyFilter}
                        disabled={isApplyDisabled}
                    />
                    <ClearButton
                        label={tW("common.buttons.clear")}
                        size="sm"
                        onClick={handleClearAll}
                    />
                    <UpdateButton
                        label={isBulkUpdating ? tW("common.buttons.updating") : tW("common.buttons.update")}
                        size="sm"
                        onClick={handleBulkUpdate}
                        disabled={isBulkUpdateDisabled}
                    />
                    <CancelButton
                        label={tW("common.buttons.cancel")}
                        size="sm"
                        onClick={handleClearAll}
                    />
                </div>
            </div>
        </div>
    );
});
FloorCvHeaderExtra.displayName = "FloorCvHeaderExtra";
