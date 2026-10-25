"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import * as XLSX from "xlsx-js-style";
import { toast } from "sonner";
import { ValidationMessage } from "@/components/common";
import type {
  PropertySearchResultsProps,
} from "@/types/property-search";
import { usePropertySearchResults } from "@/hooks/search-property";
import { ArrowLeft } from "lucide-react";
import { fetchApartmentUnitListAction } from "@/app/[locale]/property-tax/search-property/action";
import { buildPropertySearchPayload } from "@/lib/api/property-search/build-search-payload";
import type { SearchResult } from "@/types/property-search";
import { buildPropertySearchColumns } from "./results/columns";
import { ResultsHeader } from "./results/ResultsHeader";
import { PropertySearchTable } from "./results/PropertySearchTable";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type PageToken = number | "dots";

function buildPagination(current: number, total: number): PageToken[] {
  const pages: PageToken[] = [];
  const window = 3;
  const start = Math.max(1, current - Math.floor(window / 2));
  const end = Math.min(total, start + window - 1);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("dots");
  }

  for (let i = start; i <= end; i++) pages.push(i);

  if (end < total) {
    if (end < total - 1) pages.push("dots");
    pages.push(total);
  }

  return pages;
}

export function PropertySearchResults({
  selectedStatus,
  isSearchActive,
  results,
  totalCount: totalCountProp,
  pageNumber: pageNumberProp,
  pageSize: pageSizeProp,
  onPageChange,
  onPageSizeChange,
  loading = false,
  searchError = null,
  zoneOptions,
  allWardOptions,
  criteria,
  activeTab,
}: PropertySearchResultsProps): React.ReactElement {
  const t = useTranslations("propertySearch.results");
  const locale = useLocale();

  const [viewMode, setViewMode] = React.useState<"properties" | "units">("properties");
  const [activeApartment, setActiveApartment] = React.useState<SearchResult | null>(null);
  const [units, setUnits] = React.useState<SearchResult[]>([]);
  const [unitsLoading, setUnitsLoading] = React.useState(false);

  const [prevResults, setPrevResults] = React.useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setViewMode("properties");
    setActiveApartment(null);
    setUnits([]);
  }

  const displayResults = viewMode === "units" ? units : results;

  const {
    filteredData,
    paginatedData,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  } = usePropertySearchResults({
    results: displayResults,
    totalCount: viewMode === "units" ? undefined : totalCountProp,
    pageNumber: viewMode === "units" ? undefined : pageNumberProp,
    pageSize: viewMode === "units" ? undefined : pageSizeProp,
    onPageChange: (page) => onPageChange(page, pageSizeProp),
    onPageSizeChange,
  });

  const handleLoadUnits = React.useCallback(async (row: SearchResult) => {
    setUnitsLoading(true);
    try {
      const criteriaPayload = criteria
        ? buildPropertySearchPayload(
            selectedStatus,
            criteria,
            isSearchActive,
            activeTab ?? "quick-search"
          )
        : undefined;

      if (criteriaPayload && criteria?.propertyNoFrom) {
        criteriaPayload.propertyNoFrom = criteria.propertyNoFrom.trim();
      }
      if (criteriaPayload && criteria?.propertyNoTo) {
        criteriaPayload.propertyNoTo = criteria.propertyNoTo.trim();
      }

      const res = await fetchApartmentUnitListAction(row.propertyId, criteriaPayload);
      if (res.error) {
        toast.error(res.error);
      } else {
        const fetchedUnits = res.items || [];
        row.childUnitCount = res.totalCount ?? fetchedUnits.length;
        setUnits(fetchedUnits);
        setActiveApartment(row);
        setViewMode("units");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load apartment units";
      toast.error(msg);
    } finally {
      setUnitsLoading(false);
    }
  }, [criteria, selectedStatus, isSearchActive, activeTab]);

  const handleBackToProperties = React.useCallback(() => {
    setViewMode("properties");
    setActiveApartment(null);
    setUnits([]);
  }, []);

  const pages = React.useMemo(() => {
    return buildPagination(pageNumber, Math.max(1, totalPages));
  }, [pageNumber, totalPages]);

  const handleExportToExcel = React.useCallback(() => {
    if (filteredData.length === 0) {
      toast.error(t("noDataToExport"));
      return;
    }

    const excelData = filteredData.map((row) => {
      const displayZone = row.zone?.trim() || "";
      const displayWard = row.ward?.trim() || "";

      const zoneOpt = zoneOptions.find(
        (opt) => opt.label.startsWith(`${displayZone} - `) || opt.label === displayZone
      );
      const zoneLabel = zoneOpt ? zoneOpt.label : displayZone;

      const wardOpt = allWardOptions.find(
        (opt) => opt.label.startsWith(`${displayWard} - `) || opt.label === displayWard
      );
      const wardLabel = wardOpt ? wardOpt.label : displayWard;

      const rawHolder = row.holderName?.trim() || "";
      const isPlaceholderHolder = rawHolder.toLowerCase() === "the holder";
      const holder = isPlaceholderHolder ? "" : rawHolder;

      return {
        "UPIC ID": row.upicId ?? "",
        Zone: zoneLabel,
        Ward: wardLabel,
        "PROP-PART NO": row.partitionNo ? `${row.propertyNo}-${row.partitionNo}` : (row.propertyNo ?? ""),
        "Old Property No.": row.oldPropertyNo ?? "",
        Category: row.category ?? "",
        "Society Name": row.societyName ?? "",
        "Property Description": row.description ?? "",
        "Owner Name": holder,
        "Occupier Name": row.occupierName ?? "",
        "Mobile No.": row.mobile ?? "",
        "Alternate Mobile No.": row.alternateMobile ?? "",
        "Rateable Value (RV)": row.rv ?? 0,
        "Capital Value (CV)": row.cv ?? "",
        "Total Tax": row.totalTax ?? 0,
        Address: row.address ?? "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Format headers with custom style (TMC Brand Blue background and dark text)
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "D6E8FF" }, // Light blue background
          },
          font: {
            name: "Arial",
            sz: 10,
            bold: true,
            color: { rgb: "1E3A8A" }, // Dark blue text
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "B2CFFF" } },
            bottom: { style: "medium", color: { rgb: "1E3A8A" } },
            left: { style: "thin", color: { rgb: "B2CFFF" } },
            right: { style: "thin", color: { rgb: "B2CFFF" } },
          },
        };
      }
    }

    // Set header row height to 28 pt to provide a spacious feel
    worksheet["!rows"] = [{ hpt: 28 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Property Data");

    const maxLens = Object.keys(excelData[0]).map((key) => {
      let maxLen = key.length;
      for (const row of excelData) {
        const valStr = String((row as Record<string, unknown>)[key] ?? "");
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
      return { wch: maxLen + 2 };
    });
    worksheet["!cols"] = maxLens;

    XLSX.writeFile(workbook, "Property_Search_Results.xlsx");
  }, [filteredData, zoneOptions, allWardOptions, t]);

  const columns = React.useMemo(
    () => buildPropertySearchColumns(t, locale, zoneOptions, allWardOptions, viewMode),
    [t, locale, zoneOptions, allWardOptions, viewMode]
  );

  return (
    <div className="space-y-2">
      <ResultsHeader
        selectedStatus={selectedStatus}
        exportDisabled={filteredData.length === 0 || loading || unitsLoading}
        onExport={handleExportToExcel}
      />

      {viewMode === "units" && activeApartment && (
        <div className="flex items-center gap-2 mb-2 p-1.5 bg-blue-50/50 border border-blue-200/60 rounded-lg text-sm text-[#1E3A8A] font-medium">
          <button
            type="button"
            onClick={handleBackToProperties}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 border border-blue-200 rounded-md text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            {t("backToProperties") || "Back to Properties"}
          </button>
          <span>
            {t("viewingUnitsFor")} {t("apartment")}: <strong>{activeApartment.upicId || activeApartment.propertyNo}</strong>
          </span>
        </div>
      )}

      <ValidationMessage
        message={searchError ?? undefined}
        visible={Boolean(searchError)}
        type="error"
      />

      <PropertySearchTable
        columns={columns}
        data={paginatedData}
        loading={loading || unitsLoading}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        searchError={searchError}
        pages={pages}
        PAGE_SIZE_OPTIONS={PAGE_SIZE_OPTIONS}
        onLoadUnits={handleLoadUnits}
        viewMode={viewMode}
      />
    </div>
  );
}
