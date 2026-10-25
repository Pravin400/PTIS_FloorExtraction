import React from 'react';
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/common/ActionButton";
import { OffsetData } from "@/types/offset-details.types";

interface OffsetFormSummaryProps {
    calculateAdjustedRoomTotal: () => number;
    areaUnit: "sq.m" | "sq.ft";
    handleSubtractClick: () => void;
    handleAddClick?: () => void;
    selectedOperation: "add" | "subtract" | null;
    isShakingSubtract: boolean;
    offsetData: OffsetData;
    setSelectedOperation: (op: "add" | "subtract" | null) => void;
    setOffsetValidationError: (msg: string) => void;
    offsetValidationError: string;
}

export const OffsetFormSummary: React.FC<OffsetFormSummaryProps> = ({
    calculateAdjustedRoomTotal,
    areaUnit,
    handleSubtractClick,
    handleAddClick,
    selectedOperation,
    isShakingSubtract,
    offsetData,
    offsetValidationError,
}) => {
    const t = useTranslations("quickDataEntry");

    return (
        <div className="mb-1 p-1 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{t("offset.status.total")}</span>
                    <span className="px-3 py-1 bg-white text-gray-900 font-bold rounded border border-gray-300">
                        {calculateAdjustedRoomTotal().toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600">{areaUnit === "sq.m" ? "sq.m" : "sq.ft"}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSubtractClick}
                            icon={Minus}
                            className={`p-2 rounded-md transition-all duration-150 ${selectedOperation === "subtract"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                } ${isShakingSubtract
                                    ? "animate-shake-increment border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                    : ""
                                }`}
                        />
                        {offsetData.area > 0 && selectedOperation === "subtract" && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded whitespace-nowrap">
                                {offsetData.area.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddClick}
                            icon={Plus}
                            className={`p-2 rounded-md transition-colors ${selectedOperation === "add"
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        />
                        {offsetData.area > 0 && selectedOperation === "add" && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded whitespace-nowrap">
                                +{offsetData.area.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {offsetValidationError && selectedOperation === "subtract" && (
                <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="text-xs text-red-600 font-medium">
                        {offsetValidationError}
                    </p>
                </div>
            )}
        </div>
    );
};
