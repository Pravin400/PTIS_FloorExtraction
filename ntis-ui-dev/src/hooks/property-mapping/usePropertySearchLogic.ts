/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from "react";
import { NewProperty, OldPropertyCandidate, FloorDetail, SearchOldPropertiesParams, SearchOldPropertySuggestion } from "@/types/property-mapping";
import { searchOldPropertiesAction } from "@/app/[locale]/property-tax/property-mapping/action";
import { getFloorKey, calculateMatchScore } from "@/components/modules/property-tax/property-mapping/mappingScoreCalculator";

interface UsePropertySearchLogicProps {
  currentNewProperty: NewProperty | undefined;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCustomFloorDataMap: React.Dispatch<React.SetStateAction<Record<string, FloorDetail[]>>>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

function mapSuggestionToCandidate(
  item: SearchOldPropertySuggestion,
  idx: number,
  currentNewProperty: NewProperty | undefined,
  prefix: string
): OldPropertyCandidate {
  const oldPropertyNo = String(item.oldPropertyNo || "");
  const oldPartitionNo = item.oldPartitionNo ? String(item.oldPartitionNo) : undefined;
  const oldOwnerName = item.oldOwnerName ? String(item.oldOwnerName) : "";
  const oldOccupierName = item.oldOccupierName ? String(item.oldOccupierName) : "";
  const oldAddress = item.oldAddress ? String(item.oldAddress) : "";
  const oldConstructionArea = typeof item.oldConstructionArea === "number" ? item.oldConstructionArea : 0;
  const oldFloor = item.oldFloor ? String(item.oldFloor) : "";
  const oldTotalTax = typeof item.oldTotalTax === "number" ? item.oldTotalTax : 0;
  const oldCSN = item.oldCSN ? String(item.oldCSN) : undefined;
  const oldRV = typeof item.oldRV === "number" ? item.oldRV : 0;
  const oldUseType = item.oldUseType ? String(item.oldUseType) : "";
  const oldWardNo = item.oldWardNo ? String(item.oldWardNo) : "";
  const oldZoneNo = item.oldZoneNo ? String(item.oldZoneNo) : "";
  const oldPlotNo = item.oldPlotNo ? String(item.oldPlotNo) : "";
  const isMapped = Boolean(item.isMapped);
  const mappedNewPropertyNo = item.mappedNewPropertyNo ? String(item.mappedNewPropertyNo) : null;

  const newPropertyRef = {
    propNo: currentNewProperty?.propNo || "",
    owner: currentNewProperty?.owner || "",
    address: currentNewProperty?.address || "",
    builtUpArea: currentNewProperty?.builtUpArea || 0,
    floors: currentNewProperty?.floors || "",
    tax: currentNewProperty?.tax || 0,
    cts: currentNewProperty?.cts || "",
    rv: currentNewProperty?.rv || 0,
    use: currentNewProperty?.use || "",
    ward: currentNewProperty?.ward || "",
    zone: currentNewProperty?.zone || "",
    plotNo: currentNewProperty?.plotNo || "",
    constructionYear: currentNewProperty?.constructionYear || ""
  };

  const score = calculateMatchScore(newPropertyRef, {
    propNo: oldPropertyNo,
    owner: oldOwnerName || oldOccupierName,
    address: oldAddress,
    area: oldConstructionArea,
    floors: oldFloor,
    tax: oldTotalTax,
    cts: oldCSN,
    rv: oldRV,
    use: oldUseType,
    ward: oldWardNo,
    zone: oldZoneNo,
    plotNo: oldPlotNo,
    constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
  });

  const detailsOld = Array.isArray(item.propertyDetailsOld) ? item.propertyDetailsOld : [];
  const candCarpetArea = detailsOld.reduce((sum: number, d: Record<string, unknown>) => sum + (typeof d.oldCarpetAreaSqFeet === "number" ? d.oldCarpetAreaSqFeet : 0), 0);

  return {
    id: String(item.id || idx) + "-" + prefix + "-" + idx,
    status: isMapped
      ? (mappedNewPropertyNo === currentNewProperty?.propNo ? "Mapped" as const : "Blocked" as const)
      : "Unmapped" as const,
    isMapped: isMapped,
    mappedNewPropertyNo: mappedNewPropertyNo,
    isSearchResult: true,
    propNo: oldPropertyNo,
    partitionNo: oldPartitionNo,
    owner: oldOwnerName || oldOccupierName,
    address: oldAddress,
    area: oldConstructionArea,
    carpetArea: candCarpetArea,
    tax: oldTotalTax,
    floors: oldFloor,
    evidence: [
      { text: `Ward ${oldWardNo}`, type: "good" as const },
      { text: `Zone ${oldZoneNo}`, type: "good" as const },
      { text: `Search Result`, type: "good" as const }
    ],
    score: score,
    isHardConflict: false,
    belongsToNewId: currentNewProperty?.propNo || "",
    cts: oldCSN,
    rv: oldRV,
    use: oldUseType,
    ward: oldWardNo,
    zone: oldZoneNo,
    plotNo: oldPlotNo,
    constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
  };
}

export function usePropertySearchLogic({
  currentNewProperty,
  searchQuery,
  setSearchQuery,
  setCustomFloorDataMap,
  showToast,
}: UsePropertySearchLogicProps) {
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const isSearchingServer = isManualSearching || isAutoSearching;

  const autoSearchedPropNos = useRef<Set<string>>(new Set());

  const [serverSearchedCandidates, setServerSearchedCandidates] = useState<OldPropertyCandidate[]>([]);
  const [autoSearchedCandidates, setAutoSearchedCandidates] = useState<OldPropertyCandidate[]>([]);

  // Step 1.1 Pagination State (Auto-Search / Primary Table)
  const [page12, setPage12] = useState(1);
  const [pageSize12, setPageSize12] = useState(10);
  const [totalCount12, setTotalCount12] = useState(0);

  // Step 1.2 Pagination State (Manual Search Table)
  const [page13, setPage13] = useState(1);
  const [pageSize13, setPageSize13] = useState(10);
  const [totalCount13, setTotalCount13] = useState(0);

  const updateFloorMapFromSuggestions = useCallback((suggestions: SearchOldPropertySuggestion[]) => {
    setCustomFloorDataMap(prev => {
      const updated = { ...prev };
      suggestions.forEach(item => {
        if (item.oldPropertyNo && Array.isArray(item.propertyDetailsOld)) {
          const key = getFloorKey(String(item.oldPropertyNo), item.oldPartitionNo ? String(item.oldPartitionNo) : null);
          updated[key] = item.propertyDetailsOld.map((floor) => ({
            floor: String(floor.floorDescription || floor.oldFloorId || ""),
            use: String(floor.typeOfUseDescription || ""),
            construction: String(floor.constructionTypeDescription || ""),
            carpetAreaSqFeet: typeof floor.oldCarpetAreaSqFeet === "number" ? floor.oldCarpetAreaSqFeet : 0,
            builtupAreaSqFeet: typeof floor.oldBuiltupAreaSqFeet === "number" ? floor.oldBuiltupAreaSqFeet : 0,
            level: "good" as const,
            constructionYear: floor.oldConstructionYear ? String(floor.oldConstructionYear) : (floor.constructionYearValue ? String(floor.constructionYearValue) : undefined),
            assessmentYear: floor.oldAssessmentYear ? String(floor.oldAssessmentYear) : (floor.assessmentYearValue ? String(floor.assessmentYearValue) : undefined)
          }));
        }
      });
      return updated;
    });
  }, [setCustomFloorDataMap]);

  const performServerSearch = async (term: string, page?: number, size?: number) => {
    if (!term || term.trim().length < 3) return;
    const cleanTerm = term.trim();
    const reqPage = page ?? page13;
    const reqSize = size ?? pageSize13;
    setIsManualSearching(true);
    try {
      const res = await searchOldPropertiesAction({
        searchTerm: cleanTerm,
        pageNumber: reqPage,
        pageSize: reqSize,
      });
      if (res && res.oldPropertySuggestions) {
        setServerSearchedCandidates(
          res.oldPropertySuggestions.map((item, idx) => mapSuggestionToCandidate(item, idx, currentNewProperty, "search"))
        );
        const count = res.totalCount ?? res.totalRecords ?? res.oldPropertySuggestions.length;
        setTotalCount13(count);
        updateFloorMapFromSuggestions(res.oldPropertySuggestions);
      } else {
        setServerSearchedCandidates([]);
        setTotalCount13(0);
      }
    } catch (err) {
      console.error("performServerSearch failed:", err);
      showToast("Server search failed", "error");
    } finally {
      setIsManualSearching(false);
    }
  };

  const handlePageChange13 = (newPage: number) => {
    setPage13(newPage);
    if (searchQuery.trim()) {
      performServerSearch(searchQuery, newPage, pageSize13);
    }
  };

  const handlePageSizeChange13 = (newSize: number) => {
    setPageSize13(newSize);
    setPage13(1);
    if (searchQuery.trim()) {
      performServerSearch(searchQuery, 1, newSize);
    }
  };

  const executeAutoSearch = useCallback(async (page?: number, size?: number) => {
    if (!currentNewProperty || !currentNewProperty.propNo) return;
    const reqPage = page ?? page12;
    const reqSize = size ?? pageSize12;
    setIsAutoSearching(true);
    try {
      const params: SearchOldPropertiesParams = { pageNumber: reqPage, pageSize: reqSize };
      if (currentNewProperty.owner) params.oldOwnerName = currentNewProperty.owner;
      if (currentNewProperty.mobile) params.oldMobileNo = currentNewProperty.mobile;
      if (currentNewProperty.address) params.oldAddress = currentNewProperty.address;
      if (currentNewProperty.constructionYear) params.oldConstructionYear = currentNewProperty.constructionYear;

      if (Object.keys(params).length <= 2) {
        setAutoSearchedCandidates([]);
        setTotalCount12(0);
        return;
      }

      const res = await searchOldPropertiesAction(params);
      if (res && res.oldPropertySuggestions) {
        setAutoSearchedCandidates(
          res.oldPropertySuggestions.map((item, idx) => mapSuggestionToCandidate(item, idx, currentNewProperty, "auto"))
        );
        const count = res.totalCount ?? res.totalRecords ?? res.oldPropertySuggestions.length;
        setTotalCount12(count);
        updateFloorMapFromSuggestions(res.oldPropertySuggestions);
      } else {
        setAutoSearchedCandidates([]);
        setTotalCount12(0);
      }
    } catch (err) {
      console.error("Auto background search failed:", err);
    } finally {
      setIsAutoSearching(false);
    }
  }, [currentNewProperty, page12, pageSize12, updateFloorMapFromSuggestions]);

  const handlePageChange12 = (newPage: number) => {
    setPage12(newPage);
    if (autoSearchedCandidates.length > 0) {
      executeAutoSearch(newPage, pageSize12);
    } else if (searchQuery.trim()) {
      performServerSearch(searchQuery, newPage, pageSize12);
    }
  };

  const handlePageSizeChange12 = (newSize: number) => {
    setPageSize12(newSize);
    setPage12(1);
    if (autoSearchedCandidates.length > 0) {
      executeAutoSearch(1, newSize);
    } else if (searchQuery.trim()) {
      performServerSearch(searchQuery, 1, newSize);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setServerSearchedCandidates([]);
      setTotalCount13(0);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!currentNewProperty || !currentNewProperty.propNo || autoSearchedPropNos.current.has(currentNewProperty.propNo)) {
      if (!currentNewProperty?.propNo) {
        setAutoSearchedCandidates([]);
        setTotalCount12(0);
      }
      return;
    }

    autoSearchedPropNos.current.add(currentNewProperty.propNo);
    setPage12(1);
    executeAutoSearch(1, pageSize12);
  }, [currentNewProperty?.propNo, currentNewProperty, executeAutoSearch, pageSize12]);

  const resetSearch = () => {
    setSearchQuery("");
    setServerSearchedCandidates([]);
    setTotalCount13(0);
    setPage13(1);
  };

  return {
    isManualSearching,
    isAutoSearching,
    isSearchingServer,
    serverSearchedCandidates,
    autoSearchedCandidates,
    performServerSearch,
    resetSearch,

    // Step 1.1 Pagination Props
    page12,
    pageSize12,
    totalCount12: totalCount12 || autoSearchedCandidates.length,
    handlePageChange12,
    handlePageSizeChange12,

    // Step 1.2 Pagination Props
    page13,
    pageSize13,
    totalCount13: totalCount13 || serverSearchedCandidates.length,
    handlePageChange13,
    handlePageSizeChange13,
  };
}
