"use client";

import { useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { RateMasterClientProps } from "@/types/RVRateMaster";
import { useRateMasterFilters } from "@/hooks/RVRateMaster/useRateMasterFilters";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { RateViewFilters, RateViewActions, RateViewGrid } from "./view";
import { downloadDetailedRates } from "./view/rateDownloadHelpers";
import { filterTableData, countConfiguredRates, buildCategoryColorMap, buildRateColumns } from "./view/rateViewHelpers";

const singleColorClass = "text-blue-900";
const singleColorClassHeader = "text-blue-1000";

export default function RateMasterView({
  rateMasterData = [],
  totalPages = 0,
  totalCount = 0,
  zones = [],
  useGroups = [],
  assessmentYears = [],
  rateCategories = [],
  zoneDescriptions = [],
  initialZone = "ALL",
  initialUseGroup,
  initialYear = "ALL",
  rateUnitPolicy,
  rateFrequencyPolicy,
  globalFrequencyMismatch,
  isOpenPlot = false,
}: RateMasterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("ptis_RVRateMaster");
  const tCommon = useTranslations("common");

  const rateSectionLabel = useAliasLabel("Rate_Section", t("aliasFallback.rateSection"));
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const taxZoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  const aliasLabels = useMemo(() => ({
    rateSection: rateSectionLabel,
    assessment: assessmentLabel,
    use: useLabel,
    taxZone: taxZoneLabel,
    typeOfUse: typeOfUseLabel,
  }), [rateSectionLabel, assessmentLabel, useLabel, taxZoneLabel, typeOfUseLabel]);
  const pageNumber = Number(searchParams?.get("page")) || 1;
  const rawPageSize = Number(searchParams?.get("pageSize"));
  const pageSize = [50, 100, 150, 200, 250].includes(rawPageSize) ? rawPageSize : 50;
  const zoneRemarksMap = useMemo(() => {
    const map = new Map<string, string>();
    zoneDescriptions.forEach(zone => {
      map.set(zone.zoneNo, zone.description || '');
    });
    return map;
  }, [zoneDescriptions]);
  const useGroupsFiltered = useMemo(() => {
    return useGroups.filter(opt => opt.value !== 'ALL');
  }, [useGroups]);

  const isPaginationEnabled = totalPages !== undefined && pageNumber !== undefined;
  const filterValues = useMemo(() => ({
    zone: initialZone,
    useGroup: isOpenPlot ? "ALL" : (initialUseGroup || (useGroupsFiltered.length > 0 ? useGroupsFiltered[0].value : "")),
    year: initialYear,
  }), [initialZone, initialUseGroup, initialYear, isOpenPlot, useGroupsFiltered]);

  const {
    selectedZone,
    selectedUseGroup,
    assessmentYear: selectedYear,
    handleDropdownChange,
  } = useRateMasterFilters({
    mode: "add",
    filterValues,
    useGroupOptions: useGroupsFiltered,
  });

  const handleZoneChange = useCallback((value: string) => {
    handleDropdownChange('zone', value);
  }, [handleDropdownChange]);

  const handleYearChange = useCallback((value: string) => {
    handleDropdownChange('assessmentYear', value);
  }, [handleDropdownChange]);

  const handleUseGroupChange = useCallback((value: string) => {
    handleDropdownChange('useGroup', value);
  }, [handleDropdownChange]);
  const [isGeneratingRate, startGenerateTransition] = useTransition();

  const handleGenerateRate = () => {
    const routePrefix = isOpenPlot ? 'openplot' : 'rvratemaster';
    startGenerateTransition(() => {
      router.push(`/${locale}/property-tax/rate-master/${routePrefix}/add`);
    });
  };

  const handleEditRate = () => {
    const routePrefix = isOpenPlot ? 'openplot' : 'rvratemaster';
    const params = new URLSearchParams();
    params.set('zone', selectedZone ?? "");
    params.set('year', selectedYear ?? "");
    if (!isOpenPlot) params.set('useGroup', selectedUseGroup ?? "");
    router.push(`/${locale}/property-tax/rate-master/${routePrefix}/EditDelete/bulk?${params.toString()}`);
  };

  const handleDeleteRate = () => {
    const routePrefix = isOpenPlot ? 'openplot' : 'rvratemaster';
    const params = new URLSearchParams();
    params.set('zone', selectedZone ?? "");
    params.set('year', selectedYear ?? "");
    if (!isOpenPlot) params.set('useGroup', selectedUseGroup ?? "");
    params.set('mode', 'delete');
    router.push(`/${locale}/property-tax/rate-master/${routePrefix}/EditDelete/bulk?${params.toString()}`);
  };

  const handleDownloadRates = async () => {
    await downloadDetailedRates(selectedZone, zones, rateUnitPolicy?.value ?? "SqMeter", t, rateCategories, useGroups, isOpenPlot, aliasLabels);
  };
  const filteredData = useMemo(() =>
    filterTableData(rateMasterData, selectedZone, selectedYear, selectedUseGroup, isPaginationEnabled, isOpenPlot),
    [rateMasterData, selectedZone, selectedYear, selectedUseGroup, isPaginationEnabled, isOpenPlot]
  );
  const ratesConfiguredCount = useMemo(() =>
    countConfiguredRates(filteredData),
    [filteredData]
  );
  const categoryColorMap = useMemo(() =>
    buildCategoryColorMap(rateCategories, singleColorClass),
    [rateCategories]
  );

  const columns = useMemo(() =>
    buildRateColumns(rateCategories, singleColorClassHeader, tCommon, t, rateUnitPolicy?.value ?? "SqMeter", aliasLabels),
    [rateCategories, tCommon, t, rateUnitPolicy, aliasLabels]
  );

  const isDownloadDisabled = !selectedZone || selectedZone === 'ALL' ||
    (!isOpenPlot && (!selectedUseGroup || selectedUseGroup === 'ALL')) ||
    !selectedYear || selectedYear === 'ALL';

  // Use the global frequency mismatch from props
  const frequencyMismatch = globalFrequencyMismatch;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.set('pageSize', size.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const isDrawerOpen = pathname.includes('/add') || pathname.includes('/EditDelete') || pathname.includes('/edit');

  return (
    <div className="space-y-1" inert={isDrawerOpen ? true : undefined}>
      {/* Combined Filters and Action Buttons Section */}
      <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-2 md:p-3 pl-6">
        <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-end">
          {/* Filters */}
          <div className="flex-1 w-full">
            <RateViewFilters
              zones={zones}
              assessmentYears={assessmentYears}
              useGroupsFiltered={useGroupsFiltered}
              selectedZone={selectedZone}
              selectedYear={selectedYear}
              selectedUseGroup={selectedUseGroup ?? ""}
              onZoneChange={handleZoneChange}
              onYearChange={handleYearChange}
              onUseGroupChange={handleUseGroupChange}
              t={t}
              disabled={isDrawerOpen}
              isOpenPlot={isOpenPlot}
            />
          </div>

          {/* Action Buttons */}
          <RateViewActions
            onGenerateRate={handleGenerateRate}
            onEditRate={handleEditRate}
            onDeleteRate={handleDeleteRate}
            onDownloadRates={handleDownloadRates}
            isDownloadDisabled={isDownloadDisabled || isDrawerOpen}
            isActionDisabled={!!frequencyMismatch || isDrawerOpen}
            isDeleteDisabled={isDrawerOpen}
            isGeneratingRate={isGeneratingRate}
            t={t}
          />
        </div>
      </div>

      {/* Rate Frequency Mismatch Banner */}
      {frequencyMismatch && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-300 rounded-lg px-4 py-2 shadow-sm max-w-4xl">
            <span className="text-orange-600 shrink-0" aria-hidden="true">{"\u26A0"}</span>
            <span className="text-sm text-orange-800 font-medium">
              {t('messages.rateFrequencyMismatch', {
                configured: frequencyMismatch.configuredFrequency,
                existing: frequencyMismatch.existingFrequency,
              })}
            </span>
          </div>
        </div>
      )}

      {/* Grid Content */}
      <RateViewGrid
        data={filteredData}
        ratesConfiguredCount={ratesConfiguredCount}
        columns={columns}
        categoryColorMap={categoryColorMap}
        selectedZone={selectedZone}
        selectedYear={selectedYear}
        selectedUseGroup={selectedUseGroup ?? ""}
        zones={zones}
        assessmentYears={assessmentYears}
        useGroups={useGroups}
        zoneRemarksMap={zoneRemarksMap}
        rateUnit={rateUnitPolicy?.value ?? "SqMeter"}
        rateFrequencyPolicy={rateFrequencyPolicy}
        rateUnitPolicy={rateUnitPolicy}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        t={t}
        tCommon={tCommon}
      />
    </div>
  );
}
