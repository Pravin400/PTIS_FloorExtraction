import { useCallback } from "react";
import { toast } from "sonner";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { BuildingStructureItem } from "@/types/zone-master/properties/building-structure.types";
import { generateBuildingStructureAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface UseBuildingPreviewProps {
  form: PartitionFormState;
  selectedWard: WardItem | null;
  selectedProperty: ZonePropertyItem | null;
  wings: WingItem[];
  floors: Floor[];
  setLoadingPreview: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewData: React.Dispatch<React.SetStateAction<BuildingStructureItem[]>>;
  setErrors: React.Dispatch<React.SetStateAction<PartitionFormErrors>>;
  validate: (data: PartitionFormState) => { valid: boolean; errors: PartitionFormErrors };
  t: (key: string) => string;
}

export function useBuildingPreview({
  form,
  selectedWard,
  selectedProperty,
  wings,
  floors,
  setLoadingPreview,
  setShowPreview,
  setPreviewData,
  setErrors,
  validate,
  t,
}: UseBuildingPreviewProps) {

  const handlePreviewBuilding = useCallback(async () => {
    const validationResult = validate(form);
    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      return;
    }

    if (!selectedWard?.id) {
      return;
    }
    if (!selectedProperty?.propertyNo) {
      return;
    }

    // Convert floor IDs to floor data
    const fromFloorId = parseInt(form.fromFloor, 10);
    const toFloorId = parseInt(form.toFloor, 10);
    
    if (isNaN(fromFloorId) || isNaN(toFloorId)) {
      return;
    }
    
    const fromFloorData = floors.find(f => f.id === fromFloorId);
    const toFloorData = floors.find(f => f.id === toFloorId);

    if (!fromFloorData || !toFloorData) {
      return;
    }
    
    const selectedWing = wings.find(w => w.wingNo === form.wingLetter);
    if (!selectedWing) {
      return;
    }

    setLoadingPreview(true);
    setShowPreview(true);

    try {
      const payload = {
        wardId: selectedWard.id,
        propertyNo: selectedProperty.propertyNo,
        wingId: selectedWing.id,
        fromFloor: fromFloorData.floorCode,
        toFloor: toFloorData.floorCode,
        noOfFlatOnOneFloor: parseInt(form.noOfFlatOnOneFloor, 10),
        flatStart: parseInt(form.flatStart, 10),
        incrementedBy: parseInt(form.incrementedBy, 10),
        prifix: form.prefix?.trim() || undefined,
        generationType: form.generationType.trim(),
      };

      const result = await generateBuildingStructureAction(payload);
      
      
      if (result.success && result.data) {
        setPreviewData(result.data);
        toast.success(t("partitionForm.preview.success"));
      } else {
        toast.error(result.error || t("partitionForm.preview.error"));
        setPreviewData([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate preview";
      toast.error(errorMessage);
      setPreviewData([]);
    } finally {
      setLoadingPreview(false);
    }
  }, [form, selectedWard, selectedProperty, wings, floors, setLoadingPreview, setShowPreview, setPreviewData, setErrors, validate, t]);

  return {
    handlePreviewBuilding,
  };
}
