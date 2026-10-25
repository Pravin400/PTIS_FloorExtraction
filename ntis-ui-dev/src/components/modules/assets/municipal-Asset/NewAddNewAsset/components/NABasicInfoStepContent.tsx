'use client';


import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MovableParentAssetSection } from "../basic-info/MovableParentAssetSection";
import { NAAssetProfile } from "./NAAssetProfile";
import { NAPropertyInfo } from "./NAPropertyInfo";
import { NADynamicFields } from "./NADynamicFields";
import { NAAssetMedia } from "./NAAssetMedia";
import { NAFloorTable } from "./NAFloorTable";
import { NASummaryCards } from "./NASummaryCards";
import { FloorComponentDrawer } from "../FloorComponentDrawer/FloorComponentDrawer";
import { deleteFloorSubmissionAction, deleteChildAssetAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";
import { useConfirm } from "@/components/common/ConfirmProvider";

import type { NABasicInfoStepContentProps, AssetFloorDetailItem } from "@/types/asset/municipal-Asset/new-add-new-asset";

export function NABasicInfoStepContent({
  orchestrator,
  currentStep,
  zones = [],
  wards = [],
  moujas = [],
  subzones = [],
  departments = [],
  ownershipTypes = [],
  designations = [],
  assetConditions = [],
  initialParentAsset = null,
  initialParentFloors = [],
  initialParentSubunits = [],
  initialPhotoTypes = [],
  initialDbPhotos = [],
  cvRollup = null,
}: NABasicInfoStepContentProps) {
  const { confirm } = useConfirm();
  const searchParams = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editFloorId, setEditFloorId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<"floorSubmission" | "generateUnits">("floorSubmission");

  const category = searchParams.get("category") || orchestrator.formData.category || "";
  const categoryKey = category.toUpperCase();
  const isLandOrInfra =
    categoryKey === "LAND" ||
    categoryKey === "INFRASTRUCTURE" ||
    orchestrator.categoryStr?.toUpperCase() === "LAND" ||
    orchestrator.categoryStr?.toUpperCase() === "INFRASTRUCTURE" ||
    orchestrator.formData.category?.toUpperCase()?.includes("LAND") ||
    orchestrator.formData.category?.toUpperCase()?.includes("INFRASTRUCTURE") ||
    orchestrator.formData.categoryCode === "CAT-LAND" ||
    orchestrator.formData.categoryCode === "CAT-INFRA";

  const handleAddFloor = () => {
    setEditFloorId(null);
    setDrawerMode("floorSubmission");
    setIsDrawerOpen(true);
  };

  const handleEditFloor = (id: number) => {
    const floorToEdit = orchestrator.floors?.find((f: AssetFloorDetailItem) => f.id === id);
    const unitType = String((floorToEdit as unknown as Record<string, unknown>)?.unitType || "").toUpperCase();
    const isPoolUnit =
      unitType.includes("SHOP") ||
      unitType.includes("FLAT") ||
      unitType.includes("OFFICE") ||
      unitType.includes("UNIT") ||
      (floorToEdit as unknown as Record<string, unknown>)?.isUnit === true ||
      (floorToEdit as unknown as Record<string, unknown>)?.isChildAsset === true;

    setEditFloorId(id);
    setDrawerMode(isPoolUnit ? "generateUnits" : "floorSubmission");
    setIsDrawerOpen(true);
  };

  const handleGenerateUnits = () => {
    setEditFloorId(null);
    setDrawerMode("generateUnits");
    setIsDrawerOpen(true);
  };

  const handleFloorSaveSuccess = async (savedFloorItem?: unknown, options?: { keepDrawerOpen?: boolean }) => {
    if (savedFloorItem && typeof savedFloorItem === "object" && "id" in savedFloorItem) {
      const item = savedFloorItem as AssetFloorDetailItem;
      const currentFloors = orchestrator.floors || [];
      const existsIndex = currentFloors.findIndex((f: AssetFloorDetailItem) => f.id === (item as AssetFloorDetailItem).id);
      let nextFloors: AssetFloorDetailItem[];
      if (existsIndex >= 0) {
        nextFloors = currentFloors.map((f: AssetFloorDetailItem) =>
          f.id === (item as AssetFloorDetailItem).id ? ({ ...f, ...(item as unknown as Record<string, unknown>) } as AssetFloorDetailItem) : f
        );
      } else {
        nextFloors = [...currentFloors, item as AssetFloorDetailItem];
      }
      orchestrator.updateContextFormData({ floors: nextFloors });
    }
    if (!options?.keepDrawerOpen) {
      setIsDrawerOpen(false);
      setEditFloorId(null);
    }
  };

  const handleDeleteFloor = async (id: number) => {
    const assetToDelete = orchestrator.floors?.find((f: AssetFloorDetailItem) => f.id === id);
    if (!assetToDelete) return;

    confirm({
      variant: "delete",
      title: "Delete Floor Detail",
      description: "Are you sure you want to delete this floor detail?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const isDirectSubmission = (assetToDelete as unknown as Record<string, unknown>).isDirectFloorSubmission === true;
          const res = isDirectSubmission
            ? await deleteFloorSubmissionAction(id)
            : await deleteChildAssetAction(id);
          if (!res.success) {
            throw new Error(res.error || (isDirectSubmission ? "Failed to delete floor submission" : "Failed to delete child asset"));
          }

          const nextFloors = (orchestrator.floors || []).filter((f: AssetFloorDetailItem) => f.id !== id);
          orchestrator.updateContextFormData({ floors: nextFloors });
        } catch (err: unknown) {
          console.error("Failed to delete floor:", err);
        }
      },
    });
  };

  const showFormDetails = !orchestrator.formData.isMovableCategory || !!orchestrator.formData.parentBuildingId;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] px-3 pt-0.5 pb-0.5 overflow-y-auto">
      {orchestrator.formData.isMovableCategory && (
        <div className="mb-2 shrink-0">
          <MovableParentAssetSection
            formData={orchestrator.formData}
            updateFormData={orchestrator.updateFormData}
            initialParentAsset={initialParentAsset}
            initialParentFloors={initialParentFloors}
            initialParentSubunits={initialParentSubunits}
          />
        </div>
      )}

      {showFormDetails && (
        <>
          <div className="overflow-x-auto custom-scrollbar pb-1 w-full shrink-0">
            <div
              className={`grid grid-cols-1 ${(orchestrator.dynamicFields && orchestrator.dynamicFields.length > 0) || orchestrator.isDynamicLoading
                  ? "min-w-[1240px] xl:min-w-0 xl:grid-cols-4 md:grid-cols-2"
                  : "min-w-[940px] xl:min-w-0 xl:grid-cols-3 md:grid-cols-3"
                } gap-2 mb-1 items-stretch h-[390px] max-h-[390px] min-h-[390px] relative`}
            >
              <NAAssetProfile
                formData={orchestrator.formData}
                errors={orchestrator.errors}
                showError={orchestrator.showError}
                handleChange={orchestrator.handleChange}
                updateFormData={orchestrator.updateFormData}
                zones={zones}
                wards={orchestrator.cascade.wards.length > 0 ? orchestrator.cascade.wards : wards}
                moujas={moujas}
                subzones={orchestrator.cascade.subzones.length > 0 ? orchestrator.cascade.subzones : subzones}
                assetConditions={assetConditions}
                isLoadingWards={orchestrator.cascade.isLoadingWards}
                isLoadingSubzones={orchestrator.cascade.isLoadingSubzones}
              />
              <NAPropertyInfo
                formData={orchestrator.formData}
                errors={orchestrator.errors}
                showError={orchestrator.showError}
                handleChange={orchestrator.handleChange}
                updateFormData={orchestrator.updateFormData}
                departments={departments}
                ownershipTypes={ownershipTypes}
                designations={
                  orchestrator.cascade.designations.length > 0
                    ? orchestrator.cascade.designations
                    : designations
                }
                isLoadingDesignations={orchestrator.cascade.isLoadingDesignations}
              />
              {((orchestrator.dynamicFields && orchestrator.dynamicFields.length > 0) ||
                orchestrator.isDynamicLoading) && (
                  <NADynamicFields
                    fields={orchestrator.dynamicFields}
                    loading={orchestrator.isDynamicLoading}
                    formData={orchestrator.formData}
                    onAttributeChange={orchestrator.handleAttributeChange}
                  />
                )}
              <NAAssetMedia
                currentStep={currentStep}
                initialPhotoTypes={initialPhotoTypes}
                initialDbPhotos={initialDbPhotos}
              />
            </div>
          </div>

          {/* PR 2 Floor snapshot Table */}
          <div className="flex-[3] min-h-0 mb-1 flex flex-col shrink-0">
            <NAFloorTable
              floors={orchestrator.floors || []}
              onAdd={handleAddFloor}
              onEdit={handleEditFloor}
              onDelete={handleDeleteFloor}
              onGenerateUnits={isLandOrInfra ? undefined : handleGenerateUnits}
              showGenerateUnits={!isLandOrInfra}
              typeId={orchestrator.typeId}
            />
          </div>

          <div className="mt-auto shrink-0 mb-0">
            <NASummaryCards summary={orchestrator.summary} cvRollup={cvRollup} />
          </div>

          {/* PR 2 Floor Configurator Drawer */}
          <FloorComponentDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setEditFloorId(null);
            }}
            onSuccess={handleFloorSaveSuccess}
            editFloorId={editFloorId}
            mode={drawerMode}
            assetId={Number(orchestrator.assetId || orchestrator.formData.id || orchestrator.formData.assetId || searchParams.get("assetId") || searchParams.get("id")) || 0}
            categoryId={orchestrator.categoryId || Number(searchParams.get("categoryId")) || 0}
            typeId={orchestrator.typeId || Number(searchParams.get("typeId")) || 0}
            categoryStr={orchestrator.categoryStr || String(orchestrator.formData.category || '')}
            assetTypeStr={orchestrator.formData.assetType || ''}
          />
        </>
      )}
    </div>
  );
}
