"use client";

import React from "react";
import { Column } from "@/components/common/MasterTable";
import { UseFactorCVMaster, UseType } from "@/types/useCategoryCvFactor.types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MatrixCellInput } from "@/components/common/MatrixCellInput";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { Button } from "@/components/common/ActionButton";
import { Badge } from "@/components/common/Badge";
import { toast } from "sonner";

/**
 * Renders a sortable column header with sort icon matching Floor Weightage header style.
 */
function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  tCommon: (key: string) => string;
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  const renderSortButton = () => {
    if (isAsc) {
      return (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`}
        />
      );
    }
    if (isDesc) {
      return (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`}
        />
      );
    }
    return (
      <SortDefaultButton
        onClick={() => onSort(columnKey)}
        aria-label={`${tCommon("table.sort.by")} ${label}`}
      />
    );
  };

  return (
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export const getTypeOfUseColumns = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, values?: Record<string, any>) => string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string,
    handleTypeRowClick: (row: UseType) => void,
    tCommon: (key: string) => string,
    leftSortBy?: string,
    leftSortOrder?: string,
    onLeftSort?: (key: string) => void
): Column<UseType>[] => {
    const sortableColumns: Record<string, string> = {
        typeOfUseCode: "TypeOfUseCode",
        description: "Description",
    };

    const createSortableLabel = (label: string, dataKey: string) => {
        const apiSortKey = sortableColumns[dataKey];
        if (onLeftSort && apiSortKey) {
            return (
                <SortableHeader
                    label={label}
                    columnKey={apiSortKey}
                    sortBy={leftSortBy}
                    sortOrder={leftSortOrder}
                    onSort={onLeftSort}
                    tCommon={tCommon}
                />
            );
        }
        return label;
    };

    return [
        {
            key: "typeOfUseCode",
            label: createSortableLabel(t('leftTable.typeOfUseCode'), "typeOfUseCode"),
            width: "30%",
            render: (value, row) => (
                <Button
                    variant="ghost"
                    className="!h-auto !p-0 !bg-transparent text-blue-600 hover:underline hover:!bg-transparent inline-flex items-center gap-2 font-normal"
                    onClick={() => handleTypeRowClick(row)}
                >
                    <i className="fa-solid fa-list-ul text-blue-500 text-lg"></i>
                    <Badge variant="default" size="sm" className="min-w-[24px] h-[24px] flex items-center justify-center border-blue-200 text-blue-500 bg-[#E2EEFF]">
                        {String(value || '')}
                    </Badge>
                </Button>
            ),
        },
        {
            key: "description",
            label: createSortableLabel(t('leftTable.typeOfUse'), "description"),
            width: "50%",
            render: (value, row) => (
                <Button
                    variant="ghost"
                    className="!h-auto !p-0 !bg-transparent text-blue-600 hover:underline hover:!bg-transparent text-left w-full py-1 font-normal justify-start"
                    onClick={() => handleTypeRowClick(row)}
                >
                    <span className="w-full text-left break-all line-clamp-2" title={String(value || '')}>{String(value || '')}</span>
                </Button>
            ),
        },
        {
            key: "isActive",
            label: t('leftTable.status'),
            width: "20%",
            isStatus: true,
            render: (value) => (
                <StatusBadge
                    variant="status"
                    value={value as boolean}
                    activeLabel={tW('common.labels.active')}
                    inactiveLabel={tW('common.labels.inactive')}
                />
            ),
        },
    ];
};

