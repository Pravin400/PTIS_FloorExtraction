"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";
import { WRAP_HEADER, WRAP_CELL } from "./result-styles";
import { PropertySearchPagination } from "./PropertySearchPagination";
import type { SearchResult } from "@/types/property-search";
import type { Column } from "@/components/common";

interface PropertySearchTableProps {
  columns: Column<SearchResult>[];
  data: SearchResult[];
  loading: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchError: string | null;
  pages: (number | "dots")[];
  PAGE_SIZE_OPTIONS: number[];
  onLoadUnits: (row: SearchResult) => Promise<void>;
  viewMode: "properties" | "units";
}

export function PropertySearchTable({
  columns,
  data,
  loading,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  searchError,
  pages,
  PAGE_SIZE_OPTIONS,
  onLoadUnits,
  viewMode,
}: PropertySearchTableProps) {
  const t = useTranslations("propertySearch.results");
  const tCommon = useTranslations("common");

  const isRowExpandable = React.useCallback((row: SearchResult) => {
    const unitCount = row.childUnitCount ?? row.propertyCount ?? 0;
    return (
      row.category?.toLowerCase() === "apartment" &&
      (!row.partitionNo || row.partitionNo.trim() === "") &&
      unitCount > 0
    );
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <div className="border border-blue-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <table className="w-full table-fixed min-w-[1300px] text-sm">
            <thead className="sticky top-0 z-20 bg-gradient-to-r from-[#E2EEFF] via-[#D6E8FF] to-[#E2EEFF] border-b border-blue-200 transition-colors duration-200 hover:from-[#D6E8FF] hover:via-[#CFE3FF] hover:to-[#D6E8FF]">
              <tr>
                <th className="w-10 px-2 py-3 text-center text-sm font-semibold text-[#1E3A8A] rounded-tl-lg border-r border-blue-200/60" />
                {columns.map((col, index) => {
                  const hasBorder = col.key !== "scrollbarSpacer" && index < columns.length - 2;
                  return (
                    <th
                      key={String(col.key)}
                      style={{ width: col.width }}
                      className={cn(
                        "px-2 py-3 text-sm font-semibold text-[#1E3A8A]",
                        hasBorder ? "border-r border-blue-200/60" : "",
                        col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                        WRAP_HEADER,
                        col.headerClassName
                      )}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#004c8c]" />
                      <span className="text-sm font-medium">{tCommon("actions.loading")}</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-10 text-center text-gray-500">
                    {searchError ? t("searchFailed") : t("noResults")}
                  </td>
                </tr>
              ) : (
                data.map((row, i) => {
                  const rowKey = `${row.propertyId || row.id}-${row.partitionNo || 0}-${i}`;
                  const expandable = viewMode === "properties" && isRowExpandable(row);

                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="border-b border-blue-100 hover:bg-blue-50/40">
                        <td className="w-10 px-2 py-2 text-center align-middle border-r border-blue-100/60">
                          {expandable ? (
                            <button
                              type="button"
                              onClick={() => onLoadUnits(row)}
                              className="p-1 hover:bg-blue-50 rounded text-[#1E3A8A] flex items-center justify-center mx-auto transition-transform duration-200 cursor-pointer animate-pulse-subtle"
                              aria-label="Load apartment units"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-3.5 h-3.5"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          ) : null}
                        </td>

                        {columns.map((col, index) => {
                          const hasBorder = col.key !== "scrollbarSpacer" && index < columns.length - 2;
                          return (
                            <td
                              key={String(col.key)}
                              className={cn(
                                "px-2 py-2 text-gray-700",
                                hasBorder ? "border-r border-blue-100/60" : "",
                                col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                                WRAP_CELL,
                                col.cellClassName
                              )}
                            >
                              {col.render ? col.render(row[col.key], row, i) : String(row[col.key] ?? "-")}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <PropertySearchPagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pages={pages}
            PAGE_SIZE_OPTIONS={PAGE_SIZE_OPTIONS}
          />
        )}
      </div>
    </div>
  );
}
