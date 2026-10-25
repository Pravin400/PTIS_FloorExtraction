import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Column } from '@/components/common/MasterTable';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';
import { Tooltip } from '@/components/common';

import { ArrowUpDown } from 'lucide-react';

const ReadOnlyCellHover = ({
    value,
    onClick,
    disabled,
    tooltip
}: {
    value: string;
    onClick?: () => void;
    disabled?: boolean;
    tooltip?: string;
}) => {
    const cell = (
        <div
            onClick={disabled ? undefined : onClick}
            className={`px-1 py-0.5 min-h-[24px] flex items-center justify-center text-[11px] w-full text-gray-700 ${onClick && !disabled ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className="truncate">{value || "-"}</span>
        </div>
    );
    if (tooltip) {
        return <Tooltip content={tooltip}>{cell}</Tooltip>;
    }
    return cell;
};

const makeHeader = (title: string, tooltip: string) => (
    <Tooltip content={tooltip} placement="top">
        <div className="inline-flex h-6 w-full items-center justify-center gap-0.5 rounded border border-blue-400/10 bg-black/5 px-1.5 text-[10px] font-bold text-inherit shadow-sm transition-colors duration-200 select-none whitespace-nowrap">
            <span className="truncate font-bold uppercase tracking-normal text-white">
                {title}
            </span>
            <span className="inline-flex flex-shrink-0 items-center ml-1">
                <ArrowUpDown className="h-2.5 w-2.5 text-white opacity-60" />
            </span>
        </div>
    </Tooltip>
);

const makeFloorQcHeader = (columnKey: string, t: ReturnType<typeof useTranslations>) =>
    makeHeader(
        t(`floorQC.columns.${columnKey}`),
        t(`floorQC.toolTipFloorQC.tooltips.${columnKey}`)
    );

export function useFloorSubmissionColumns({
    subTab,
    dualMethodTab,
}: {
    subTab: string;
    dualMethodTab: string;
    onEdit: (row: FloorSubmissionRow) => void;
}): Column<FloorSubmissionRow>[] {
    const t = useTranslations("appartmentQC");

    const commonColumns: Column<FloorSubmissionRow>[] = useMemo(() => [
        { key: "floorId", label: makeFloorQcHeader("floor", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.floorId} /> },
        { key: "conYear", label: makeFloorQcHeader("conYear", t), width: "70px", align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.conYear} /> },
        { key: "asstYear", label: makeFloorQcHeader("asstYear", t), width: "70px", align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.asstYear} /> },
        { key: "constructionTypeId", label: makeFloorQcHeader("conType", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.constructionTypeId} /> },
        { key: "typeOfUseId", label: makeFloorQcHeader("use", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.typeOfUseId} /> },
        { key: "subTypeOfUseId", label: makeFloorQcHeader("subTypeOfUse", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.subTypeOfUseId} /> },
        {
            key: "noOfRooms", label: makeFloorQcHeader("noOfRooms", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
                <ReadOnlyCellHover
                    value={String(row.noOfRooms || "")}
                />
            )
        },
        {
            key: "area", label: makeFloorQcHeader("area", t), align: "center", cellClassName: "px-0.5 py-0.5", render: (_v, row) => (
                <ReadOnlyCellHover
                    value={row.area}
                />
            )
        }
    ], [t]);

    const rateableColumns: Column<FloorSubmissionRow>[] = useMemo(() => [
        { key: "rentMY", label: makeFloorQcHeader("rentMY", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.rentMY} /> },
        { key: "rateMY", label: makeFloorQcHeader("rateMY", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.rateMY} /> },
        { key: "rentalValue", label: makeFloorQcHeader("rentalValue", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.rentalValue} /> },
        { key: "depreciation", label: makeFloorQcHeader("depreciation", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.depreciation} /> },
        { key: "alv", label: makeFloorQcHeader("alv", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.alv} /> },
        { key: "mr", label: makeFloorQcHeader("mr", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.mr} /> },
        { key: "rv", label: makeFloorQcHeader("rv", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.rv} /> },
    ], [t]);

    const capitalColumns: Column<FloorSubmissionRow>[] = useMemo(() => [
        { key: "sdrr", label: makeFloorQcHeader("sdrr", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.sdrr} /> },
        { key: "baseValue", label: makeFloorQcHeader("baseValue", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.baseValue} /> },
        { key: "floorFactor", label: makeFloorQcHeader("floorFactor", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.floorFactor} /> },
        { key: "ageFactor", label: makeFloorQcHeader("ageFactor", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.ageFactor} /> },
        { key: "ntbFactor", label: makeFloorQcHeader("ntbFactor", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.ntbFactor} /> },
        { key: "useFactor", label: makeFloorQcHeader("useFactor", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.useFactor} /> },
        { key: "capitalValue", label: makeFloorQcHeader("capitalValue", t), align: "right", cellClassName: "px-0.5 py-0.5", render: (_v, row) => <ReadOnlyCellHover value={row.capitalValue} /> },
    ], [t]);

   
    return useMemo(() => {
        if (subTab === 'capital') {
            return commonColumns.concat(capitalColumns);
        }
        if (subTab === 'dual-method') {
            return dualMethodTab === 'capital'
                ? commonColumns.concat(capitalColumns)
                : commonColumns.concat(rateableColumns);
        }
        return commonColumns.concat(rateableColumns);
    }, [subTab, dualMethodTab, commonColumns, rateableColumns, capitalColumns]);
}
