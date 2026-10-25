"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { GrievanceWorkflowStageOption } from "@/types/asset-masters/user-department-allocation.types";
import { fetchGrievanceWorkflowStagesAction } from "@/app/[locale]/assets/configuration/master-data/user-department-allocation/action";

interface UseAllocationStageStepProps {
  stages?: GrievanceWorkflowStageOption[];
  initialStageIds: number[];
  open: boolean;
}

export function useAllocationStageStep({
  stages,
  initialStageIds,
  open,
}: UseAllocationStageStepProps) {
  const [selectedStageIds, setSelectedStageIds] = useState<number[]>(initialStageIds);
  const [stageSearch, setStageSearch] = useState("");
  const [fetchedStages, setFetchedStages] = useState<GrievanceWorkflowStageOption[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(false);

  const stagesList = stages && stages.length > 0 ? stages : fetchedStages;

  const hasFetchedStagesRef = useRef(false);

  useEffect(() => {
    if (!open || (stages && stages.length > 0) || hasFetchedStagesRef.current) {
      return;
    }
    hasFetchedStagesRef.current = true;
    let isMounted = true;
    setIsLoadingStages(true);
    fetchGrievanceWorkflowStagesAction()
      .then((stgs) => {
        if (isMounted) {
          setFetchedStages(stgs);
          setIsLoadingStages(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingStages(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [open, stages]);

  const filteredStages = useMemo(() => {
    if (!stageSearch.trim()) return stagesList || [];
    const q = stageSearch.toLowerCase().trim();
    return (stagesList || []).filter(
      (s) =>
        s.stageName.toLowerCase().includes(q) ||
        s.stageCode.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [stagesList, stageSearch]);

  const selectedStageCount = selectedStageIds.length;

  const toggleStage = useCallback((stageId: number) => {
    const n = Number(stageId);
    setSelectedStageIds((prev) =>
      prev.includes(n) ? prev.filter((id) => id !== n) : [...prev, n]
    );
  }, []);

  const selectAllStages = useCallback(() => {
    setSelectedStageIds((prev) =>
      Array.from(new Set([...prev, ...filteredStages.map((s) => Number(s.id))]))
    );
  }, [filteredStages]);

  const clearAllStages = useCallback(() => {
    setSelectedStageIds([]);
  }, []);

  const resetStages = useCallback((newIds: number[]) => {
    setSelectedStageIds(newIds);
    setStageSearch("");
  }, []);

  return {
    selectedStageIds,
    setSelectedStageIds,
    stageSearch,
    setStageSearch,
    stagesList,
    filteredStages,
    selectedStageCount,
    isLoadingStages,
    toggleStage,
    selectAllStages,
    clearAllStages,
    resetStages,
  };
}
