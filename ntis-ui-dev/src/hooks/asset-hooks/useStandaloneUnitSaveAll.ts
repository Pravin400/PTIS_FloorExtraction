/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import { createChildAssetAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";
import { resolveStandaloneFloorDetailsMap } from '@/lib/utils/asset-utils/new-add-new-asset/standalone-subunit-floor-sync.utils';
import { buildStandaloneUnitSavePayload } from '@/lib/utils/asset-utils/new-add-new-asset/standalone-subunit-save-payload.utils';

/** Bulk "Save All" flow for standalone sub-units — also used as the wizard
 * submit hook for SAVE & NEXT. Only saves units that are new or modified
 * since the last save, so navigating Previous → Next doesn't re-create
 * already-persisted units. */
export function useStandaloneUnitSaveAll(
  units: any[],
  setUnits: (units: any[]) => void,
  formData: any,
  parentBuildingId: any,
  t: (key: string, values?: any) => string
) {
  const handleSaveAll = useCallback(async (): Promise<boolean> => {
    if (units.length === 0) return true;

    const loadingToast = toast.loading(t("standaloneSubUnit.toasts.savingUnits"));

    const pId = Number(parentBuildingId || formData.id || formData.assetId || 0);
    if (!pId) {
      toast.error(t("standaloneSubUnit.toasts.parentIdNotResolved"), { id: loadingToast });
      return false;
    }

    try {
      const saved: any[] = [];
      const errors: string[] = [];
      const unsaved = units.filter((u: any) => !u.isSaved || u.isModified);

      const floorDetailsMap = await resolveStandaloneFloorDetailsMap(pId, unsaved);

      for (const unit of unsaved) {
        const resolvedFloorDetailsId = unit.floorId
          ? (floorDetailsMap.get(unit.floorId) ?? unit.floorId)
          : undefined;

        const res = await createChildAssetAction(
          buildStandaloneUnitSavePayload(unit, pId, resolvedFloorDetailsId, formData)
        );

        if (res.success && res.data) {
          saved.push({
            ...unit,
            id: res.data.assetId || unit.id,
            unitNumber: res.data.assetNo || unit.unitNumber,
            isSaved: true,   // mark as persisted so future Save & Next skips it
            isModified: false,
          });
        } else {
          const rawErr = res.error || "failed";
          const friendlyErr = rawErr.includes("LeaseRent_Asset_NotFound")
            ? "Failed to register renter: Asset unit not found in registry"
            : rawErr;
          errors.push(`${unit.unitNumber}: ${friendlyErr}`);
        }
      }

      // Merge saved back into units
      const updatedUnits = units.map((u: any) => {
        const s = saved.find((sv: any) => sv.id === u.id);
        return s ?? u;
      });
      setUnits(updatedUnits);

      if (errors.length > 0) {
        toast.warning(t("standaloneSubUnit.toasts.partialSave", { saved: saved.length, failed: errors.length, errors: errors.join(", ") }), { id: loadingToast });
        return false;
      }
      toast.success(t("standaloneSubUnit.toasts.allSaved", { count: saved.length }), { id: loadingToast });
      return true;
    } catch (err: any) {
      toast.error(err.message || t("standaloneSubUnit.toasts.saveFailed"), { id: loadingToast });
      return false;
    }
  }, [units, setUnits, parentBuildingId, formData, t]);

  return { handleSaveAll };
}
