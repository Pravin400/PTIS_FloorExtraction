"use client";

import React, { useMemo, useCallback } from "react";
import { MasterTable, DocumentViewerModal } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { UnitRow, CoverageStatus, COVERAGE_STATUSES, coverageBadgeConfig, UnitSelectionPanelProps } from "./unit-selection.types";
import { useUnitCoverage } from "./useUnitCoverage";
import { useUnitBulkDelete } from "./useUnitBulkDelete";
import { useUnitTableColumns } from "./useUnitTableColumns";
import { useUnitSelectionActions } from "./useUnitSelectionActions";
import { UnitSelectionToolbar } from "./UnitSelectionToolbar";
import { UnitScopeBanner } from "./UnitScopeBanner";
import type { UnitSelectionItem } from "@/types/building-permission.types";

export type { UnitRow, CoverageStatus, UnitSelectionPanelProps };
export { COVERAGE_STATUSES, coverageBadgeConfig };

export const UnitSelectionPanel: React.FC<UnitSelectionPanelProps> = ({
    levelState, t, savedPropertyDetails = [], activeSelectedId, activeAttributeName,
    onEditUnit, onUrlUpdate, showActions = true, societyDetailId, wingDetailId,
    propertyId, onBulkDelete, onDeleteSelectionChange,
}) => {
    const translate = useCallback((key: string, fallback: string, values?: Record<string, string | number | Date>) => {
        try {
            if (typeof t.has === "function" && !t.has(key)) return fallback;
            const val = t(key, values);
            return (!val || val.includes("quickDataEntry.") || val === key) ? fallback : val;
        } catch {
            return fallback;
        }
    }, [t]);

    const {
        uploadedUnitsMap, wingDocumentMap, apartmentDocumentItem,
        unitCoverageMap, isUnitApplied, appliedUnitsCount,
        selectableUnits, appliedUnits,
    } = useUnitCoverage({ levelState, savedPropertyDetails, activeSelectedId });

    const {
        viewerModalData, setViewerModalData, statusFilter, setStatusFilter,
        activeEditingUnitId, isRowEditing, updateUrl, handleClearSelection,
        handleCancelEdit, handleViewUnitDocument, handleEditUnit, searchParams,
        setLocalEditingUnitId,
    } = useUnitSelectionActions({ levelState, isUnitApplied, onEditUnit, onUrlUpdate, t });

    const {
        selectedDeleteUnitIds, isBulkDeleting, isAllAppliedUnitsSelectedForDelete,
        handleToggleAllAppliedUnitsForDelete, handleToggleDeleteUnit,
        handleClearDeleteSelection, handleConfirmBulkDelete,
    } = useUnitBulkDelete({
        levelState, activeSelectedId, activeAttributeName, savedPropertyDetails,
        appliedUnits, activeEditingUnitId, societyDetailId, wingDetailId, propertyId,
        onBulkDelete, onDeleteSelectionChange, setLocalEditingUnitId, updateUrl, translate,
    });

    const isAllSelectableUnitsSelected = useMemo(() => {
        if (selectableUnits.length === 0) return false;
        return selectableUnits.every((u) => levelState.selectedUnitIds.has((u.propertyId ?? u.propertyDetailsId) as number));
    }, [selectableUnits, levelState.selectedUnitIds]);

    const handleToggleAllSelectableUnits = useCallback(() => {
        levelState.setSelectedUnitIds((prev: Set<number>) => {
            const next = new Set(prev);
            if (isAllSelectableUnitsSelected) selectableUnits.forEach((u) => next.delete((u.propertyId ?? u.propertyDetailsId) as number));
            else selectableUnits.forEach((u) => next.add((u.propertyId ?? u.propertyDetailsId) as number));
            return next;
        });
    }, [isAllSelectableUnitsSelected, selectableUnits, levelState]);

    const unitTableColumns = useUnitTableColumns({
        levelState, uploadedUnitsMap, wingDocumentMap, apartmentDocumentItem,
        unitCoverageMap, isUnitApplied, isRowEditing, isAllSelectableUnitsSelected,
        handleToggleAllSelectableUnits, selectableUnits, appliedUnits,
        isAllAppliedUnitsSelectedForDelete, handleToggleAllAppliedUnitsForDelete,
        selectedDeleteUnitIds, handleToggleDeleteUnit, showActions, t, translate,
        handleEditUnit, handleCancelEdit, handleViewUnitDocument,
    });

    const unitTableData = useMemo<UnitRow[]>(() => {
        return (levelState.filteredUnits as UnitSelectionItem[])
            .map((u: UnitSelectionItem): UnitRow => ({
                propertyDetailsId: u.propertyDetailsId,
                propertyId: u.propertyId,
                unitNo: u.unitNo,
                wingName: u.wingName,
                wingDetailId: u.wingDetailId,
                floorName: u.floorName,
                useName: u.useName || "Residential",
                coverageStatus: unitCoverageMap.get((u.propertyId ?? u.propertyDetailsId) as number) ?? "none",
            }))
            .filter((row: UnitRow) => statusFilter === "all" || row.coverageStatus === statusFilter);
    }, [levelState.filteredUnits, unitCoverageMap, statusFilter]);

    const selectedUnitNamesSummary = useMemo(() => {
        if (levelState.selectedUnitIds.size === 0) return "";
        const names = (levelState.filteredUnits as UnitSelectionItem[])
            .filter((u: UnitSelectionItem) => levelState.selectedUnitIds.has((u.propertyId ?? u.propertyDetailsId) as number))
            .map((u: UnitSelectionItem) => u.unitNo).filter(Boolean);
        return names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
    }, [levelState.selectedUnitIds, levelState.filteredUnits]);

    return (
        <>
            <div className="space-y-2 p-2.5 rounded-xl border transition-all bg-slate-50/70 border-slate-200">
                <UnitSelectionToolbar
                    levelState={levelState}
                    appliedUnitsCount={appliedUnitsCount}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    isEditingAppliedUnit={Boolean(activeEditingUnitId && isUnitApplied(activeEditingUnitId))}
                    activeEditingUnitId={activeEditingUnitId}
                    handleClearSelection={handleClearSelection}
                    selectedDeleteUnitIds={selectedDeleteUnitIds}
                    isBulkDeleting={isBulkDeleting}
                    handleConfirmBulkDelete={handleConfirmBulkDelete}
                    handleClearDeleteSelection={handleClearDeleteSelection}
                    searchParams={searchParams}
                    updateUrl={updateUrl}
                    t={t}
                    translate={translate}
                />

                <MasterTable<UnitRow>
                    columns={unitTableColumns}
                    data={unitTableData}
                    isPagination={false}
                    emptyText={t("building.noUnitsMatch") || "No units match the selected filters"}
                    maxBodyHeightClassName="max-h-36 sm:max-h-40"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 30) {
                            levelState.loadNextUnitsPage();
                        }
                    }}
                    getRowKey={(row, i) => `${row.propertyDetailsId ?? ""}-${i}`}
                    onRowClick={(row) => {
                        const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
                        if (isRowEditing(row)) { handleCancelEdit(); return; }
                        if (isUnitApplied(unitPropId)) {
                            toast.info(translate("building.unitAlreadyAppliedHint", "This unit is already applied. Click the edit icon to modify its details."));
                            return;
                        }
                        setLocalEditingUnitId(null);
                        if (searchParams.get("unitPropertyId")) {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("unitPropertyId");
                            updateUrl(params);
                        }
                        levelState.toggleUnitSelection(unitPropId);
                    }}
                    rowClassName={(row) => {
                        const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
                        const isApplied = isUnitApplied(unitPropId);
                        const isEditing = isRowEditing(row);
                        const isSelected = !isApplied && levelState.selectedUnitIds.has(unitPropId);
                        if (isEditing) return "select-none bg-blue-100/80 hover:bg-blue-100/90 font-semibold ring-2 ring-blue-500 border-l-4 border-l-blue-600 shadow-sm cursor-pointer transition-colors";
                        if (isApplied) return "select-none bg-slate-50/50 border-l-4 border-l-slate-300";
                        return cn("select-none cursor-pointer hover:bg-slate-50/80 transition-colors border-l-4 border-l-transparent", isSelected && "bg-blue-50/90 font-semibold ring-1 ring-blue-500/60 border-l-4 border-l-blue-600 shadow-sm");
                    }}
                />

                {levelState.isLoadingMoreUnits && (
                    <div className="py-1.5 text-center text-xs text-blue-600 font-medium flex items-center justify-center gap-2 bg-blue-50/40 rounded-lg">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>{t("building.loadingNextUnits") || "Loading next 10 units..."}</span>
                    </div>
                )}
            </div>

            <UnitScopeBanner
                selectedCount={levelState.selectedUnitIds.size}
                isEditingAppliedUnit={Boolean(activeEditingUnitId && isUnitApplied(activeEditingUnitId))}
                activeEditingUnitId={activeEditingUnitId}
                selectedUnitNamesSummary={selectedUnitNamesSummary}
                handleCancelEdit={handleCancelEdit}
                t={t}
                translate={translate}
            />

            {viewerModalData?.isOpen && (
                <DocumentViewerModal
                    isOpen={viewerModalData.isOpen}
                    onClose={() => setViewerModalData(null)}
                    fileUrl={viewerModalData.fileUrl}
                    fileName={viewerModalData.fileName}
                />
            )}
        </>
    );
};
