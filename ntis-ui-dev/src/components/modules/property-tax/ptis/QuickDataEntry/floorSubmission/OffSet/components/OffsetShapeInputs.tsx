import React from 'react';
import { useTranslations } from "next-intl";
import { Label } from "@/components/common/label";
import { Input, Select } from "@/components/common";
import { Info } from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";
import { Button } from "@/components/common/ActionButton";
import { OffsetData } from "@/types/offset-details.types";

interface OffsetShapeInputsProps {
    shapeOptions: { label: string; value: string }[];
    selectedShape: string;
    handleShapeChange: (shape: string) => void;
    offsetData: OffsetData;
    handleOffsetInputChange: (field: keyof OffsetData, value: string) => void;
    areaUnit: "sq.m" | "sq.ft";
    isOffsetDataValid: () => boolean;
    handleAddOffset: () => void;
}

export const OffsetShapeInputs: React.FC<OffsetShapeInputsProps> = ({
    shapeOptions,
    selectedShape,
    handleShapeChange,
    offsetData,
    handleOffsetInputChange,
    areaUnit,
    isOffsetDataValid,
    handleAddOffset,
}) => {
    const t = useTranslations("quickDataEntry");

    const cleanValue = (val: string): string | null => {
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            if (val.includes(".")) {
                const [intPart, decPart] = val.split(".");
                return intPart.slice(0, 6) + "." + (decPart.slice(0, 2));
            } else {
                return val.slice(0, 6);
            }
        }
        return null;
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2.5 items-end">
                <div id="offset-shape-select-container" className="flex-shrink-0 w-[130px]">
                    <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                        {t("offset.labels.selectShape")}
                    </Label>
                    <Select
                        options={shapeOptions}
                        value={selectedShape}
                        onChange={(_, value) => handleShapeChange(value)}
                        disabled={false}
                    />
                </div>

                {selectedShape === "Rectangle" && (
                    <>
                        <div className="flex-1 min-w-[80px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.length")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-length-input"
                                type="text"
                                value={offsetData.length}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("length", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.length).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                        <div className="flex-1 min-w-[80px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.width")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-width-input"
                                type="text"
                                value={offsetData.width}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("width", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.width).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                    </>
                )}

                {selectedShape === "Square" && (
                    <div className="flex-1 min-w-[80px]">
                        <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                            {t("offset.placeholders.side")} ({areaUnit === "sq.m" ? "m" : "ft"})
                        </Label>
                        <Input
                            id="offset-side-input"
                            type="text"
                            value={offsetData.side}
                            maxLength={7}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                                const cleaned = cleanValue(e.target.value);
                                if (cleaned !== null) handleOffsetInputChange("side", cleaned);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "." && String(offsetData.side).includes(".")) {
                                    e.preventDefault();
                                    return;
                                }
                                const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                            placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                        />
                    </div>
                )}

                {selectedShape === "Triangle" && (
                    <>
                        <div className="flex-1 min-w-[80px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.base")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-base-input"
                                type="text"
                                value={offsetData.base}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("base", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.base).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                        <div className="flex-1 min-w-[80px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.height")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-height-input"
                                type="text"
                                value={offsetData.height}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("height", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.height).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                    </>
                )}

                {selectedShape === "Trapezoid" && (
                    <>
                        <div className="flex-1 min-w-[70px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.base1")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-base1-input"
                                type="text"
                                value={offsetData.base1}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("base1", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.base1).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                        <div className="flex-1 min-w-[70px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.base2")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-base2-input"
                                type="text"
                                value={offsetData.base2}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("base2", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.base2).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                        <div className="flex-1 min-w-[70px]">
                            <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                                {t("offset.placeholders.height")} ({areaUnit === "sq.m" ? "m" : "ft"})
                            </Label>
                            <Input
                                id="offset-height-input-trap"
                                type="text"
                                value={offsetData.height}
                                maxLength={7}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                    const cleaned = cleanValue(e.target.value);
                                    if (cleaned !== null) handleOffsetInputChange("height", cleaned);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "." && String(offsetData.height).includes(".")) {
                                        e.preventDefault();
                                        return;
                                    }
                                    const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                    if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                            />
                        </div>
                    </>
                )}

                {["Circle", "Semi Circle", "Quarter Circle"].includes(selectedShape) ? (
                    <div className="flex-1 min-w-[80px]">
                        <Label className="block text-xs font-semibold mb-1.5 text-gray-700">
                            {t("offset.placeholders.radius")} ({areaUnit === "sq.m" ? "m" : "ft"})
                        </Label>
                        <Input
                            id="offset-radius-input"
                            type="text"
                            value={offsetData.radius}
                            maxLength={7}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                                const cleaned = cleanValue(e.target.value);
                                if (cleaned !== null) handleOffsetInputChange("radius", cleaned);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "." && String(offsetData.radius).includes(".")) {
                                    e.preventDefault();
                                    return;
                                }
                                const controlKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", ".", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                if (!/^[0-9]$/.test(e.key) && !controlKeys.includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            className="w-full h-10 px-3 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                            placeholder={areaUnit === "sq.m" ? "m" : "ft"}
                        />
                    </div>
                ) : null}

                <div className="flex-shrink-0 w-[130px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Label className="text-xs font-semibold text-gray-700">
                            {t("offset.calculatedArea")}
                        </Label>
                        {selectedShape === "Trapezoid" && (
                            <Tooltip content={t("offset.formulaTip")} placement="top">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                            </Tooltip>
                        )}
                    </div>
                    <Input
                        type="text"
                        value={offsetData.area.toFixed(2) + " " + (areaUnit === "sq.m" ? "sq.m" : "sq.ft")}
                        readOnly
                        className="w-full h-10 px-3 border border-purple-200 rounded-md text-sm font-semibold bg-purple-50 text-purple-900 text-center"
                    />
                </div>
            </div>

            <div className="flex gap-2.5 items-center justify-end">
                <Button
                    id="offset-add-button"
                    onClick={handleAddOffset}
                    disabled={!isOffsetDataValid()}
                    className="bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d] hover:from-[#16a34a] hover:via-[#15803d] hover:to-[#166534] text-white px-6 py-2 text-xs font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[100px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {t("offset.actions.add")}
                </Button>
            </div>
        </div>
    );
};
