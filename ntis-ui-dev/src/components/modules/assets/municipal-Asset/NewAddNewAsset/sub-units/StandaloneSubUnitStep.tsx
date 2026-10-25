'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNAAssetForm } from "../NAAssetFormContext";
import { LoadingState } from "@/components/common/LoadingState";
import { SubUnitDetailedConfigurator } from "./SubUnitDetailedConfigurator";
import { deleteChildAssetAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { useTranslations } from "next-intl";
import { mapInitialStandaloneUnits } from "@/lib/utils/asset-utils/new-add-new-asset/child-asset/standalone-subunit-initial-mapping.utils";
import { useStandaloneUnitConfigure } from "@/hooks/asset-hooks/useStandaloneUnitConfigure";
import { useStandaloneUnitGenerate } from "@/hooks/asset-hooks/useStandaloneUnitGenerate";
import { useStandaloneUnitSaveAll } from "@/hooks/asset-hooks/useStandaloneUnitSaveAll";
import { StandaloneParentBuildingBanner } from "./StandaloneParentBuildingBanner";
import { StandaloneUnitGeneratorPanel } from "./StandaloneUnitGeneratorPanel";
import { StandaloneUnitsTable } from "./StandaloneUnitsTable";

export function StandaloneSubUnitStep({
  dropdownOptions,
  initialSubUnits = [],
  initialParentFloors = []
}: {
  dropdownOptions?: Record<string, unknown>;
  initialSubUnits?: Record<string, unknown>[];
  initialParentFloors?: { id: number; [key: string]: unknown }[];
}) {
  const t = useTranslations("addAssetForm");
  const { confirm } = useConfirm();
  const { formData, updateFormData, setSubunitFiles, registerSubmitHook } = useNAAssetForm();
  const initializedRef = useRef<string | null>(null);

  const parentBuildingId = formData.parentBuildingId;
  const parentBuildingData = (formData as unknown as { parentBuildingData?: { assetName?: string; floors?: { id: number; [key: string]: unknown }[] } })?.parentBuildingData;
  const parentBuildingName = parentBuildingData?.assetName || (parentBuildingId === 1001 ? "Municipal Office Complex" :
    parentBuildingId === 1002 ? "Sunshine Residential" :
      parentBuildingId === 1003 ? "Central Market Hub" : "Parent Building");

  // Prefer the server-fetched floors (SSR, keyed off the URL-synced parentBuildingId)
  // over (formData as any).parentBuildingData?.floors, which nothing in this codebase populates.
  const parentFloors = useMemo(() => initialParentFloors.length > 0 ? initialParentFloors : (parentBuildingData?.floors || []), [initialParentFloors, parentBuildingData?.floors]);

  const [fromNo, setFromNo] = useState(1);
  const [toNo, setToNo] = useState(5);
  const [selectedFloorId, setSelectedFloorId] = useState<number>(parentFloors[0]?.id || 1);

  const units = (formData as unknown as { unitDetails?: Record<string, unknown>[] })?.unitDetails || [];
  const setUnits = useCallback((newUnits: Record<string, unknown>[]) => {
    updateFormData({ ...({ unitDetails: newUnits } as Record<string, unknown>) });
  }, [updateFormData]);

  const { activeUnit, setActiveUnit, isLoadingDetails, handleConfigureUnit } = useStandaloneUnitConfigure(units, setUnits);
  const { isGenerating, setIsGenerating, handleGenerate } = useStandaloneUnitGenerate(units, setUnits, formData, parentBuildingId, t);
  const { handleSaveAll } = useStandaloneUnitSaveAll(units, setUnits, formData, parentBuildingId, t);

  const handleDeleteSubUnit = async (unit: Record<string, unknown>) => {
    confirm({
      variant: "delete",
      title: t("floorDetails.deleteFloorDetailTitle") || "Delete Sub-unit",
      description: t("floorDetails.deleteFloorDetailDesc") || "Are you sure you want to delete this sub-unit detail?",
      onConfirm: async () => {
        const dbId = unit.id ? Number(unit.id) : (unit.assetId ? Number(unit.assetId) : 0);
        if (dbId && dbId > 0) {
          setIsGenerating(true);
          try {
            const res = await deleteChildAssetAction(dbId);
            if (res.success) {
              setUnits(units.filter((u: Record<string, unknown>) => u.id !== dbId && u.tempId !== unit.tempId));
              toast.success("Sub-unit deleted successfully.");
            } else {
              toast.error(res.error || "Failed to delete sub-unit from server.");
            }
          } catch (err) { const e = err as { message?: string }; toast.error(e?.message || "Failed to duplicate subunits"); } finally {
            setIsGenerating(false);
          }
        } else {
          setUnits(units.filter((u: Record<string, unknown>) => u.tempId !== unit.tempId));
          toast.success("Sub-unit deleted successfully.");
        }
      }
    });
  };

  const handleSaveUnitDetail = (updatedUnit: Record<string, unknown> & { id?: number | string; photoFile?: unknown; planFile?: unknown }) => {
    const updatedUnits = units.map((u: Record<string, unknown>) =>
      u.id === updatedUnit.id
        ? {
          ...u,
          ...updatedUnit,
          isModified: true, // mark it modified so it gets saved to the database!
        }
        : u
    );
    setUnits(updatedUnits);

    if (setSubunitFiles && updatedUnit.id) {
      setSubunitFiles((prev) => ({
        ...prev,
        [String(updatedUnit.id)]: {
          photoFile: updatedUnit.photoFile,
          planFile: updatedUnit.planFile,
        },
      }));
    }

    setActiveUnit(null);
  };

  // Load and map initial sub-units from props
  useEffect(() => {
    const signature = `${initialSubUnits?.length ?? 0}|${(initialSubUnits?.[0] as { assetId?: number | string; id?: number | string } | undefined)?.assetId ?? (initialSubUnits?.[0] as { assetId?: number | string; id?: number | string } | undefined)?.id ?? ""}|${parentFloors?.length ?? 0}`;
    if (initializedRef.current === signature) return;
    initializedRef.current = signature;

    if (!initialSubUnits || initialSubUnits.length === 0) {
      // Only clear if there are no existing units in formData either (prevent clearing on back-nav)
      const existingUnits = (formData as unknown as { unitDetails?: Record<string, unknown>[] })?.unitDetails || [];
      if (existingUnits.length === 0) {
        updateFormData({ unitDetails: [] } as unknown as Parameters<typeof updateFormData>[0]);
      }
      return;
    }

    updateFormData({ unitDetails: mapInitialStandaloneUnits(initialSubUnits, parentFloors) } as unknown as Parameters<typeof updateFormData>[0]);
    initializedRef.current = signature;
  }, [initialSubUnits, parentFloors, formData, updateFormData]);

  useEffect(() => {
    if (registerSubmitHook) registerSubmitHook(handleSaveAll);
    return () => { if (registerSubmitHook) registerSubmitHook(null); };
  }, [registerSubmitHook, handleSaveAll]);

  if (isLoadingDetails) {
    return (
      <LoadingState
        message="Loading subunit configurations..."
        minHeight=""
        messageClassName="text-xs font-bold text-slate-500 uppercase tracking-widest"
        className="absolute inset-0 z-50 bg-slate-50 p-8"
      />
    );
  }

  if (activeUnit) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-slate-50">
        <SubUnitDetailedConfigurator
          key={String(activeUnit.dbId ?? activeUnit.id ?? '')}
          unit={activeUnit}
          parentBuildingName={parentBuildingName}
          onSave={handleSaveUnitDetail}
          onCancel={() => setActiveUnit(null)}
          floors={parentFloors}
          dropdownOptions={dropdownOptions}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto py-4">
      <StandaloneParentBuildingBanner
        t={t}
        parentBuildingName={parentBuildingName}
        assetType={formData.assetType}
        parentBuildingData={parentBuildingData}
      />

      <StandaloneUnitGeneratorPanel
        t={t}
        fromNo={fromNo}
        setFromNo={setFromNo}
        toNo={toNo}
        setToNo={setToNo}
        parentFloors={parentFloors}
        selectedFloorId={selectedFloorId}
        setSelectedFloorId={setSelectedFloorId}
        isGenerating={isGenerating}
        onGenerate={() => handleGenerate(fromNo, toNo)}
        unitsCount={units.length}
      />

      <StandaloneUnitsTable
        t={t}
        units={units}
        dropdownOptions={dropdownOptions}
        isGenerating={isGenerating}
        onConfigureUnit={handleConfigureUnit}
        onDeleteUnit={handleDeleteSubUnit}
      />
    </div>
  );
}
