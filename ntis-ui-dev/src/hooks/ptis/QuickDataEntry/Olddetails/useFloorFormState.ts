import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FloorInformationFormData, OldFloorDetail } from "@/types/OldDetails/property-old-details.types";

/**
 * Hook to manage the state of the Floor Information Form.
 * Handles form data, editing, resetting, and URL sync for type-of-use.
 */
export function useFloorFormState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<FloorInformationFormData>({
    id: undefined,
    oldFloorId: "",
    oldSubFloorId: "",
    oldConstructionYear: "",
    oldAssessmentYear: "",
    oldConstructionTypeId: "",
    oldTypeOfUseId: "",
    oldSubTypeOfUseId: "",
    oldCarpetAreaSqFeet: "",
    oldAreaSqFeet: "",
    oldAreaSqMeter: "",
    oldBuiltupAreaSqFeet: "",
    oldBuiltupAreaSqMeter: ""
  });

  const [initialEditValues, setInitialEditValues] = useState<FloorInformationFormData | null>(null);

  /**
   * Handles Type of Use change and updates sub-type options via URL query params.
   */
  const handleUseTypeChange = useCallback((val: string | number, isEditBinding = false) => {
    const useTypeId = val ? String(val) : "";

    setFormData(prev => ({
      ...prev,
      oldTypeOfUseId: useTypeId,
      oldSubTypeOfUseId: isEditBinding ? prev.oldSubTypeOfUseId : ""
    }));

    // Only update URL if the value has changed
    const currentParam = searchParams.get('typeOfUseId') || "";
    if (currentParam !== useTypeId) {
      const urlParams = new URLSearchParams(searchParams);
      if (useTypeId) {
        urlParams.set('typeOfUseId', useTypeId);
      } else {
        urlParams.delete('typeOfUseId');
      }
      const queryString = urlParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  /**
   * Pre-fills form data for editing an existing record.
   */
  const handleEdit = useCallback((row: OldFloorDetail) => {  
    const editData = {
      id: row.id,
      oldFloorId: String(row.oldFloorId),
      oldSubFloorId: row.oldSubFloorId ? String(row.oldSubFloorId) : "",
      oldConstructionYear: row.oldConstructionYear,
      oldAssessmentYear: row.oldAssessmentYear || "",
      oldConstructionTypeId: String(row.oldConstructionTypeId),
      oldTypeOfUseId: row.oldTypeOfUseId ? String(row.oldTypeOfUseId) : "",
      oldSubTypeOfUseId: row.oldSubTypeOfUseId ? String(row.oldSubTypeOfUseId) : "",
      oldCarpetAreaSqFeet: String(row.oldCarpetAreaSqFeet),
      oldAreaSqFeet: String(row.oldCarpetAreaSqFeet || ""),
      oldAreaSqMeter: String(row.oldCarpetAreaSqMeter || ""),
      oldBuiltupAreaSqFeet: String(row.oldBuiltupAreaSqFeet || ""),
      oldBuiltupAreaSqMeter: String(row.oldBuiltupAreaSqMeter || ""),
      // Store description strings dynamically inside formData
      floorDescription: row.floorDescription,
      subFloorDescription: row.subFloorDescription,
      constructionTypeDescription: row.constructionTypeDescription,
      typeOfUseDescription: row.typeOfUseDescription,
      subTypeOfUseDescription: row.subTypeOfUseDescription,
    };

    setFormData(editData);
    setInitialEditValues({ ...editData });

    // Sync oldTypeOfUseId to URL query params on edit, so Sub Type options are fetched SSR
    if (row.oldTypeOfUseId) {
      const urlParams = new URLSearchParams(searchParams.toString());
      urlParams.set('typeOfUseId', String(row.oldTypeOfUseId));
      const queryString = urlParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }

    // Scroll to form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, router, searchParams]);

  /**
   * Resets the form to initial empty state.
   */
  const handleReset = useCallback(() => {
    setFormData({
      id: undefined,
      oldFloorId: "",
      oldSubFloorId: "",
      oldConstructionYear: "",
      oldAssessmentYear: "",
      oldConstructionTypeId: "",
      oldTypeOfUseId: "",
      oldSubTypeOfUseId: "",
      oldCarpetAreaSqFeet: "",
      oldAreaSqFeet: "",
      oldAreaSqMeter: "",
      oldBuiltupAreaSqFeet: "",
      oldBuiltupAreaSqMeter: ""
    });
    setInitialEditValues(null);

    const currentParam = searchParams.get('typeOfUseId');
    if (currentParam) {
      const urlParams = new URLSearchParams(searchParams);
      urlParams.delete('typeOfUseId');
      const queryString = urlParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return {
    formData,
    setFormData,
    initialEditValues,
    handleUseTypeChange,
    handleEdit,
    handleReset
  };
}
