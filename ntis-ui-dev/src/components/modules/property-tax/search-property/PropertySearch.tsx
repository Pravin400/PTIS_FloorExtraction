"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer, TableHeader, Card, CardContent } from "@/components/common";
import type {
  PropertySearchProps,
  PropertyStatus,
  SearchCriteria,
  SearchTab,
} from "@/types/property-search";
import { PropertyStats } from "./PropertyStats";
import { PropertySearchForm } from "./PropertySearchForm";
import { PropertySearchResults } from "./PropertySearchResults";
import { usePropertySearchNavigation } from "@/hooks/search-property";

/**
 * PropertySearch
 *
 * Top-level client component for Property Tax → Search Property.
 * Fully SSR-driven: all filters live in the URL search params. This
 * component is a thin orchestrator that translates user interactions
 * into URL updates and lets the server-rendered `page.tsx` re-fetch.
 */
export function PropertySearch({
  results,
  totalCount,
  pageNumber,
  pageSize,
  mainCards,
  workflowCards,
  cardFilterParams,
  zoneOptions,
  wardOptions,
  allWardOptions,
  propertyTypeOptions,
  workflowStageOptions,
  propertyDescriptionOptions,
  lookupOptions,
  selectedStatus,
  isSearchActive,
  activeTab: activeTabProp,
  criteria,
  searchError = null,
}: PropertySearchProps): React.ReactElement {
  const t = useTranslations("propertySearch");
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SearchTab>(activeTabProp);
  const [isPending, startTransition] = useTransition();
  const [awaitingResults, setAwaitingResults] = useState(false);
  const [statusClearedByTab, setStatusClearedByTab] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [prevActiveTabProp, setPrevActiveTabProp] = React.useState(activeTabProp);

  if (activeTabProp !== prevActiveTabProp) {
    setPrevActiveTabProp(activeTabProp);
    setActiveTab(activeTabProp);
  }

  const displayedStatus =
    statusClearedByTab && selectedStatus ? null : selectedStatus;
  const resultsLoading = awaitingResults && isPending;
  const displayedResults = (isPending && isResetting) ? [] : results;
  const displayedTotal = (isPending && isResetting) ? 0 : totalCount;

  const {
    updateSearchCriteria,
    resetSearch,
    updateStatus,
    updateZone,
    updateWard,
    updatePage,
  } = usePropertySearchNavigation({ startTransition });

  const handleStatusFilter = useCallback(
    (status: PropertyStatus) => {
      setStatusClearedByTab(false);
      setIsResetting(false);
      setAwaitingResults(true);
      if (displayedStatus === status) {
        updateStatus(null);
      } else {
        updateStatus(status);
      }
    },
    [displayedStatus, updateStatus]
  );

  const handleSearch = useCallback(
    (next: SearchCriteria, tab: SearchTab) => {
      setIsResetting(false);
      setAwaitingResults(true);
      updateSearchCriteria(next, tab, displayedStatus);
    },
    [displayedStatus, updateSearchCriteria]
  );

  const handleReset = useCallback(() => {
    setIsResetting(true);
    setAwaitingResults(false);
    resetSearch(activeTab);
  }, [activeTab, resetSearch]);

  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      if (tab === activeTab) return;
      if (displayedStatus) {
        setStatusClearedByTab(true);
      }
      setActiveTab(tab);

      const params = new URLSearchParams(currentParams.toString());
      if (tab === "quick-search") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      const nextUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [activeTab, currentParams, displayedStatus, pathname, router]
  );

  return (
    <PageContainer>
      <div className="w-full space-y-1.5 relative z-30">
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={SearchIcon}
          className="py-1 sm:py-1 px-3 sm:px-3 border-l-4 border-l-[#004c8c] [&>div>div:first-child>div:first-child]:border-[#004c8c]/20 [&>div>div:first-child>div:first-child]:bg-[#004c8c]/10 [&>div>div:first-child>div:first-child]:!p-1 [&_svg]:text-[#004c8c] [&_svg]:!w-4 [&_svg]:!h-4 [&_p]:!mt-0"
        />

        <Card
          variant="default"
          padding="none"
          className="rounded-lg shadow-sm border border-slate-200 overflow-visible shrink-0"
        >
          <CardContent className="py-1 px-2 space-y-1">
            <PropertyStats
              selectedStatus={displayedStatus}
              onStatusClick={handleStatusFilter}
              mainCards={mainCards}
              workflowCards={workflowCards}
              cardFilterParams={cardFilterParams}
              disabled={isPending}
            />

            <div className="border-t border-slate-100 pt-1">
              <PropertySearchForm
                initialCriteria={criteria}
                activeTab={activeTab}
                selectedStatus={displayedStatus}
                zoneOptions={zoneOptions}
                wardOptions={wardOptions}
                propertyTypeOptions={propertyTypeOptions}
                workflowStageOptions={workflowStageOptions}
                propertyDescriptionOptions={propertyDescriptionOptions}
                lookupOptions={lookupOptions}
                onSearch={handleSearch}
                onReset={handleReset}
                onTabChange={handleTabChange}
                onZoneChange={updateZone}
                onWardChange={updateWard}
                searchPending={isPending}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          variant="default"
          padding="none"
          className="rounded-lg shadow-sm border border-slate-200 min-w-0"
        >
          <CardContent className="p-2">
            <PropertySearchResults
              selectedStatus={displayedStatus}
              isSearchActive={isSearchActive}
              results={displayedResults}
              totalCount={displayedTotal}
              pageNumber={pageNumber}
              pageSize={pageSize}
              onPageChange={updatePage}
              onPageSizeChange={(size) => updatePage(1, size)}
              loading={resultsLoading}
              searchError={searchError}
              zoneOptions={zoneOptions}
              allWardOptions={allWardOptions}
              criteria={criteria}
              activeTab={activeTab}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default PropertySearch;
