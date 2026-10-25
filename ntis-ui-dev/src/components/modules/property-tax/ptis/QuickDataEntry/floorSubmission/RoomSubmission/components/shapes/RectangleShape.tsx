import React from "react";
import { ParameterInput } from "./ParameterInput";
import { AreaText } from "./AreaText";
import { ShapeProps } from "./types";

export const RectangleShape: React.FC<ShapeProps> = ({
    centerX,
    centerY,
    shapeParameters,
    isParamFilled,
    onParameterChange,
    onNextField,
    areaUnit,
    selectedRoomForPlan,
}) => {
    const l = parseFloat(String(shapeParameters.length || "0"));
    const w = parseFloat(String(shapeParameters.width || "0"));
    const area = l * w;
    const rectWidth = 180;
    const rectHeight = 100;
    const x = centerX - rectWidth / 2;
    const y = centerY - rectHeight / 2;
    const unit = areaUnit === "sq.m" ? "sq.m" : "sq.ft";

    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <rect x={x} y={y} width={rectWidth} height={rectHeight} fill="none" stroke="#4F46E5" strokeWidth="3" rx="4" />
            <line x1={x} y1={y - 20} x2={x + rectWidth} y2={y - 20} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={x} y1={y - 25} x2={x} y2={y - 15} stroke="#94A3B8" strokeWidth="1.5" />
            <line x1={x + rectWidth} y1={y - 25} x2={x + rectWidth} y2={y - 15} stroke="#94A3B8" strokeWidth="1.5" />
            <line x1={x - 20} y1={y} x2={x - 20} y2={y + rectHeight} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={x - 25} y1={y} x2={x - 15} y2={y} stroke="#94A3B8" strokeWidth="1.5" />
            <line x1={x - 25} y1={y + rectHeight} x2={x - 15} y2={y + rectHeight} stroke="#94A3B8" strokeWidth="1.5" />
            <ParameterInput
                param="length"
                value={String(shapeParameters.length || "")}
                label="Length"
                isFilled={isParamFilled("length")}
                onChange={(val) => onParameterChange("length", val)}
                onEnter={() => document.querySelector<HTMLInputElement>('[data-param="width"]')?.focus()}
                autoFocus={!isParamFilled("length")}
                x={centerX}
                y={y - 60}
                areaUnit={areaUnit}
            />
            <ParameterInput
                param="width"
                value={String(shapeParameters.width || "")}
                label="Width"
                isFilled={isParamFilled("width")}
                onChange={(val) => onParameterChange("width", val)}
                onEnter={onNextField}
                verticalLabel={true}
                x={x - 60}
                y={centerY}
                areaUnit={areaUnit}
            />
            <AreaText area={area} unit={unit} x={centerX} y={centerY} roomNo={selectedRoomForPlan.roomNo} />
        </svg>
    );
};
