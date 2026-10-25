"use client";

import { useState, useCallback, useMemo } from "react";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import { validateBuildingBasicInfo, sanitizeBasicInfoField } from "@/lib/validation/asset/new-add-new-asset";
import { mapContextToInitialBasicInfo } from "./initialBasicInfoMapper";
import type {
  BuildingBasicInfoFormData,
  BuildingBasicInfoFormErrors,
  FormFieldChangeEvent,
} from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import { INITIAL_BUILDING_BASIC_INFO } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { UseNABuildingBasicInfoFormReturn } from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";

export type { UseNABuildingBasicInfoFormReturn };

export function useNABuildingBasicInfoForm(): UseNABuildingBasicInfoFormReturn {
  const {
    formData: contextData,
    updateFormData: syncContext,
    submittedOnce: contextSubmittedOnce,
    setSubmittedOnce: setContextSubmittedOnce,
  } = useNAAssetForm();

  const initialOverrides = useMemo(
    () => mapContextToInitialBasicInfo(contextData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [formData, setFormData] = useState<BuildingBasicInfoFormData>({
    ...INITIAL_BUILDING_BASIC_INFO,
    ...initialOverrides,
  });

  const [errors, setErrors] = useState<BuildingBasicInfoFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof BuildingBasicInfoFormData, boolean>>>({});
  const [localSubmittedOnce, setLocalSubmittedOnce] = useState(false);

  const submittedOnce = contextSubmittedOnce !== undefined ? contextSubmittedOnce : localSubmittedOnce;
  const setSubmittedOnce = setContextSubmittedOnce || setLocalSubmittedOnce;

  // Sync initial overrides if context updates externally
  const [prevContextData, setPrevContextData] = useState(contextData);
  if (contextData && contextData !== prevContextData) {
    setPrevContextData(contextData);
    const fields: (keyof BuildingBasicInfoFormData)[] = [
      "category", "assetType", "zone", "subzone", "ward", "mouja",
      "propertyNumber", "surveyNumber", "partitionNo", "upicId",
      "length", "width", "landArea", "assetName", "assetNameRegional",
      "department", "fullAddress", "fullAddressRegional", "locality",
      "pinCode", "ownershipType", "encroachmentStatus", "operationalControl",
      "inChargeName", "inChargeDesignation", "inChargeMobile", "inChargeEmail",
      "inChargeNameRegional", "inChargeRegionalName",
      "categoryId", "typeId", "latitude", "longitude", "zoneId", "wardId",
      "departmentId", "moujaId", "subZoneId", "status", "condition", "assetConditionId", "assetCode",
      "isMovableCategory", "parentBuildingId", "hasFloorDetails", "hasInventory",
      "isInventoryMandatory", "hasLegalCompliance", "categoryCode", "valuationType",
      "isRented", "leaseStartDate", "leaseEndDate", "leaseAmount", "securityDeposit",
      "paymentFrequency", "lessorName", "lessorMobile", "lessorEmail", "lessorAddress",
      "plotNumber", "pTaxId", "mpmsNo", "typeOfUseId", "subTypeOfUseId", "offset", "offsetOp"
    ];

    setFormData((prev) => {
      const patch: Partial<BuildingBasicInfoFormData> = {};
      for (const field of fields) {
        const cVal = contextData[field as keyof typeof contextData];
        if (cVal !== undefined && cVal !== null && cVal !== "" && cVal !== prev[field]) {
          Object.assign(patch, { [field]: cVal });
        }
      }
      if (contextData.attributes && Object.keys(contextData.attributes).length > 0) {
        patch.attributes = { ...(prev.attributes || {}), ...contextData.attributes };
      }
      return Object.keys(patch).length > 0 ? { ...prev, ...patch } : prev;
    });
  }

  const updateFormData = useCallback(
    (patch: Partial<BuildingBasicInfoFormData>) => {
      setFormData((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const key in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, key)) {
            const field = key as keyof BuildingBasicInfoFormData;
            const val = patch[field];
            if (val !== undefined && prev[field] !== val) {
              Object.assign(next, { [field]: val });
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
      syncContext(patch);
    },
    [syncContext]
  );

  // Auto-calculate land area from length, width, and offset if landArea is not explicitly overridden
  const calculatedLandArea = useMemo(() => {
    const isLand = formData.valuationType
      ? formData.valuationType === "LAND"
      : formData.category?.toLowerCase().includes("land");

    const isBuilding = formData.valuationType
      ? formData.valuationType === "BUILDING"
      : formData.category?.toLowerCase().includes("building") || formData.hasFloorDetails === true;

    if (!isLand && !isBuilding) return formData.landArea || "";

    const lenVal = parseFloat(formData.length || "0");
    const widthVal = parseFloat(formData.width || "0");
    const offsetVal = isLand ? parseFloat(formData.offset || "0") : 0;
    const isAdd = formData.offsetOp === "Add";

    if (lenVal > 0 && widthVal > 0) {
      return isAdd
        ? ((lenVal * widthVal) + offsetVal).toFixed(2)
        : Math.max(0, (lenVal * widthVal) - offsetVal).toFixed(2);
    }
    return formData.landArea || "";
  }, [
    formData.length,
    formData.width,
    formData.offset,
    formData.offsetOp,
    formData.valuationType,
    formData.category,
    formData.hasFloorDetails,
    formData.landArea,
  ]);

  const effectiveFormData = useMemo(() => {
    if (calculatedLandArea && calculatedLandArea !== formData.landArea) {
      return { ...formData, landArea: calculatedLandArea };
    }
    return formData;
  }, [formData, calculatedLandArea]);

  // Validation
  const validationErrors = useMemo(
    () => validateBuildingBasicInfo(effectiveFormData),
    [effectiveFormData]
  );

  const isValid = useMemo(() => Object.keys(validationErrors).length === 0, [validationErrors]);

  const showError = useCallback(
    (field: keyof BuildingBasicInfoFormData): boolean =>
      Boolean((submittedOnce || touched[field]) && validationErrors[field]),
    [submittedOnce, touched, validationErrors]
  );

  const handleChange = useCallback(
    (e: FormFieldChangeEvent) => {
      const { name, value } = e.target;
      const target = "selectionStart" in e.target ? (e.target as HTMLInputElement | HTMLTextAreaElement) : null;
      const start = target ? target.selectionStart : null;
      const end = target ? target.selectionEnd : null;

      const sanitizedValue = sanitizeBasicInfoField(name, value);
      if ("value" in e.target) {
        e.target.value = sanitizedValue;
      }

      const patch: Partial<BuildingBasicInfoFormData> = {};
      Object.assign(patch, { [name]: sanitizedValue });
      if (name === "zone") {
        patch.zoneId = sanitizedValue;
        patch.ward = "";
        patch.wardId = "";
      } else if (name === "ward") {
        patch.wardId = sanitizedValue;
      } else if (name === "mouja") {
        patch.moujaId = sanitizedValue;
        patch.subzone = "";
        patch.subZoneId = "";
      } else if (name === "subzone") {
        patch.subZoneId = sanitizedValue;
      } else if (name === "typeOfUseId") {
        patch.subTypeOfUseId = "";
      }

      setFormData((prev) => {
        if (prev[name as keyof BuildingBasicInfoFormData] === sanitizedValue) return prev;
        return { ...prev, ...patch };
      });
      syncContext(patch);

      const isTitleCased = name === "assetName" || name === "inChargeName" || name === "inChargeDesignation";
      if (start !== null && end !== null && isTitleCased) {
        requestAnimationFrame(() => {
          try {
            target?.setSelectionRange(start, end);
          } catch {}
        });
      }
    },
    [syncContext]
  );

  const handleAttributeChange = useCallback(
    (name: string, value: string | number | boolean) => {
      const nextAttributes = { ...formData.attributes, [name]: value };
      setFormData((prev) => ({ ...prev, attributes: nextAttributes }));
      syncContext({ attributes: nextAttributes });
    },
    [formData.attributes, syncContext]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name as keyof BuildingBasicInfoFormData]: true,
      }));
    },
    []
  );

  const handleSubmitStep = useCallback((): boolean => {
    setSubmittedOnce(true);
    const currentErrors = validateBuildingBasicInfo(formData);
    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  }, [formData, setSubmittedOnce]);

  return {
    formData,
    errors: Object.keys(errors).length > 0 ? errors : validationErrors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    handleAttributeChange,
    handleSubmitStep,
    showError,
    updateFormData,
  };
}
