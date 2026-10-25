/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from "react";
import { NewProperty, OldPropertyCandidate, SearchOldPropertiesParams, FloorDetail } from "@/types/property-mapping";
import { searchOldPropertiesAction } from "@/app/[locale]/property-tax/property-mapping/action";

function getFloorKey(propNo: string, partitionNo?: string | null): string {
  if (partitionNo) {
    return `${propNo} / ${partitionNo}`;
  }
  return propNo;
}

export function usePropertySearch(
  currentNewProperty: NewProperty | undefined,
  calculateMatchScore: (newProp: Record<string, unknown>, cand: Record<string, unknown>) => number
) {
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const isSearchingServer = isManualSearching || isAutoSearching;

  const [searchQuery, setSearchQuery] = useState("");
  const [serverSearchQuery, setServerSearchQuery] = useState("");
  const [serverSearchedCandidates, setServerSearchedCandidates] = useState<OldPropertyCandidate[]>([]);
  const [autoSearchedCandidates, setAutoSearchedCandidates] = useState<OldPropertyCandidate[]>([]);
  const [customFloorDataMap, setCustomFloorDataMap] = useState<Record<string, FloorDetail[]>>({});

  const autoSearchedPropNos = useRef<Set<string>>(new Set());

  // Function to run manual server-side search
  const performServerSearch = async (term: string) => {
    if (!term) return;
    const cleanTerm = term.trim();
    if (cleanTerm.length < 3) return;

    setIsManualSearching(true);
    try {
      const res = await searchOldPropertiesAction({ searchTerm: cleanTerm, pageSize: -1 });
      if (res && res.oldPropertySuggestions) {
        const mappedSuggestions = res.oldPropertySuggestions.map((item, idx) => {
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
            propNo: item.oldPropertyNo || "",
            owner: item.oldOwnerName || item.oldOccupierName || "",
            address: item.oldAddress || "",
            area: item.oldConstructionArea || 0,
            floors: item.oldFloor || "",
            tax: item.oldTotalTax || 0,
            cts: item.oldCSN || undefined,
            rv: item.oldRV || 0,
            use: item.oldUseType || "",
            ward: item.oldWardNo || "",
            zone: item.oldZoneNo || "",
            plotNo: item.oldPlotNo || "",
            constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
          });

          const candCarpetArea = item.propertyDetailsOld
            ? item.propertyDetailsOld.reduce((sum, d) => sum + (d.oldCarpetAreaSqFeet || 0), 0)
            : 0;

          return {
            id: String(item.id) + "-search-" + idx,
            status: item.isMapped 
              ? (item.mappedNewPropertyNo === currentNewProperty?.propNo ? "Mapped" as const : "Blocked" as const)
              : "Unmapped" as const,
            isMapped: item.isMapped,
            mappedNewPropertyNo: item.mappedNewPropertyNo,
            isSearchResult: true,
            propNo: item.oldPropertyNo || "",
            partitionNo: item.oldPartitionNo || undefined,
            owner: item.oldOwnerName || item.oldOccupierName || "",
            address: item.oldAddress || "",
            area: item.oldConstructionArea || 0,
            carpetArea: candCarpetArea,
            tax: item.oldTotalTax || 0,
            floors: item.oldFloor || "",
            evidence: [
              { text: `Ward ${item.oldWardNo || ""}`, type: "good" as const },
              { text: `Zone ${item.oldZoneNo || ""}`, type: "good" as const },
              { text: `Search Result`, type: "good" as const }
            ],
            score: score,
            isHardConflict: false,
            belongsToNewId: currentNewProperty?.propNo || "",
            cts: item.oldCSN || undefined,
            rv: item.oldRV || 0,
            use: item.oldUseType || "",
            ward: item.oldWardNo || "",
            zone: item.oldZoneNo || "",
            plotNo: item.oldPlotNo || "",
            constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
          };
        });

        setServerSearchedCandidates(mappedSuggestions);
        setServerSearchQuery(cleanTerm);

        setCustomFloorDataMap(prev => {
          const updated = { ...prev };
          res.oldPropertySuggestions.forEach(item => {
            if (item.oldPropertyNo && item.propertyDetailsOld) {
              const key = getFloorKey(item.oldPropertyNo, item.oldPartitionNo);
              updated[key] = item.propertyDetailsOld.map(floor => ({
                floor: floor.floorDescription || String(floor.oldFloorId) || "",
                use: floor.typeOfUseDescription || "",
                construction: floor.constructionTypeDescription || "",
                carpetAreaSqFeet: floor.oldCarpetAreaSqFeet || 0,
                builtupAreaSqFeet: floor.oldBuiltupAreaSqFeet || 0,
                level: "good" as const,
                constructionYear: floor.oldConstructionYear || (floor.constructionYearValue ? String(floor.constructionYearValue) : undefined),
                assessmentYear: floor.oldAssessmentYear || (floor.assessmentYearValue ? String(floor.assessmentYearValue) : undefined)
              }));
            }
          });
          return updated;
        });
      } else {
        setServerSearchedCandidates([]);
        setServerSearchQuery(cleanTerm);
      }
    } catch (err) {
      console.error("performServerSearch failed:", err);
    } finally {
      setIsManualSearching(false);
    }
  };

  // Clear manual search results when query is emptied (no API calls)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setServerSearchQuery("");
      setServerSearchedCandidates([]);
    }
  }, [searchQuery]);

  // Explicit auto-search execution function (no useEffect API calls)
  const triggerAutoSearch = async () => {
    if (!currentNewProperty || !currentNewProperty.propNo) {
      setAutoSearchedCandidates([]);
      return;
    }

    if (autoSearchedPropNos.current.has(currentNewProperty.propNo)) {
      return;
    }

    autoSearchedPropNos.current.add(currentNewProperty.propNo);
    setIsAutoSearching(true);
    try {
      const params: SearchOldPropertiesParams = { pageSize: -1 };
      if (currentNewProperty.owner) params.oldOwnerName = currentNewProperty.owner;
      if (currentNewProperty.mobile) params.oldMobileNo = currentNewProperty.mobile;
      if (currentNewProperty.address) params.oldAddress = currentNewProperty.address;
      if (currentNewProperty.constructionYear) params.oldConstructionYear = currentNewProperty.constructionYear;

      if (Object.keys(params).length <= 1) {
        setAutoSearchedCandidates([]);
        return;
      }

      const res = await searchOldPropertiesAction(params);
      if (res && res.oldPropertySuggestions) {
        const mappedSuggestions = res.oldPropertySuggestions.map((item, idx) => {
          const newPropertyRef = {
            propNo: currentNewProperty.propNo,
            owner: currentNewProperty.owner,
            address: currentNewProperty.address,
            builtUpArea: currentNewProperty.builtUpArea || 0,
            floors: currentNewProperty.floors || "",
            tax: currentNewProperty.tax || 0,
            cts: currentNewProperty.cts || "",
            rv: currentNewProperty.rv || 0,
            use: currentNewProperty.use || "",
            ward: currentNewProperty.ward || "",
            zone: currentNewProperty.zone || "",
            plotNo: currentNewProperty.plotNo || "",
            constructionYear: currentNewProperty.constructionYear || ""
          };

          const score = calculateMatchScore(newPropertyRef, {
            propNo: item.oldPropertyNo || "",
            owner: item.oldOwnerName || item.oldOccupierName || "",
            address: item.oldAddress || "",
            area: item.oldConstructionArea || 0,
            floors: item.oldFloor || "",
            tax: item.oldTotalTax || 0,
            cts: item.oldCSN || undefined,
            rv: item.oldRV || 0,
            use: item.oldUseType || "",
            ward: item.oldWardNo || "",
            zone: item.oldZoneNo || "",
            plotNo: item.oldPlotNo || "",
            constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
          });

          const candCarpetArea = item.propertyDetailsOld
            ? item.propertyDetailsOld.reduce((sum, d) => sum + (d.oldCarpetAreaSqFeet || 0), 0)
            : 0;

          return {
            id: String(item.id) + "-auto-" + idx,
            status: item.isMapped 
              ? (item.mappedNewPropertyNo === currentNewProperty.propNo ? "Mapped" as const : "Blocked" as const)
              : "Unmapped" as const,
            isMapped: item.isMapped,
            mappedNewPropertyNo: item.mappedNewPropertyNo,
            isSearchResult: true,
            propNo: item.oldPropertyNo || "",
            partitionNo: item.oldPartitionNo || undefined,
            owner: item.oldOwnerName || item.oldOccupierName || "",
            address: item.oldAddress || "",
            area: item.oldConstructionArea || 0,
            carpetArea: candCarpetArea,
            tax: item.oldTotalTax || 0,
            floors: item.oldFloor || "",
            evidence: [
              { text: `Ward ${item.oldWardNo || ""}`, type: "good" as const },
              { text: `Zone ${item.oldZoneNo || ""}`, type: "good" as const },
              { text: `Search Result`, type: "good" as const }
            ],
            score: score,
            isHardConflict: false,
            belongsToNewId: currentNewProperty.propNo,
            cts: item.oldCSN || undefined,
            rv: item.oldRV || 0,
            use: item.oldUseType || "",
            ward: item.oldWardNo || "",
            zone: item.oldZoneNo || "",
            plotNo: item.oldPlotNo || "",
            constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
          };
        });

        setAutoSearchedCandidates(mappedSuggestions);

        setCustomFloorDataMap(prev => {
          const updated = { ...prev };
          res.oldPropertySuggestions.forEach(item => {
            if (item.oldPropertyNo && item.propertyDetailsOld) {
              const key = getFloorKey(item.oldPropertyNo, item.oldPartitionNo);
              updated[key] = item.propertyDetailsOld.map(floor => ({
                floor: floor.floorDescription || String(floor.oldFloorId) || "",
                use: floor.typeOfUseDescription || "",
                construction: floor.constructionTypeDescription || "",
                carpetAreaSqFeet: floor.oldCarpetAreaSqFeet || 0,
                builtupAreaSqFeet: floor.oldBuiltupAreaSqFeet || 0,
                level: "good" as const,
                constructionYear: floor.oldConstructionYear || (floor.constructionYearValue ? String(floor.constructionYearValue) : undefined),
                assessmentYear: floor.oldAssessmentYear || (floor.assessmentYearValue ? String(floor.assessmentYearValue) : undefined)
              }));
            }
          });
          return updated;
        });
      } else {
        setAutoSearchedCandidates([]);
      }
    } catch (err) {
      console.error("Auto background search failed:", err);
    } finally {
      setIsAutoSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setServerSearchQuery("");
    setServerSearchedCandidates([]);
  };

  return {
    isManualSearching,
    isAutoSearching,
    isSearchingServer,
    searchQuery,
    setSearchQuery,
    serverSearchQuery,
    serverSearchedCandidates,
    autoSearchedCandidates,
    customFloorDataMap,
    performServerSearch,
    triggerAutoSearch,
    resetSearch,
  };
}
