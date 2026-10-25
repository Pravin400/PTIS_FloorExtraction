"use client";

import { MasterTable, Button } from "@/components/common";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { CustomDateRange } from "@/types/renter/renter.types";
import { normalizeCalculationMethod, formatDateDDMMYYYY } from "@/lib/utils/renter/renterUtils";

interface CustomRangeTableRow {
    id: string;
    rowIndex: number;
    range: CustomDateRange;
    incrementSource: {
        incrementType: 'Percentage' | 'Fixed';
        incrementValue: number;
    };
    durationMonths: number;
    durationTotal: number;
    [key: string]: unknown;
}

interface CustomRangesTableProps {
    data: CustomRangeTableRow[];
    onDelete: (id: string) => void;
}

export const CustomRangesTable = (props: CustomRangesTableProps) => {
    const t = useTranslations('quickDataEntry');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: any[] = [
        {
            key: "rowIndex",
            label: "#",
            width: "7%",
            headerClassName: "text-center text-[10px] uppercase tracking-wider text-slate-500 font-bold",
            cellClassName: "text-center",
            render: (val: unknown) => (
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-gray-200">
                    {val as number}
                </span>
            ),
        },
        {
            key: "range",
            label: t('floor.table.duration'),
            width: "28%",
            headerClassName: "text-[10px] uppercase tracking-wider text-slate-500 font-bold",
            cellClassName: "text-xs font-semibold text-slate-800",
            render: (_v: unknown, row: CustomRangeTableRow) => {
                const r = row.range;
                return (
                    <>
                        {formatDateDDMMYYYY(r.fromDate)}
                        <span className="text-slate-400 mx-1">{`→`}</span>
                        {formatDateDDMMYYYY(r.toDate)}
                    </>
                );
            },
        },
        {
            key: "durationMonths",
            label: t('floor.renterSection.months'),
            width: "10%",
            headerClassName: "text-center text-[10px] uppercase tracking-wider text-slate-500 font-bold",
            cellClassName: "text-center text-xs font-semibold text-slate-700",
            render: (val: unknown) => `${val as number}M`,
        },
        {
            key: "incrementSource",
            label: t('floor.table.increment'),
            width: "14%",
            headerClassName: "text-[10px] uppercase tracking-wider text-slate-500 font-bold",
            render: (_v: unknown, row: CustomRangeTableRow) => {
                const r = row.incrementSource;
                return (
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${r.incrementType === "Percentage" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-emerald-50 text-emerald-800 border border-emerald-100"}`}>
                        {r.incrementType === "Percentage" ? `${r.incrementValue}%` : `${`₹`}${r.incrementValue.toLocaleString("en-IN")}`}
                    </span>
                );
            },
        },
        {
            key: "methodSource",
            label: t('floor.renterSection.method'),
            width: "12%",
            headerClassName: "text-[10px] uppercase tracking-wider text-slate-500 font-bold",
            render: (_v: unknown, row: CustomRangeTableRow) => {
                const method = normalizeCalculationMethod(row.range.calculationMethod);
                const isCompounding = method === "Incremented Value";
                return (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${isCompounding ? "bg-amber-50 text-amber-800 border border-amber-100" : "bg-slate-50 text-slate-700 border border-gray-200"}`}>
                    {isCompounding ? t('floor.renterSection.incrementedCompounding') : t('floor.renterSection.baseValueLinear')}
                </span>
                );
            },
        },
        {
            key: "durationTotal",
            label: t('floor.renterSection.rangeTotal'),
            width: "16%",
            headerClassName: "text-right text-[10px] uppercase tracking-wider text-slate-500 font-bold",
            cellClassName: "text-right",
            render: (val: unknown) => (
                <span className="text-xs font-bold text-slate-900">
                    {`₹`}{Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            key: "id",
            label: " ",
            width: "8%",
            headerClassName: "text-center",
            cellClassName: "text-center",
            render: (_v: unknown, row: CustomRangeTableRow) => (
                <Button variant="ghost" onClick={() => props.onDelete(row.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50">
                    <X className="w-3.5 h-3.5" />
                </Button>
            ),
        },
    ];

    return (
        <MasterTable
            columns={columns}
            data={props.data}
            headerTitle={`${t('floor.renterSection.activeDateRanges')} (${props.data.length})`}
            containerClassName="rounded-xl overflow-hidden shadow-sm border border-gray-200 pt-0"
            tableClassName="text-xs min-w-[520px]"
            getRowKey={(row) => row.id}
        />
    );
};
