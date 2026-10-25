import React from "react";
import { ParameterInput } from "./ParameterInput";
import { AreaText } from "./AreaText";
import { ShapeProps } from "./types";

export const TrapezoidShape: React.FC<ShapeProps> = ({
    centerX,
    centerY,
    shapeParameters,
    isParamFilled,
    onParameterChange,
    onNextField,
    areaUnit,
    selectedRoomForPlan,
}) => {
    const b1 = parseFloat(String(shapeParameters.base1 || "0"));
    const b2 = parseFloat(String(shapeParameters.base2 || "0"));
    const h = parseFloat(String(shapeParameters.height || "0"));
    const area = ((b1 + b2) * h) / 2;
    const base1Width = 100;
    const base2Width = 180;
    const trapHeight = 100;
    const topY = centerY - trapHeight / 2;
    const bottomY = centerY + trapHeight / 2;
    const unit = areaUnit === "sq.m" ? "sq.m" : "sq.ft";

    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
            <polygon points={`${centerX - base1Width / 2},${topY} ${centerX + base1Width / 2},${topY} ${centerX + base2Width / 2},${bottomY} ${centerX - base2Width / 2},${bottomY}`} fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinejoin="round" />
            <line x1={centerX} y1={topY} x2={centerX} y2={bottomY} stroke="#4F46E5" strokeWidth="2" strokeDasharray="4 4" />
            <line x1={centerX - base1Width / 2} y1={topY - 20} x2={centerX + base1Width / 2} y2={topY - 20} stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={centerX - base1Width / 2} y1={topY - 25} x2={centerX - base1Width / 2} y2={topY - 10} stroke="#4F46E5" strokeWidth="1.5" />
            <line x1={centerX + base1Width / 2} y1={topY - 25} x2={centerX + base1Width / 2} y2={topY - 10} stroke="#4F46E5" strokeWidth="1.5" />
            <ParameterInput
                param="base1"
                value={String(shapeParameters.base1 || "")}
                label="Base 1"
                isFilled={isParamFilled("base1")}
                onChange={(val) => onParameterChange("base1", val)}
                onEnter={() => document.querySelector<HTMLInputElement>('[data-param="base2"]')?.focus()}
                autoFocus={!isParamFilled("base1")}
                x={centerX}
                y={topY - 60}
                areaUnit={areaUnit}
            />
            <line x1={centerX - base2Width / 2} y1={bottomY + 20} x2={centerX + base2Width / 2} y2={bottomY + 20} stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={centerX - base2Width / 2} y1={bottomY + 15} x2={centerX - base2Width / 2} y2={bottomY + 25} stroke="#4F46E5" strokeWidth="1.5" />
            <line x1={centerX + base2Width / 2} y1={bottomY + 15} x2={centerX + base2Width / 2} y2={bottomY + 25} stroke="#4F46E5" strokeWidth="1.5" />
            <ParameterInput
                param="base2"
                value={String(shapeParameters.base2 || "")}
                label="Base 2"
                isFilled={isParamFilled("base2")}
                onChange={(val) => onParameterChange("base2", val)}
                onEnter={() => document.querySelector<HTMLInputElement>('[data-param="height"]')?.focus()}
                x={centerX}
                y={bottomY + 38}
                areaUnit={areaUnit}
            />
            <line x1={centerX - base2Width / 2 - 20} y1={topY} x2={centerX - base2Width / 2 - 20} y2={bottomY} stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1={centerX - base2Width / 2 - 25} y1={topY} x2={centerX - base2Width / 2 - 10} y2={topY} stroke="#4F46E5" strokeWidth="1.5" />
            <line x1={centerX - base2Width / 2 - 25} y1={bottomY} x2={centerX - base2Width / 2 - 10} y2={bottomY} stroke="#4F46E5" strokeWidth="1.5" />
            <ParameterInput
                param="height"
                value={String(shapeParameters.height || "")}
                label="Height"
                isFilled={isParamFilled("height")}
                onChange={(val) => onParameterChange("height", val)}
                onEnter={onNextField}
                verticalLabel={true}
                x={centerX - base2Width / 2 - 60}
                y={centerY}
                areaUnit={areaUnit}
            />
            <AreaText area={area} unit={unit} x={centerX} y={centerY} roomNo={selectedRoomForPlan.roomNo} />
        </svg>
    );
};
