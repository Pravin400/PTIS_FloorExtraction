import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AliasMaster } from "@/types/alias-master.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";

interface GetAliasMasterColumnsProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  onToggleStatus: (row: AliasMaster) => void;
  togglingId?: number | null;
}

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

export function getAliasMasterColumns({
  t,
  tCommon,
  sortBy,
  sortOrder,
  onSort,
  onToggleStatus,
  togglingId,
}: GetAliasMasterColumnsProps): Column<AliasMaster>[] {
  const createSortableLabel = (label: string, dataKey: string) => {
    return (
      <SortableHeader
        label={label}
        columnKey={dataKey}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        tCommon={tCommon}
      />
    );
  };

  return [
    { key: "keyName", label: createSortableLabel(t("keyName"), "keyName"), width: "16%", render: (v) => (typeof v === "string" ? v : "") },
    { key: "labelName", label: createSortableLabel(t("labelName"), "labelName"), width: "18%", render: (v) => (typeof v === "string" ? v : "") },
    { key: "englishName", label: createSortableLabel(t("englishName"), "englishName"), width: "18%", render: (v) => (typeof v === "string" ? v : "-") },
    { key: "regionalName", label: t("regionalName"), width: "16%", render: (v) => (typeof v === "string" ? v : "-") },
    { key: "hindiName", label: t("hindiName"), width: "16%", render: (v) => (typeof v === "string" ? v : "-") },
    {
      key: "isActive",
      label: t("status"),
      width: "10%",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={row.isActive}
            disabled={togglingId === row.id}
            showPopup={false}
            onChange={() => onToggleStatus(row)}
            activeLabel={t("active")}
            inactiveLabel={t("inactive")}
          />
          <span className={row.isActive ? "text-sm font-medium text-green-600" : "text-sm font-medium text-gray-400"}>
            {row.isActive ? t("active") : t("inactive")}
          </span>
        </div>
      ),
    },
  ];
}
