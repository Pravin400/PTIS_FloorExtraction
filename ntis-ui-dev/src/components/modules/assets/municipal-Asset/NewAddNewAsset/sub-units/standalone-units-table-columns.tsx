'use client';

import { Button, type FloorDetailsTableColumn } from "@/components/common";
import { Edit3, Trash2 } from "lucide-react";
import { StandaloneUnitsTableColumnsArgs } from "@/types/asset/sub-units.types";

function buildLabelMap(options: { value?: string | number; label?: string }[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (Array.isArray(options)) {
    options.forEach((o) => {
      if (o.value !== undefined && o.label !== undefined) {
        map.set(String(o.value), String(o.label));
      }
    });
  }
  return map;
}

export function buildStandaloneUnitsTableColumns({
  t,
  dropdownOptions,
  isGenerating,
  onConfigureUnit,
  onDeleteUnit,
}: StandaloneUnitsTableColumnsArgs): FloorDetailsTableColumn<Record<string, unknown>>[] {
  const constructionTypeMap = buildLabelMap(dropdownOptions?.constructionTypes);
  const useTypeMap = buildLabelMap(dropdownOptions?.useTypes);
  const subUseTypeMap = buildLabelMap(dropdownOptions?.subUseTypes);

  return [
    {
      key: "unitNumber",
      label: t("subunit.columns.unitNumber"),
      render: (row) => (
        <span className="font-bold text-slate-800">{String(row.unitNumber ?? "")}</span>
      ),
    },
    {
      key: "unitName",
      label: t("subunit.columns.unitName"),
      render: (row) => (
        <span className="font-semibold text-slate-700">{String(row.unitName ?? "—")}</span>
      ),
    },
    {
      key: "floorName",
      label: t("subunit.columns.floorNumber"),
      render: (row) => {
        const floorName = String(row.floorName ?? "");
        const subFloorName = String(row.subFloorName || "");
        return (
          <span className="font-medium text-slate-700">
            {floorName || "Floor"}
            {subFloorName ? " / " + subFloorName : ""}
          </span>
        );
      },
    },
    {
      key: "conType",
      label: t("subunit.columns.conType"),
      render: (row) => (
        <span>{constructionTypeMap.get(String(row.conType)) || String(row.conType ?? "") || "—"}</span>
      ),
    },
    {
      key: "useType",
      label: t("subunit.columns.useType"),
      render: (row) => (
        <span>{useTypeMap.get(String(row.useType)) || String(row.useType ?? "") || "—"}</span>
      ),
    },
    {
      key: "subUseType",
      label: t("subunit.columns.subUseType"),
      render: (row) => (
        <span>{subUseTypeMap.get(String(row.subUseType)) || String(row.subUseType ?? "") || "—"}</span>
      ),
    },
    {
      key: "carpetAreaSqFeet",
      label: t("subunit.columns.carpetSqFt"),
      render: (row) => (
        <span className="font-mono text-slate-600">{String(row.carpetAreaSqFeet ?? 0)}</span>
      ),
    },
    {
      key: "builtUpAreaSqFeet",
      label: t("subunit.columns.builtUpSqFt"),
      render: (row) => (
        <span className="font-mono text-slate-600">{String(row.builtUpAreaSqFeet ?? 0)}</span>
      ),
    },
    {
      key: "rentAmount",
      label: t("subunit.columns.rentAmount"),
      render: (row) => (
        <span className="font-mono text-slate-600">{String(row.rentAmount ?? "—")}</span>
      ),
    },
    {
      key: "rentType",
      label: t("subunit.columns.rentType"),
      render: (row) => (
        <span>{String(row.rentType ?? "—")}</span>
      ),
    },
    {
      key: "occupantName",
      label: t("subunit.columns.occupantName"),
      render: (row) => (
        <span>{String(row.occupantName ?? "—")}</span>
      ),
    },
    {
      key: "unitsCount",
      label: t("subunit.columns.unitsCount"),
      render: (row) => {
        const count = ((row.unitsCount as number) || (row.roomsList as unknown[])?.length || 0);
        return (
          <span className="font-mono text-slate-600 font-semibold">{count}</span>
        );
      },
    },
    {
      key: "actions",
      label: t("subunit.columns.action"),
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-center">
          <Button
            size="xs"
            variant="ghost"
            type="button"
            icon={Edit3}
            onClick={() => onConfigureUnit(row)}
            disabled={isGenerating}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title={t("floorDetails.editFloorDetail")}
          />
          <Button
            size="xs"
            variant="ghost"
            type="button"
            icon={Trash2}
            onClick={() => onDeleteUnit(row)}
            disabled={isGenerating}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            title={t("floorDetails.deleteFloorDetail")}
          />
        </div>
      ),
    },
  ];
}
