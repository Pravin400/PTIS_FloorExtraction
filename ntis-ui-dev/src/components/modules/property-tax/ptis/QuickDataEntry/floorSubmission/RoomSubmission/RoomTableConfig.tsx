import { useTranslations } from "next-intl";
import { RoomTableHeaderProps } from "@/types/room-details.types";

export const COLUMN_WIDTHS = {
    roomNo: "10%",
    roomType: "14%",
    shape: "14%",
    total: "11%",
    roomCount: "11%",
    offset: "10%",
    outer: "10%",
    area: "10%",
    action: "10%"
} as const;

export type ColumnWidthsKey = keyof typeof COLUMN_WIDTHS;

export interface RoomTableHeaderExtProps extends RoomTableHeaderProps {
    isUtilityCategory?: boolean;
}

export function RoomTableHeader({ areaUnit, isUtilityCategory }: RoomTableHeaderExtProps) {
    const t = useTranslations("quickDataEntry");

    const unitLabel = areaUnit === "sq.m" ? "sq.m" : "sq.ft";

    return (
        <div className="flex gap-0 text-center py-2 text-sm bg-slate-100 text-[#333333] border-b border-gray-300 w-full min-w-[800px]">
            <div className="border-r border-gray-300 px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.roomNo }}>
                {isUtilityCategory ? "NO" : t("roomSubmission.table.roomNo")}
            </div>
            <div className="border-r border-gray-300 px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.roomType }}>
                {isUtilityCategory ? "TYPE" : t("roomSubmission.table.roomType")}
            </div>
            <div className="border-r border-gray-300 px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.shape }}>{t("roomSubmission.table.shape")}</div>
            <div className="border-r border-gray-300 px-2 font-semibold flex flex-col items-center justify-center leading-tight" style={{ width: COLUMN_WIDTHS.area }}>
                {t("roomSubmission.table.area")}&nbsp;
                <span className="text-[10px] opacity-80 uppercase">
                    ({unitLabel})
                </span>
            </div>
            <div className="border-r border-gray-300 px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.roomCount }}>
                {isUtilityCategory ? "COUNT" : t("roomSubmission.table.roomCount")}
            </div>
            <div className="border-r border-gray-300 px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.offset }}>{t("roomSubmission.table.offset")}</div>
            <div className="border-r border-gray-300 px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.outer }}>{t("roomSubmission.table.outer")}</div>
            <div className="border-r border-gray-300 px-2 font-semibold flex flex-col items-center justify-center leading-tight" style={{ width: COLUMN_WIDTHS.total }}>
                {t("roomSubmission.table.total")}&nbsp;
                <span className="text-[10px] opacity-80 uppercase">
                    ({unitLabel})
                </span>
            </div>
            <div className="px-2 font-semibold flex items-center justify-center" style={{ width: COLUMN_WIDTHS.action }}>{t("roomSubmission.table.action")}</div>
        </div>
    );
};
