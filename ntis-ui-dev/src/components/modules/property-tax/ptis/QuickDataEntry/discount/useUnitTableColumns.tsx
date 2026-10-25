import { useMemo } from "react";
import { Checkbox } from "@/components/common";
import type { Column } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { Pencil, Eye, CheckCircle2 } from "lucide-react";
import { UnitRow, coverageBadgeConfig, UseUnitTableColumnsParams } from "./unit-selection.types";

export function useUnitTableColumns(p: UseUnitTableColumnsParams): Column<UnitRow>[] {
    const {
        levelState, uploadedUnitsMap, wingDocumentMap, apartmentDocumentItem,
        unitCoverageMap, isUnitApplied, isRowEditing, isAllSelectableUnitsSelected,
        handleToggleAllSelectableUnits, selectableUnits, appliedUnits,
        isAllAppliedUnitsSelectedForDelete, handleToggleAllAppliedUnitsForDelete,
        selectedDeleteUnitIds, handleToggleDeleteUnit, showActions, t, translate,
        handleEditUnit, handleCancelEdit, handleViewUnitDocument,
    } = p;

    return useMemo<Column<UnitRow>[]>(() => {
        const cols: Column<UnitRow>[] = [
            {
                key: "propertyDetailsId",
                label: (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={isAllSelectableUnitsSelected}
                            onCheckedChange={handleToggleAllSelectableUnits}
                            disabled={selectableUnits.length === 0}
                            className={cn(selectableUnits.length === 0 && "opacity-50 cursor-not-allowed")}
                        />
                    </div>
                ),
                width: "40px",
                align: "center",
                render: (_, row) => {
                    const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
                    const isApplied = isUnitApplied(unitPropId);
                    const isChecked = isApplied || levelState.selectedUnitIds.has(unitPropId);
                    const isEditing = isRowEditing(row);

                    return (
                        <div
                            onClick={(e) => { e.stopPropagation(); if (isEditing) handleCancelEdit(); }}
                            className={cn("inline-flex items-center justify-center p-1 rounded", isApplied && !isEditing ? "cursor-not-allowed" : "cursor-pointer")}
                            title={isEditing ? translate("building.unselectEditingUnit", "Click to unselect / cancel editing this unit") : isApplied ? translate("building.unitAlreadyAppliedTooltip", "Unit is already applied. Click Edit icon to modify.") : undefined}
                        >
                            <Checkbox
                                checked={isChecked}
                                disabled={isApplied && !isEditing}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={() => { if (isEditing) handleCancelEdit(); else if (!isApplied) levelState.toggleUnitSelection(unitPropId); }}
                                className={cn(isApplied && !isEditing && "cursor-not-allowed opacity-80")}
                            />
                        </div>
                    );
                },
            },
            {
                key: "unitNo",
                label: t("building.unit") || "Unit",
                render: (val, row) => {
                    const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
                    const isApplied = isUnitApplied(unitPropId);
                    const isEditing = isRowEditing(row);
                    return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(isEditing ? "font-bold text-blue-900" : isApplied ? "font-medium text-slate-700 select-none" : "font-bold text-slate-800")}>{String(val || "")}</span>
                            {isEditing && (
                                <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-400 text-[10px] font-bold flex-shrink-0 animate-pulse shadow-2xs">
                                    <Pencil className="w-2.5 h-2.5 text-blue-700 shrink-0" /><span>{translate("building.editing", "Editing")}</span>
                                </span>
                            )}
                            {!isEditing && isApplied && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 text-[10px] font-semibold flex-shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /><span>{translate("building.applied", "Applied")}</span>
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: "wingName",
                label: t("building.wing") || "Wing",
                render: (val, row) => <span className={cn("font-semibold", isRowEditing(row) ? "text-blue-900" : isUnitApplied((row.propertyId ?? row.propertyDetailsId) as number) ? "text-slate-400 select-none" : "text-slate-700")}>{String(val || "")}</span>,
            },
            {
                key: "coverageStatus",
                label: translate("building.coverageStatus", "Coverage Status"),
                render: (_, row) => {
                    const cfg = coverageBadgeConfig[unitCoverageMap.get((row.propertyId ?? row.propertyDetailsId) as number) ?? "none"];
                    return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap", cfg.className)}>{cfg.icon}<span>{translate(cfg.tKey, cfg.label)}</span></span>;
                },
            },
        ];

        if (showActions) {
            cols.push({
                key: "actions",
                label: t("common.actions") || "Action",
                align: "center",
                width: "100px",
                render: (_, row) => {
                    const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
                    const status = unitCoverageMap.get(unitPropId) ?? "none";
                    const isEditing = isRowEditing(row);
                    const docItem = uploadedUnitsMap.get(unitPropId) || (row.wingDetailId ? wingDocumentMap.get(row.wingDetailId) : undefined) || apartmentDocumentItem || undefined;
                    const viewTooltip = docItem ? (status === "wing" ? translate("building.viewWingDocument", "View Wing Document") : status === "apartment" ? translate("building.viewApartmentDocument", "View Apartment Document") : translate("common.view", "View Document")) : translate("building.noDocumentAttached", "No document attached");

                    return (
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg shadow-2xs cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95", isEditing ? "text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 ring-2 ring-blue-400 shadow-xs" : "text-blue-600 bg-blue-50/90 hover:bg-blue-100 hover:text-blue-800 border border-blue-200")}
                                title={isEditing ? translate("building.cancelEditUnit", "Cancel editing / unselect this unit") : isUnitApplied(unitPropId) ? translate("building.editAppliedData", "Edit Applied Data") : translate("common.edit", "Edit")}
                                onClick={() => { if (isEditing) handleCancelEdit(); else handleEditUnit(row); }}
                            >
                                <Pencil className={cn("w-4 h-4", isEditing ? "text-white" : "text-blue-600")} />
                            </button>
                            <button
                                type="button"
                                disabled={!docItem}
                                className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150", docItem ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer hover:scale-105 active:scale-95" : "text-slate-300 bg-slate-50 border border-slate-200 cursor-not-allowed opacity-50")}
                                title={viewTooltip}
                                onClick={() => handleViewUnitDocument(row, docItem)}
                            >
                                <Eye className={cn("w-4 h-4", docItem ? "text-emerald-600" : "text-slate-300")} />
                            </button>
                        </div>
                    );
                },
            });
        }

        cols.push({
            key: "deleteSelection",
            label: (
                <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center p-1" title={translate("building.selectAllAppliedForDeleteTooltip", "Select all applied units for deletion")}>
                    <Checkbox
                        checked={isAllAppliedUnitsSelectedForDelete}
                        onCheckedChange={handleToggleAllAppliedUnitsForDelete}
                        disabled={appliedUnits.length === 0}
                        className={cn("data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600", appliedUnits.length === 0 && "opacity-40 cursor-not-allowed")}
                    />
                </div>
            ),
            width: "44px",
            align: "center",
            render: (_, row) => {
                const unitPropId = (row.propertyId ?? row.propertyDetailsId) as number;
                const isApplied = isUnitApplied(unitPropId);
                return (
                    <div onClick={(e) => e.stopPropagation()} className={cn("inline-flex items-center justify-center p-1 rounded", isApplied ? "cursor-pointer" : "cursor-not-allowed")} title={isApplied ? translate("building.selectUnitToDeleteTooltip", `Select unit ${row.unitNo} to delete applied data`, { unit: row.unitNo }) : translate("building.unitNotAppliedDeleteTooltip", "Unit is not applied (cannot delete)")}>
                        <Checkbox
                            checked={isApplied && selectedDeleteUnitIds.has(unitPropId)}
                            disabled={!isApplied}
                            onCheckedChange={() => { if (isApplied) handleToggleDeleteUnit(unitPropId); }}
                            className={cn("data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600", !isApplied && "cursor-not-allowed opacity-30")}
                        />
                    </div>
                );
            },
        });

        return cols;
    }, [
        levelState, uploadedUnitsMap, wingDocumentMap, apartmentDocumentItem,
        unitCoverageMap, isUnitApplied, isRowEditing, isAllSelectableUnitsSelected,
        handleToggleAllSelectableUnits, selectableUnits, appliedUnits,
        isAllAppliedUnitsSelectedForDelete, handleToggleAllAppliedUnitsForDelete,
        selectedDeleteUnitIds, handleToggleDeleteUnit, showActions, t, translate,
        handleEditUnit, handleCancelEdit, handleViewUnitDocument,
    ]);
}
