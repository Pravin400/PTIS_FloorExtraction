"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Info, XCircle } from "lucide-react";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { Tooltip, Button, EditButton, DeleteButton } from "@/components/common";
import { RoomDataTableProps, RoomData } from "@/types/room-details.types";
import { OffsetData } from "@/types/offset-details.types";
import { COLUMN_WIDTHS } from "./RoomTableConfig";
import { cn } from "@/lib/utils/cn";

import { isRecordOpenPlot } from "@/hooks/ptis/floorSubmission/useFloorAreaValidation";


export const RoomDataTable: React.FC<RoomDataTableProps & { isUtilityCategory?: boolean }> = (props) => {
    const {
        rooms,
        grandTotal,
        builtupGrandTotal,
        areaUnit,
        handleEdit,
        handleDelete,
        handleCancelEdit,
        editingIndex,
        selectedRoomForPlan,
        onOpenOffset,
        isUtilityCategory,
        floorData,
    } = props;

    const isOpenSpaceSection = isRecordOpenPlot(floorData);

    const t = useTranslations("quickDataEntry");

    const columns = useMemo(() => {
        const shapeWidth = isOpenSpaceSection ? "30%" : COLUMN_WIDTHS.shape;
        const totalWidth = isOpenSpaceSection ? "18%" : COLUMN_WIDTHS.total;
        const roomNoWidth = isOpenSpaceSection ? "12%" : COLUMN_WIDTHS.roomNo;
        const areaWidth = isOpenSpaceSection ? "15%" : COLUMN_WIDTHS.area;
        const roomCountWidth = isOpenSpaceSection ? "13%" : COLUMN_WIDTHS.roomCount;
        const offsetWidth = isOpenSpaceSection ? "12%" : COLUMN_WIDTHS.offset;

        return [
            {
                key: "roomNo",
                label: isUtilityCategory ? "NO" : t("roomSubmission.table.roomNo"),
                width: roomNoWidth,
                align: "center",
                cellClassName: "font-medium text-gray-700",
            },
            ...(!isOpenSpaceSection ? [
                {
                    key: "utilities",
                    label: isUtilityCategory ? "TYPE" : t("roomSubmission.table.roomType"),
                    width: COLUMN_WIDTHS.roomType,
                    align: "center",
                    render: (_val: unknown, row: RoomData) => {
                        const typeVal = row.roomTypeDescription ?? row.utilities ?? row.roomType;
                        const cleanType = (typeVal && typeVal !== "Room" && typeVal !== "Residential") ? String(typeVal) : "";
                        return (
                            <div className="px-2 text-gray-900 font-medium truncate text-center">
                                {cleanType || "-"}
                            </div>
                        );
                    }
                }
            ] : []),
            {
                key: "shape",
                label: t("roomSubmission.table.shape"),
                width: shapeWidth,
                align: "center",
                render: (val: unknown) => (
                    <div className="px-2 text-gray-900 font-medium truncate text-center">
                        {val && val !== "-Select-" ? t(`roomSubmission.input.shapes.${String(val).replace(/\s+/g, '').replace(/^\w/, c => c.toLowerCase())}`) : "-Select-"}
                    </div>
                )
            },
            {
                key: "area",
                label: `${t("roomSubmission.table.area")} (${areaUnit})`,
                width: areaWidth,
                align: "center",
                render: (val: unknown) => <div className="text-center"><span className="font-semibold text-gray-800">{parseFloat(String((val ?? 0) || 0)).toFixed(2)}</span></div>
            },
            {
                key: "roomCount",
                label: isUtilityCategory ? "COUNT" : t("roomSubmission.table.roomCount"),
                width: roomCountWidth,
                align: "center",
                cellClassName: "text-gray-700",
            },
            {
                key: "offsetMinus",
                label: t("roomSubmission.table.offset"),
                width: offsetWidth,
                align: "center",
                render: (val: unknown, row: RoomData, idx: number) => {
                    const hasOffset = val === "Yes" || row.offsetMinus === "Yes" || row.minusYesNo === true || (row.offsets && row.offsets.length > 0);
                    return (
                        <div className="flex justify-center">
                            <Tooltip placement="top" content={row.offsets && row.offsets.length > 0
                                ? t("offsetTooltip", {
                                    details: row.offsets.map((off: OffsetData) => {
                                        const normalizedShape = off.shape
                                            ? off.shape.replace(/\s+/g, "").replace(/^\w/, c => c.toLowerCase())
                                            : "";
                                        return `${t(`roomSubmission.input.shapes.${normalizedShape}`)}, ${off.operation === "subtract" ? "-" : "+"}${(off.area ?? 0).toFixed(2)}`;
                                    }).join(", ")
                                })
                                : t("offsetTooltipEmpty")}
                            >
                                <div
                                    className="flex justify-center items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onOpenOffset) onOpenOffset(idx);
                                    }}
                                >
                                    {hasOffset ? (
                                        <div className="flex items-center text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 font-bold">
                                            {row.offsets?.length || 0}
                                            <Info className="w-2.5 h-2.5 ml-1" />
                                        </div>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100">{t("floor.no")}</span>
                                    )}
                                </div>
                            </Tooltip>
                        </div>
                    );
                }
            },
            ...(!isOpenSpaceSection ? [
                {
                    key: "outer",
                    label: t("roomSubmission.table.outer"),
                    width: COLUMN_WIDTHS.outer,
                    align: "center",
                    render: (val: unknown, row: RoomData) => {
                        const isOuter = val === "Yes" || val === true || val === "true" || row.outer === "Yes" || (row.outer as unknown) === true || row.outerYesNo === true || (row as Record<string, unknown>).OuterYesNo === true;
                        return (
                            <div className="flex justify-center">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    isOuter ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-600 border border-blue-100"
                                )}>
                                    {isOuter ? t("floor.yes") : t("floor.no")}
                                </span>
                            </div>
                        );
                    }
                }
            ] : []),
            {
                key: "total",
                label: `${t("roomSubmission.table.total")} (${areaUnit})`,
                width: totalWidth,
                align: "center",
                render: (val: unknown) => <div className="text-center"><span className="font-bold text-indigo-700">{parseFloat(String((val ?? 0) || 0)).toFixed(2)}</span></div>
            }
        ];
    }, [areaUnit, t, onOpenOffset, isUtilityCategory, isOpenSpaceSection]);

    const finalColumns = columns;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <MasterTable<RoomData & Record<string, unknown>>
                columns={finalColumns as Column<RoomData & Record<string, unknown>>[]}
                data={rooms as (RoomData & Record<string, unknown>)[]}
                maxBodyHeightClassName="max-h-[260px]"
                emptyText={t("roomSubmission.table.noData")}
                getRowKey={(row: RoomData, idx: number) => String(row.tempId || (row.id ? `room-${row.id}-${idx}` : `room-${row.roomNo || idx}-${idx}`))}
                rowClassName={(row: RoomData, idx: number) => cn(
                    "transition-colors hover:bg-blue-50/50 cursor-pointer",
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50",
                    editingIndex === idx || selectedRoomForPlan?.tempId === row.tempId ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : ""
                )}
                renderActions={(row: RoomData) => {
                    const idx = rooms.indexOf(row);
                    return (
                        <>
                            {editingIndex === idx && (
                                <Tooltip placement="top" content={t("roomSubmission.table.cancel")}>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        icon={XCircle}
                                        onClick={(e) => { e.stopPropagation(); handleCancelEdit?.(); }}
                                        className="shadow-sm hover:scale-110 active:scale-95"
                                    />
                                </Tooltip>
                            )}
                            <Tooltip placement="top" content={t("roomSubmission.table.edit")}>
                                <EditButton
                                    size="xs"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(idx); }}
                                    className="room-edit-btn shadow-sm hover:scale-110 active:scale-95"
                                />
                            </Tooltip>
                            <Tooltip placement="top" content={t("roomSubmission.table.delete")}>
                                <DeleteButton
                                    size="xs"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                                    className="room-delete-btn shadow-sm hover:scale-110 active:scale-95"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Tab' && !e.shiftKey) {
                                            const allDeleteBtns = document.querySelectorAll('.room-delete-btn');
                                            if (allDeleteBtns[allDeleteBtns.length - 1] === e.currentTarget) {
                                                e.preventDefault();
                                                const saveBtn = document.getElementById('btn-room-save-data');
                                                if (saveBtn) {
                                                    saveBtn.focus();
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Tooltip>
                        </>
                    );
                }}
                footerRightContent={
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600">
                                {t("roomSubmission.table.totalArea")}
                            </span>
                            <span className="text-sm font-bold text-gray-800">
                                {(grandTotal ?? 0).toFixed(2)} {areaUnit}
                            </span>
                        </div>
                        {!isOpenSpaceSection && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-blue-600 uppercase">
                                    {t("roomSubmission.table.totalBuiltupArea")}
                                </span>
                                <span className="text-[12px] font-bold text-blue-700">
                                    {(builtupGrandTotal ?? 0).toFixed(2)} {areaUnit}
                                </span>
                            </div>
                        )}
                    </div>
                }
            >
            </MasterTable>
        </div>
    );
};