"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { Layers, Map } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import TableHeader from "@/components/common/TableHeader";
import { RateSectionContentProps } from "@/types/rateSectionMaster.types";
import RateSectionList from "./ratesection/RateSectionList";
import WardList from "./wards/WardList";
import RateSectionForm from "./ratesection/RateSectionForm";
import AddWard from "./wards/LinkWard";
import EditWard from "./wards/EditWard";
import { DashboardCard } from "@/components/common/DashboardCard";
import { PageContainer } from "@/components/common";

// Drawer-related URL parameters to clean up when closing
const DRAWER_PARAMS = [
  'addRateSection', 'addWard', 'editWard', 
  'id', 'ward', 'wardTab',
  'availablewardpage', 'availablewardpagesize',
  'viewwardpage', 'viewwardpagesize',
  'selectedwardpage', 'selectedwardpagesize'
] as const;

/**
 * Creates a clean URL by removing drawer-related parameters
 */
function buildCleanUrl(searchParams: URLSearchParams, pathname: string, paramsToRemove: readonly string[] = DRAWER_PARAMS): string {
  const params = new URLSearchParams(searchParams.toString());
  paramsToRemove.forEach(param => params.delete(param));
  return params.toString() ? `${pathname}?${params.toString()}` : pathname;
}

/**
 * Extracts drawer state from URL search parameters
 */
function useDrawerParams(searchParams: URLSearchParams) {
  return useMemo(() => ({
    id: searchParams.get('id'),
    wardId: searchParams.get('ward'),
    isAddRateSectionOpen: searchParams.has('addRateSection'),
    isAddWardOpen: searchParams.has('addWard'),
    isEditWardOpen: searchParams.has('editWard'),
  }), [searchParams]);
}

