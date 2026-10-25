/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { NewProperty, OldPropertyCandidate, FloorTab, FloorDetail, MappingLink } from "@/types/property-mapping";
import { getFloorKey, calculateMatchScore } from "@/components/modules/property-tax/property-mapping/mappingScoreCalculator";
import { isCandidateMatchingAny } from "@/components/modules/property-tax/property-mapping/mappingUtils";

interface UsePropertyCandidatesProps {
  currentNewProperty: NewProperty | undefined;
  candidates: OldPropertyCandidate[];
  autoSearchedCandidates: OldPropertyCandidate[];
  serverSearchedCandidates: OldPropertyCandidate[];
  searchQuery: string;
  activeFloorDataMap: Record<string, FloorDetail[]>;
  mappings: MappingLink[];
}

function getCandidateWithDynamicScore(
  cand: OldPropertyCandidate,
  currentNewProperty: NewProperty,
  mappedOldPropNos: string[] = []
): OldPropertyCandidate {
  const isMappedToCurrent = isCandidateMatchingAny(cand, mappedOldPropNos);

  const updatedCand: OldPropertyCandidate = {
    ...cand,
    isMapped: isMappedToCurrent,
    status: isMappedToCurrent ? ("Mapped" as const) : ("Unmapped" as const),
    mappedNewPropertyNo: isMappedToCurrent ? currentNewProperty.propNo : (cand.mappedNewPropertyNo || ""),
    belongsToNewId: isMappedToCurrent ? currentNewProperty.propNo : (cand.belongsToNewId || ""),
  };

  const newPropertyRef = {
    propNo: currentNewProperty.propNo || "",
    owner: currentNewProperty.owner || "",
    address: currentNewProperty.address || "",
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

  const dynamicScore = calculateMatchScore(newPropertyRef, {
    propNo: updatedCand.propNo || "",
    owner: updatedCand.owner || "",
    address: updatedCand.address || "",
    area: updatedCand.area || 0,
    floors: updatedCand.floors || "",
    tax: updatedCand.tax || 0,
    cts: updatedCand.cts,
    rv: updatedCand.rv,
    use: updatedCand.use,
    ward: updatedCand.ward,
    zone: updatedCand.zone,
    plotNo: updatedCand.plotNo,
    constructionYear: updatedCand.constructionYear
  });

  return { ...updatedCand, score: dynamicScore };
}

export function usePropertyCandidates({
  currentNewProperty,
  candidates,
  autoSearchedCandidates,
  serverSearchedCandidates,
  searchQuery,
  activeFloorDataMap,
  mappings,
}: UsePropertyCandidatesProps) {
  const t = useTranslations("propertyMapping");
  const [checkedCandidateIds, setCheckedCandidateIds] = useState<Record<string, string[]>>({});
  const [selectedFloorProperty, setSelectedFloorProperty] = useState("");
  const [hoveredFloorIndex, setHoveredFloorIndex] = useState<number | null>(null);

  const mappedOldPropNos = useMemo(() => {
    return Array.from(new Set(mappings.flatMap((m) => m.oldPropNos || []).filter(Boolean)));
  }, [mappings]);

  const autoCandidates = useMemo(() => {
    if (!currentNewProperty) return [];
    const initialActive = candidates.filter(
      (c) =>
        (c.belongsToNewId === currentNewProperty.propNo ||
          c.belongsToNewId === currentNewProperty.fullPropNo ||
          isCandidateMatchingAny(c, mappedOldPropNos)) &&
        c.propNo !== ""
    );
    const merged = [...initialActive];
    autoSearchedCandidates.forEach((ac) => {
      if (!merged.some((m) => m.id === ac.id || (m.propNo === ac.propNo && m.partitionNo === ac.partitionNo))) {
        merged.push(ac);
      }
    });
    return merged.map((c) => getCandidateWithDynamicScore(c, currentNewProperty, mappedOldPropNos));
  }, [candidates, currentNewProperty, autoSearchedCandidates, mappedOldPropNos]);

  const manualCandidates = useMemo(() => {
    if (!currentNewProperty || !searchQuery.trim()) return [];
    return serverSearchedCandidates.map((c) => getCandidateWithDynamicScore(c, currentNewProperty, mappedOldPropNos));
  }, [currentNewProperty, searchQuery, serverSearchedCandidates, mappedOldPropNos]);

  const activeCandidates = useMemo(() => {
    const merged = [...autoCandidates];
    manualCandidates.forEach((mc) => {
      if (!merged.some((m) => m.id === mc.id || (m.propNo === mc.propNo && m.partitionNo === mc.partitionNo))) {
        merged.push(mc);
      }
    });
    return merged;
  }, [autoCandidates, manualCandidates]);

  const activeCheckedIds = useMemo(() => {
    if (!currentNewProperty) return [];
    const custom = checkedCandidateIds[currentNewProperty.propNo];
    if (custom !== undefined) return custom;
    return activeCandidates
      .filter((c) => isCandidateMatchingAny(c, mappedOldPropNos) || (c.isMapped && (c.mappedNewPropertyNo === currentNewProperty.propNo || !c.mappedNewPropertyNo)))
      .map((c) => c.id);
  }, [checkedCandidateIds, currentNewProperty, activeCandidates, mappedOldPropNos]);

  const selectedCandidates = useMemo(() => {
    return activeCandidates.filter((c) => activeCheckedIds.includes(c.id));
  }, [activeCandidates, activeCheckedIds]);

  const inferredMappingType = useMemo(() => {
    if (selectedCandidates.length === 0) return t("mappingType.unmapped");
    if (selectedCandidates.length === 1) return t("mappingType.oneToOne");
    return t("mappingType.split", { count: selectedCandidates.length });
  }, [selectedCandidates, t]);

  const floorPropertyTabs = useMemo<FloorTab[]>(() => {
    const tabs: FloorTab[] = [];
    if (!currentNewProperty) return tabs;

    const newKey = getFloorKey(currentNewProperty.propNo, currentNewProperty.partitionNo);
    if (activeFloorDataMap[newKey]) {
      tabs.push({ key: newKey, label: t("floorVisualizer.tabLabel.new"), isNew: true, displayPropNo: currentNewProperty.propNo });
    }

    selectedCandidates.forEach((c) => {
      if (c.status === "Mapped" && mappedOldPropNos.includes(c.propNo)) return;
      const candKey = getFloorKey(c.propNo, c.partitionNo);
      if (activeFloorDataMap[candKey]) {
        tabs.push({
          key: candKey,
          label: t("floorVisualizer.tabLabel.old"),
          isNew: false,
          displayPropNo: c.partitionNo ? `#${c.partitionNo}` : c.propNo,
        });
      }
    });
    return tabs;
  }, [currentNewProperty, selectedCandidates, activeFloorDataMap, t, mappedOldPropNos]);

  useEffect(() => {
    if (floorPropertyTabs.length > 0) {
      const hasSelected = floorPropertyTabs.some((t) => t.key === selectedFloorProperty);
      if (!hasSelected) setSelectedFloorProperty(floorPropertyTabs[0].key);
    } else {
      setSelectedFloorProperty("");
    }
  }, [floorPropertyTabs, selectedFloorProperty]);

  const handleToggleCandidate = (id: string) => {
    if (!currentNewProperty) return;
    setCheckedCandidateIds((prev) => {
      const currentVal = prev[currentNewProperty.propNo] !== undefined
        ? prev[currentNewProperty.propNo]
        : candidates.filter((c) => c.isMapped || mappedOldPropNos.includes(c.propNo)).map((c) => c.id);
      const updated = currentVal.includes(id) ? currentVal.filter((item) => item !== id) : [...currentVal, id];
      return { ...prev, [currentNewProperty.propNo]: updated };
    });
  };

  return {
    autoCandidates,
    manualCandidates,
    activeCheckedIds,
    selectedCandidates,
    inferredMappingType,
    floorPropertyTabs,
    selectedFloorProperty,
    setSelectedFloorProperty,
    hoveredFloorIndex,
    setHoveredFloorIndex,
    mappedOldPropNos,
    handleToggleCandidate,
  };
}

