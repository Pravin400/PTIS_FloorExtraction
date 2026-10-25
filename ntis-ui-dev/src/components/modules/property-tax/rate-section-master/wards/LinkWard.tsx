"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Drawer } from "@/components/common/Drawer";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { Map } from "lucide-react";
import { PrevPageButton, NextPageButton } from "@/components/common/ActionButtons";
import { LinkWardProps } from "@/types/rateSectionMaster.types";
import RateSectionWards from "./RateSectionWards";
import LinkWardTabs from "./LinkWardTabs";
import { getSelectedZoneName, handleToggleAvailable, handleToggleSelected} from "./linkWardHelpers";
import { useLinkWardHandlers } from "@/hooks/rateSectionMaster/useLinkWardHandlers";
import { useLinkWardPagination } from "@/hooks/rateSectionMaster/useLinkWardPagination";
import { useLinkWardActions } from "@/hooks/rateSectionMaster/useLinkWardActions";

export default function AddWard({
  open,
  onClose,
  onSuccess: _onSuccess,
  rates,
  sections: _sections,
  selectedZoneNo,
  ssrAllWards = [],
  ssrAllWardsCount = 0,
  ssrWardAssignments = {},
  ssrAllRateSections = [],
  ssrSelectedWards = [],
  ssrSelectedWardsTotalCount = 0,
  ssrViewAllWards = [],
  ssrViewAllWardsTotalCount = 0,
  ssrViewAllWardsTotalPages = 0,
  rateSectionAlias: propRateSectionAlias,
  wardAlias: propWardAlias,
  wardsAlias: propWardsAlias
}: LinkWardProps) {
  const t = useTranslations("rateSectionMaster");
  const defaultRateSection = useAliasLabel(
    "Rate_Section",
    useAliasLabel("Rate_Section_Name", useAliasLabel("Rate Section", t("defaults.rateSection")))
  );
  const defaultWard = useAliasLabel("Ward", t("defaults.ward"));
  const defaultWards = useAliasLabel("Wards", t("defaults.wards"));
  const rateSection = propRateSectionAlias || defaultRateSection;
  const ward = propWardAlias || defaultWard;
  const wards = propWardsAlias || defaultWards;

  const router = useRouter();
  const searchParams = useSearchParams();

  const [wardAssignments, setWardAssignments] = useState(ssrWardAssignments);

  const allAvailableWards = ssrAllWards;
  const totalViewAllCount = ssrViewAllWardsTotalCount || ssrAllWardsCount;

  // Select All state management
  const [isViewAllSelectAllActive, setIsViewAllSelectAllActive] = useState(false);
  const [isAvailableSelectAllActive, setIsAvailableSelectAllActive] = useState(false);
  const [isRateSectionSelectAllActive, setIsRateSectionSelectAllActive] = useState(false);
  const [viewAllSelectAllLoading, setViewAllSelectAllLoading] = useState(false);
  const [availableSelectAllLoading, setAvailableSelectAllLoading] = useState(false);
  const [rateSectionSelectAllLoading, setRateSectionSelectAllLoading] = useState(false);

  const state = useLinkWardPagination({
    open,
    ssrSelectedWards,
    ssrSelectedWardsTotalCount,
    ssrAllWards,
    ssrAllWardsCount,
    ssrViewAllWards,
    ssrViewAllWardsTotalCount,
    ssrViewAllWardsTotalPages
  });

  const handlers = useLinkWardHandlers({ searchParams, router });

  const { moveToSelected, moveToAvailable } = useLinkWardActions({
    rates,
    allRateSections: ssrAllRateSections,
    selectedZoneNo: selectedZoneNo ?? undefined,
    wardAssignments,
    checkedAvailable: state.checkedAvailable,
    selectedWards: state.selectedWards,
    setCheckedAvailable: state.setCheckedAvailable,
    checkedSelected: state.checkedSelected,
    setCheckedSelected: state.setCheckedSelected,
    setLoading: state.setLoading,
    setSelectedWards: state.setSelectedWards,
    setSelectedWardsTotalCount: state.setSelectedWardsTotalCount,
    setWardAssignments,
    router,
    t,
    isViewAllSelectAllActive,
    isAvailableSelectAllActive,
    isRateSectionSelectAllActive,
    setViewAllSelectAllLoading,
    setAvailableSelectAllLoading,
    setIsViewAllSelectAllActive,
    setIsAvailableSelectAllActive,
    setIsRateSectionSelectAllActive,
    viewAllSearch: state.viewAllSearch,
    availableSearch: state.availableSearch,
    rateSectionAlias: rateSection,
    wardAlias: ward,
    wardsAlias: wards
  });

  const selectedZoneName = useMemo(
    () => getSelectedZoneName(selectedZoneNo ?? undefined, rates),
    [selectedZoneNo, rates]
  );

  const totalUnassignedForHeader = useMemo(() => {
    return allAvailableWards.filter(w => 
      !wardAssignments[w.wardNo] && !state.selectedWards.includes(w.wardNo)
    ).length;
  }, [allAvailableWards, wardAssignments, state.selectedWards]);

  const toggleAvailable = (wardNo: string) =>
    handleToggleAvailable(
      wardNo,
      wardAssignments,
      selectedZoneNo ?? undefined,
      state.checkedAvailable,
      state.setCheckedAvailable,
      rates,
      t
    );

  const toggleSelected = (wardNo: string) =>
    handleToggleSelected(
      wardNo,
      state.checkedSelected,
      state.setCheckedSelected
    );

  // Handle Select All for ViewWards
  const handleViewAllSelectAll = useCallback((isChecked: boolean) => {
    setIsViewAllSelectAllActive(isChecked);
    if (!isChecked) {
      state.setCheckedAvailable(new Set());
    }
  }, [state]);

  // Handle Select All for AvailableWards
  const handleAvailableSelectAll = useCallback((isChecked: boolean) => {
    setIsAvailableSelectAllActive(isChecked);
    if (!isChecked) {
      state.setCheckedAvailable(new Set());
    }
  }, [state]);

  // Handle Select All for RateSectionWards
  const handleRateSectionSelectAll = useCallback(async (wardNos: string[]) => {
    if (wardNos.length === 0) {
      // Deselect all
      setIsRateSectionSelectAllActive(false);
      state.setCheckedSelected(new Set());
      return;
    }

    const id = Number(selectedZoneNo);
    if (!id || isNaN(id)) {
      return;
    }

    setRateSectionSelectAllLoading(true);
    try {
      // Just set the Select All state to active without checking individual checkboxes
      // The API will be called when user clicks "Move to Available" button
      setIsRateSectionSelectAllActive(true);
      state.setCheckedSelected(new Set()); // Clear individual selections
    } finally {
      setRateSectionSelectAllLoading(false);
    }
  }, [selectedZoneNo, state]);

  return (
    <Drawer
      open={open}
      width="lg"
      bodyClassName="overflow-hidden"
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center bg-blue-600 rounded-lg text-white">
            <Map size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {t("wards.linkTitle", { ward, rateSection })}
            </div>
          </div>
        </div>
      }
    >
      <div className="flex gap-3 p-6 h-[75vh]">
        <LinkWardTabs
          activeTab={state.activeTab}
          totalUnassignedForHeader={totalUnassignedForHeader}
          totalViewAllCount={totalViewAllCount}
          allAvailableWards={allAvailableWards}
          wardAssignments={wardAssignments}
          selectedWards={state.selectedWards}
          availableSearch={state.availableSearch}
          availablePage={state.availablePage}
          availablePageSize={state.availablePageSize}
          checkedAvailable={state.checkedAvailable}
          loading={state.loading}
          viewAllWards={state.viewAllWards}
          viewAllSearch={state.viewAllSearch}
          viewWardPage={state.viewWardPage}
          viewWardPageSize={state.viewWardPageSize}
          totalViewAllPages={state.totalViewAllPages}
          onTabChange={state.handleTabChange}
          onAvailableSearch={handlers.handleAvailableSearch}
          onToggleAvailable={toggleAvailable}
          onAvailablePageChange={handlers.updateAvailablePage}
          onAvailablePageSizeChange={handlers.updateAvailablePageSize}
          onViewAllSearch={handlers.handleViewAllSearch}
          onViewWardPageChange={handlers.updateViewWardPage}
          onViewWardPageSizeChange={handlers.updateViewWardPageSize}
          isAvailableSelectAllActive={isAvailableSelectAllActive}
          isViewAllSelectAllActive={isViewAllSelectAllActive}
          availableSelectAllLoading={availableSelectAllLoading}
          viewAllSelectAllLoading={viewAllSelectAllLoading}
          onAvailableSelectAll={handleAvailableSelectAll}
          onViewAllSelectAll={handleViewAllSelectAll}
          t={t}
          rateSectionAlias={rateSection}
          wardAlias={ward}
          wardsAlias={wards}
        />

        <div className="flex flex-col gap-2 justify-center">
          <NextPageButton
            onClick={moveToSelected}
            disabled={(state.checkedAvailable.size === 0 && !isAvailableSelectAllActive && !isViewAllSelectAllActive) || state.loading || availableSelectAllLoading || viewAllSelectAllLoading}
            aria-label={t('wards.moveRight')}
          />
          <PrevPageButton
            onClick={moveToAvailable}
            disabled={(state.checkedSelected.size === 0 && !isRateSectionSelectAllActive) || state.loading || rateSectionSelectAllLoading}
            aria-label={t('wards.moveLeft')}
          />
        </div>

        <RateSectionWards
          filteredSelected={state.filteredSelected}
          selectedSearch={state.selectedSearch}
          selectedPage={state.selectedPage}
          selectedPageSize={state.selectedPageSize}
          selectedWardsTotalCount={state.selectedWardsTotalCount}
          checkedSelected={state.checkedSelected}
          selectedZoneNo={selectedZoneNo}
          selectedZoneName={selectedZoneName}
          onSearch={handlers.handleSelectedSearch}
          onToggle={toggleSelected}
          onPageChange={handlers.updateSelectedPage}
          onPageSizeChange={handlers.updateSelectedPageSize}
          onSelectAll={handleRateSectionSelectAll}
          isSelectAllActive={isRateSectionSelectAllActive}
          selectAllLoading={rateSectionSelectAllLoading}
          rateSectionAlias={rateSection}
          wardAlias={ward}
          wardsAlias={wards}
        />
      </div>
    </Drawer>
  );
}