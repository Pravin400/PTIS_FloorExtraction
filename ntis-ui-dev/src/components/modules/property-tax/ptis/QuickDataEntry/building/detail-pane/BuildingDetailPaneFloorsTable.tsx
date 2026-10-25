import React, { useMemo } from "react";
import { Layers } from "lucide-react";
import { Label } from "@/components/common";
import FloorTable from "../../floorSubmission/FloorTable";
import { FloorCertificateDto } from "@/types/building-permission.types";
import type {
    FloorResponse,
    ConstructionTypeResponse,
    TypeOfUseApiItem,
    SubFloorResponse,
    SubTypeOfUseResponse,
} from "@/types/floor-details.types";
import type { FloorData } from "@/types/room-details.types";

interface BuildingDetailPaneFloorsTableProps {
    initialFloors?: FloorData[];
    floors?: FloorCertificateDto[];
    activeFloorId?: string | number | null;
    activeScope?: string;
    isSaving?: boolean;
    onScopeChange?: (scope: "Property" | "Floor", floorDetailsId: number | null) => void | Promise<void>;
    floorData?: FloorResponse[];
    subFloorData?: SubFloorResponse[];
    constructionTypeData?: ConstructionTypeResponse[];
    useData?: TypeOfUseApiItem[];
    subTypeData?: SubTypeOfUseResponse[];
    t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export const BuildingDetailPaneFloorsTable: React.FC<BuildingDetailPaneFloorsTableProps> = ({
    initialFloors = [],
    floors = [],
    activeFloorId = null,
    activeScope = "Property",
    isSaving = false,
    onScopeChange,
    floorData = [],
    subFloorData = [],
    constructionTypeData = [],
    useData = [],
    subTypeData = [],
    t,
}) => {
    const floorsWithCertDates = useMemo(() => {
        return (initialFloors || [])
            .filter((f) => {
                const raw = f as unknown as Record<string, unknown>;
                const floorDesc = String(f.floor || f.floorDescription || raw.floorName || "").trim().toLowerCase();
                const conTyp = String(f.conTyp || f.constructionTypeDescription || raw.constructionTypeName || "").trim().toLowerCase();
                const use = String(f.use || f.typeOfUseDescription || raw.useName || "").trim().toLowerCase();
                const subUse = String(f.subTyp || f.subTypeOfUseDescription || raw.subUseName || "").trim().toLowerCase();
                const floorId = String(f.floorId || f.floorID || "");
                const isOpenPlot =
                    floorDesc === "open plot" ||
                    floorDesc === "op" ||
                    floorDesc.includes("open plot") ||
                    conTyp === "open plot" ||
                    conTyp === "op" ||
                    conTyp.includes("open plot") ||
                    use.includes("खुला भूखंड") ||
                    use.includes("open plot") ||
                    subUse.includes("खुला भूखंड") ||
                    subUse.includes("open plot") ||
                    floorId === "77" ||
                    raw.isOpenPlot === true ||
                    raw.isPlotCategory === true;
                return !isOpenPlot;
            })
            .map((f) => {
                const fId = f.id ?? (f as unknown as { propertyDetailsId?: number }).propertyDetailsId;
                const certFloor = (floors || []).find((fc) => fc.propertyDetailsId === Number(fId));
                return {
                    ...f,
                    ccDate: certFloor?.ccDate || (f as unknown as { ccDate?: string }).ccDate || null,
                    ocDate: certFloor?.ocDate || (f as unknown as { ocDate?: string }).ocDate || null,
                };
            });
    }, [initialFloors, floors]);

    if (!floorsWithCertDates || floorsWithCertDates.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    {t("building.floorsOverview") || "Floors Overview"}
                    <span className="text-[11px] font-normal text-slate-500">
                        ({t("building.clickFloorHint") || "Click a floor below to view or customize floor-wise certificate"})
                    </span>
                </Label>
                {floorsWithCertDates.length > 0 && (
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {floorsWithCertDates.length}{" "}
                        {floorsWithCertDates.length === 1
                            ? t("building.floorCountSingular") || "Floor"
                            : t("building.floorCountPlural") || "Floors"}
                    </span>
                )}
            </div>

            <div className="mb-3">
                <FloorTable
                    t={t}
                    filteredFloors={floorsWithCertDates}
                    floorSearch=""
                    setFloorSearch={() => {}}
                    selectedFloor={
                        activeFloorId !== null
                            ? floorsWithCertDates.find(
                                  (f) =>
                                      Number(f.id) === Number(activeFloorId) ||
                                      Number((f as unknown as { propertyDetailsId?: number }).propertyDetailsId) ===
                                          Number(activeFloorId)
                              ) || null
                            : null
                    }
                    setSelectedFloor={() => {}}
                    isAddingNewFloor={false}
                    setIsAddingNewFloor={() => {}}
                    handleAddFloor={() => {}}
                    handleOpenDataEntrySameAs={() => {}}
                    viewOnly={true}
                    updateUrlParams={() => {}}
                    handleDeleteFloor={() => {}}
                    startTransition={(fn) => fn()}
                    setFormErrors={() => {}}
                    floorLookup={floorData}
                    subFloorLookup={subFloorData}
                    constructionLookup={constructionTypeData}
                    useLookup={useData}
                    subTypeData={subTypeData}
                    setEditingFloorForm={() => {}}
                    isBuildingPermissionView={true}
                    onRowClick={(floor: FloorData) => {
                        if (isSaving) return;
                        const targetId = floor.id ?? (floor as unknown as { propertyDetailsId?: number }).propertyDetailsId;
                        if (onScopeChange && targetId !== undefined && targetId !== null) {
                            if (activeScope === "Floor" && Number(activeFloorId) === Number(targetId)) {
                                onScopeChange("Property", null);
                            } else {
                                onScopeChange("Floor", Number(targetId));
                            }
                        }
                    }}
                />
            </div>
            <hr className="border-slate-200 mb-3" />
        </>
    );
};
