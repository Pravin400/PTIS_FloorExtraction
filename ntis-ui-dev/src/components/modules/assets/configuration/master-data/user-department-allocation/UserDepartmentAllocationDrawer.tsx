"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer, ValidationMessage } from "@/components/common";
import type {
  AssetUserListItem,
  OwningDepartmentOption,
  ZoneOption,
  WardOption,
  GrievanceWorkflowStageOption,
} from "@/types/asset-masters/user-department-allocation.types";
import { useUserDepartmentAllocationDrawer } from "@/hooks/asset-masters/user-department-allocation/useUserDepartmentAllocationDrawer";
import { UserAllocationHeaderCard } from "./UserAllocationHeaderCard";
import { UserAllocationStepper } from "./UserAllocationStepper";
import { UserAllocationStep1Department } from "./UserAllocationStep1Department";
import { UserAllocationStep2ZoneWard } from "./UserAllocationStep2ZoneWard";
import { UserAllocationStep3StageAccess } from "./UserAllocationStep3StageAccess";
import { UserAllocationDrawerFooter } from "./UserAllocationDrawerFooter";


interface UserDepartmentAllocationDrawerProps {
  open: boolean;
  onClose: () => void;
  onCancel?: () => void;
  user: AssetUserListItem | null;
  owningDepartments: OwningDepartmentOption[];
  zones: ZoneOption[];
  stages?: GrievanceWorkflowStageOption[];
  initialStep?: 1 | 2 | 3;
  initialZoneId?: number;
  initialWardsByZone?: Record<number, WardOption[]>;
  t: (key: string, values?: Record<string, string | number>) => string;
  onSuccess?: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  onSaveError?: () => void;
}

export function UserDepartmentAllocationDrawer(props: UserDepartmentAllocationDrawerProps) {
  const {
    open,
    onClose,
    onCancel,
    user,
    zones,
    t,
  } = props;

  const tCommon = useTranslations("common");

  const {
    activeUser,
    currentStep,
    selectedDeptIds,
    deptSearch,
    wardSearch,
    setWardSearch,
    stageSearch,
    setStageSearch,
    stepError,
    isSubmitting,
    isUpdateMode,
    filteredDepts,
    filteredZones,
    filteredStages,
    stagesList,
    selectedStageIds,
    selectedStageCount,
    isLoadingStages,
    setDeptSearch,
    toggleDept,
    selectAllDepts,
    clearAllDepts,
    toggleStage,
    selectAllStages,
    clearAllStages,
    handleProceedToZones,
    handleProceedToStages,
    handleBackToZones,
    handleBackToDepartments,
    handleSave,
    selectedZoneWards,
    activeWardZoneId,
    setActiveWardZoneId,
    toggleWardSelection,
    selectAllWardsForZone,
    clearWardsForZone,
    isLoadingWards,
    totalSelectedWardsCount,
    configuredZoneCount,
    activeZoneWards,
    filteredActiveZoneWards,
  } = useUserDepartmentAllocationDrawer({ ...props, tCommon });

  const activeWardZone = useMemo(() => {
    if (!activeWardZoneId) return null;
    return zones.find((z) => Number(z.id) === Number(activeWardZoneId)) || null;
  }, [zones, activeWardZoneId]);

  if (!activeUser) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="lg"
      title={
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl text-indigo-600 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-base sm:text-xl text-slate-800 leading-tight truncate">
              {isUpdateMode ? t("drawer.update") : t("drawer.title")}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 truncate">
              {currentStep === 1
                ? t("drawer.step1Title")
                : currentStep === 2
                  ? t("drawer.step2Title")
                  : t("drawer.step3Title")}
            </span>
          </div>
        </div>
      }
      footer={
        <UserAllocationDrawerFooter
          currentStep={currentStep}
          isSubmitting={isSubmitting}
          isUpdateMode={isUpdateMode}
          onCancel={onCancel}
          onClose={onClose}
          handleBackToDepartments={handleBackToDepartments}
          handleProceedToZones={handleProceedToZones}
          handleBackToZones={handleBackToZones}
          handleProceedToStages={handleProceedToStages}
          handleSave={handleSave}
          t={t}
        />
      }
    >
      <div className="p-3.5 sm:p-5 space-y-3.5 bg-slate-50/40 relative min-h-[420px]">
        {/* User Card */}
        <UserAllocationHeaderCard
          user={user}
          activeUser={activeUser}
          t={t}
        />

        {/* Stepper Tabs */}
        <UserAllocationStepper
          currentStep={currentStep}
          handleBackToDepartments={handleBackToDepartments}
          handleProceedToZones={handleProceedToZones}
          handleProceedToStages={handleProceedToStages}
          selectedDeptIds={selectedDeptIds}
          totalSelectedWardsCount={totalSelectedWardsCount}
          selectedStageCount={selectedStageCount}
          t={t}
        />

        {/* Validation Error Alert */}
        {stepError && (
          <ValidationMessage
            message={stepError}
            type="error"
            className="py-2.5 px-3 rounded-xl font-medium shadow-2xs"
          />
        )}

        {/* STEP 1: OWNING DEPARTMENT SELECTION */}
        {currentStep === 1 && (
          <UserAllocationStep1Department
            filteredDepts={filteredDepts}
            selectedDeptIds={selectedDeptIds}
            deptSearch={deptSearch}
            setDeptSearch={setDeptSearch}
            toggleDept={toggleDept}
            selectAllDepts={selectAllDepts}
            clearAllDepts={clearAllDepts}
            t={t}
          />
        )}

        {/* STEP 2: ZONE & WARD ALLOCATION */}
        {currentStep === 2 && (
          <UserAllocationStep2ZoneWard
            zonesList={zones}
            filteredZones={filteredZones}
            selectedZoneWards={selectedZoneWards}
            activeWardZoneId={activeWardZoneId}
            setActiveWardZoneId={setActiveWardZoneId}
            activeWardZone={activeWardZone}
            activeZoneWards={activeZoneWards}
            filteredActiveZoneWards={filteredActiveZoneWards}
            wardSearch={wardSearch}
            setWardSearch={setWardSearch}
            toggleWardSelection={toggleWardSelection}
            selectAllWardsForZone={selectAllWardsForZone}
            clearWardsForZone={clearWardsForZone}
            isLoadingWards={isLoadingWards}
            totalSelectedWardsCount={totalSelectedWardsCount}
            configuredZoneCount={configuredZoneCount}
            t={t}
          />
        )}

        {/* STEP 3: GRIEVANCE STAGE ACCESS CONTROL */}
        {currentStep === 3 && (
          <UserAllocationStep3StageAccess
            stagesList={stagesList}
            filteredStages={filteredStages}
            selectedStageIds={selectedStageIds}
            stageSearch={stageSearch}
            setStageSearch={setStageSearch}
            toggleStage={toggleStage}
            selectAllStages={selectAllStages}
            clearAllStages={clearAllStages}
            isLoadingStages={isLoadingStages}
            t={t}
          />
        )}
      </div>
    </Drawer>
  );
}
