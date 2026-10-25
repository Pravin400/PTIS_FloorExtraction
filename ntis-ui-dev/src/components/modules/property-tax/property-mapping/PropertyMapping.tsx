"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PageContainer, WaitingWindow } from "@/components/common";
import { FloorDetail, MappedPropertyApiResponse } from "@/types/property-mapping";

import { usePropertyMappingState } from "@/hooks/property-mapping/usePropertyMappingState";
import { usePropertySearchLogic } from "@/hooks/property-mapping/usePropertySearchLogic";
import { usePropertyCandidates } from "@/hooks/property-mapping/usePropertyCandidates";
import { usePropertyMappingHandlers } from "@/hooks/property-mapping/usePropertyMappingHandlers";

import { MappingHeader } from "./MappingHeader";
import { PropertyMappingWorkspace } from "./PropertyMappingWorkspace";
import { DiffModal } from "./PropertyDetailsDiffModal";
import { ActiveMappingsRegister } from "./ConfirmedMappingsTab";
import { AuditTrail } from "./MappingHistoryTab";

interface PropertyMappingProps {
  initialMappingData?: MappedPropertyApiResponse | null;
  initialSearchParams?: Record<string, string | string[] | undefined>;
}

export default function PropertyMapping({ initialMappingData, initialSearchParams }: PropertyMappingProps) {
  const t = useTranslations("propertyMapping");
  const router = useRouter();
  const pathname = usePathname();
  const fallbackSearchParams = useSearchParams();

  const searchParams = useMemo(() => {
    if (initialSearchParams) {
      return { get: (key: string) => { const val = initialSearchParams[key]; return Array.isArray(val) ? val[0] : (val ?? null); } };
    }
    return fallbackSearchParams;
  }, [initialSearchParams, fallbackSearchParams]);

  const queryCv = searchParams.get("cv");
  const queryPropertyId = searchParams.get("propertyId");

  const isCapitalValue = useMemo(() => {
    if (initialMappingData?.items?.length) {
      const first = initialMappingData.items[0];
      if (first.transMastRecords?.length) return first.transMastRecords[0].calculationType === "CV";
    }
    return Boolean(queryCv);
  }, [initialMappingData, queryCv]);

  const rvLabel = isCapitalValue ? t("sidebar.fields.capitalValue") : t("sidebar.fields.rateableValue");
  const locale = useMemo(() => pathname.split("/").filter(Boolean)[0] || "en", [pathname]);
  const [hasModifiedMappings, setHasModifiedMappings] = useState(false);

  const handleMappingChanged = useCallback(() => {
    setHasModifiedMappings(true);
  }, []);

  const targetReturnUrl = useMemo(() => {
    const from = searchParams.get("from");
    const returnUrl = searchParams.get("returnUrl");
    const queryWardNo = searchParams.get("wardNo");
    const queryPropertyNo = searchParams.get("propertyNo");
    const queryPartitionNo = searchParams.get("partitionNo");
    const queryWardId = searchParams.get("wardId");

    let targetPath = `/${locale}/property-tax/ptis/individual`;
    let searchPart = "";

    if (returnUrl) {
      const cleanReturn = returnUrl.startsWith("/") ? returnUrl : `/${returnUrl}`;
      const [path, query] = cleanReturn.split("?");
      targetPath = path;
      searchPart = query || "";
    } else if (from === "apartment") {
      targetPath = `/${locale}/property-tax/ptis/apartment`;
    } else if (from === "ptis") {
      targetPath = `/${locale}/property-tax/ptis`;
    }

    const backParams = new URLSearchParams(searchPart);
    if (queryWardNo && !backParams.has("wardNo")) backParams.set("wardNo", queryWardNo);
    if (queryPropertyNo && !backParams.has("propertyNo")) backParams.set("propertyNo", queryPropertyNo);
    if (queryPartitionNo && !backParams.has("partitionNo")) backParams.set("partitionNo", queryPartitionNo);
    if (queryWardId && !backParams.has("wardId")) backParams.set("wardId", queryWardId);
    if (queryPropertyId && !backParams.has("propertyId")) backParams.set("propertyId", queryPropertyId);
    backParams.set("tab", "olddetails");

    const queryString = backParams.toString();
    return queryString ? `${targetPath}?${queryString}` : targetPath;
  }, [searchParams, queryPropertyId, locale]);

  const handleBack = useCallback(() => {
    // FAST EXIT: If no mappings were created or removed during this visit,
    // immediately return via browser history if available; otherwise use targetReturnUrl.
    if (!hasModifiedMappings) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push(targetReturnUrl);
      }
      return;
    }

    // OPERATION PERFORMED: Hard navigate to targetReturnUrl so stale Next.js router cache is bypassed and fresh mapped property records are fetched.
    if (typeof window !== "undefined") {
      window.location.href = targetReturnUrl;
    } else {
      router.push(targetReturnUrl);
      router.refresh();
    }
  }, [hasModifiedMappings, targetReturnUrl, router]);

  // Pre-fetch the return page in background to make returning after operations blazing fast
  useEffect(() => {
    if (typeof router?.prefetch === "function" && targetReturnUrl) {
      router.prefetch(targetReturnUrl);
    }
  }, [targetReturnUrl, router]);

  const [customFloorDataMap, setCustomFloorDataMap] = useState<Record<string, FloorDetail[]>>({});
  const [activeTab, setActiveTab] = useState<"workspace" | "mapped" | "history">("workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [mappingStateFilter, setMappingStateFilter] = useState("All");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const {
    selectedNewIndex, setSelectedNewIndex, newProperties, setNewProperties, currentNewProperty,
    candidates, setCandidates, setMappings, mappings, setHistoryList, historyList, compareCandidate, setCompareCandidate, activeFloorDataMap, refreshMappingState
  } = usePropertyMappingState(initialMappingData, queryPropertyId, customFloorDataMap);

  const {
    isManualSearching, isSearchingServer, serverSearchedCandidates, autoSearchedCandidates, performServerSearch, resetSearch,
    page12, pageSize12, totalCount12, handlePageChange12, handlePageSizeChange12,
    page13, pageSize13, totalCount13, handlePageChange13, handlePageSizeChange13,
  } = usePropertySearchLogic({ currentNewProperty, searchQuery, setSearchQuery, setCustomFloorDataMap, showToast });

  const {
    autoCandidates, manualCandidates, activeCheckedIds, selectedCandidates, inferredMappingType,
    floorPropertyTabs, selectedFloorProperty, setSelectedFloorProperty, hoveredFloorIndex, setHoveredFloorIndex,
    mappedOldPropNos, handleToggleCandidate
  } = usePropertyCandidates({ currentNewProperty, candidates, autoSearchedCandidates, serverSearchedCandidates, searchQuery, activeFloorDataMap, mappings });

  const { metrics, validationStatus, isSubmitting, handleConfirmMapping, handleDisconnectMapping, handleUnlinkCandidate } = usePropertyMappingHandlers({
    currentNewProperty, selectedCandidates, activeFloorDataMap, inferredMappingType, selectedNewIndex,
    newProperties, setNewProperties, setSelectedNewIndex, setMappings, setHistoryList, showToast, refreshMappingState, candidates, mappings, setCandidates,
    onMappingChanged: handleMappingChanged,
  });

  return (
    <PageContainer>
      <div className="flex flex-col w-full bg-[#f8fafc] text-slate-900 font-sans p-3 gap-4 relative">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-lg animate-fade-in ${
            toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {toast.msg}
          </div>
        )}

        <MappingHeader activeTab={activeTab} setActiveTab={setActiveTab} mappings={mappings} newProperties={newProperties} handleBack={handleBack} />

        {activeTab === "workspace" && (
          <PropertyMappingWorkspace
            currentNewProperty={currentNewProperty}
            inferredMappingType={inferredMappingType}
            selectedNewIndex={selectedNewIndex}
            newPropertiesCount={newProperties.length}
            onPrevRecord={() => setSelectedNewIndex((prev) => Math.max(0, prev - 1))}
            onNextRecord={() => setSelectedNewIndex((prev) => Math.min(newProperties.length - 1, prev + 1))}
            rvLabel={rvLabel}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchingServer={isSearchingServer}
            onPerformSearch={performServerSearch}
            onResetFilters={() => { resetSearch(); setMappingStateFilter("All"); showToast(t("toasts.filtersReset"), "info"); }}
            mappingStateFilter={mappingStateFilter}
            setMappingStateFilter={setMappingStateFilter}
            filteredAutoCandidates={autoCandidates}
            filteredManualCandidates={manualCandidates}
            activeCheckedIds={activeCheckedIds}
            mappedOldPropNos={mappedOldPropNos}
            onToggleCandidate={handleToggleCandidate}
            onCompareClick={setCompareCandidate}
            hasSearchActive={Boolean(searchQuery.trim() || autoSearchedCandidates.length > 0)}
            selectedCandidates={selectedCandidates}
            metrics={metrics}
            floorPropertyTabs={floorPropertyTabs}
            selectedFloorProperty={selectedFloorProperty}
            setSelectedFloorProperty={setSelectedFloorProperty}
            activeFloorDataMap={activeFloorDataMap}
            hoveredFloorIndex={hoveredFloorIndex}
            setHoveredFloorIndex={setHoveredFloorIndex}
            validationStatus={validationStatus}
            isSubmitting={isSubmitting}
            onConfirmClick={handleConfirmMapping}
            onDisconnectCandidate={handleUnlinkCandidate}
            stepNumbers={{ comparisonStep: 2, floorStep: 3 }}
            page12={page12}
            pageSize12={pageSize12}
            totalCount12={totalCount12}
            onPageChange12={handlePageChange12}
            onPageSizeChange12={handlePageSizeChange12}
            page13={page13}
            pageSize13={pageSize13}
            totalCount13={totalCount13}
            onPageChange13={handlePageChange13}
            onPageSizeChange13={handlePageSizeChange13}
          />
        )}

        {activeTab === "mapped" && <ActiveMappingsRegister mappings={mappings} onDisconnectMapping={handleDisconnectMapping} />}
        {activeTab === "history" && <AuditTrail historyList={historyList} />}

        <DiffModal candidate={compareCandidate} currentNewProperty={currentNewProperty} onClose={() => setCompareCandidate(null)} money={(val) => "₹" + val.toLocaleString("en-IN")} rvLabel={rvLabel} />
        <WaitingWindow isOpen={isManualSearching} title={t("waitingWindow.title")} message={t("waitingWindow.message")} />
      </div>
    </PageContainer>
  );
}
