/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { bulkGenerateSubUnitsAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions";

export function useStandaloneUnitGenerate(
  units: any[],
  setUnits: (units: any[]) => void,
  formData: any,
  parentBuildingId: any,
  t: (key: string, values?: any) => string
) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (fromNo: number, toNo: number) => {
    const pId = Number(parentBuildingId || formData.id || formData.assetId || 0);
    if (!pId) {
      toast.error(t("standaloneSubUnit.toasts.parentNotSaved"));
      return;
    }

    const count = toNo - fromNo + 1;
    if (count < 1) {
      toast.error(t("standaloneSubUnit.toasts.countMin"));
      return;
    }

    const typeLabel = formData.assetType?.split(" ")[0] || "Unit";

    setIsGenerating(true);
    const loadingToast = toast.loading(t("standaloneSubUnit.toasts.generating", { count, typeLabel }));

    try {
      const res = await bulkGenerateSubUnitsAction({
        parentAssetId: pId,
        type: typeLabel,
        count: count,
      });

      if (res.success && res.data?.generatedAssets?.length) {
        const newUnits = res.data.generatedAssets.map((ga) => ({
          id: ga.assetId,
          subAssetId: ga.assetNo,
          unitNumber: ga.assetNo,
          unitName: ga.assetName || `${typeLabel} ${ga.assetNo}`,
          unitType: typeLabel,
          carpetAreaSqFeet: 0,
          baseValue: 0,
          status: "Active",
          floorId: null,
          floorDetailsId: null,
          rooms: [],
          rentAmount: 0,
          securityDeposit: 0,
          isSaved: true,
          isModified: false,
        }));

        setUnits([...units, ...newUnits]);
        const generatedCount = res.data.generatedAssets.length;
        const unitText = generatedCount === 1 ? `unit` : `units`;
        toast.success(
          t("standaloneSubUnit.toasts.generatedSuccess", { count: generatedCount, unitText }),
          { id: loadingToast }
        );
      } else {
        toast.error(res.error || t("standaloneSubUnit.toasts.generationFailed"), { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || t("standaloneSubUnit.toasts.generationFailed"), { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, setIsGenerating, handleGenerate };
}
