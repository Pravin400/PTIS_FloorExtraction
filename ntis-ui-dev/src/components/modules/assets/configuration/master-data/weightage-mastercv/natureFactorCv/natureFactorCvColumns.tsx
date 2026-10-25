import React from "react";
import { Column } from "@/components/common/MasterTable";
import { MatrixCellInput } from "@/components/common/MatrixCellInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { NatureFactorCVMaster as NatureFactorCVMasterType } from "@/types/natureofbuilding-cv-weightageMaster.types";
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

interface GetNatureFactorCvColumnsProps {
  t: (key: string) => string;
  tW: (key: string) => string;
  tCommon: (key: string) => string;
  editableRows: Record<string, NatureFactorCVMasterType>;
  getRowUid: (row: NatureFactorCVMasterType) => string;
  handleCellChange: (rowId: string, columnId: string, value: number) => void;
  sortBy?: string;
  sortOrder?: string;
  onSort?: (key: string) => void;
  constructionTypeOptions?: { label: string; value: string }[];
  assessmentYearOptions?: { label: string; value: string }[];
}

export const getNatureFactorCvColumns = ({
  t,
  tW,
  tCommon,
  editableRows,
  getRowUid,
  handleCellChange,
  sortBy,
  sortOrder,
  onSort,
  constructionTypeOptions = [],
  assessmentYearOptions = [],
}: GetNatureFactorCvColumnsProps): Column<NatureFactorCVMasterType>[] => {
  // Sortable columns — API requires fields: ConstructionTypeId, ConstructionDescription, YearRangeCVId
  const sortableColumns: Record<string, string> = {
    constructionCode: "ConstructionTypeId",
    constructionDescription: "ConstructionDescription",
    fromYear: "YearRangeCVId",
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
      label: createSortableLabel(t("columns.constructionCode"), "constructionCode"),
      width: "15%",
      render: (value, row) => {
        let code = "-";
        if (value && typeof value === "string" && value !== "-") {
          code = value;
        } else {
          const opt = constructionTypeOptions.find(o => o.value === String(row.constructionTypeId));
          if (opt) {
            const parts = opt.label.split(" - ");
            code = parts.length > 1 ? parts[0].trim() : opt.label;
          }
        }
        return <span className="break-all block">{code}</span>;
      },
    },
    {
      key: "constructionDescription",
      label: createSortableLabel(t("columns.description"), "constructionDescription"),
      width: "25%",
      render: (value, row) => {
        let desc = "-";
        if (value && typeof value === "string" && value !== "-") {
          desc = value;
        } else {
          const opt = constructionTypeOptions.find(o => o.value === String(row.constructionTypeId));
          if (opt) {
            const parts = opt.label.split(" - ");
            desc = parts.length > 1 ? parts.slice(1).join(" - ").trim() : opt.label;
          }
        }
        return <span className="break-all block">{desc}</span>;
      },
    },
    {
      key: "factor",
      label: t("columns.factor"),
      width: "10%",
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
            onCellChange={handleCellChange}
            onMaxExceeded={() => toast.error(tW('common.messages.valueExceedsMax'))}
          />
        );
      },
    },
    {
      key: "fromYear",
      label: createSortableLabel(t("columns.assessmentYear"), "fromYear"),
      width: "15%",
      render: (_value, row) => {
        if (row.fromYear != null && row.toYear != null && row.fromYear !== 0 && row.toYear !== 0) {
          return `${row.fromYear}-${row.toYear}`;
        }
        const yearId = (row as Record<string, unknown>).yearRangeCVId ?? (row as Record<string, unknown>).yearRangeId ?? (row as Record<string, unknown>).yearRangeCvId ?? (row as Record<string, unknown>).YearRangeCVId ?? (row as Record<string, unknown>).YearRangeCvId ?? (row as Record<string, unknown>).yearId;
        if (yearId != null && yearId !== undefined) {
          const opt = assessmentYearOptions.find(o => String(o.value) === String(yearId));
          if (opt) return opt.label;
        }
        return "-";
      },
    },
    {
      key: "isActive",
      label: t("columns.status"),
      width: "10%",
      isStatus: true,
      render: (value) => {
        return (
          <StatusBadge
            variant="status"
            value={value as boolean}
            activeLabel={tW("common.labels.active")}
            inactiveLabel={tW("common.labels.inactive")}
          />
        );
      },
    },
  ];
};
