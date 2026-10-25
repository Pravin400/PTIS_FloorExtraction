import React from "react";
import { Building2, Layers, ArrowLeft } from "lucide-react";

interface BuildingDetailPaneScopeBannerProps {
    displayName: string;
    activeScope?: string;
    selectedFloorName: string;
    isSaving?: boolean;
    onScopeChange?: (scope: "Property" | "Floor", floorDetailsId: number | null) => void | Promise<void>;
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const BuildingDetailPaneScopeBanner: React.FC<BuildingDetailPaneScopeBannerProps> = ({
    displayName,
    activeScope = "Property",
    selectedFloorName,
    isSaving = false,
    onScopeChange,
    t,
}) => {
    return (
        <>
            {/* Header with Title and Scope Badge */}
            <div className="pb-2.5 border-b border-blue-50 mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-blue-900 leading-tight">{displayName}</h4>
                    {activeScope === "Floor" ? (
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-amber-600" />
                            {selectedFloorName} ({t("building.scopeFloorBadge") || "Floor Scope"})
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            {t("building.scopePropertyBadge") || "Entire Property"}
                        </span>
                    )}
                </div>
            </div>

            {/* Scope Explanation & Quick Action Card */}
            <div className="bg-slate-50 border border-blue-100 rounded-xl p-2.5 mb-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            {t("building.activeScopeLabel") || "Active Scope"}:
                        </span>
                        {activeScope === "Floor" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-500 text-white shadow-2xs whitespace-nowrap">
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                <span>{selectedFloorName}</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs whitespace-nowrap">
                                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{t("building.scopeProperty") || "Entire Property"}</span>
                            </span>
                        )}
                        <span className="text-xs text-slate-600 ml-1">
                            {activeScope === "Floor"
                                ? t("building.floorScopeNotice") ||
                                  "Customizing certificate for this floor (overrides property-level certificate)."
                                : t("building.propertyScopeNotice") ||
                                  "Details entered below apply to the entire property (all floors)."}
                        </span>
                    </div>

                    {activeScope === "Floor" && onScopeChange && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => !isSaving && onScopeChange("Property", null)}
                                className="whitespace-nowrap shrink-0 inline-flex flex-row items-center gap-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 hover:text-blue-800 shadow-2xs h-8 px-3 rounded-lg cursor-pointer transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{t("building.clearSelection") || "Back to Entire Property"}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
