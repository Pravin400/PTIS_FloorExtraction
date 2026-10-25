import React from "react";

interface AreaTextProps {
    area: number;
    unit: string;
    x: number;
    y: number;
    roomNo?: string;
}

export const AreaText: React.FC<AreaTextProps> = ({
    area,
    unit,
    x,
    y,
    roomNo,
}) => {
    if (area <= 0 || !Number.isFinite(area)) return null;
    const textStr = `${area.toFixed(2)} ${unit}`;
    const boxWidth = Math.max(90, textStr.length * 8.5 + 16);
    const rectX = x - boxWidth / 2;

    return (
        <g className="animate-in fade-in duration-500">
            {roomNo && (
                <text
                    x={x}
                    y={y - 22}
                    fill="#1E3A8A"
                    fontSize="16"
                    fontWeight="900"
                    textAnchor="middle"
                    className="drop-shadow-sm"
                >
                    {roomNo}
                </text>
            )}
            <rect
                x={rectX}
                y={y - 12}
                width={boxWidth}
                height="24"
                rx="6"
                fill="white"
                fillOpacity="0.95"
                stroke="#10B981"
                strokeWidth="1.5"
                className="drop-shadow-sm"
            />
            <text
                x={x}
                y={y + 5}
                fill="#059669"
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
            >
                {textStr}
            </text>
        </g>
    );
};
