import React from "react";
import {
  type Column,
  StatusBadge,
  Badge,
  Tooltip,
  SortAscButton,
  SortDescButton,
  SortDefaultButton,
} from "@/components/common";
import type { AssetUserListItem } from "@/types/asset-masters/user-department-allocation.types";

function AllocatedBadgesList({
  items,
  maxVisible = 2,
  align = "left",
}: {
  items: string[];
  maxVisible?: number;
  align?: "left" | "center";
}) {
  if (items.length === 0) {
    return <span className="text-slate-400 text-sm">-</span>;
  }

  const visibleItems = items.slice(0, maxVisible);
  const remainingItems = items.slice(maxVisible);

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 py-0.5 ${
        align === "center" ? "justify-center" : "justify-start"
      }`}
    >
      {visibleItems.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          size="md"
          className="font-normal text-slate-800 !h-auto !min-h-[22px] !py-1 !px-2.5 !leading-snug text-center break-words max-w-full"
          title={item}
        >
          {item}
        </Badge>
      ))}
      {remainingItems.length > 0 && (
        <Tooltip
          content={remainingItems.join(", ")}
          placement="top"
        >
          <Badge
            variant="secondary"
            size="md"
            className="font-normal text-slate-800 hover:bg-slate-200 cursor-pointer transition-colors !h-auto !min-h-[22px] !py-0.5 !px-2 !leading-snug whitespace-nowrap"
          >
            {`+${remainingItems.length} more`}
          </Badge>
        </Tooltip>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  const renderSortButton = () => {
    if (isAsc) {
      return (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={`Sort ${label} ascending`}
        />
      );
    }
    if (isDesc) {
      return (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={`Sort ${label} descending`}
        />
      );
    }
    return (
      <SortDefaultButton
        onClick={() => onSort(columnKey)}
        aria-label={`Sort by ${label}`}
      />
    );
  };

  return (
    <div className="flex items-center gap-1.5 justify-start w-full">
      <span className="font-semibold">{label}</span>
      {renderSortButton()}
    </div>
  );
}

export const ALLOWED_SORT_COLUMNS = ["userName", "firstName", "email"] as const;

export function getUserDepartmentAllocationColumns(
  t: (key: string) => string,
  _tCommon?: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetUserListItem>[] {
  const sortableColumns: readonly string[] = ALLOWED_SORT_COLUMNS;

  const createSortableLabel = (label: string, key: string) => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "userName",
      label: createSortableLabel(t("columns.username"), "userName"),
      width: "11%",
      align: "left",
      cellClassName: "py-3 px-4",
      render: (_, row) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-sm text-slate-800">
            {row.userName}
          </span>
          {row.userCode ? (
            <span className="text-xs text-slate-500 font-mono mt-0.5">
              {row.userCode}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "firstName",
      label: createSortableLabel(t("columns.fullName"), "firstName"),
      width: "12%",
      align: "left",
      cellClassName: "py-3 px-4",
      render: (_, row) => {
        const parts = [row.firstName, row.middleName, row.lastName].filter(Boolean);
        const name = parts.join(" ") || "-";
        return (
          <span className="text-sm font-medium text-slate-700">
            {name}
          </span>
        );
      },
    },
    {
      key: "email",
      label: createSortableLabel(t("columns.contact"), "email"),
      width: "13%",
      align: "left",
      cellClassName: "py-3 px-4",
      render: (_, row) => (
        <div className="flex flex-col text-left">
          <span className="text-sm text-slate-700 truncate max-w-[200px]" title={row.email || ""}>
            {row.email || "-"}
          </span>
          {row.mobileNo ? (
            <span className="text-xs text-slate-500 font-mono mt-0.5">
              {row.mobileNo}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "departments",
      label: t("columns.departmentsRole"),
      width: "14%",
      align: "left",
      cellClassName: "py-3 px-4",
      render: (_, row) => {
        const roles = row.roleAllocations || [];
        if (roles.length === 0) {
          return <span className="text-slate-400 text-sm">-</span>;
        }
        return (
          <div className="flex flex-col gap-1 text-left">
            {roles.map((r) => (
              <div key={r.id}>
                <span className="text-sm font-medium text-slate-800">
                  {r.userRoleName || "-"}
                </span>
                {r.departmentName ? (
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {r.departmentName}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "owningDepartments",
      label: t("columns.owningDepartments"),
      width: "14%",
      align: "left",
      cellClassName: "py-3 px-4",
      render: (_, row) => {
        const uniqueDepts = Array.from(
          new Set(
            (row.owningDepartments || [])
              .map((d) => d.owningDepartmentName)
              .filter((name): name is string => Boolean(name && name.trim()))
          )
        );

        return (
          <AllocatedBadgesList
            items={uniqueDepts}
            maxVisible={2}
            align="left"
          />
        );
      },
    },
    {
      key: "allocatedZones",
      label: t("columns.allocatedZones"),
      width: "11%",
      align: "center",
      cellClassName: "py-3 px-4 text-center",
      render: (_, row) => {
        const uniqueZones = Array.from(
          new Set(
            (row.zoneAllocations || [])
              .map((z) => z.zoneNo || z.zoneDescription)
              .filter((name): name is string => Boolean(name && name.trim()))
          )
        );

        return (
          <AllocatedBadgesList
            items={uniqueZones}
            maxVisible={2}
            align="center"
          />
        );
      },
    },
    {
      key: "stageAccess",
      label: t("columns.stageAccess"),
      width: "18%",
      align: "center",
      cellClassName: "py-3 px-4 text-center",
      render: (_, row) => {
        const stageNames = (row.stageAccess || [])
          .map((s) => s.stageName || s.stageCode)
          .filter((name): name is string => Boolean(name && name.trim()));

        return (
          <AllocatedBadgesList
            items={stageNames}
            maxVisible={2}
            align="center"
          />
        );
      },
    },
    {
      key: "isActive",
      label: t("columns.status"),
      width: "7%",
      align: "center",
      cellClassName: "py-3.5 px-3 text-center",
      render: (_, row) => (
        <StatusBadge
          value={row.isActive}
          activeLabel={t("status.active")}
          inactiveLabel={t("status.inactive")}
        />
      ),
    },
  ];
}
