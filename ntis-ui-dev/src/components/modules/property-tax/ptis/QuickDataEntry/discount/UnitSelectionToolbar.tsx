"use client";

import React from "react";
import { Label, Badge, SearchInput, Select } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Trash2, Loader2 } from "lucide-react";
import type { useDiscountLevelState } from "@/hooks/useDiscountLevelState";
import type { CoverageStatus } from "./unit-selection.types";

interface UnitSelectionToolbarProps {
    levelState: NonNullable<ReturnType<typeof useDiscountLevelState>>;
    appliedUnitsCount: number;
    statusFilter: "all" | CoverageStatus;
    setStatusFilter: (filter: "all" | CoverageStatus) => void;
    isEditingAppliedUnit: boolean;
    activeEditingUnitId: number | null;
    handleClearSelection: () => void;
    selectedDeleteUnitIds: Set<number>;
    isBulkDeleting: boolean;
    handleConfirmBulkDelete: () => void;
    handleClearDeleteSelection: () => void;
    searchParams: URLSearchParams;
    updateUrl: (params: URLSearchParams) => void;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
    translate: (key: string, fallback: string, values?: Record<string, string | number | Date>) => string;
}

export const UnitSelectionToolbar: React.FC<UnitSelectionToolbarProps> = ({
    levelState, appliedUnitsCount, statusFilter, setStatusFilter,
    isEditingAppliedUnit, activeEditingUnitId, handleClearSelection,
    selectedDeleteUnitIds, isBulkDeleting, handleConfirmBulkDelete,
    handleClearDeleteSelection, searchParams, updateUrl, t, translate,
}) => {
    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {t("building.selectUnits") || "SELECT UNITS"}
                    </Label>
                    <span className="text-[11px] text-slate-500">
                        {t("building.unitsInWing", { count: levelState.filteredUnits.length })}
                    </span>
                    <span className="text-[11px] text-blue-600 font-medium italic">
                        {t("building.clickRowToSelect") || "• Click any row to select"}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {appliedUnitsCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter(statusFilter === "direct" ? "all" : "direct")}
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer border transition-all",
                                statusFilter === "direct" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            )}
                            title={t("building.filterAppliedTooltip") || "Filter applied units"}
                        >
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>{t("building.appliedSeparately", { count: appliedUnitsCount })}</span>
                        </button>
                    )}

                    {(levelState.selectedUnitIds.size > 0 || isEditingAppliedUnit || activeEditingUnitId !== null) && (
                        <button
                            type="button"
                            onClick={handleClearSelection}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer border border-slate-300 transition-all"
                        >
                            {t("building.clearSelectedCount", { count: Math.max(levelState.selectedUnitIds.size, 1) })}
                        </button>
                    )}

                    {selectedDeleteUnitIds.size > 0 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={isBulkDeleting}
                                onClick={handleConfirmBulkDelete}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-2xs transition-all cursor-pointer border border-rose-600",
                                    isBulkDeleting && "opacity-50 cursor-not-allowed"
                                )}
                                title={translate("building.bulkDeleteTooltip", "Delete applied data for selected units")}
                            >
                                {isBulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 shrink-0" />}
                                <span>{translate("building.bulkDeleteSelected", `Delete Selected (${selectedDeleteUnitIds.size})`, { count: selectedDeleteUnitIds.size })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearDeleteSelection}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer border border-rose-200 transition-all"
                            >
                                {translate("building.clear", "Clear")}
                            </button>
                        </div>
                    )}

                    <Badge variant="secondary" size="sm" className="bg-white text-slate-700 font-bold border border-slate-200">
                        {t("building.selectedRatio", { selected: levelState.selectedUnitIds.size, total: levelState.filteredUnits.length })}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SearchInput
                    placeholder={t("building.searchUnitPlaceholder") || "Search unit..."}
                    value={levelState.unitSearchQuery}
                    onChange={levelState.setUnitSearchQuery}
                    className="w-full mb-0 text-xs"
                />
                <Select
                    options={levelState.wings.map((w) => ({ label: w.wingName, value: String(w.wingDetailId) }))}
                    value={levelState.selectedWingDetailId ? String(levelState.selectedWingDetailId) : ""}
                    onChange={(_, val) => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (val === "all") {
                            levelState.setSelectedWingDetailId(null);
                            params.delete("wingDetailId");
                        } else {
                            const nextWingDetailId = Number(val);
                            levelState.setSelectedWingDetailId(nextWingDetailId);
                            params.set("wingDetailId", String(nextWingDetailId));
                        }
                        updateUrl(params);
                    }}
                    selectSize="sm"
                    className="text-xs"
                />
                <Select
                    options={[
                        { label: translate("building.allStatus", "All Status"), value: "all" },
                        { label: translate("building.appliedOnly", "Applied (Direct)"), value: "direct" },
                        { label: translate("building.wingCoveredOnly", "Wing Covered"), value: "wing" },
                        { label: translate("building.apartmentCoveredOnly", "Apartment Covered"), value: "apartment" },
                        { label: translate("building.notAppliedOnly", "Not Applied"), value: "none" },
                    ]}
                    value={statusFilter}
                    onChange={(_, val) => setStatusFilter(val as CoverageStatus | "all")}
                    selectSize="sm"
                    className="text-xs"
                />
            </div>
        </div>
    );
};