export const getUseFactorColumns = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, values?: Record<string, any>) => string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tW: (key: string, values?: Record<string, any>) => string,
    editableRows: Record<string, UseFactorCVMaster>,
    handleCellChange: (rowId: string, columnId: string, value: number) => void,
    getRowUid: (row: UseFactorCVMaster) => string,
    tCommon: (key: string) => string,
    sortBy?: string,
    sortOrder?: string,
    onSort?: (key: string) => void,
    typeOfUseOptions: { label: string; value: string }[] = [],
    assessmentYearOptions: { label: string; value: string }[] = []
): Column<UseFactorCVMaster>[] => {
    const sortableColumns: Record<string, string> = {
        typeOfUseCode: "TypeOfUseCode",
        typeOfUseDescription: "TypeOfUseDescription",
        subTypeOfUseDescription: "SubTypeOfUseDescription",
        fromYear: "FromYear",
    };

    const createSortableLabel = (label: string, dataKey: string) => {
        const apiSortKey = sortableColumns[dataKey];
        if (onSort && apiSortKey) {
            return (
                <SortableHeader
                    label={label}
                    columnKey={apiSortKey}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    tCommon={tCommon}
                />
            );
        }
        return label;
    };

    return [
        {
            key: "typeOfUseCode",
            label: createSortableLabel(t('columns.typeOfUseCode'), "typeOfUseCode"),
            width: "15%",
            render: (value, row) => {
                let code = "-";
                if (value && typeof value === "string" && value !== "-") {
                    code = value;
                } else {
                    const opt = typeOfUseOptions.find(o => o.value === String(row.typeOfUseId));
                    if (opt) {
                        const parts = opt.label.split(" - ");
                        code = parts.length > 1 ? parts[0].trim() : opt.label;
                    }
                }
                return <span className="break-all block">{code}</span>;
            },
        },
        {
            key: "typeOfUseDescription",
            label: createSortableLabel(t('columns.typeOfUse'), "typeOfUseDescription"),
            width: "20%",
            render: (value, row) => {
                let desc = "-";
                if (value && typeof value === "string" && value !== "-") {
                    desc = value;
                } else {
                    const opt = typeOfUseOptions.find(o => o.value === String(row.typeOfUseId));
                    if (opt) {
                        const parts = opt.label.split(" - ");
                        desc = parts.length > 1 ? parts.slice(1).join(" - ").trim() : opt.label;
                    }
                }
                return <span className="break-all block">{desc}</span>;
            },
        },
        {
            key: "subTypeOfUseDescription",
            label: createSortableLabel(t('columns.subType'), "subTypeOfUseDescription"),
            width: "25%",
            render: (value) => (
                <span className="break-all block" title={String(value || '')}>
                    {(value as string) || "-"}
                </span>
            ),
        },
        {
            key: "factor",
            label: t('columns.factor'),
            width: "15%",
            render: (value, row) => {
                const rowUid = getRowUid(row);
                const editableValue = editableRows[rowUid]?.factor ?? (value as number);
                return (
                    <MatrixCellInput
                        className="lg:w-26"
                        value={editableValue}
                        rowId={rowUid}
                        columnId="factor"
                        maxValue={999.99}
                        metaLabel={t('columns.factor')}
                        onCellChange={handleCellChange}
                        onMaxExceeded={() => toast.error(tW('common.messages.valueExceedsMax'))}
                    />
                );
            },
        },
        {
            key: "fromYear",
            label: createSortableLabel(t('columns.assessmentYear'), "fromYear"),
            width: "15%",
            render: (_value, row) => {
                if (row.fromYear != null && row.toYear != null && row.fromYear !== 0 && row.toYear !== 0) {
                    return `${row.fromYear}-${row.toYear}`;
                }
                const yearId = row.yearRangeCVId ?? row.yearRangeId ?? row.yearRangeCvId ?? row.YearRangeCVId ?? row.YearRangeCvId ?? row.yearId;
                if (yearId != null && yearId !== undefined) {
                    const opt = assessmentYearOptions.find(o => String(o.value) === String(yearId));
                    if (opt) return opt.label;
                }
                return "-";
            },
        },
        {
            key: "isActive",
            label: t('columns.status'),
            width: "10%",
            isStatus: true,
            render: (value) => {
                return (
                    <StatusBadge
                        variant="status"
                        value={value as boolean}
                        activeLabel={tW('common.labels.active')}
                        inactiveLabel={tW('common.labels.inactive')}
                    />
                );
            },
        },
    ];
};

