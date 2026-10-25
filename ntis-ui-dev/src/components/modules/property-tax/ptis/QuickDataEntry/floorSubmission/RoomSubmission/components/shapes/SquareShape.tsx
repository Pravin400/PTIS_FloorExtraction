import React from "react";
import { ParameterInput } from "./ParameterInput";
import { AreaText } from "./AreaText";
import { ShapeProps } from "./types";

export const SquareShape: React.FC<ShapeProps> = ({
    centerX,
    centerY,
    shapeParameters,
    isParamFilled,
    onParameterChange,
    onNextField,
    areaUnit,
    selectedRoomForPlan,
}) => {
    const s = parseFloat(String(shapeParameters.side || "0"));
    const area = s * s;
    const size = 130;
    const x = centerX - size / 2;
    const y = centerY - size / 2;
    const unit = areaUnit === "sq.m" ? "sq.m" : "sq.ft";

    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <rect x={x} y={y} width={size} height={size} fill="none" stroke="#4F46E5" strokeWidth="3" rx="4" />
            <line x1={x} y1={y - 20} x2={x + size} y2={y - 20} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={x} y1={y - 25} x2={x} y2={y - 15} stroke="#94A3B8" strokeWidth="1.5" />
            <line x1={x + size} y1={y - 25} x2={x + size} y2={y - 15} stroke="#94A3B8" strokeWidth="1.5" />
            <ParameterInput
                param="side"
                value={String(shapeParameters.side || "")}
                label="Side"
                isFilled={isParamFilled("side")}
                onChange={(val) => onParameterChange("side", val)}
                onEnter={onNextField}
                autoFocus={!isParamFilled("side")}
                x={centerX}
                y={y - 50}
                areaUnit={areaUnit}
            />
            <AreaText area={area} unit={unit} x={centerX} y={centerY} roomNo={selectedRoomForPlan.roomNo} />
        </svg>
    );
};
