import { useState, useMemo } from "react";
import { NewProperty, OldPropertyCandidate, FloorDetail, MappingLink, AuditHistory, MappedPropertyApiResponse } from "@/types/property-mapping";
import { getFloorKey, calculateMatchScore } from "@/components/modules/property-tax/property-mapping/mappingScoreCalculator";
import { getUsernameFromCookie } from "@/lib/utils/cookie";

export function usePropertyMappingState(
  initialMappingData: MappedPropertyApiResponse | null | undefined,
  queryPropertyId: string | null,
  customFloorDataMap: Record<string, FloorDetail[]>
) {
  const currentUserName = useMemo(() => getUsernameFromCookie() || "Admin", []);
  const [selectedNewIndex, setSelectedNewIndex] = useState<number>(0);

  const [newProperties, setNewProperties] = useState<NewProperty[]>(() => {
    if (initialMappingData?.items?.length) {
      const first = initialMappingData.items[0];
      const newInfo = first.newPropertyInfo;
      const newDetails = first.newPropertyDetails || [];

      const openPlotFloor = newDetails.find(d => d.isOpenPlot);
      const plotAreaVal = openPlotFloor ? openPlotFloor.builtupAreaSqFeet : 0;
      const builtUpAreaVal = newDetails.filter(d => !d.isOpenPlot).reduce((sum, d) => sum + d.builtupAreaSqFeet, 0);
      const carpetAreaVal = newDetails.filter(d => !d.isOpenPlot).reduce((sum, d) => sum + d.carpetAreaSqFeet, 0);

      const nonOpenPlotFloors = newDetails.filter(d => !d.isOpenPlot);
      const floorLabels = nonOpenPlotFloors.map(d => d.floorDescription || d.floorCode).filter(Boolean);
      const floorsText = floorLabels.length > 0 ? floorLabels.join(", ") : "";

      const fullPropNo = [newInfo?.wardNo, newInfo?.propertyNo, newInfo?.partitionNo].filter(Boolean).join(" - ");
      const transRecord = first.transMastRecords?.[0] || null;

      const rvVal = transRecord?.calculationValue ?? 0;
      const taxVal = transRecord?.taxAmount ?? 0;

      return [{
        id: "dyn-" + (newInfo?.id || queryPropertyId || ""),
        propNo: newInfo?.propertyNo || "",
        partitionNo: newInfo?.partitionNo || "",
        fullPropNo: fullPropNo,
        owner: newInfo?.ownerName || newInfo?.ownerNameEnglish || first.oldOwnerName || first.oldOccupierName || "",
        address: newInfo?.address || newInfo?.addressEnglish || first.oldAddress || "",
        mobile: newInfo?.mobileNo || first.oldMobileNo || "",
        plotArea: plotAreaVal,
        builtUpArea: builtUpAreaVal,
        carpetArea: carpetAreaVal,
        floors: floorsText,
        use: newInfo?.propertyTypeDescription || first.oldUseType || "",
        rv: rvVal,
        tax: taxVal,
        cts: newInfo?.csn || first.oldCSN || "",
        status: initialMappingData?.items?.some(item => Boolean(item.oldPropertyNo)) ? "Mapped" : "Needs verification",
        verificationResult: initialMappingData?.items?.some(item => Boolean(item.oldPropertyNo)) ? "Verified & Mapped" : "Pending review",
        remark: "",
        mappingType: first.mappingCategory === "SPLIT" ? "Split" : "1 → 1",
        ward: newInfo?.wardNo || "",
        zone: newInfo?.taxZoneNo || "",
        plotNo: newInfo?.plotNo || "",
        constructionYear: newDetails[0]?.constructionYear || ""
      }];
    }
    return [{
      id: "dyn-empty", propNo: "", partitionNo: "", fullPropNo: "", owner: "", address: "", mobile: "",
      plotArea: 0, builtUpArea: 0, carpetArea: 0, floors: "", use: "", rv: 0, tax: 0, cts: "",
      status: "Needs verification", verificationResult: "Pending review", remark: "", mappingType: "1 → 1",
      ward: "", zone: "", plotNo: "", constructionYear: ""
    }];
  });

  const currentNewProperty = useMemo(() => {
    return newProperties[selectedNewIndex] || newProperties[0];
  }, [newProperties, selectedNewIndex]);

  const [candidates, setCandidates] = useState<OldPropertyCandidate[]>(() => {
    if (initialMappingData?.items?.length) {
      const first = initialMappingData.items[0];
      const newInfo = first.newPropertyInfo;
      const newDetails = first.newPropertyDetails || [];
      const ownerName = newInfo?.ownerName || newInfo?.ownerNameEnglish || first.oldOwnerName || first.oldOccupierName || "";
      const addressVal = newInfo?.address || newInfo?.addressEnglish || first.oldAddress || "";
      const ctsVal = newInfo?.csn || first.oldCSN || "";

      const builtUpAreaVal = newDetails.filter(d => !d.isOpenPlot).reduce((sum, d) => sum + d.builtupAreaSqFeet, 0);
      const nonOpenPlotFloors = newDetails.filter(d => !d.isOpenPlot);
      const floorLabels = nonOpenPlotFloors.map(d => d.floorDescription || d.floorCode).filter(Boolean);
      const floorsText = floorLabels.length > 0 ? floorLabels.join(", ") : "";
      const transRecord = first.transMastRecords?.[0] || null;
      const rvVal = transRecord?.calculationValue ?? 0;
      const taxVal = transRecord?.taxAmount ?? 0;

      const newPropRef = {
        propNo: newInfo?.propertyNo || "",
        owner: ownerName,
        address: addressVal,
        builtUpArea: builtUpAreaVal,
        floors: floorsText,
        tax: taxVal,
        cts: ctsVal,
        rv: rvVal,
        use: newInfo?.propertyTypeDescription || first.oldUseType || "",
        ward: newInfo?.wardNo || "",
        zone: newInfo?.taxZoneNo || "",
        plotNo: newInfo?.plotNo || "",
        constructionYear: newDetails[0]?.constructionYear || ""
      };

      return initialMappingData.items
        .filter(item => Boolean(item.oldPropertyNo))
        .map((item, idx) => {
          const itemTrans = item.transMastRecords?.[0] || null;
          const itemTax = itemTrans?.taxAmount ?? (item.oldTotalTax || 0);
          const itemRv = itemTrans?.calculationValue ?? (item.oldRV || 0);
          const candCarpetArea = (item.propertyDetailsOld || []).reduce((sum, d) => sum + (d.oldCarpetAreaSqFeet || 0), 0);

          const candScore = calculateMatchScore(newPropRef, {
            propNo: item.oldPropertyNo || "",
            owner: item.oldOwnerName || item.oldOccupierName || ownerName,
            address: item.oldAddress || addressVal,
            area: item.oldConstructionArea || 0,
            floors: item.oldFloor || "",
            tax: itemTax,
            cts: item.oldCSN || ctsVal,
            rv: itemRv,
            use: item.oldUseType || "",
            ward: item.oldWardNo || "",
            zone: item.oldZoneNo || "",
            plotNo: item.oldPlotNo || "",
            constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
          });

          // Extract the REAL Old Property ID:
          // 1. transMastOldRecords uses 'propertyMastOldId' (NOT 'propertyId')
          // 2. propertyDetailsOld uses 'propertyId' which IS the old property ID
          // 3. item.propertyId is the NEW property ID — only use as last resort
          const realOldPropertyId = item.transMastOldRecords?.[0]?.propertyMastOldId
            ?? item.propertyDetailsOld?.[0]?.propertyId 
            ?? item.propertyId;

          return {
            id: String(realOldPropertyId) + "-initial-" + idx,
            status: "Mapped" as const,
            isMapped: true,
            mappedNewPropertyNo: newInfo?.propertyNo || "",
            propNo: item.oldPropertyNo || "",
            partitionNo: item.oldPartitionNo || undefined,
            owner: item.oldOwnerName || item.oldOccupierName || ownerName,
            address: item.oldAddress || addressVal,
            area: item.oldConstructionArea || 0,
            carpetArea: candCarpetArea,
            tax: itemTax,
            floors: item.oldFloor || "",
            evidence: [
              { text: `Ward ${item.oldWardNo || ""}`, type: "good" as const },
              { text: `Zone ${item.oldZoneNo || ""}`, type: "good" as const },
              { text: `Category ${item.mappingCategory || "ONE_TO_ONE"}`, type: "good" as const }
            ],
            score: candScore,
            isHardConflict: false,
            belongsToNewId: newInfo?.propertyNo || "",
            cts: item.oldCSN || ctsVal,
            rv: itemRv,
            use: item.oldUseType || "",
            ward: item.oldWardNo || "",
            zone: item.oldZoneNo || "",
            plotNo: item.oldPlotNo || "",
            constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
          };
        });
    }
    return [];
  });

  const [activeCheckedIds, setActiveCheckedIds] = useState<string[]>(() => {
    return candidates.filter(c => c.isMapped).map(c => c.id);
  });

  const [mappedOldPropNos, setMappedOldPropNos] = useState<string[]>(() => {
    return candidates.filter(c => c.isMapped).map(c => c.partitionNo ? `${c.propNo} / ${c.partitionNo}` : c.propNo);
  });

  const [mappings, setMappings] = useState<MappingLink[]>(() => {
    if (initialMappingData?.items?.length) {
      const first = initialMappingData.items[0];
      const newInfo = first.newPropertyInfo;
      const oldPropNos = initialMappingData.items
        .map(i => (i.oldPropertyNo ? (i.oldPartitionNo ? `${i.oldPropertyNo} / ${i.oldPartitionNo}` : i.oldPropertyNo) : ""))
        .filter(Boolean) as string[];

      if (oldPropNos.length > 0) {
        const isMultiple = oldPropNos.length > 1 || first.mappingCategory === "SPLIT" || first.mappingCategory === "MERGE";
        return [{
          id: "ML-" + (first.propertyId || "101"),
          newPropNo: newInfo?.propertyNo || "",
          oldPropNos: oldPropNos,
          status: "Mapped",
          mapType: isMultiple ? `Split (1 New → ${oldPropNos.length} Old Records)` : "1 → 1 (One-to-One)",
          confidence: 100,
          note: "Initial mapping record",
          mappedBy: currentUserName,
          mappedAt: new Date().toISOString().split('T')[0]
        }];
      }
    }
    return [];
  });

  const [historyList, setHistoryList] = useState<AuditHistory[]>(() => {
    if (initialMappingData?.items?.length) {
      const first = initialMappingData.items[0];
      const newInfo = first.newPropertyInfo;
      const oldPropNos = initialMappingData.items
        .map(i => (i.oldPropertyNo ? (i.oldPartitionNo ? `${i.oldPropertyNo} / ${i.oldPartitionNo}` : i.oldPropertyNo) : ""))
        .filter(Boolean) as string[];

      return [{
        id: "H-1",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Mapped",
        newPropNo: newInfo?.propertyNo || "",
        oldPropNos: oldPropNos,
        user: currentUserName,
        reason: "Initial property mapping loaded from legacy API records."
      }];
    }
    return [];
  });

  const [compareCandidate, setCompareCandidate] = useState<OldPropertyCandidate | null>(null);

  const initialFloorDataMap = useMemo(() => {
    const map: Record<string, FloorDetail[]> = {};
    if (initialMappingData?.items) {
      initialMappingData.items.forEach(item => {
        if (item.oldPropertyNo && item.propertyDetailsOld) {
          const key = getFloorKey(item.oldPropertyNo, item.oldPartitionNo);
          map[key] = item.propertyDetailsOld.map((floor: Record<string, unknown>) => ({
            floor: String(floor.floorDescription || floor.oldFloorId || ""),
            use: String(floor.typeOfUseDescription || ""),
            construction: String(floor.constructionTypeDescription || ""),
            carpetAreaSqFeet: Number(floor.oldCarpetAreaSqFeet || 0),
            builtupAreaSqFeet: Number(floor.oldBuiltupAreaSqFeet || 0),
            level: "good" as const,
            constructionYear: floor.oldConstructionYear ? String(floor.oldConstructionYear) : (floor.constructionYearValue ? String(floor.constructionYearValue) : undefined),
            assessmentYear: floor.oldAssessmentYear ? String(floor.oldAssessmentYear) : (floor.assessmentYearValue ? String(floor.assessmentYearValue) : undefined)
          }));
        }
      });
    }
    return map;
  }, [initialMappingData]);

  const activeFloorDataMap = useMemo(() => {
    return { ...initialFloorDataMap, ...customFloorDataMap };
  }, [initialFloorDataMap, customFloorDataMap]);

  const refreshMappingState = (
    freshData: MappedPropertyApiResponse,
    mergedOverrideCandidates?: OldPropertyCandidate[],
    unmappedPropNos?: string[]
  ) => {
    if (!freshData?.items?.length) return;
    
    // 1. Update New Properties
    const first = freshData.items[0];
    const newInfo = first.newPropertyInfo;
    const newDetails = first.newPropertyDetails || [];
    
    const openPlotFloor = newDetails.find(d => d.isOpenPlot);
    const plotAreaVal = openPlotFloor ? openPlotFloor.builtupAreaSqFeet : 0;
    const builtUpAreaVal = newDetails.filter(d => !d.isOpenPlot).reduce((sum, d) => sum + d.builtupAreaSqFeet, 0);
    const carpetAreaVal = newDetails.filter(d => !d.isOpenPlot).reduce((sum, d) => sum + d.carpetAreaSqFeet, 0);
    const nonOpenPlotFloors = newDetails.filter(d => !d.isOpenPlot);
    const floorLabels = nonOpenPlotFloors.map(d => d.floorDescription || d.floorCode).filter(Boolean);
    const floorsText = floorLabels.length > 0 ? floorLabels.join(", ") : "";
    const fullPropNo = [newInfo?.wardNo, newInfo?.propertyNo, newInfo?.partitionNo].filter(Boolean).join(" - ");
    const transRecord = first.transMastRecords?.[0] || null;
    const rvVal = transRecord?.calculationValue ?? 0;
    const taxVal = transRecord?.taxAmount ?? 0;

    const parsedNewProps: NewProperty[] = [{
      id: "dyn-" + (newInfo?.id || queryPropertyId || ""),
      propNo: newInfo?.propertyNo || "",
      partitionNo: newInfo?.partitionNo || "",
      fullPropNo: fullPropNo,
      owner: newInfo?.ownerName || newInfo?.ownerNameEnglish || first.oldOwnerName || first.oldOccupierName || "",
      address: newInfo?.address || newInfo?.addressEnglish || first.oldAddress || "",
      mobile: newInfo?.mobileNo || first.oldMobileNo || "",
      plotArea: plotAreaVal,
      builtUpArea: builtUpAreaVal,
      carpetArea: carpetAreaVal,
      floors: floorsText,
      use: newInfo?.propertyTypeDescription || first.oldUseType || "",
      rv: rvVal,
      tax: taxVal,
      cts: newInfo?.csn || first.oldCSN || "",
      status: (freshData.items.some(item => Boolean(item.oldPropertyNo)) || (mergedOverrideCandidates && mergedOverrideCandidates.length > 0)) ? "Mapped" : "Needs verification",
      verificationResult: (freshData.items.some(item => Boolean(item.oldPropertyNo)) || (mergedOverrideCandidates && mergedOverrideCandidates.length > 0)) ? "Verified & Mapped" : "Pending review",
      remark: "",
      mappingType: first.mappingCategory === "SPLIT" ? "Split" : "1 → 1",
      ward: newInfo?.wardNo || "",
      zone: newInfo?.taxZoneNo || "",
      plotNo: newInfo?.plotNo || "",
      constructionYear: newDetails[0]?.constructionYear || ""
    }];
    setNewProperties(parsedNewProps);

    // 2. Update Candidates
    const newPropRef = {
      propNo: newInfo?.propertyNo || "",
      owner: parsedNewProps[0].owner,
      address: parsedNewProps[0].address,
      builtUpArea: builtUpAreaVal,
      floors: floorsText,
      tax: taxVal,
      cts: parsedNewProps[0].cts,
      rv: rvVal,
      use: parsedNewProps[0].use,
      ward: newInfo?.wardNo || "",
      zone: newInfo?.taxZoneNo || "",
      plotNo: newInfo?.plotNo || "",
      constructionYear: newDetails[0]?.constructionYear || ""
    };

    const isUnmapped = (pNo: string) => {
      if (!unmappedPropNos || unmappedPropNos.length === 0 || !pNo) return false;
      const cleanP = pNo.trim().toLowerCase();
      if (!cleanP) return false;

      return unmappedPropNos.some((u) => {
        if (!u) return false;
        const cleanU = u.trim().toLowerCase();
        if (cleanU === cleanP) return true;
        const normU = cleanU.replace(/\s+/g, "");
        const normP = cleanP.replace(/\s+/g, "");
        if (normU === normP) return true;
        const baseU = cleanU.split(" / ")[0].split(" - ")[0].trim();
        const baseP = cleanP.split(" / ")[0].split(" - ")[0].trim();
        return Boolean(baseU && baseP && baseU === baseP);
      });
    };

    const parsedCandidates = freshData.items
      .filter(item => Boolean(item.oldPropertyNo))
      .map((item, idx) => {
        const itemTrans = item.transMastRecords?.[0] || null;
        const itemTax = itemTrans?.taxAmount ?? (item.oldTotalTax || 0);
        const itemRv = itemTrans?.calculationValue ?? (item.oldRV || 0);
        const candCarpetArea = (item.propertyDetailsOld || []).reduce((sum, d) => sum + (d.oldCarpetAreaSqFeet || 0), 0);
        const candScore = calculateMatchScore(newPropRef, {
          propNo: item.oldPropertyNo || "",
          owner: item.oldOwnerName || item.oldOccupierName || parsedNewProps[0].owner,
          address: item.oldAddress || parsedNewProps[0].address,
          area: item.oldConstructionArea || 0,
          floors: item.oldFloor || "",
          tax: itemTax,
          cts: item.oldCSN || parsedNewProps[0].cts,
          rv: itemRv,
          use: item.oldUseType || "",
          ward: item.oldWardNo || "",
          zone: item.oldZoneNo || "",
          plotNo: item.oldPlotNo || "",
          constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
        });

        const realOldPropertyId = item.transMastOldRecords?.[0]?.propertyMastOldId
          ?? item.propertyDetailsOld?.[0]?.propertyId 
          ?? item.propertyId;

        const candIsUnmapped = isUnmapped(item.oldPropertyNo || "");

        return {
          id: String(realOldPropertyId) + "-initial-" + idx,
          status: (candIsUnmapped ? "Unmapped" : "Mapped") as "Mapped" | "Unmapped",
          isMapped: !candIsUnmapped,
          mappedNewPropertyNo: candIsUnmapped ? "" : (newInfo?.propertyNo || ""),
          propNo: item.oldPropertyNo || "",
          partitionNo: item.oldPartitionNo || undefined,
          owner: item.oldOwnerName || item.oldOccupierName || parsedNewProps[0].owner,
          address: item.oldAddress || parsedNewProps[0].address,
          area: item.oldConstructionArea || 0,
          carpetArea: candCarpetArea,
          tax: itemTax,
          floors: item.oldFloor || "",
          evidence: [
            { text: `Ward ${item.oldWardNo || ""}`, type: "good" as const },
            { text: `Zone ${item.oldZoneNo || ""}`, type: "good" as const },
            { text: `Category ${item.mappingCategory || "ONE_TO_ONE"}`, type: "good" as const }
          ],
          score: candScore,
          isHardConflict: false,
          belongsToNewId: candIsUnmapped ? "" : (newInfo?.propertyNo || ""),
          cts: item.oldCSN || parsedNewProps[0].cts,
          rv: itemRv,
          use: item.oldUseType || "",
          ward: item.oldWardNo || "",
          zone: item.oldZoneNo || "",
          plotNo: item.oldPlotNo || "",
          constructionYear: item.oldConstructionYear ? String(item.oldConstructionYear) : (item.oldAssessmentYear ? String(item.oldAssessmentYear) : "")
        };
      });

    // Merge explicitly passed candidates (if any were confirmed in the current session)
    const combinedCandidates: OldPropertyCandidate[] = [...parsedCandidates];
    if (mergedOverrideCandidates) {
      mergedOverrideCandidates.forEach(moc => {
        if (isUnmapped(moc.propNo)) return;
        const existingIdx = combinedCandidates.findIndex(c => c.propNo === moc.propNo && c.partitionNo === moc.partitionNo);
        if (existingIdx >= 0) {
          combinedCandidates[existingIdx] = { ...combinedCandidates[existingIdx], isMapped: true, status: "Mapped" as const, mappedNewPropertyNo: newInfo?.propertyNo || "" };
        } else {
          combinedCandidates.push({ ...moc, isMapped: true, status: "Mapped" as const, mappedNewPropertyNo: newInfo?.propertyNo || "" });
        }
      });
    }

    setCandidates(combinedCandidates);
    setActiveCheckedIds(combinedCandidates.filter(c => c.isMapped).map(c => c.id));
    setMappedOldPropNos(combinedCandidates.filter(c => c.isMapped).map(c => c.partitionNo ? `${c.propNo} / ${c.partitionNo}` : c.propNo));

    // 3. Update Mappings
    const oldPropNos = Array.from(new Set([
      ...freshData.items.map(i => (i.oldPropertyNo ? (i.oldPartitionNo ? `${i.oldPropertyNo} / ${i.oldPartitionNo}` : i.oldPropertyNo) : "")).filter(Boolean) as string[],
      ...(mergedOverrideCandidates ? mergedOverrideCandidates.map(c => (c.partitionNo ? `${c.propNo} / ${c.partitionNo}` : c.propNo)).filter(Boolean) : [])
    ])).filter(p => !isUnmapped(p));

    if (oldPropNos.length > 0) {
      const isMultiple = oldPropNos.length > 1 || first.mappingCategory === "SPLIT" || first.mappingCategory === "MERGE";
      setMappings([{
        id: "ML-" + (first.propertyId || "101"),
        newPropNo: newInfo?.propertyNo || "",
        oldPropNos: oldPropNos,
        status: "Mapped",
        mapType: isMultiple ? `Split (1 New → ${oldPropNos.length} Old Records)` : "1 → 1 (One-to-One)",
        confidence: 100,
        note: "Updated mapping record",
        mappedBy: currentUserName,
        mappedAt: new Date().toISOString().split('T')[0]
      }]);
    } else {
      setMappings([]);
      setNewProperties(prev => prev.map(p => ({ ...p, status: "Needs verification", verificationResult: "Pending review" })));
    }
  };

  return {
    selectedNewIndex,
    setSelectedNewIndex,
    newProperties,
    setNewProperties,
    currentNewProperty,
    candidates,
    activeCheckedIds,
    setActiveCheckedIds,
    mappedOldPropNos,
    setMappedOldPropNos,
    mappings,
    setMappings,
    historyList,
    setHistoryList,
    compareCandidate,
    setCompareCandidate,
    activeFloorDataMap,
    refreshMappingState,
    setCandidates,
  };
}
