"use client";

import React, { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Info, Layers } from "lucide-react";
import { 
    RoomData, 
} from "@/types/room-details.types";
import { 
    RoomFormData, 
    ShapeParameters 
} from "@/types/common-details.types";
import { RectangleShape } from "./components/shapes/RectangleShape";
import { SquareShape } from "./components/shapes/SquareShape";
import { CircleShape } from "./components/shapes/CircleShape";
import { TriangleShape } from "./components/shapes/TriangleShape";
import { TrapezoidShape } from "./components/shapes/TrapezoidShape";
import { SemiCircleShape } from "./components/shapes/SemiCircleShape";
import { QuarterCircleShape } from "./components/shapes/QuarterCircleShape";
import { RoomFormulaDisplay } from "./components/RoomFormulaDisplay";

// --- Main RoomPreview Component ---

export const RoomPreview: React.FC<{
    selectedRoomForPlan: RoomData | null;
    filledParameters: string[];
    setFormData: Dispatch<SetStateAction<RoomFormData>>;
    shapeParameters: ShapeParameters;
    setShapeParameters: Dispatch<SetStateAction<ShapeParameters>>;
    setFilledParameters: Dispatch<SetStateAction<string[]>>;
    setSelectedRoomForPlan: (room: RoomData | null) => void;
    areaUnit: "sq.m" | "sq.ft";
}> = ({
    selectedRoomForPlan,
    filledParameters,
    setFormData,
    shapeParameters,
    setShapeParameters,
    setFilledParameters,
    setSelectedRoomForPlan,
    areaUnit,
}) => {
    const t = useTranslations("quickDataEntry");

    const getParam = (params: Record<string, unknown>, key: string, fallback: unknown = "0"): number => {
        return parseFloat(String(params[key] || fallback));
    };

    const onParameterChange = (param: string, value: string) => {
        setFormData((prev: RoomFormData) => ({
            ...prev,
            [param]: value,
        }));

        const newParams = {
            ...shapeParameters,
            [param]: value,
        };
        setShapeParameters(newParams);

        if (value && value.trim() !== "") {
            if (!filledParameters.includes(param)) {
                setFilledParameters([...filledParameters, param]);
            }
        } else {
            setFilledParameters(
                filledParameters.filter((p) => p !== param),
            );
        }

        if (selectedRoomForPlan) {
            setSelectedRoomForPlan({
                ...selectedRoomForPlan,
                shapeParams: newParams,
            });
        }
    };

    const onNextField = () => {
        const roomCountInput = document.querySelector('[data-field="roomCount"]') as HTMLInputElement;
        if (roomCountInput) {
            roomCountInput.focus();
            roomCountInput.select();
        }
    };

    const renderRealTimePlan = () => {
        if (!selectedRoomForPlan) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <Layers className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                        <p className="text-gray-600 font-semibold">
                            {t("visualization.states.selectShape")}
                        </p>
                    </div>
                </div>
            );
        }

        const shape = selectedRoomForPlan.shape || "-Select-";

        if (shape === "-Select-" || !shape) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 font-semibold">
                            {t("visualization.states.noShape")}
                        </p>
                    </div>
                </div>
            );
        }

        const currentShapeParams = (selectedRoomForPlan.shapeParameters || selectedRoomForPlan.shapeParams) || {};
        
        const getParamValue = (param: string): number => {
            const shapeParamsRecord = currentShapeParams as Record<string, unknown>;
            const roomRecord = selectedRoomForPlan as unknown as Record<string, unknown>;
            const fromShapeParams = parseFloat(String(shapeParamsRecord[param] || "0"));
            const fromRoom = parseFloat(String(roomRecord[param] || "0"));
            return fromShapeParams > 0 ? fromShapeParams : fromRoom;
        };

        const isParamFilled = (param: string) => {
            return (filledParameters || []).includes(param) || getParamValue(param) > 0;
        };

        const centerX = 200;
        const centerY = 125;

        const commonProps = {
            centerX,
            centerY,
            shapeParameters,
            isParamFilled,
            onParameterChange,
            onNextField,
            areaUnit,
            selectedRoomForPlan,
        };

        return (
            <div className="h-full w-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-slate-200/30 pointer-events-none" />

                {shape === "Rectangle" && <RectangleShape {...commonProps} />}
                {shape === "Square" && <SquareShape {...commonProps} />}
                {shape === "Circle" && <CircleShape {...commonProps} />}
                {shape === "Triangle" && <TriangleShape {...commonProps} />}
                {shape === "Trapezoid" && <TrapezoidShape {...commonProps} />}
                {shape === "Semi Circle" && <SemiCircleShape {...commonProps} />}
                {shape === "Quarter Circle" && <QuarterCircleShape {...commonProps} />}
            </div>
        );
    };

    return (
        <div
            className="w-full lg:w-[450px] border-t-2 lg:border-t-0 lg:border-l-2 border-slate-200 bg-white flex-shrink-0 flex flex-col shadow-xl transition-all duration-300 overflow-hidden lg:rounded-r-lg"
        >
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 flex items-center gap-3 border-b border-indigo-200 shadow-sm flex-shrink-0">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    {(() => {
                        const shape = selectedRoomForPlan?.shape;
                        const params = ((selectedRoomForPlan?.shapeParameters || selectedRoomForPlan?.shapeParams) || {}) as Record<string, unknown>;
                        let calculatedArea = 0;

                        if (shape === "Rectangle") {
                            const length = getParam(params, 'length', selectedRoomForPlan?.length);
                            const width = getParam(params, 'width', selectedRoomForPlan?.width);
                            if (length > 0 && width > 0) calculatedArea = length * width;
                        } else if (shape === "Square") {
                            const side = getParam(params, 'side');
                            if (side > 0) calculatedArea = side * side;
                        } else if (shape === "Circle") {
                            const radius = getParam(params, 'radius');
                            if (radius > 0) calculatedArea = Math.PI * radius * radius;
                        } else if (shape === "Triangle") {
                            const base = getParam(params, 'base');
                            const height = getParam(params, 'height');
                            if (base > 0 && height > 0) calculatedArea = 0.5 * base * height;
                        } else if (shape === "Trapezoid") {
                            const base1 = getParam(params, 'base1');
                            const base2 = getParam(params, 'base2');
                            const height = getParam(params, 'height');
                            if (base1 > 0 && base2 > 0 && height > 0)
                                calculatedArea = 0.5 * (base1 + base2) * height;
                        } else if (shape === "Semi Circle") {
                            const radius = getParam(params, 'radius');
                            if (radius > 0) calculatedArea = (Math.PI * radius * radius) / 2;
                        } else if (shape === "Quarter Circle") {
                            const radius = getParam(params, 'radius');
                            if (radius > 0) calculatedArea = (Math.PI * radius * radius) / 4;
                        }

                        return calculatedArea > 0 ? (
                            <div className="inline-flex items-center gap-2 bg-blue-600/20 px-3 py-1 rounded-lg text-sm backdrop-blur-md border border-white/20">
                                <p className="font-bold text-white">
                                    {t("visualization.area")} {calculatedArea.toFixed(2)}{" "}
                                    {areaUnit === "sq.m" ? "sq.m" : "sq.ft"}
                                </p>
                            </div>
                        ) : (
                            <h3 className="font-bold text-sm text-blue-100 uppercase tracking-widest">
                                {t("visualization.livePreview")}
                            </h3>
                        );
                    })()}
                </div>
                {selectedRoomForPlan?.roomNo && (
                    <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        {t("visualization.room")}{String(selectedRoomForPlan.roomNo || '')}
                    </div>
                )}
            </div>

            <div className="overflow-hidden min-h-[300px] flex-1 w-full bg-white relative flex items-center justify-center p-2">
                {renderRealTimePlan()}
            </div>

            {selectedRoomForPlan && (
                <RoomFormulaDisplay 
                    selectedRoomForPlan={selectedRoomForPlan} 
                    areaUnit={areaUnit} 
                />
            )}

            {!selectedRoomForPlan && (
                <div className="px-1 py-1 bg-blue-50 border-t border-blue-200 flex-shrink-0">
                    <div className="flex items-start gap-2 text-xs text-blue-700">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">
                                {t("visualization.tips.title")}
                            </p>
                            <ul className="space-y-1 text-[11px]">
                                <li>{t("visualization.tips.step1")}</li>
                                <li>{t("visualization.tips.step2")}</li>
                                <li>{t("visualization.tips.step3")}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
