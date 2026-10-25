'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import PropertyDetailsTab from '@/components/modules/property-tax/ptis/tabs/PropertyDetailsTab';
import KycDetailsTab from '@/components/modules/property-tax/ptis/tabs/KycDetailsTab';
import SocietyDetailsTab from '@/components/modules/property-tax/ptis/tabs/SocietyDetailsTab';
import OldDetailsTab from '@/components/modules/property-tax/ptis/tabs/OldDetailsTab';
import DiscountDataTab from '@/components/modules/property-tax/ptis/tabs/DiscountDataTab';
import BuildingPermissionTab from '@/components/modules/property-tax/ptis/tabs/BuildingPermissionTab';
import { PropertySearchBar } from './tabs/components/PropertySearchBar';
import { PropertyTabHeaders } from './tabs/components/PropertyTabHeaders';
import { useSyncedSearchParams } from '@/hooks/ptis/tab/useSyncedSearchParams';
import { useWardOptions } from '@/hooks/ptis/tab/useWardOptions';
import { usePropertyOptions } from '@/hooks/ptis/tab/usePropertyOptions';
import { usePropertySearch } from '@/hooks/ptis/tab/usePropertySearch';
import { useSyncedTabData } from '@/hooks/ptis/tab/useSyncedTabData';
import { usePropertySearchState } from '@/hooks/ptis/tab/usePropertySearchState';
import { usePropertySuggestions } from '@/hooks/ptis/tab/usePropertySuggestions';
import { Tabs, TabValue } from '@/components/common/Tabs';
import type { PtisTabId, PtisInitialData } from '@/types/ptis.types';
import { PTIS_TABS } from '@/types/ptis.types';
import type { PTISSearchSelectOption as SearchSelectOption } from '@/components/common/PTISSearchSelect';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizePartition } from '@/lib/utils/format';
import { toast } from 'sonner';

interface PropertyTabSectionProps {
  initialData?: PtisInitialData;
  initialWardId?: number | null;
  initialTab?: string;
  forceActiveTab?: PtisTabId;
  initialError?: string;
  onFilterChange?: (wardNo: string, propertyNo: string) => void;
}

const EMPTY_ARRAY: never[] = [];

