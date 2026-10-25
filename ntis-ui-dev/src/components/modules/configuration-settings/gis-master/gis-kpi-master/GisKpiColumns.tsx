import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { GisKpiMaster } from "@/types/gis-master/gis-kpi-master.types";
import { resolveLucideIcon } from "./constants";
import {
  SortAscButton,
  SortDescButton,
  SortDefaultButton,
} from "@/components/common/ActionButtons";

/**
 * Renders a sortable column header with sort icon
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

/**
 * Returns the table column configuration for GIS KPI Master.
 */
export function getGisKpiColumns(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<GisKpiMaster>[] {
  const sortableColumns = ["kpiCode", "defaultTitle"];

  const createSortableLabel = (label: string, key: string) => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={(k) => tCommon(k)}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "kpiCode",
      label: createSortableLabel(t("list.table.kpiCode"), "kpiCode"),
      width: "15%",
      render: (value) => (
        <span className="font-semibold text-blue-900">
          {typeof value === "string" ? value : ""}
        </span>
      ),
    },
    {
      key: "defaultTitle",
      label: createSortableLabel(t("list.table.defaultTitle"), "defaultTitle"),
      width: "25%",
      render: (value) => (
        <span className="text-gray-800 font-medium">
          {typeof value === "string" ? value : ""}
        </span>
      ),
    },
    {
      key: "defaultIcon",
      label: t("list.table.defaultIcon"),
      width: "15%",
      render: (value, row) => {
        const iconName = typeof value === "string" ? value : "";
        if (!iconName) return <span className="text-gray-400">—</span>;
        const IconComponent = resolveLucideIcon(iconName);
        const iconColor = typeof row.defaultColor === "string" && row.defaultColor ? row.defaultColor : "#2563EB";
        return (
          <div
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs"
            title={iconName}
          >
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${iconColor}15`,
                borderColor: `${iconColor}30`,
                color: iconColor,
              }}
            >
              <IconComponent className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-slate-600 text-[11px] truncate max-w-[110px]">
              {iconName}
            </span>
          </div>
        );
      },
    },
    {
      key: "defaultColor",
      label: t("list.table.defaultColor"),
      width: "12%",
      render: (value) => {
        const color = typeof value === "string" && value ? value : "#2563EB";
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded-full border border-gray-300 shadow-xs shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-xs text-gray-700 uppercase">
              {color}
            </span>
          </div>
        );
      },
    },
    {
      key: "mappedDepartments",
      label: t("list.table.mappedDepartment"),
      width: "23%",
      render: (_value, row) => {
        const departments = (row.mappedDepartments ?? []).filter((dept) => dept.isActive !== false);
        if (!departments.length) {
          return <span className="text-gray-400 text-xs italic">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5 items-center">
            {departments.map((dept) => {
              const DeptIcon = resolveLucideIcon(dept.customIcon || row.defaultIcon);
              const deptColor = dept.customColor || row.defaultColor || "#2563EB";
              return (
                <span
                  key={`${dept.departmentId}-${dept.id}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  title={
                    dept.customTitle
                      ? `${dept.departmentName || ""} (${dept.customTitle})`
                      : dept.departmentName || undefined
                  }
                >
                  <DeptIcon className="w-3.5 h-3.5 shrink-0" style={{ color: deptColor }} />
                  <span>{dept.departmentName || `Dept ${dept.departmentId}`}</span>
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "10%",
      isStatus: true,
    },
  ];
}
