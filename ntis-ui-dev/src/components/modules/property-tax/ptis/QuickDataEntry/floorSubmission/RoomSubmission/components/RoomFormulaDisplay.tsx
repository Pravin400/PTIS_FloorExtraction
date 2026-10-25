import React from "react";
import { useTranslations } from "next-intl";
import { RoomData } from "@/types/room-details.types";
import { OffsetData } from "@/types/offset-details.types";

interface RoomFormulaDisplayProps {
    selectedRoomForPlan: RoomData;
    areaUnit: "sq.m" | "sq.ft";
}

export const RoomFormulaDisplay: React.FC<RoomFormulaDisplayProps> = ({
    selectedRoomForPlan,
    areaUnit,
}) => {
    const t = useTranslations("quickDataEntry");
    const unitLabel = areaUnit === "sq.m" ? "m" : "ft";

    const getParam = (params: Record<string, unknown>, key: string, fallback: unknown = "0"): number => {
        return parseFloat(String(params[key] || fallback));
    };

    const shape = selectedRoomForPlan.shape;
    const params = (selectedRoomForPlan.shapeParameters || selectedRoomForPlan.shapeParams || {}) as Record<string, unknown>;
    let area = 0;

    if (shape === "Rectangle") {
        const length = getParam(params, 'length', selectedRoomForPlan.length);
        const width = getParam(params, 'width', selectedRoomForPlan.width);
        if (length > 0 && width > 0) area = length * width;
    } else if (shape === "Square") {
        const side = getParam(params, 'side');
        if (side > 0) area = side * side;
    } else if (shape === "Circle") {
        const radius = getParam(params, 'radius');
        if (radius > 0) area = Math.PI * radius * radius;
    } else if (shape === "Triangle") {
        const base = getParam(params, 'base');
        const height = getParam(params, 'height');
        if (base > 0 && height > 0) area = 0.5 * base * height;
    } else if (shape === "Trapezoid") {
        const base1 = getParam(params, 'base1');
        const base2 = getParam(params, 'base2');
        const height = getParam(params, 'height');
        if (base1 > 0 && base2 > 0 && height > 0) area = 0.5 * (base1 + base2) * height;
    } else if (shape === "Semi Circle") {
        const radius = getParam(params, 'radius');
        if (radius > 0) area = (Math.PI * radius * radius) / 2;
    } else if (shape === "Quarter Circle") {
        const radius = getParam(params, 'radius');
        if (radius > 0) area = (Math.PI * radius * radius) / 4;
    }

    let formula = "";
    let formulaWithValues = "";
    const p = params as Record<string, unknown>;

    if (shape === "Rectangle") {
        formula = t("visualization.formulas.rectangle");
        if (p.length && p.width) formulaWithValues = `${p.length}${unitLabel} × ${p.width}${unitLabel}`;
    } else if (shape === "Square") {
        formula = t("visualization.formulas.square");
        if (p.side) formulaWithValues = `(${p.side}${unitLabel})²`;
    } else if (shape === "Circle") {
        formula = t("visualization.formulas.circle");
        if (p.radius) formulaWithValues = `π × (${p.radius}${unitLabel})²`;
    } else if (shape === "Triangle") {
        formula = t("visualization.formulas.triangle");
        if (p.base && p.height) formulaWithValues = `½ × ${p.base}${unitLabel} × ${p.height}${unitLabel}`;
    } else if (shape === "Trapezoid") {
        formula = t("visualization.formulas.trapezoid");
        if (p.base1 && p.base2 && p.height) formulaWithValues = `½ × (${p.base1}${unitLabel} + ${p.base2}${unitLabel}) × ${p.height}${unitLabel}`;
    } else if (shape === "Semi Circle") {
        formula = t("visualization.formulas.semiCircle");
        if (p.radius) formulaWithValues = `(π × (${p.radius}${unitLabel})²) / 2`;
    } else if (shape === "Quarter Circle") {
        formula = t("visualization.formulas.quarterCircle");
        if (p.radius) formulaWithValues = `(π × (${p.radius}${unitLabel})²) / 4`;
    }

    const totalOffsetAdditions = (selectedRoomForPlan.offsets || [])
        .filter((o: OffsetData) => o.operation === "add")
        .reduce((sum: number, o: OffsetData) => sum + (o.area || 0), 0);

    const totalOffsetSubtractions = (selectedRoomForPlan.offsets || [])
        .filter((o: OffsetData) => o.operation === "subtract")
        .reduce((sum: number, o: OffsetData) => sum + (o.area || 0), 0);

    const netOffsetImpact = totalOffsetAdditions - totalOffsetSubtractions;
    const netArea = area + netOffsetImpact;
    const hasOffsets = (selectedRoomForPlan.offsets || []).length > 0;

    if (area <= 0) return null;

    return (
        <div className="bg-white border border-blue-300 rounded-lg shadow-md p-1 m-1 animate-slide-up flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded p-0.5 border border-blue-300 shadow-sm">
                <div className="bg-white rounded px-1 py-0.5 border border-blue-200">
                    <div>
                        <p className="text-xs font-mono text-gray-600 font-semibold text-center leading-tight m-[2px]">
                            {t("visualization.formulas.mainArea")} {formula}
                        </p>
                        <div className="bg-gray-50 rounded px-1 border border-gray-200">
                            <p className="text-sm font-mono text-gray-700 font-bold text-center leading-tight">
                                {formulaWithValues || t("visualization.formulas.enterValues")}{" "}
                                = {area.toFixed(2)} {areaUnit === "sq.m" ? "sq.m" : "sq.ft"}
                            </p>
                        </div>
                    </div>

                    {hasOffsets && (
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded px-1 py-0.5 border-2 border-blue-400 shadow-sm mt-0.5">
                            <p className="text-xs font-mono text-gray-700 font-semibold text-center leading-tight">
                                    {t("visualization.formulas.totalNetArea")} {t("visualization.formulas.mainAreaLabelShort")}{" "}
                                {netOffsetImpact >= 0 ? "+" : "-"}{" "}
                                    {t("visualization.formulas.offsetTitleShort")}
                            </p>
                            <p className="text-base font-mono text-gray-900 font-extrabold text-center leading-tight">
                                {area.toFixed(2)}{" "}
                                {netOffsetImpact >= 0 ? "+" : "-"}{" "}
                                {Math.abs(netOffsetImpact).toFixed(2)}{" "}
                                ={" "}
                                <span className="text-blue-900 text-lg">
                                    {netArea.toFixed(2)} {areaUnit === "sq.m" ? "sq.m" : "sq.ft"}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
