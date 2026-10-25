"use client";

import { useState, useEffect } from "react";
import { getColumns } from "./TaxZoningColumns";
import { MasterTable, Column } from "@/components/common/MasterTable";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/ActionButton";
import { AddButton, ExportButton, ApplyButton, ClearButton } from "@/components/common/ActionButtons";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { TaxZone, TaxZoningRange, Ward } from "@/types/taxZoningRange.types";
import { useTaxZoningRangeFilters } from "@/hooks/taxZoningRange/useTaxZoningRange";
import { useTaxZoningExport } from "@/hooks/taxZoningRange/useTaxZoningExport";
import { ALPHANUMERIC_WITH_SPACES_SANITIZE } from "@/lib/utils/validation-rules";
import { fetchPropertiesByWardAction } from "@/app/[locale]/property-tax/taxzoningmaster/actions";
import { SearchSelect, SearchSelectOption } from "@/components/common/SearchSelect";
import { SearchInput } from "@/components/common/SearchInput";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface TaxZoningViewTableProps {
  data: TaxZoningRange[];
  taxZones: TaxZone[];
  wardsData: Ward[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  ulbName?: string;
  filters: {
    wardId?: number;
    fromPropertyNo?: string;
    toPropertyNo?: string;
    taxZoneId?: number;
    search?: string;
  };
}

export default function TaxZoningViewTable({
  data,
  taxZones,
  wardsData,
  totalCount,
  pageNumber,
  pageSize,
  ulbName,
  filters,
}: TaxZoningViewTableProps) {
  const router = useRouter();
  const params = useParams();
  const locale = String(params?.locale || "en");
  const basePath = `/${locale}/property-tax/taxzoningmaster`;
  const t = useTranslations("taxZoningRange");
  const tUi = useTranslations("taxZoningRange.ui.viewTable");
  const dateLocale = locale === "hi" ? "hi-IN" : locale === "mr" ? "mr-IN" : "en-IN";
  const wardLabel = useAliasLabel("Ward", t("aliasFallback.ward"));
  const taxZoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));

  const {
    filterWard,
    setFilterWard,
    filterFrom,
    setFilterFrom,
    filterTo,
    setFilterTo,
    filterZone,
    setFilterZone,
    search,
    setSearch,
    handleApplyFilters,
    handleClearFilters,
    changePage,
    changePageSize,
  } = useTaxZoningRangeFilters({ pageNumber, pageSize, filters });

  const [wardPropertyNos, setWardPropertyNos] = useState<string[]>([]);
  useEffect(() => {
    async function load() {
      if (!filterWard) {
        setWardPropertyNos([]);
        setFilterFrom("");
        setFilterTo("");
        return;
      }
      const res = await fetchPropertiesByWardAction(Number(filterWard));
      if (res.success && res.data) {
        const nos = res.data.items
          .map((p) => p.propertyNo)
          .filter((n): n is string => !!n)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setWardPropertyNos([...new Set(nos)]);
      } else {
        setWardPropertyNos([]);
      }
      setFilterFrom("");
      setFilterTo("");
    }
    load();
  }, [filterWard, setFilterFrom, setFilterTo]);

  const handleEdit = (id: number) => {
    router.push(`${basePath}/addtaxzoning/${id}`);
  };

  const columns = getColumns(handleEdit, tUi, dateLocale, wardLabel, taxZoneLabel);

  const isFiltered = Boolean(filters.wardId || filters.fromPropertyNo || filters.toPropertyNo || filters.taxZoneId || filters.search);

  const { isExportingExcel, handleExportExcel, isExportingPending, handleExportPending } = useTaxZoningExport(
    {
      wardId: filters.wardId,
      taxZoneId: filters.taxZoneId,
      fromPropertyNo: filters.fromPropertyNo,
      searchTerm: filters.search,
      ulbName,
    },
    isFiltered,
    t
  );

  return (
    <Card className="bg-white border-[#d8e2ef] shadow-sm" padding="none">
      {/* Panel Head */}
      <div className="min-h-[42px] px-3 py-2 flex items-center justify-between gap-3 bg-gradient-to-r from-[#f1f7ff] to-[#fbfdff] border-b border-[#d8e2ef]">
        <div className="flex items-center gap-2">
          <div className="min-w-[25px] h-[25px] flex items-center justify-center rounded-lg bg-[#17508e] text-white font-extrabold text-[11px]">
            2
          </div>
          <div>
            <h2 className="m-0 text-[14px] text-[#0b2f5b] font-semibold">{tUi("heading")}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end flex-wrap">
          <ExportButton
            label={isExportingPending ? tUi("exportingLabel") : tUi("pendingListBtn")}
            size="sm"
            isLoading={isExportingPending}
            disabled={isExportingPending}
            onClick={handleExportPending}
            className="h-[34px] text-[11px] font-extrabold"
          />
          <ExportButton
            label={isExportingExcel ? tUi("exportingLabel") : tUi("exportExcelBtn")}
            size="sm"
            isLoading={isExportingExcel}
            disabled={isExportingExcel}
            onClick={handleExportExcel}
            className="h-[34px] text-[11px] font-extrabold"
          />
          <Button
            variant="secondary"
            onClick={() => router.push(`${basePath}/wardwisezoninglist`)}
            className="h-[34px] text-[11px] font-extrabold"
          >
            {tUi("wardAbstractBtn", { ward: wardLabel })}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`${basePath}/bulkupdateZoning`)}
            className="h-[34px] text-[11px] font-extrabold"
          >
            {tUi("bulkUpdateBtn")}
          </Button>
          <AddButton
            label={tUi("addZoningRangeBtn")}
            onClick={() => router.push(`${basePath}/addtaxzoning/0`)}
            className="h-[34px] text-[11px] font-extrabold"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[minmax(105px,.55fr)_minmax(105px,.52fr)_minmax(105px,.52fr)_minmax(115px,.58fr)_minmax(220px,1.3fr)_auto] gap-1.5 p-2 bg-[#fbfdff] border-b border-[#d8e2ef] items-end">
        <div className="flex flex-col">
          <label className="text-[10px] font-extrabold text-[#42526b] mb-1">{tUi("wardNo", { ward: wardLabel })}</label>
          <SearchSelect
            name="filterWard"
            options={[{ label: tUi("allWards", { ward: wardLabel }), value: "" }, ...wardsData.map((w): SearchSelectOption => ({ label: w.wardNo, value: String(w.id) }))]}
            value={filterWard}
            onChange={(_, v) => setFilterWard(v)}
            placeholder={tUi("allWards", { ward: wardLabel })}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-extrabold text-[#42526b] mb-1">{tUi("propertyFrom")}</label>
          <SearchSelect
            name="filterFrom"
            options={[{ label: tUi("allOption"), value: "" }, ...wardPropertyNos.map((no): SearchSelectOption => ({ label: no, value: no }))]}
            value={filterFrom}
            onChange={(_, v) => setFilterFrom(v)}
            placeholder={wardPropertyNos.length === 0 ? tUi("selectWardFirst", { ward: wardLabel }) : tUi("allOption")}
            disabled={wardPropertyNos.length === 0}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-extrabold text-[#42526b] mb-1">{tUi("propertyTo")}</label>
          <SearchSelect
            name="filterTo"
            options={[
              { label: tUi("allOption"), value: "" },
              ...wardPropertyNos
                .filter((no) => !filterFrom || no.localeCompare(filterFrom, undefined, { numeric: true }) >= 0)
                .map((no): SearchSelectOption => ({ label: no, value: no })),
            ]}
            value={filterTo}
            onChange={(_, v) => setFilterTo(v)}
            placeholder={wardPropertyNos.length === 0 ? tUi("selectWardFirst", { ward: wardLabel }) : tUi("allOption")}
            disabled={wardPropertyNos.length === 0}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-extrabold text-[#42526b] mb-1">{tUi("taxZone", { taxZone: taxZoneLabel })}</label>
          <SearchSelect
            name="filterZone"
            options={[{ label: tUi("allZones", { taxZone: taxZoneLabel }), value: "" }, ...taxZones.map((z): SearchSelectOption => ({ label: z.taxZoneNo, value: String(z.id) }))]}
            value={filterZone}
            onChange={(_, v) => setFilterZone(v)}
            placeholder={tUi("allZones", { taxZone: taxZoneLabel })}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-extrabold text-[#42526b] mb-1">{tUi("zoneDescription", { taxZone: taxZoneLabel })}</label>
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val.replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, ""))}
            placeholder={tUi("searchPlaceholder")}
            className="!mb-0 w-full"
          />
        </div>
        <div className="flex items-center gap-1.5 pb-0.5 lg:col-span-1 md:col-span-3 col-span-1 justify-start lg:justify-end">
          <ApplyButton label={tUi("apply")} onClick={handleApplyFilters} className="h-[34px] text-[11px] font-extrabold" />
          <ClearButton label={tUi("reset")} onClick={handleClearFilters} className="h-[34px] text-[11px] font-extrabold" />
        </div>
      </div>

      {/* Filter Feedback */}
      <div className="min-h-[31px] px-3 py-1.5 flex items-center gap-2 border-b border-[#aac0d7] bg-[#f5faff] text-[#64748b] text-[9px]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#1aa064] shadow-[0_0_0_3px_rgba(26,160,100,.12)]"></span>
        <strong className="text-[#174f86]">
          {isFiltered ? tUi("filteredRecordsShowing", { count: totalCount }) : tUi("allRecordsDisplayed")}
        </strong>
      </div>

      {/* Table using MasterTable */}
      <div className="w-full relative">
        <MasterTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={data as unknown as Record<string, unknown>[]}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          pageNumber={pageNumber}
          height="sm"
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
        />
      </div>
    </Card>
  );
}