export default function RateSectionContent({ 
  rates = [], 
  sections = [], 
  sectionsTotalCount = 0,
  totalRateSectionCount, 
  filteredRateSectionCount,
  totalWardsCount: initialTotalWards, 
  initialWardCounts, 
  initialSelectedRateSection,
  initialSelectedRateSectionLabel,
  initialEditWardData,
  ssrAllWards = [],
  ssrAllWardsCount = 0,
  ssrWardAssignments = {},
  ssrAllRateSections = [],
  ssrSelectedWards = [],
  ssrSelectedWardsTotalCount = 0,
  ssrViewAllWards = [],
  ssrViewAllWardsTotalCount = 0,
  ssrViewAllWardsTotalPages = 0
}: RateSectionContentProps) {
  const t = useTranslations("rateSectionMaster");
  const rateSectionAlias = useAliasLabel(
    "Rate_Section",
    useAliasLabel("Rate_Section_Name", useAliasLabel("Rate Section", t("defaults.rateSection")))
  );
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const wardsAlias = useAliasLabel("Wards", t("defaults.wards"));

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Use transition for non-blocking navigation
  const [, startTransition] = useTransition();
  
  // Local state to immediately close drawer before navigation completes
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  // Selected rate section - use prop value or compute default
  const selectedRateSection = useMemo(() => {
    if (initialSelectedRateSection) return initialSelectedRateSection;
    return rates.length > 0 ? String(rates[0].id ?? '') : null;
  }, [initialSelectedRateSection, rates]);

  // Wards for selected rate section - use sections from SSR directly
  const wards = sections;

  // Drawers and highlights
  const [newlyCreatedRateNo, setNewlyCreatedRateNo] = useState<string | null>(null);

  // Extract drawer state from URL params using helper
  const { id, wardId, isAddRateSectionOpen, isAddWardOpen, isEditWardOpen } = useDrawerParams(searchParams);

  const handleCloseDrawer = useCallback(() => {
    // If closing AddWard drawer, set immediate close
    if (searchParams.has('addWard')) {
      setIsDrawerClosing(true);
    }
    
    const newPath = buildCleanUrl(searchParams, pathname);
    startTransition(() => {
      router.push(newPath);
    });
  }, [searchParams, pathname, router]);

  // Handle rate section creation - navigate to the page where new item appears
  const handleRateSectionCreated = (newRateId: string) => {
    setNewlyCreatedRateNo(newRateId);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    params.delete("addRateSection");
    params.set("zone", newRateId);
    params.set("wardpage", "1");
    params.delete("wardq");
    
    // Calculate the page where the new rate section will appear
    // New rate sections are added at the end (highest ID), so they'll be on the last page
    const currentPageSize = Number(params.get("ratesectionpagesize")) || 10;
    const newTotalCount = totalRateSectionCount + 1; // Account for the newly created item
    const lastPage = Math.ceil(newTotalCount / currentPageSize);
    params.set("ratesectionpage", String(lastPage));
    
    router.push(`?${params.toString()}`);

    setTimeout(() => setNewlyCreatedRateNo(null), 3000);
  };

  // Handle wards added - close drawer immediately and navigate
  const handleWardAdded = useCallback(() => {
    // Immediately close drawer via local state (instant feedback)
    setIsDrawerClosing(true);
    
    // Build new URL without drawer params using helper
    const wardDrawerParams = ['addWard', 'wardTab', 'availablewardpage', 'availablewardpagesize', 'viewwardpage', 'viewwardpagesize', 'selectedwardpage', 'selectedwardpagesize'] as const;
    const newPath = buildCleanUrl(searchParams, pathname, wardDrawerParams);
    
    // Use startTransition for non-blocking navigation
    startTransition(() => {
      router.push(newPath);
    });
  }, [searchParams, pathname, router]);
  
  // Reset drawer closing state when URL changes (navigation complete)
  useEffect(() => {
    if (!searchParams.has('addWard')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDrawerClosing(false);
    }
  }, [searchParams]);

  // Called by WardList after add/delete (refresh via SSR)
  const handleWardsChanged = () => {
    router.refresh();
  };

  return (
    <PageContainer>
      <div className="space-y-2 mb-0">
        <TableHeader
          title={t('title', { rateSection: rateSectionAlias })}
          subtitle={t('subtitle', { rateSection: rateSectionAlias, ward: wardAlias, wards: wardsAlias })}
          icon={Layers}
          rightContent={
            <div className="flex items-center gap-3">
              <DashboardCard
                label={t('dashboard.totalRateSections', { rateSection: rateSectionAlias })}
                value={totalRateSectionCount}
                icon={<Layers className="w-5 h-5 text-[#1A86E8]" />}
                className="min-w-[140px]"
              />
              <DashboardCard
                label={t('dashboard.totalWards', { wards: wardsAlias, ward: wardAlias })}
                value={initialTotalWards}
                icon={<Map className="w-5 h-5 text-[#1A86E8]" />}
                className="min-w-[140px]"
              />
            </div>
          }
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        {/* Rate Sections */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border-2 border-[#1A86E8]/20 flex flex-col">
          <RateSectionList
            rates={rates}
            selectedRateSection={selectedRateSection}
            newlyCreatedRateNo={newlyCreatedRateNo}
            initialWardCounts={initialWardCounts}
            totalCount={filteredRateSectionCount ?? totalRateSectionCount}
            onDeleteSuccess={() => router.refresh()}
            rateSectionAlias={rateSectionAlias}
            wardAlias={wardAlias}
            wardsAlias={wardsAlias}
          />
        </div>

        {/* Wards */}
        <div className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border-2 border-[#1A86E8]/20 flex flex-col">
          <WardList
            key={selectedRateSection} // Force remount on rate section change to ensure state reset
            rates={rates}
            sections={wards}
            sectionsTotalCount={sectionsTotalCount}
            selectedRateSection={selectedRateSection}
            selectedRateSectionLabel={initialSelectedRateSectionLabel}
            onWardsChanged={handleWardsChanged}
            rateSectionAlias={rateSectionAlias}
            wardAlias={wardAlias}
            wardsAlias={wardsAlias}
          />
        </div>
      </div>

      {/* Drawers */}
      <RateSectionForm
        mode="add"
        open={isAddRateSectionOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleRateSectionCreated}
        existingRates={rates}
      />
      <AddWard
        key={isAddWardOpen ? "open" : "closed"}
        open={isAddWardOpen && !isDrawerClosing}
        onClose={handleCloseDrawer}
        onSuccess={handleWardAdded}
        rates={rates}
        sections={wards}
        selectedZoneNo={selectedRateSection}
        ssrAllWards={ssrAllWards}
        ssrAllWardsCount={ssrAllWardsCount}
        ssrWardAssignments={ssrWardAssignments}
        ssrAllRateSections={ssrAllRateSections}
        ssrSelectedWards={ssrSelectedWards}
        ssrSelectedWardsTotalCount={ssrSelectedWardsTotalCount}
        ssrViewAllWards={ssrViewAllWards}
        ssrViewAllWardsTotalCount={ssrViewAllWardsTotalCount}
        ssrViewAllWardsTotalPages={ssrViewAllWardsTotalPages}
        rateSectionAlias={rateSectionAlias}
        wardAlias={wardAlias}
        wardsAlias={wardsAlias}
      />

      {/* Edit Ward Drawer */}
      <EditWard
        open={isEditWardOpen}
        onClose={handleCloseDrawer}
        id={id}
        wardId={wardId}
        rates={rates}
        sections={wards}
        initialWardData={initialEditWardData}
        rateSectionAlias={rateSectionAlias}
        wardAlias={wardAlias}
        wardsAlias={wardsAlias}
      />
    </PageContainer>
  );
}

