"use client";

import { MasterTable, AddButton } from "@/components/common";
import { Column } from "@/components/common/MasterTable";
import { Info } from "lucide-react";
import { WingSummary } from "../wingColumns";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface WingSummaryTableProps {
  wingSummaries: WingSummary[];
  wingColumns: Column<WingSummary>[];
  onAddWingClick: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function WingSummaryTable({
  wingSummaries,
  wingColumns,
  onAddWingClick,
  t,
}: WingSummaryTableProps) {
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));
  const wingsAlias = useAliasLabel("Wings", t("defaults.wings"));

  return (
    <div className="p-3 rounded-lg border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-700">
            {t("partitionForm.wing.table.title", { wing: wingAlias })}
          </h4>
        </div>
        <AddButton
          onClick={onAddWingClick}
          label={t("partitionForm.wing.addWing", { wing: wingAlias })}
          size="xs"
        />
      </div>

      <MasterTable
        columns={wingColumns as unknown as Column<Record<string, unknown>>[]}
        data={wingSummaries as unknown as Record<string, unknown>[]}
        emptyText={t("partitionForm.wing.table.noWingsFound", { wings: wingsAlias, wing: wingAlias })}
        height="xs"
        paginationConfig={{ enabled: false }}
      />
    </div>
  );
}
