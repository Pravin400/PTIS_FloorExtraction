import React from "react";
import { ParameterInput } from "./ParameterInput";
import { AreaText } from "./AreaText";
import { ShapeProps } from "./types";

export const TriangleShape: React.FC<ShapeProps> = ({
    centerX,
    centerY,
    shapeParameters,
    isParamFilled,
    onParameterChange,
    onNextField,
    areaUnit,
    selectedRoomForPlan,
}) => {
    const b = parseFloat(String(shapeParameters.base || "0"));
    const h = parseFloat(String(shapeParameters.height || "0"));
    const area = (b * h) / 2;
    const baseWidth = 180;
    const triHeight = 110;
    const bottomY = centerY + triHeight / 2;
    const topY = centerY - triHeight / 2;
    const unit = areaUnit === "sq.m" ? "sq.m" : "sq.ft";

    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <polygon points={`${centerX},${topY} ${centerX + baseWidth / 2},${bottomY} ${centerX - baseWidth / 2},${bottomY}`} fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinejoin="round" />
            <line x1={centerX} y1={topY} x2={centerX} y2={bottomY} stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={centerX - baseWidth / 2} y1={bottomY + 20} x2={centerX + baseWidth / 2} y2={bottomY + 20} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={centerX - baseWidth / 2} y1={bottomY + 15} x2={centerX - baseWidth / 2} y2={bottomY + 25} stroke="#94A3B8" strokeWidth="1.5" />
            <line x1={centerX + baseWidth / 2} y1={bottomY + 15} x2={centerX + baseWidth / 2} y2={bottomY + 25} stroke="#94A3B8" strokeWidth="1.5" />
            <ParameterInput
                param="base"
                value={String(shapeParameters.base || "")}
                label="Base"
                isFilled={isParamFilled("base")}
                onChange={(val) => onParameterChange("base", val)}
                onEnter={() => document.querySelector<HTMLInputElement>('[data-param="height"]')?.focus()}
                autoFocus={!isParamFilled("base")}
                x={centerX}
                y={bottomY + 38}
                areaUnit={areaUnit}
            />
            <ParameterInput
                param="height"
                value={String(shapeParameters.height || "")}
                label="Height"
                isFilled={isParamFilled("height")}
                onChange={(val) => onParameterChange("height", val)}
                onEnter={onNextField}
                verticalLabel={true}
                x={centerX - baseWidth / 2 - 60}
                y={(topY + bottomY) / 2}
                areaUnit={areaUnit}
            />
            <AreaText area={area} unit={unit} x={centerX} y={bottomY - 25} roomNo={selectedRoomForPlan.roomNo} />
        </svg>
    );
};
