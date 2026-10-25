"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { mapSharedApiError } from "@/lib/utils/asset-utils/shared-error-mapping";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
  WardOption,
  GrievanceWorkflowStageOption,
} from "@/types/asset-masters/user-department-allocation.types";
import { saveUserAllocationAction } from "@/app/[locale]/assets/configuration/master-data/user-department-allocation/action";
import { useAllocationDepartmentStep } from "./useAllocationDepartmentStep";
import { useAllocationZoneWardStep } from "./useAllocationZoneWardStep";
import { useAllocationStageStep } from "./useAllocationStageStep";
import { useAllocationUrlSync, updateAllocationUrlParams } from "./useAllocationUrlSync";

export interface UseUserDepartmentAllocationDrawerProps {
  open: boolean;
  onClose: () => void;
  user: AssetUserListItem | null;
  owningDepartments: OwningDepartmentOption[];
  zones: ZoneOption[];
  stages?: GrievanceWorkflowStageOption[];
  initialStep?: 1 | 2 | 3;
  initialZoneId?: number | null;
  initialWardsByZone?: Record<number, WardOption[]>;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon?: (key: string, values?: Record<string, string | number>) => string;
  onSuccess?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  onSaveError?: () => void;
}

export function useUserDepartmentAllocationDrawer(
  props: UseUserDepartmentAllocationDrawerProps
) {
  const {
    open,
    onClose,
    user,
    owningDepartments = [],
    zones = [],
    stages,
    t,
    tCommon = (k: string) => k,
    onSuccess,
    onSubmittingChange,
    onSaveError,
  } = props;

  const activeUser = user;
  const selectedUserId = user?.id ?? 0;

  const initialDeptIds = useMemo(() => {
    if (activeUser?.owningDepartments && activeUser.owningDepartments.length > 0) {
      return Array.from(
        new Set(
          activeUser.owningDepartments
            .map((d) => d.owningDepartmentId)
            .filter((id): id is number => typeof id === "number" && id > 0)
        )
      );
    }
    return [];
  }, [activeUser]);

  const initialZoneIds = useMemo(() => {
    if (activeUser?.zoneAllocations && activeUser.zoneAllocations.length > 0) {
      return Array.from(
        new Set(
          activeUser.zoneAllocations
            .map((z) => z.zoneId)
            .filter((id): id is number => typeof id === "number" && id > 0)
        )
      );
    }
    return [];
  }, [activeUser]);

  const initialZoneWards = useMemo(() => {
    const map: Record<number, number[]> = {};
    if (activeUser?.zoneAllocations && activeUser.zoneAllocations.length > 0) {
      for (const z of activeUser.zoneAllocations) {
        if (z.zoneId && z.wardId && Number(z.wardId) > 0) {
          const zid = Number(z.zoneId);
          const wid = Number(z.wardId);
          if (!map[zid]) map[zid] = [];
          if (!map[zid].includes(wid)) map[zid].push(wid);
        }
      }
    }
    return map;
  }, [activeUser]);

  const initialStageIds = useMemo(() => {
    if (activeUser?.stageAccess && activeUser.stageAccess.length > 0) {
      return Array.from(
        new Set(
          activeUser.stageAccess
            .map((s) => s.stageId)
            .filter((id): id is number => typeof id === "number" && id > 0)
        )
      );
    }
    return [];
  }, [activeUser]);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(props.initialStep ?? 1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearStepError = useCallback(() => {
    setStepError(null);
  }, []);

  const handleZoneUrlChange = useCallback((zoneId: number) => {
    updateAllocationUrlParams(2, zoneId);
  }, []);

  // 1. Department Step sub-hook
  const deptStep = useAllocationDepartmentStep({
    owningDepartments,
    initialDeptIds,
    onDepartmentSelectionChange: clearStepError,
  });

  // 2. Zone/Ward Step sub-hook
  const zoneWardStep = useAllocationZoneWardStep({
    zones,
    initialZoneIds,
    initialZoneWards,
    initialWardsByZone: props.initialWardsByZone,
    initialZoneId: props.initialZoneId,
    open,
    currentStep,
    onZoneChange: handleZoneUrlChange,
    onZoneSelectionChange: clearStepError,
  });

  // 3. Stage Access Step sub-hook
  const stageStep = useAllocationStageStep({
    stages,
    initialStageIds,
    open,
  });

  // 4. URL Synchronization sub-hook
  useAllocationUrlSync({
    open,
    currentStep,
    activeWardZoneId: zoneWardStep.activeWardZoneId,
  });

  // Synchronize state via useEffect when drawer opens or active user changes
  const prevTrackKeyRef = useRef<string | null>(null);
  const currentTrackKey = open && activeUser?.id ? `${open}-${activeUser.id}` : null;

  useEffect(() => {
    if (currentTrackKey && currentTrackKey !== prevTrackKeyRef.current) {
      prevTrackKeyRef.current = currentTrackKey;
      deptStep.resetDepartments(initialDeptIds);
      const initialWithWards = Object.keys(initialZoneWards).map(Number).find((id) => id > 0);
      const targetZid =
        props.initialZoneId ??
        initialWithWards ??
        initialZoneIds[0] ??
        (zones.length > 0 ? zones[0].id : null);
      zoneWardStep.resetZoneWards(
        initialZoneIds,
        initialZoneWards,
        props.initialWardsByZone ?? {},
        targetZid
      );
      stageStep.resetStages(initialStageIds);
      setCurrentStep(props.initialStep ?? 1);
      setStepError(null);
    } else if (!open) {
      prevTrackKeyRef.current = null;
    }
  }, [
    currentTrackKey,
    open,
    deptStep,
    zoneWardStep,
    stageStep,
    initialDeptIds,
    initialZoneIds,
    initialZoneWards,
    initialStageIds,
    props.initialStep,
    props.initialZoneId,
    props.initialWardsByZone,
    zones,
  ]);

  const isUpdateMode = useMemo(() => {
    if (!activeUser) return false;
    if (activeUser.owningDepartments && activeUser.owningDepartments.length > 0) return true;
    if (activeUser.zoneAllocations && activeUser.zoneAllocations.length > 0) return true;
    if (activeUser.stageAccess && activeUser.stageAccess.length > 0) return true;
    return false;
  }, [activeUser]);

  const {
    activeWardZoneId,
    selectedZoneWards,
    setActiveWardZoneId,
  } = zoneWardStep;

  const { selectedDeptIds } = deptStep;
  const { selectedStageIds } = stageStep;

  const handleProceedToZones = useCallback(() => {
    if (selectedDeptIds.length === 0) {
      setStepError(t("drawer.validationDepartmentRequired"));
      return;
    }
    setStepError(null);
    setCurrentStep(2);
    const targetZoneId =
      activeWardZoneId ??
      Object.keys(selectedZoneWards).map(Number).find((id) => id > 0) ??
      (zones.length > 0 ? zones[0].id : null);
    if (targetZoneId) {
      setActiveWardZoneId(targetZoneId);
    }
    updateAllocationUrlParams(2, targetZoneId);
  }, [
    selectedDeptIds.length,
    t,
    activeWardZoneId,
    selectedZoneWards,
    setActiveWardZoneId,
    zones,
  ]);

  const handleProceedToStages = useCallback(() => {
    if (selectedDeptIds.length === 0) {
      setStepError(t("drawer.validationDepartmentRequired"));
      return;
    }
    setStepError(null);
    setCurrentStep(3);
    updateAllocationUrlParams(3);
  }, [selectedDeptIds.length, t]);

  const handleBackToZones = useCallback(() => {
    setStepError(null);
    setCurrentStep(2);
    updateAllocationUrlParams(2, activeWardZoneId);
  }, [activeWardZoneId]);

  const handleBackToDepartments = useCallback(() => {
    setStepError(null);
    setCurrentStep(1);
    updateAllocationUrlParams(1);
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeUser || isSubmitting) return;
    if (selectedDeptIds.length === 0) {
      setCurrentStep(1);
      setStepError(t("drawer.validationDepartmentRequired"));
      return;
    }

    setIsSubmitting(true);
    onSubmittingChange?.(true);
    try {
      const effectiveZoneIds = Object.entries(selectedZoneWards)
        .filter(([_, wards]) => Array.isArray(wards) && wards.length > 0)
        .map(([zid]) => Number(zid));

      const result = await saveUserAllocationAction(
        activeUser.id,
        selectedDeptIds,
        effectiveZoneIds,
        isUpdateMode,
        selectedZoneWards,
        zoneWardStep.allocationMode || "WARD",
        selectedStageIds
      );

      if (result.ok) {
        toast.success(
          isUpdateMode
            ? t("drawer.updateSuccessMessage")
            : t("drawer.successMessage")
        );
        onSuccess?.();
        onClose();
      } else {
        const errorMsg =
          result.error === "department_required"
            ? t("drawer.validationDepartmentRequired")
            : mapSharedApiError({
                message: result.message,
                statusCode: result.statusCode,
                t: (k: string, vals?: Record<string, string | number | Date>) =>
                  t(k, vals as Record<string, string | number>),
                tCommon: (k: string, vals?: Record<string, string | number | Date>) =>
                  tCommon(k, vals as Record<string, string | number>),
                fallbackEntityName: t("title"),
                customStatusCodes: {
                  404: t("emptyStates.noUsersFound"),
                  401: tCommon("errors.unauthorized"),
                  500: t("drawer.errorMessage"),
                },
              });
        toast.error(errorMsg);
        onSaveError?.();
      }
    } catch {
      toast.error(t("drawer.errorMessage"));
      onSaveError?.();
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }, [
    activeUser,
    isSubmitting,
    selectedDeptIds,
    selectedZoneWards,
    zoneWardStep.allocationMode,
    isUpdateMode,
    selectedStageIds,
    t,
    tCommon,
    onSuccess,
    onClose,
    onSaveError,
    onSubmittingChange,
  ]);

  return {
    activeUser,
    selectedUserId,
    currentStep,
    setCurrentStep,
    selectedDeptIds: deptStep.selectedDeptIds,
    selectedZoneIds: zoneWardStep.selectedZoneIds,
    deptSearch: deptStep.deptSearch,
    zoneSearch: zoneWardStep.zoneSearch,
    wardSearch: zoneWardStep.wardSearch,
    setWardSearch: zoneWardStep.setWardSearch,
    stageSearch: stageStep.stageSearch,
    setStageSearch: stageStep.setStageSearch,
    stepError,
    isSubmitting,
    isUpdateMode,
    filteredDepts: deptStep.filteredDepts,
    filteredZones: zoneWardStep.filteredZones,
    filteredStages: stageStep.filteredStages,
    stagesList: stageStep.stagesList,
    selectedStageIds: stageStep.selectedStageIds,
    selectedStageCount: stageStep.selectedStageCount,
    isLoadingStages: stageStep.isLoadingStages,
    setDeptSearch: deptStep.setDeptSearch,
    setZoneSearch: zoneWardStep.setZoneSearch,
    toggleDept: deptStep.toggleDept,
    selectAllDepts: deptStep.selectAllDepts,
    clearAllDepts: deptStep.clearAllDepts,
    toggleZone: zoneWardStep.toggleZone,
    selectAllZones: zoneWardStep.selectAllZones,
    clearAllZones: zoneWardStep.clearAllZones,
    toggleStage: stageStep.toggleStage,
    selectAllStages: stageStep.selectAllStages,
    clearAllStages: stageStep.clearAllStages,
    handleProceedToZones,
    handleProceedToStages,
    handleBackToZones,
    handleBackToDepartments,
    handleSave,
    allocationMode: zoneWardStep.allocationMode,
    setAllocationMode: zoneWardStep.setAllocationMode,
    selectedZoneWards: zoneWardStep.selectedZoneWards,
    handleSelectZoneWard: zoneWardStep.handleSelectZoneWard,
    activeWardZoneId: zoneWardStep.activeWardZoneId,
    setActiveWardZoneId: zoneWardStep.setActiveWardZoneId,
    toggleWardSelection: zoneWardStep.toggleWardSelection,
    selectAllWardsForZone: zoneWardStep.selectAllWardsForZone,
    clearWardsForZone: zoneWardStep.clearWardsForZone,
    wardsByZone: zoneWardStep.wardsByZone,
    loadingWardsZoneId: zoneWardStep.loadingWardsZoneId,
    isLoadingWards: zoneWardStep.isLoadingWards,
    loadWardsForZone: zoneWardStep.loadWardsForZone,
    totalSelectedWardsCount: zoneWardStep.totalSelectedWardsCount,
    configuredZoneCount: zoneWardStep.configuredZoneCount,
    activeZoneWards: zoneWardStep.activeZoneWards,
    filteredActiveZoneWards: zoneWardStep.filteredActiveZoneWards,
  };
}
