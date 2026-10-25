'use client';

import { Card, SearchInput, ClearButton, SearchSelect } from "@/components/common";
import { GapAnalysisViewFormProps } from "@/types/PropertyMedia/PropertyMedia.types";
import { useTranslations } from "next-intl";

export function GapAnalysisViewForm({
    workflowStageOptions = [],
    divisionOptions = [],
    propertyTypeOptions = [],
    wardOptions = [],
    selectedWorkflowStage = '',
    selectedDivision = '',
    selectedWard = '',
    selectedPropertyType = '',
    searchTerm = '',
    onFilterChange,
    onSearchChange,
    onClear,
    isWardDisabled = false,
    divisionLabel,
    wardLabel,
    isLoading = false,
}: GapAnalysisViewFormProps) {
    const t = useTranslations("propertyMedia");

    return (
        <Card className="mb-2.5 rounded-xl border border-[#dce8f5] bg-[#f8fbff] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                <SearchSelect
                    name="workflowStageId"
                    value={selectedWorkflowStage}
                    options={workflowStageOptions}
                    onChange={onFilterChange}
                    label={t("propertyMediaViewDrawer.workflowStageLabel")}
                    placeholder={t("propertyMediaViewDrawer.placeholders.selectStage")}
                />

                <SearchSelect
                    name="divisionId"
                    value={selectedDivision}
                    options={divisionOptions}
                    onChange={onFilterChange}
                    label={divisionLabel ?? t("propertyMediaViewDrawer.divisionLabel")}
                    placeholder={t("propertyMediaViewDrawer.placeholders.selectDivision")}
                />

                <SearchSelect
                    name="wardId"
                    value={selectedWard}
                    options={wardOptions}
                    onChange={onFilterChange}
                    label={wardLabel ?? t("propertyMediaViewDrawer.wardLabel")}
                    placeholder={
                        isWardDisabled
                            ? t("propertyMediaViewDrawer.placeholders.selectDivision")
                            : t("propertyMediaViewDrawer.placeholders.selectWard")
                    }
                    disabled={isWardDisabled}
                    isLoading={isLoading && !isWardDisabled && wardOptions.length === 0}
                />

                <SearchSelect
                    name="propertyTypeId"
                    value={selectedPropertyType}
                    options={propertyTypeOptions}
                    onChange={onFilterChange}
                    label={t("propertyMediaViewDrawer.propertyTypeLabel")}
                    placeholder={t("propertyMediaViewDrawer.placeholders.selectPropertyType")}
                />

                <div className="flex flex-col gap-1 w-full">
                    <label className="text-sm font-medium text-gray-700">
                        {t("propertyMediaViewDrawer.search")}
                    </label>
                    <SearchInput
                        value={searchTerm}
                        onChange={onSearchChange}
                        placeholder={t("propertyMediaViewDrawer.searchPlaceholder")}
                        className="mb-0 w-full"
                        inputClassName="h-8 py-0"
                    />
                </div>
            </div>
            <div className="w-full flex justify-end pt-3 pb-1">
                <ClearButton
                    size="xs"
                    onClick={onClear}
                />
            </div>
        </Card>
    );
}

