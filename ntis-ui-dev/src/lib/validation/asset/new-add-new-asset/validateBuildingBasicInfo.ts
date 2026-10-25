import type {
  BuildingBasicInfoFormData,
  BuildingBasicInfoFormErrors,
} from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import { buildingBasicInfoSchema } from "@/lib/utils/asset-utils/new-add-new-asset/basic-info/basic-info-validation-schemas";
import { validateForm } from "@/lib/utils/asset-utils/new-add-new-asset/basic-info/basic-info-validation-helpers";
import {
  validatePropertyFields,
  validateMovableLeaseFields,
  validateDimensionFields,
  validateOwnershipFields,
} from "./validateBuildingBasicInfo.utils";

export function validateBuildingBasicInfo(
  formData: BuildingBasicInfoFormData
): BuildingBasicInfoFormErrors {
  const errors = validateForm(formData, buildingBasicInfoSchema) as BuildingBasicInfoFormErrors;

  const categoryStr = formData.category?.toLowerCase() || formData.categoryStr?.toLowerCase() || "";
  const valType = formData.valuationType?.toUpperCase() || "";
  const isLand = valType === "LAND" || categoryStr.includes("land") || formData.categoryCode === "CAT-LAND";
  const isBuilding = valType === "BUILDING" || categoryStr.includes("building") || formData.categoryCode === "CAT-BUILDING" || formData.hasFloorDetails === true;

  validateOwnershipFields(formData, errors);
  validatePropertyFields(formData, errors, isLand, isBuilding);
  validateMovableLeaseFields(formData, errors);
  validateDimensionFields(formData, errors, isLand, isBuilding);

  return errors;
}