export default function PropertyTabSection({
  initialData,
  initialWardId = null,
  initialTab,
  forceActiveTab,
  initialError,
}: PropertyTabSectionProps) {
  const t = useTranslations('ptis');

  // Surface initial fetch errors (SSR) as client-side toasts
  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }
  }, [initialError]);

  // 1. Hook: URL State Management (Source of Truth)
  const urlState = useSyncedSearchParams();

  // 2. Hook: Local Draft State (Prevents automatic searching on every selection)
  const {
    draft,
    setWardNo,
    setPropertyNo,
    setPartitionNo,
    setPropertyId,
    setCategory,
    setExtraIds,
    handleWardSelection,
  } = usePropertySearchState({
    ...urlState,
    wardId: urlState.wardId || initialWardId,
  });

  // 3. Hook: Search & Navigation Logic
  const { isSearching, handleSearchProperty, updateUrl } = usePropertySearch();

  // 4. Hook: Data Sync (Binds raw API data to UI components)
  const {
    data,
    kycDetailsData,
    societyDetailsData,
    buildingPermissionData,
    oldDetailsData,
    oldFloorTableData,
    showOldFloorInfo,
    setShowOldFloorInfo,
    oldTaxesData,
    showOldTaxInfo,
    setShowOldTaxInfo,
    showOldMapInfo,
    setShowOldMapInfo,
    discountDetails,
    mappedPropertiesData,
  } = useSyncedTabData(
    initialData?.propertyDetails,
    initialData?.kycDetails,
    initialData?.societyDetails,
    initialData?.oldDetails,
    initialData?.oldFloorTableData,
    initialData?.showOldFloorInfo,
    initialData?.oldTaxesData,
    initialData?.showOldTaxInfo,
    initialData?.discountDetails,
    initialData?.buildingPermission,
    initialData?.showOldMapInfo,
    initialData?.mappedPropertiesData
  );

  // 5. Hook: Options Management
  const { wardOptions, isFetchingWardOptions, handleFetchWardList } = useWardOptions(
    initialData?.wardOptions || EMPTY_ARRAY
  );

  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 150);

  const [partitionSearchText, setPartitionSearchText] = useState('');
  const debouncedPartitionSearchText = useDebounce(partitionSearchText, 150);

  const scopedInitialProperties = useMemo(() => {
    if (
      initialWardId != null &&
      draft.wardId != null &&
      Number(draft.wardId) !== Number(initialWardId)
    ) {
      return EMPTY_ARRAY;
    }
    return initialData?.rawPropertyData || EMPTY_ARRAY;
  }, [draft.wardId, initialWardId, initialData?.rawPropertyData]);

  const { propertiesList, setPropertiesList, isSearchingProperties } = usePropertySuggestions(
    draft.wardId,
    debouncedSearchText,
    debouncedPartitionSearchText,
    draft.propertyId,
    scopedInitialProperties
  );

  // 6. State Handlers
  const onWardChangeCommit = useCallback(
    (id: number | null, no: string) => {
      handleWardSelection(id, no);
      setPropertiesList([]);
      setSearchText('');
      setPartitionSearchText('');
      updateUrl({
        wardNo: no || null,
        wardId: id ? id.toString() : null,
        propertyNo: null,
        partitionNo: null,
        propertyId: null,
      });
    },
    [handleWardSelection, updateUrl, setPropertiesList, setSearchText]
  );

  // Sync state with server-side rawPropertyData changes
  useEffect(() => {
    if (scopedInitialProperties.length > 0) {
      setPropertiesList(scopedInitialProperties);
    }
  }, [scopedInitialProperties, setPropertiesList]);

  // Auto-sync missing societyDetailId & wingDetailId to URL searchParams when property is loaded
  useEffect(() => {
    if (!urlState.propertyId) return;

    const currentPropId = Number(urlState.propertyId);
    const matchedProp = propertiesList.find((p) => p.propertyId === currentPropId);

    const rawPropDetails = initialData?.propertyDetails as unknown as Record<string, unknown> | undefined;
    const wingsList = (matchedProp as unknown as { wings?: Array<{ societyId?: number; societyDetailId?: number; wingDetailId?: number; wingMasterId?: number }> })?.wings || (initialData as unknown as { wings?: Array<{ societyId?: number; societyDetailId?: number; wingDetailId?: number; wingMasterId?: number }> })?.wings;

    const resolvedSocietyId =
      urlState.societyDetailId ??
      matchedProp?.societyDetailId ??
      matchedProp?.societyId ??
      wingsList?.[0]?.societyId ??
      wingsList?.[0]?.societyDetailId ??
      initialData?.societyDetails?.societyDetailId ??
      initialData?.societyDetails?.societyId ??
      (rawPropDetails?.societyDetailId as number | undefined) ??
      (rawPropDetails?.societyId as number | undefined) ??
      null;

    const resolvedWingId =
      urlState.wingDetailId ??
      matchedProp?.wingDetailId ??
      matchedProp?.wingId ??
      wingsList?.[0]?.wingDetailId ??
      wingsList?.[0]?.wingMasterId ??
      initialData?.societyDetails?.wingDetailId ??
      initialData?.societyDetails?.wingId ??
      (rawPropDetails?.wingDetailId as number | undefined) ??
      (rawPropDetails?.wingId as number | undefined) ??
      null;

    const paramsToUpdate: Record<string, string | null> = {};
    if (resolvedSocietyId && !urlState.societyDetailId) {
      paramsToUpdate.societyDetailId = String(resolvedSocietyId);
    }
    if (resolvedWingId && !urlState.wingDetailId) {
      paramsToUpdate.wingDetailId = String(resolvedWingId);
    }

    if (Object.keys(paramsToUpdate).length > 0) {
      updateUrl(paramsToUpdate);
    }
  }, [
    urlState.propertyId,
    urlState.societyDetailId,
    urlState.wingDetailId,
    propertiesList,
    initialData?.societyDetails?.societyDetailId,
    initialData?.societyDetails?.societyId,
    initialData?.societyDetails?.wingDetailId,
    initialData?.societyDetails?.wingId,
    initialData?.propertyDetails,
    initialData,
    updateUrl,
  ]);

  // Auto-resolve propertyId if typed values exactly match an item in suggestions list
  useEffect(() => {
    if (!draft.propertyNo) {
      if (draft.propertyId) {
        setPropertyId(null);
        setExtraIds(undefined, undefined);
      }
      return;
    }

    const normalizedDraftProp = draft.propertyNo.trim().toLowerCase();
    const normalizedDraftPart = normalizePartition(draft.partitionNo).toLowerCase();

    // Check if current propertyId is still valid for the typed text
    if (draft.propertyId) {
      const currentMatch = propertiesList.find(
        (p) => p.propertyId === Number(draft.propertyId)
      );
      if (
        !currentMatch ||
        currentMatch.propertyNo.trim().toLowerCase() !== normalizedDraftProp ||
        normalizePartition(currentMatch.partitionNo).toLowerCase() !== normalizedDraftPart
      ) {
        // Current selection no longer matches input text, reset it
        setPropertyId(null);
        setExtraIds(undefined, undefined);
      } else {
        const matchWings = (currentMatch as unknown as { wings?: Array<{ societyId?: number; societyDetailId?: number; wingDetailId?: number; wingMasterId?: number }> })?.wings;
        const socId = currentMatch.societyDetailId || currentMatch.societyId || matchWings?.[0]?.societyId || matchWings?.[0]?.societyDetailId;
        const wingId = currentMatch.wingDetailId || currentMatch.wingId || matchWings?.[0]?.wingDetailId || matchWings?.[0]?.wingMasterId;
        setExtraIds(socId, wingId);
      }
      return;
    }

    // Try to find a match in the suggestions list
    const exactMatch = propertiesList.find(
      (p) =>
        p.propertyNo.trim().toLowerCase() === normalizedDraftProp &&
        normalizePartition(p.partitionNo).toLowerCase() === normalizedDraftPart
    );

    if (exactMatch) {
      setPropertyId(exactMatch.propertyId.toString());
      setCategory(exactMatch.category, exactMatch.categoryLabel);
      const matchWings = (exactMatch as unknown as { wings?: Array<{ societyId?: number; societyDetailId?: number; wingDetailId?: number; wingMasterId?: number }> })?.wings;
      const socId = exactMatch.societyDetailId || exactMatch.societyId || matchWings?.[0]?.societyId || matchWings?.[0]?.societyDetailId;
      const wingId = exactMatch.wingDetailId || exactMatch.wingId || matchWings?.[0]?.wingDetailId || matchWings?.[0]?.wingMasterId;
      setExtraIds(socId, wingId);
    }
  }, [draft.propertyNo, draft.partitionNo, draft.propertyId, propertiesList, setPropertyId, setCategory, setExtraIds]);

  const dynamicPropertyOptions = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    const options: SearchSelectOption[] = [];
    propertiesList.forEach((p) => {
      const trimmedPartitionNo = (p.partitionNo ?? '').trim();
      const normalizedPartitionNo = trimmedPartitionNo === '0' ? '' : trimmedPartitionNo;
      const pWings = (p as unknown as { wings?: Array<{ societyId?: number; societyDetailId?: number; wingDetailId?: number; wingMasterId?: number }> })?.wings;
      const label = `${p.propertyNo}${normalizedPartitionNo ? ` - ${normalizedPartitionNo}` : ''}`;
      if (!seen.has(label)) {
        seen.add(label);
        options.push({
          label,
          value: JSON.stringify({
            propertyNo: p.propertyNo,
            partitionNo: normalizedPartitionNo,
            propertyId: p.propertyId,
            category: p.category,
            categoryLabel: p.categoryLabel,
            societyDetailId: p.societyDetailId || p.societyId || pWings?.[0]?.societyId || pWings?.[0]?.societyDetailId,
            wingDetailId: p.wingDetailId || p.wingId || pWings?.[0]?.wingDetailId || pWings?.[0]?.wingMasterId,
          }),
        });
      }
    });
    return options;
  }, [propertiesList]);

  const { propertyOptions, propertyOptionValueMap, partitionOptions, partitionValueMap } =
    usePropertyOptions(
      draft.propertyNo,
      dynamicPropertyOptions,
      propertiesList
    );



  // 7. Tabs Management (Optimistic UI Pattern)
  const validatedInitialTab =
    initialTab && PTIS_TABS.includes(initialTab as PtisTabId)
      ? (initialTab as PtisTabId)
      : (PTIS_TABS[0] as PtisTabId);
  const activeTab = forceActiveTab || validatedInitialTab;

  const [localTab, setLocalTab] = useState<PtisTabId>(activeTab);
  const [prevActiveTab, setPrevActiveTab] = useState<PtisTabId>(activeTab);
  const [isBuildingPermissionExpanded, setIsBuildingPermissionExpanded] = useState(false);

  // Sync local state with URL changes during render phase to avoid cascading effects
  if (activeTab !== prevActiveTab) {
    setLocalTab(activeTab);
    setPrevActiveTab(activeTab);
  }

  const handleTabChange = useCallback(
    (value: TabValue) => {
      const targetTab = value as PtisTabId;

      // Update UI immediately for snappy feedback
      setLocalTab(targetTab);

      updateUrl({ tab: targetTab === 'propertydetails' ? null : targetTab });
    },
    [updateUrl]
  );

  const handleShowFloorInfoChange = useCallback(
    (value: boolean) => {
      if (value !== showOldFloorInfo) {
        setShowOldFloorInfo(value);
        if (value) {
          setShowOldTaxInfo(false);
          setShowOldMapInfo(false);
          updateUrl({
            showFloor: 'true',
            showOldTax: null,
            showMapDetails: null,
          });
        } else {
          updateUrl({ showFloor: null });
        }
      }
    },
    [showOldFloorInfo, setShowOldFloorInfo, setShowOldTaxInfo, setShowOldMapInfo, updateUrl]
  );

  const handleShowTaxInfoChange = useCallback(
    (value: boolean) => {
      if (value !== showOldTaxInfo) {
        setShowOldTaxInfo(value);
        if (value) {
          setShowOldFloorInfo(false);
          setShowOldMapInfo(false);
          updateUrl({
            showOldTax: 'true',
            showFloor: null,
            showMapDetails: null,
          });
        } else {
          updateUrl({ showOldTax: null });
        }
      }
    },
    [showOldTaxInfo, setShowOldTaxInfo, setShowOldFloorInfo, setShowOldMapInfo, updateUrl]
  );

  const handleShowMapInfoChange = useCallback(
    (value: boolean) => {
      if (value !== showOldMapInfo) {
        setShowOldMapInfo(value);
        if (value) {
          setShowOldFloorInfo(false);
          setShowOldTaxInfo(false);
          updateUrl({
            showMapDetails: 'true',
            showFloor: null,
            showOldTax: null,
          });
        } else {
          updateUrl({ showMapDetails: null });
        }
      }
    },
    [showOldMapInfo, setShowOldMapInfo, setShowOldFloorInfo, setShowOldTaxInfo, updateUrl]
  );

  return (
    <div className="overflow-visible rounded-lg border border-slate-200 bg-white shadow-lg">
      <h1 className="sr-only">{t('title')}</h1>
      <Tabs value={localTab} onChange={handleTabChange} fullWidth={true}>
        <PropertySearchBar
          wardNo={draft.wardNo}
          setWardNo={setWardNo}
          wardId={draft.wardId}
          setWardId={onWardChangeCommit}
          propertyNo={draft.propertyNo}
          setPropertyNo={setPropertyNo}
          partitionNo={draft.partitionNo}
          setPartitionNo={setPartitionNo}
          propertyId={draft.propertyId}
          setPropertyId={setPropertyId}
          category={draft.category}
          categoryLabel={draft.categoryLabel}
          setCategory={setCategory}
          societyDetailId={draft.societyDetailId}
          wingDetailId={draft.wingDetailId}
          wardOptions={wardOptions}
          isFetchingWardOptions={isFetchingWardOptions}
          onFetchWardList={handleFetchWardList}
          propertyOptions={propertyOptions}
          propertyOptionValueMap={propertyOptionValueMap}
          partitionOptions={partitionOptions}
          partitionValueMap={partitionValueMap}
          isSearching={isSearching}
          onSearch={handleSearchProperty}
          upicId={data.upicId}
          ownerName={data.ownerName || kycDetailsData.propertyHolderName}
          propertyDescription={data.propertyDescription}
          tabHeaderInfo={initialData?.tabHeaderInfo}
          onPropertySearchChange={setSearchText}
          onPartitionSearchChange={setPartitionSearchText}
          isSearchingProperties={isSearchingProperties}
          propertiesList={propertiesList}
        />

        <PropertyTabHeaders
          activeTab={localTab}
          isBuildingPermissionExpanded={isBuildingPermissionExpanded}
          onToggleBuildingPermissionExpand={() => setIsBuildingPermissionExpanded((prev) => !prev)}
        />

        <div className="p-0">
          <Tabs.TabPanel value="propertydetails" className="mt-0 pt-0">
            <PropertyDetailsTab data={data} />
          </Tabs.TabPanel>
          <Tabs.TabPanel value="kycdetails" className="mt-0 pt-0">
            <KycDetailsTab data={kycDetailsData} />
          </Tabs.TabPanel>
          <Tabs.TabPanel value="societydetails" className="mt-0 pt-0">
            <SocietyDetailsTab data={societyDetailsData} />
          </Tabs.TabPanel>
          <Tabs.TabPanel value="buildingpermission" className="mt-0 pt-0">
            <BuildingPermissionTab
              data={buildingPermissionData}
              propertyId={urlState.propertyId ? Number(urlState.propertyId) : undefined}
              wardNo={draft.wardNo}
              wardId={draft.wardId ? Number(draft.wardId) : undefined}
              propertyNo={draft.propertyNo}
              partitionNo={draft.partitionNo}
              onFieldChange={() => {}}
              readOnly={true}
              isExpanded={isBuildingPermissionExpanded}
            />
          </Tabs.TabPanel>
          <Tabs.TabPanel value="discountdetails" className="mt-0 pt-0">
            <DiscountDataTab
              propertyId={urlState.propertyId ? Number(urlState.propertyId) : undefined}
              initialData={discountDetails}
              initialSocialData={initialData?.socialDetails}
              readOnly={true}
            />
          </Tabs.TabPanel>
          <Tabs.TabPanel value="olddetails" className="mt-0 pt-0">
            <OldDetailsTab
              oldDetailsData={oldDetailsData}
              oldFloorTableData={oldFloorTableData}
              showOldFloorInfo={showOldFloorInfo}
              setShowOldFloorInfo={handleShowFloorInfoChange}
              oldTaxesData={oldTaxesData}
              showOldTaxInfo={showOldTaxInfo}
              setShowOldTaxInfo={handleShowTaxInfoChange}
              showOldMapInfo={showOldMapInfo}
              setShowOldMapInfo={handleShowMapInfoChange}
              mappedPropertiesData={mappedPropertiesData}
            />
          </Tabs.TabPanel>
        </div>
      </Tabs>
    </div>
  );
}
