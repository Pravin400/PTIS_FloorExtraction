"use client";

import React from "react";
import { Column } from "@/components/common/MasterTable";
import { UseFactorCVMaster, UseType } from "@/types/useCategoryCvFactor.types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MatrixCellInput } from "@/components/common/MatrixCellInput";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { toast } from "sonner";

/**
 * Renders a sortable column header with sort icon.
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
    onLeftSort?: (key: string) => void,
    aliases?: Record<string, string>
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
            label: createSortableLabel(t('leftTable.typeOfUseCode', aliases), "typeOfUseCode"),
            width: "30%",
            render: (value, row) => (
                <button
                    type="button"
                    className="cursor-pointer text-blue-600 hover:underline inline-flex items-center gap-2 bg-transparent border-0 p-0"
                    onClick={() => handleTypeRowClick(row)}
                >
                    <i className="fa-solid fa-list-ul text-blue-500 text-lg"></i>
                    <div className="min-w-[24px] h-[24px] px-1 rounded border border-blue-200 text-blue-500 font-semibold flex items-center justify-center text-[11px] bg-[#E2EEFF]">
                        {String(value || '')}
                    </div>
                </button>
            ),
        },
        {
            key: "description",
            label: createSortableLabel(t('leftTable.typeOfUse', aliases), "description"),
            width: "50%",
            render: (value, row) => (
                <button
                    type="button"
                    className="cursor-pointer text-blue-600 hover:underline py-1 bg-transparent border-0 p-0 text-left w-full"
                    onClick={() => handleTypeRowClick(row)}
                >
                    {String(value || '')}
                </button>
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
    aliases?: Record<string, string>
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
            label: createSortableLabel(t('columns.typeOfUseCode', aliases), "typeOfUseCode"),
            width: "20%",
            render: (value) => value || '',
        },
        {
            key: "typeOfUseDescription",
            label: createSortableLabel(t('columns.typeOfUse', aliases), "typeOfUseDescription"),
            width: "20%",
            render: (value) => value || '',
        },
        {
            key: "subTypeOfUseDescription",
            label: createSortableLabel(t('columns.subType', aliases), "subTypeOfUseDescription"),
            width: "20%",
            render: (value) => value || "-",
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
                        maxValue={100}
                        readOnly={row.isActive === false}
                        metaLabel={t('columns.factor')}
                        onCellChange={handleCellChange}
                        onMaxExceeded={() => toast.error(tW('common.messages.factorPercentageExceedsMax'))}
                    />
                );
            },
        },
        {
            key: "fromYear",
            label: createSortableLabel(t('columns.assessmentYear', aliases), "fromYear"),
            width: "15%",
            render: (_value, row) => `${row.fromYear}-${row.toYear}`,
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
