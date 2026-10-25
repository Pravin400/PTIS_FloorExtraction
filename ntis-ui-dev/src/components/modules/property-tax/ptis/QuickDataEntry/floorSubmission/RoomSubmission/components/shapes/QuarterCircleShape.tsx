import React from "react";
import { ParameterInput } from "./ParameterInput";
import { AreaText } from "./AreaText";
import { ShapeProps } from "./types";

export const QuarterCircleShape: React.FC<ShapeProps> = ({
    centerX,
    centerY,
    shapeParameters,
    isParamFilled,
    onParameterChange,
    onNextField,
    areaUnit,
    selectedRoomForPlan,
}) => {
    const r_val = parseFloat(String(shapeParameters.radius || "0"));
    const area = (Math.PI * r_val * r_val) / 4;
    const r = 85;
    const unit = areaUnit === "sq.m" ? "sq.m" : "sq.ft";

    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <path d={`M ${centerX} ${centerY} L ${centerX + r} ${centerY} A ${r} ${r} 0 0 0 ${centerX} ${centerY - r} Z`} fill="none" stroke="#4F46E5" strokeWidth="3" />
            <line x1={centerX} y1={centerY} x2={centerX + r / Math.sqrt(2)} y2={centerY - r / Math.sqrt(2)} stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx={centerX} cy={centerY} r="3" fill="#6366F1" />
            <ParameterInput
                param="radius"
                value={String(shapeParameters.radius || "")}
                label="Radius"
                isFilled={isParamFilled("radius")}
                onChange={(val) => onParameterChange("radius", val)}
                onEnter={onNextField}
                autoFocus={!isParamFilled("radius")}
                x={centerX + r + 70}
                y={centerY - r / 2}
                areaUnit={areaUnit}
            />
            <AreaText area={area} unit={unit} x={centerX + r / 4} y={centerY - r / 4} roomNo={selectedRoomForPlan.roomNo} />
        </svg>
    );
};
