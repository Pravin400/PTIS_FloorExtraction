/**
 * Auditor Application Table Columns
 * Path: src/components/modules/fire-audit/staff/auditor/AuditorApplicationColumns.tsx
 *
 * Column definitions and rendering logic for MasterTable in Auditor dashboard.
 * Line ceiling: <= 300 lines.
 */

import { Calendar, Clock, User } from "lucide-react";
import { Badge, SortableColumnHeader, type Column } from "@/components/common";
import {
  type AuditorApplication,
  STATUS_META,
  RISK_META,
  getSlaSeverity,
} from "@/types/fire-audit/auditor.types";
import { cn } from "@/lib/utils/cn";
import {
  STATUS_TRANSLATION_KEYS,
  RISK_TRANSLATION_KEYS,
  APP_TYPE_TRANSLATION_KEYS,
  BUILDING_TYPE_TRANSLATION_KEYS,
  getLocalizedStatus,
  getLocalizedRiskCategory,
  getLocalizedAppType,
  getLocalizedBuildingType,
} from "./auditorApplicationColumns.helpers";

export {
  STATUS_TRANSLATION_KEYS,
  RISK_TRANSLATION_KEYS,
  APP_TYPE_TRANSLATION_KEYS,
  BUILDING_TYPE_TRANSLATION_KEYS,
  getLocalizedStatus,
  getLocalizedRiskCategory,
  getLocalizedAppType,
  getLocalizedBuildingType,
};

export interface GetAuditorApplicationColumnsOptions {
  t: (key: string, values?: Record<string, string | number>) => string;
  tStatus?: (key: string) => string;
  tFields?: (key: string) => string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
}

export function getAuditorApplicationColumns({
  t,
  tStatus,
  tFields,
  sortBy,
  sortOrder,
  onSort,
}: GetAuditorApplicationColumnsOptions): Column<AuditorApplication>[] {
  const notAvailable = t("notAvailable") || "-";
  const defaultSla = t("defaultSla") || "10 wd";

  const renderSortableHeader = (label: string, key: string) => {
    if (onSort) {
      return (
        <SortableColumnHeader
          label={label}
          sortDirection={sortBy === key ? (sortOrder ?? null) : null}
          onSort={() => onSort(key)}
          variant="plain"
          size="xs"
        />
      );
    }
    return label;
  };

  return [
    {
      key: "id",
      label: renderSortableHeader(t("columns.appNo"), "id"),
      headerClassName: "min-w-[140px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-bold text-[#1A86E8]">{app.id}</span>
          {app.appType ? (
            <span className="text-[11px] font-medium text-slate-400">
              {getLocalizedAppType(app.appType, t, tFields)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "appDate",
      label: renderSortableHeader(t("columns.appDate"), "appDate"),
      headerClassName: "min-w-[140px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
          <span>{app.appDate}</span>
        </div>
      ),
    },
    {
      key: "sla",
      label: renderSortableHeader(t("columns.sla"), "sla"),
      headerClassName: "min-w-[120px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => {
        const rawSla = app.sla || app.days;
        const slaValue = rawSla === "10 wd" || !rawSla ? defaultSla : rawSla;
        const slaMeta = getSlaSeverity(app);
        return (
          <div className="flex items-center gap-1.5">
            <Clock className={cn("h-3.5 w-3.5 shrink-0", slaMeta.iconColor)} />
            <Badge
              variant={slaMeta.badgeVariant}
              size="sm"
              className="font-bold text-[11px]"
            >
              {slaValue}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "buildingName",
      label: renderSortableHeader(t("columns.buildingName"), "buildingName"),
      headerClassName: "min-w-[200px]",
      render: (_, app) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 text-xs sm:text-sm">{app.buildingName}</span>
          {app.address ? (
            <span className="text-[11px] font-medium text-slate-400 line-clamp-1">{app.address}</span>
          ) : null}
          {app.node && app.sector && app.wardNo ? (
            <div className="mt-1">
              <Badge
                variant="outline"
                size="sm"
                className="inline-block rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#1A86E8] h-auto"
              >
                {[app.node, app.sector, app.wardNo].filter(Boolean).join(" • ")}
              </Badge>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "applicant",
      label: renderSortableHeader(t("columns.applicant"), "applicant"),
      headerClassName: "min-w-[160px]",
      render: (_, app) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[150px]">{app.applicant}</span>
        </div>
      ),
    },
    {
      key: "buildingType",
      label: t("columns.occupancyType"),
      headerClassName: "min-w-[140px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => (
        <span className="text-xs font-medium text-slate-800">
          {getLocalizedBuildingType(app.buildingType, t, tFields)}
        </span>
      ),
    },
    {
      key: "occupancy",
      label: t("columns.typeOfUse"),
      headerClassName: "min-w-[150px]",
      render: (_, app) => (
        <Badge
          variant="outline"
          size="sm"
          className="text-[10px] font-semibold text-purple-700 bg-purple-50 border-purple-200 px-1.5 py-0.5 rounded-md w-fit inline-block h-auto"
        >
          {getLocalizedBuildingType(app.occupancy, t, tFields)}
        </Badge>
      ),
    },
    {
      key: "score",
      label: renderSortableHeader(t("columns.scoreRisk"), "score"),
      headerClassName: "min-w-[110px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => {
        const riskMeta = app.riskCategory ? RISK_META[app.riskCategory] || RISK_META.Low : null;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-semibold text-slate-900">
              {app.score !== undefined ? `${app.score}%` : notAvailable}
            </span>
            {riskMeta ? (
              <Badge
                variant={riskMeta.badgeVariant}
                size="sm"
                className="text-[10px] font-bold px-1.5 py-0.5 rounded h-auto"
              >
                {getLocalizedRiskCategory(app.riskCategory, t, tFields)}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "auditor",
      label: t("columns.surveyor"),
      headerClassName: "min-w-[130px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs sm:text-sm font-semibold text-slate-900">{app.auditor}</span>
          {app.auditorId ? (
            <span className="font-mono text-[11px] font-medium text-slate-400">{app.auditorId}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "inspectionDate",
      label: t("columns.inspDate"),
      headerClassName: "min-w-[110px]",
      cellClassName: "whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-900",
    },
    {
      key: "dueDate",
      label: renderSortableHeader(t("columns.dueDate"), "dueDate"),
      headerClassName: "min-w-[110px]",
      cellClassName: "whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-900",
      render: (_, app) => <span>{app.dueDate || app.reportDate || notAvailable}</span>,
    },
    {
      key: "deficienciesCount",
      label: t("columns.deficiencies"),
      headerClassName: "min-w-[130px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) =>
        app.deficienciesCount > 0 ? (
          <Badge variant="destructive" size="sm" className="bg-rose-100 text-[10px] font-bold text-rose-800">
            {t("deficienciesCount", { count: app.deficienciesCount })}
          </Badge>
        ) : (
          <Badge variant="success" size="sm" className="bg-emerald-100 text-[10px] font-bold text-emerald-800">
            {t("fullyCompliant")}
          </Badge>
        ),
    },
    {
      key: "status",
      label: t("columns.status"),
      headerClassName: "min-w-[140px]",
      cellClassName: "whitespace-nowrap",
      render: (_, app) => (
        <Badge
          variant={STATUS_META[app.status]?.badgeVariant || "default"}
          size="sm"
          dot
          className="font-semibold text-xs whitespace-nowrap"
        >
          {getLocalizedStatus(app.status, t, tStatus)}
        </Badge>
      ),
    },
  ];
}
