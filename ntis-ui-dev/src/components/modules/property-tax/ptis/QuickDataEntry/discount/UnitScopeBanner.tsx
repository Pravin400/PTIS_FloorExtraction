"use client";

import React from "react";
import { Info, Pencil, Store } from "lucide-react";

interface UnitScopeBannerProps {
    selectedCount: number;
    isEditingAppliedUnit: boolean;
    activeEditingUnitId: number | null;
    selectedUnitNamesSummary: string;
    handleCancelEdit: () => void;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
    translate: (key: string, fallback: string, values?: Record<string, string | number | Date>) => string;
}

export const UnitScopeBanner: React.FC<UnitScopeBannerProps> = ({
    selectedCount,
    isEditingAppliedUnit,
    activeEditingUnitId,
    selectedUnitNamesSummary,
    handleCancelEdit,
    t,
    translate,
}) => {
    if (selectedCount === 0) {
        return (
            <div className="flex items-center gap-2 p-2 bg-amber-50/90 border border-amber-300/80 rounded-lg text-xs text-amber-900 shadow-2xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                    <strong>{t("building.noUnitsSelectedTitle") || "No units selected"}:</strong>{" "}
                    {t("building.noUnitsSelectedHint") || "Please click on one or more units in the table above to configure or attach their data."}
                </span>
            </div>
        );
    }

    if (isEditingAppliedUnit || activeEditingUnitId !== null) {
        return (
            <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-300 rounded-lg text-xs shadow-2xs">
                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                    <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                        {translate("building.editingAppliedUnit", `Editing applied details for unit (${selectedUnitNamesSummary})`, {
                            unit: selectedUnitNamesSummary,
                        })}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-blue-700 hover:text-blue-900 underline font-medium cursor-pointer"
                >
                    {translate("building.cancelEdit", "Cancel Edit")}
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-2 bg-blue-50/80 border border-blue-200 rounded-lg text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
                <Store className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                    {t("building.configuringForUnits", {
                        count: selectedCount,
                        units: selectedUnitNamesSummary,
                    })}
                </span>
            </div>
        </div>
    );
};
