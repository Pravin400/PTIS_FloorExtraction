"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check } from "lucide-react";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { Card } from "@/components/common/Card";
import { useWardAbstract } from "@/hooks/taxZoningRange/useWardAbstract";
import { WardZoningAbstractRow } from "@/types/taxZoningRange.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface WardAbstractDrawerProps {
  data: WardZoningAbstractRow[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  zoneLabels: string[];
  ulbName: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  overallTotalProperties: number;
  overallCoveredProperties: number;
  overallPendingProperties: number;
  overallCoveragePercent: number;
  searchInput?: React.ReactNode;
}

interface AbstractTableRow {
  wardNo: string;
  total: number;
  covered: number;
  pending: number;
  coverage: number;
  zoneCounts: Record<string, number>;
  isTotalRow?: boolean;
}

export default function WardAbstractDrawer({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  zoneLabels,
  onPageChange,
  onPageSizeChange,
  overallTotalProperties,
  overallCoveredProperties,
  overallPendingProperties,
  overallCoveragePercent,
  searchInput,
}: WardAbstractDrawerProps) {
  const tUi = useTranslations("taxZoningRange.ui.wardAbstract");
  const tRoot = useTranslations("taxZoningRange");
  const wardLabel = useAliasLabel("Ward", tRoot("aliasFallback.ward"));
  const taxZoneLabel = useAliasLabel("Tax Zone", tRoot("aliasFallback.taxZone"));
  const locale = useLocale();
  const dateLocale = locale === "hi" ? "hi-IN" : locale === "mr" ? "mr-IN" : "en-IN";
  const { filteredData } = useWardAbstract(data);

  const tableData: AbstractTableRow[] = useMemo(() => {
    const rows: AbstractTableRow[] = filteredData.map((d) => ({
      wardNo: d.wardNo,
      total: d.totalProperties,
      covered: d.coveredProperties,
      pending: d.pendingProperties,
      coverage: d.coveragePercent,
      zoneCounts: Object.fromEntries(d.zoneCounts.map((z) => [z.taxZoneNo, z.count])),
    }));

    // Zone totals for TOTAL row: sum current-page zone counts
    const totalZoneCounts: Record<string, number> = {};
    zoneLabels.forEach((label) => {
      totalZoneCounts[label] = filteredData.reduce(
        (sum, d) => sum + (d.zoneCounts.find((z) => z.taxZoneNo === label)?.count || 0),
        0
      );
    });

    rows.push({
      wardNo: tUi("totalRowLabel"),
      total: overallTotalProperties,
      covered: overallCoveredProperties,
      pending: overallPendingProperties,
      coverage: overallCoveragePercent,
      zoneCounts: totalZoneCounts,
      isTotalRow: true,
    });

    return rows;
  }, [filteredData, zoneLabels, overallTotalProperties, overallCoveredProperties, overallPendingProperties, overallCoveragePercent, tUi]);

  const columns: Column<AbstractTableRow & Record<string, unknown>>[] = [
    {
      key: "wardNo",
      label: tUi("columns.wardNo", { ward: wardLabel }),
      align: "center",
      render: (val, row) => (
        row.isTotalRow
          ? <span className="font-bold">{String(val)}</span>
          : <span className="font-bold text-[#123d70]">{String(val)}</span>
      ),
    },
    { key: "total", label: tUi("columns.total"), align: "center", render: (val) => Number(val).toLocaleString(dateLocale) },
    { key: "covered", label: tUi("columns.covered"), align: "center", render: (val) => Number(val).toLocaleString(dateLocale) },
    { key: "pending", label: tUi("columns.pending"), align: "center", render: (val) => Number(val).toLocaleString(dateLocale) },
    { key: "coverage", label: tUi("columns.coveragePercent"), align: "center", render: (val) => `${Number(val).toFixed(2)}%` },
    ...zoneLabels.map((label) => ({
      key: `zone_${label}` as keyof (AbstractTableRow & Record<string, unknown>),
      label: `${tUi("columns.zonePrefix", { taxZone: taxZoneLabel })} ${label}`,
      align: "center" as const,
      render: (_: unknown, row: AbstractTableRow) => (row.zoneCounts[label] ?? 0).toLocaleString(dateLocale),
    })),
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white sticky top-0 z-10 flex flex-col gap-3">
        {/* KPI Cards — always show all-wards totals */}
        <div className="flex items-center gap-3">
          <Card padding="none" className="flex-1 min-h-[58px] p-2 border border-[#cbdced] rounded-xl bg-gradient-to-br from-[#f5faff] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
            <div className="absolute w-[50px] h-[50px] rounded-full -right-[25px] -top-[25px] bg-[rgba(31,103,178,.05)]"></div>
            <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#e4f1fd] text-[#17508e] text-[7px] font-black">DB</span>
              {tUi("totalProperties")}
            </div>
            <strong className="block mt-1 text-[#0b315c] text-[16px] leading-none relative z-10">
              {overallTotalProperties.toLocaleString(dateLocale)}
            </strong>
          </Card>

          <Card padding="none" className="flex-1 min-h-[58px] p-2 border border-[#bcdcc9] rounded-xl bg-gradient-to-br from-[#f0fbf5] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
            <div className="absolute w-[50px] h-[50px] rounded-full -right-[25px] -top-[25px] bg-[rgba(31,103,178,.05)]"></div>
            <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#e1f5e9] text-[#16814f] text-[9px] font-black"><Check className="w-2.5 h-2.5" /></span>
              {tUi("covered")}
            </div>
            <div className="flex items-end gap-2 mt-1 relative z-10">
              <strong className="block text-[#0b315c] text-[16px] leading-none">
                {overallCoveredProperties.toLocaleString(dateLocale)}
              </strong>
              <b className="mb-0.5 px-1 py-[1px] rounded-full bg-[#dff4e8] text-[#147247] text-[8px]">
                {overallCoveragePercent.toFixed(2)}%
              </b>
            </div>
          </Card>

          <Card padding="none" className="flex-1 min-h-[58px] p-2 border border-[#ead6ad] rounded-xl bg-gradient-to-br from-[#fff9ed] to-white shadow-[0_4px_13px_rgba(29,62,104,.055)] relative overflow-hidden">
            <div className="absolute w-[50px] h-[50px] rounded-full -right-[25px] -top-[25px] bg-[rgba(31,103,178,.05)]"></div>
            <div className="flex items-center gap-1.5 text-[#50657b] text-[9px] font-black uppercase tracking-wider relative z-10">
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#fff0ce] text-[#926000] text-[9px] font-black">!</span>
              {tUi("pending")}
            </div>
            <strong className="block mt-1 text-[#0b315c] text-[16px] leading-none relative z-10">
              {overallPendingProperties.toLocaleString(dateLocale)}
            </strong>
          </Card>
        </div>

        {/* Search input slot */}
        {searchInput && (
          <div className="w-full max-w-sm">
            {searchInput}
          </div>
        )}
      </div>

      <div className="p-5 flex-1 overflow-auto bg-white">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <MasterTable
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            data={tableData as unknown as Record<string, unknown>[]}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            pageNumber={pageNumber}
            pageSize={pageSize}
            height="md"
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            rowClassName={(row) => ((row as unknown as AbstractTableRow).isTotalRow ? "bg-[#f1f5f9] font-bold border-t-2 border-gray-300" : "")}
          />
        </div>
      </div>
    </div>
  );
}

WardAbstractDrawer.displayName = "WardAbstractDrawer";
