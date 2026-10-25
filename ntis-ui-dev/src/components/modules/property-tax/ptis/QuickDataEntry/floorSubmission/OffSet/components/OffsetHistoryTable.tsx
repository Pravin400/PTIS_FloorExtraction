import React from 'react';
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";
import { Button } from "@/components/common/ActionButton";
import { OffsetData } from "@/types/offset-details.types";
import { OFFSET_OPERATIONS, SHAPE_TYPES } from '../../RoomSubmission/constants/room-submission.constants';

interface OffsetHistoryTableProps {
    offsetList: OffsetData[];
    areaUnit: "sq.m" | "sq.ft";
    getDimensionsString: (offset: OffsetData, unit?: string) => string;
    confirmDelete: (idx: number) => void;
    deletingIndex?: number | null;
}

export const OffsetHistoryTable: React.FC<OffsetHistoryTableProps> = ({
    offsetList,
    areaUnit,
    getDimensionsString,
    confirmDelete,
    deletingIndex = null,
}) => {
    const t = useTranslations("quickDataEntry");

    if (offsetList.length === 0) return null;

    return (
        <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-[#0097A7] text-white text-center py-2 text-xs font-semibold">
                {t("offset.history.title")}
            </div>
            <div className="bg-white">
                <div className="grid grid-cols-[1fr_2fr_2.5fr_3fr_2fr_1fr] gap-0 bg-gray-100 text-center py-2 text-xs font-semibold text-gray-700 border-b border-gray-300">
                    <div>{t("offset.history.no")}</div>
                    <div>{t("offset.history.status")}</div>
                    <div>{t("offset.history.shape")}</div>
                    <div>{t("offset.history.dim")}</div>
                    <div>{t("offset.history.area")} ({areaUnit === "sq.m" ? "sq.m" : "sq.ft"})</div>
                    <div>{t("offset.history.del")}</div>
                </div>
                <div className="max-h-[140px] overflow-y-auto">
                    {offsetList.map((offset, idx) => (
                        <div
                            key={offset.id ? `offset-${offset.id}-${idx}` : `offset-idx-${idx}`}
                            className="grid grid-cols-[1fr_2fr_2.5fr_3fr_2fr_1fr] gap-0 text-center py-2 border-b border-gray-200 text-xs hover:bg-gray-50 items-center"
                        >
                            <div className="text-gray-600">{idx + 1}</div>
                            <div>
                                <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${offset.operation === OFFSET_OPERATIONS.ADD
                                        ? "bg-green-100 text-green-700"
                                        : "bg-orange-100 text-orange-700"
                                        }`}
                                >
                                    {offset.operation === OFFSET_OPERATIONS.ADD ? t("offset.history.add") : t("offset.history.sub")}
                                </span>
                            </div>
                            <div className="text-gray-700 text-center px-2">
                                {offset.shapeType || offset.shape || SHAPE_TYPES.RECTANGLE}
                            </div>
                            <div className="text-gray-600 text-xs px-1">
                                {getDimensionsString(offset, areaUnit)}
                            </div>
                            <div className="text-gray-800 font-medium">
                                {(offset.area ?? 0).toFixed(2)}
                            </div>
                            <div className="flex justify-center">
                                <Tooltip content={t("offset.deleteConfirm.delete")}>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => confirmDelete(idx)}
                                        isLoading={deletingIndex === idx}
                                        icon={Trash2}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-blue-50 border-t border-blue-200 py-2 px-3">
                    <div className="text-xs text-gray-800">
                        <span className="font-semibold">{t("offset.netAdjustment")}</span>{" "}
                        {offsetList
                            .reduce(
                                (sum, o) =>
                                    sum + (o.operation === OFFSET_OPERATIONS.ADD ? (o.area ?? 0) : -(o.area ?? 0)),
                                0
                            )
                            .toFixed(2)}{" "}
                        {areaUnit === "sq.m" ? "sq.m" : "sq.ft"}
                    </div>
                </div>
            </div>
        </div>
    );
};
