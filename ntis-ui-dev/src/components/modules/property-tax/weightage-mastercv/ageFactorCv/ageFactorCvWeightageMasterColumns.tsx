import React from "react";
import { Column } from "@/components/common/MasterTable";
import { MatrixCellInput } from "@/components/common/MatrixCellInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
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

interface GetAgeFactorCvColumnsProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tW: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string;
  editableRows: Record<string, AgeFactorCVMaster>;
  handleCellChange: (rowId: string, columnId: string, value: number) => void;
  getRowUid: (row: AgeFactorCVMaster) => string;
  sortBy?: string;
  sortOrder?: string;
  onSort?: (key: string) => void;
  aliases?: Record<string, string>;
}

export const getAgeFactorCvWeightageMasterColumns = ({
  t,
  tW,
  tCommon,
  editableRows,
  handleCellChange,
  getRowUid,
  sortBy,
  sortOrder,
  onSort,
  aliases,
}: GetAgeFactorCvColumnsProps): Column<AgeFactorCVMaster>[] => {
  const sortableColumns: Record<string, string> = {
    constructionCode: "ConstructionCode",
    constructionDescription: "ConstructionDescription",
    ageFrom: "AgeFrom",
    ageTo: "AgeTo",
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
      key: "constructionCode",
      label: createSortableLabel(t('columns.constructionType', aliases), "constructionCode"),
      width: "12%",
      render: (value) => (value as string) || "-",
    },
    {
      key: "constructionDescription",
      label: createSortableLabel(t('columns.description'), "constructionDescription"),
      width: "18%",
      render: (value) => (value as string) || "-",
    },
    {
      key: "ageFrom",
      label: createSortableLabel(t('columns.ageFrom'), "ageFrom"),
      width: "10%",
      render: (value) => value as number,
    },
    {
      key: "ageTo",
      label: createSortableLabel(t('columns.ageTo'), "ageTo"),
      width: "10%",
      render: (value) => value as number,
    },
    {
      key: "factor",
      label: t('columns.factor'),
      width: "12%",
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
            onCellChange={handleCellChange}
            onMaxExceeded={() => toast.error(tW('common.messages.factorPercentageExceedsMax'))}
          />
        );
      },
    },
    {
      key: "fromYear",
      label: createSortableLabel(t('columns.assessmentYear', aliases), "fromYear"),
      width: "16%",
      render: (_value, row) =>
        row.fromYear != null && row.toYear != null
          ? `${row.fromYear}-${row.toYear}`
          : "-",
    },
    {
      key: "isActive",
      label: t('columns.status'),
      width: "12%",
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
