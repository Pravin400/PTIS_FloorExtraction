"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getInitialWizardDataAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/initial-data/action";
import {
  mapDbAssetToFormData,
  type RawDbAsset,
} from "@/lib/utils/asset-utils/new-add-new-asset/mapDbAssetToFormData";
import type { UseNAInitialDataLoadersParams } from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";

export type { UseNAInitialDataLoadersParams };

export function useNAInitialDataLoaders({
  orchestrator,
  currentStep,
  setCvRollup,
}: UseNAInitialDataLoadersParams) {
  // Step 1 details rehydrator — re-runs when navigating back to step 1
  // or when the asset ID changes (e.g. after a create returns a new ID).
  const orchestratorRef = useRef(orchestrator);
  useEffect(() => {
    orchestratorRef.current = orchestrator;
  }, [orchestrator]);

  const initialAssetId = orchestrator.formData.id || orchestrator.formData.assetId || 0;
  const lastLoadedStepRef = useRef<number | null>(currentStep);
  const lastLoadedAssetIdRef = useRef<number | null>(
    initialAssetId > 0 ? initialAssetId : null
  );

  const formAssetId = orchestrator.formData.id || orchestrator.formData.assetId || 0;
  const isHydrated = orchestrator.formData.hydrated;

  useEffect(() => {
    const assetId = formAssetId;

    // If already hydrated from server on initial load, synchronize the ref without firing redundant action
    if (isHydrated && lastLoadedAssetIdRef.current === null && assetId > 0) {
      lastLoadedAssetIdRef.current = assetId;
      lastLoadedStepRef.current = currentStep;
      return;
    }

    const stepChanged =
      lastLoadedStepRef.current !== 1 && currentStep === 1;
    const assetIdChanged =
      lastLoadedAssetIdRef.current !== null &&
      lastLoadedAssetIdRef.current !== assetId &&
      assetId > 0;

    if (currentStep === 1 && assetId > 0 && (stepChanged || assetIdChanged)) {
      lastLoadedStepRef.current = 1;
      lastLoadedAssetIdRef.current = assetId;

      let isMounted = true;

      async function reloadStep1Data() {
        try {
          const currentOrchestrator = orchestratorRef.current;
          const res = await getInitialWizardDataAction(
            assetId,
            currentOrchestrator.formData.categoryId,
            currentOrchestrator.formData.typeId,
            currentOrchestrator.formData.category,
            currentOrchestrator.formData.assetType
          );
          if (!isMounted) return;
          if (res.success && res.data) {
            const dbAsset = res.data.dbAsset as RawDbAsset | null | undefined;
            if (dbAsset) {
              const updates = mapDbAssetToFormData(dbAsset, currentOrchestrator.formData, assetId);
              currentOrchestrator.updateContextFormData(updates);
              if (setCvRollup) {
                const dbObj = dbAsset as Record<string, unknown>;
                const cvVal = dbObj.capitalValue ?? dbObj.totalCapitalValue ?? dbObj.CapitalValue;
                if (cvVal != null) {
                  setCvRollup(Number(cvVal) || null);
                }
              }
            }
          }
        } catch (error) {
          if (!isMounted) return;
          const message =
            error instanceof Error
              ? error.message
              : "Failed to reload asset details. Please refresh the page.";
          toast.error(message);
        }
      }

      reloadStep1Data();
      return () => {
        isMounted = false;
      };
    } else {
      lastLoadedStepRef.current = currentStep;
      lastLoadedAssetIdRef.current = assetId;
    }
  }, [currentStep, formAssetId, isHydrated, setCvRollup]);
  // NOTE: orchestrator.updateContextFormData and orchestrator.formData are intentionally
  // omitted from deps — they are stable references from useCallback/useMemo in the orchestrator.
  // Adding them would cause infinite re-render loops since formData changes on every update.
}

