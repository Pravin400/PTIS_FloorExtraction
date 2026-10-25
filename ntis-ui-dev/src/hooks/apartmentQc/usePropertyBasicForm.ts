import { useMemo, useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updateBasicDetailsAction } from "@/app/[locale]/property-tax/ptis/appartmentQC/action";
import { useToast } from "@/components/common";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  OWNERNAME_REGEX,
  limitTwoDigitNumber,
  MOBILE_10_REGEX,
  EMAIL_REGEX,
  limitSingleAtEmail
} from "@/lib/utils/validation-rules";
import type { ApartmentQCDetail } from "@/types/apartmentQC.types";
import { useEnterKeyNavigation } from "./useEnterKeyNavigation";

export type PropertyData = Partial<ApartmentQCDetail>;

export interface PropertyTypeOptionSource {
  id: string | number;
  code?: string;
  propertyDescription?: string;
}

export type OldPropertyData = Pick<
  ApartmentQCDetail,
  | "oldRV"
  | "oldTotalTax"
  | "oldConstructionArea"
  | "oldUseType"
  | "oldConstructionType"
  | "oldConstructionYear"
  | "oldCSN"
>;

export interface OldPropertyFetchResult {
  success: boolean;
  data?: OldPropertyData | null;
  message?: string;
  error?: string;
}

export type OldFieldState = {
  oldRV: string;
  oldTax: string;
  oldArea: string;
  oldUseType: string;
  oldConstructionType: string;
  oldConstructionYear: string;
  oldCSN: string;
};

export const hasAnyOldPropertyData = (data?: OldPropertyData | null) => {
  if (!data) return false;

  const hasOldRV = data.oldRV != null && data.oldRV !== 0;
  const hasOldTax = data.oldTotalTax != null && data.oldTotalTax !== 0;
  const hasOldArea = data.oldConstructionArea != null && data.oldConstructionArea !== 0;
  const hasOldUseType = Boolean(data.oldUseType && data.oldUseType.trim() !== "");
  const hasOldConType = Boolean(data.oldConstructionType && data.oldConstructionType.trim() !== "");
  const hasOldConYear = Boolean(data.oldConstructionYear && data.oldConstructionYear.trim() !== "");
  const hasOldCSN = Boolean(data.oldCSN && data.oldCSN.trim() !== "");

  return hasOldRV || hasOldTax || hasOldArea || hasOldUseType || hasOldConType || hasOldConYear || hasOldCSN;
};

export const mapOldPropertyFields = (data?: OldPropertyData | null): OldFieldState => ({
  oldRV: data?.oldRV != null ? String(data.oldRV) : "",
  oldTax: data?.oldTotalTax != null ? String(data.oldTotalTax) : "",
  oldArea: data?.oldConstructionArea != null ? String(data.oldConstructionArea) : "",
  oldUseType: data?.oldUseType || "",
  oldConstructionType: data?.oldConstructionType || "",
  oldConstructionYear: data?.oldConstructionYear || "",
  oldCSN: data?.oldCSN || "",
});

interface UsePropertyBasicFormArgs {
  propertyData?: PropertyData;
  propertyTypes?: PropertyTypeOptionSource[];
  oldPropertyFetchResult?: OldPropertyFetchResult | null;
  t: (key: string, options?: Record<string, string | number | Date>) => string;
  tQ: (key: string, options?: Record<string, string | number | Date>) => string;
  tHas: (key: string) => boolean;
}

export function usePropertyBasicForm({
  propertyData,
  propertyTypes,
  oldPropertyFetchResult,
  t,
  tQ,
  tHas
}: UsePropertyBasicFormArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm } = useConfirm();
  
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState(() => ({
    ownerName: propertyData?.ownerName || "",
    occupierName: propertyData?.occupierName || "",
    renterName: propertyData?.renterName || "",
    propertyTypeId: String(propertyData?.propertyType || ""),
    bhk: String(propertyData?.bhk || ""),
    mobileNo: propertyData?.mobileNo || "",
    emailId: propertyData?.emailId || "",
    flatOrShopName: propertyData?.flatOrShopName || "",
    wingName: String(propertyData?.wing || ""),
    flatOrShopNo: propertyData?.flatOrShopNo || "",
    oldPropertyNo: propertyData?.oldPropertyNo || "",
    remark: String(propertyData?.remark || ""),
    oldRV: String(propertyData?.oldRV || ""),
    newRV: String(propertyData?.rVorCVValue || ""),
    oldTax: String(propertyData?.oldTotalTax || ""),
    newTax: String(propertyData?.newTaxTotal || ""),
    oldArea: String(propertyData?.oldConstructionArea || ""),
    newArea: String(propertyData?.carpetASqMtr || propertyData?.builtupASqMtr || ""),
    oldUseType: propertyData?.oldUseType || "",
    oldConstructionType: propertyData?.oldConstructionType || "",
    oldCSN: propertyData?.oldCSN || "",
    oldConstructionYear: propertyData?.oldConstructionYear || "",
  }));

  const propertyTypeOptions = propertyTypes?.map((p) => ({
    value: String(p.id),
    label: p.propertyDescription || p.code || "",
  })) || [];

  const handleFieldChangeRaw = useCallback((field: string, value: string) => {
    setHasChanges(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    let processedValue = value;
    switch (field) {
      case "ownerName":
      case "occupierName":
      case "renterName":
      case "flatOrShopName":
        processedValue = value.replace(OWNERNAME_REGEX, "");
        break;
      case "bhk":
        processedValue = limitTwoDigitNumber(value);
        break;
      case "mobileNo":
        processedValue = value.replace(/\D/g, "");
        break;
      case "emailId":
        processedValue = limitSingleAtEmail(value);
        break;
    }
    handleFieldChangeRaw(field, processedValue);
  }, [handleFieldChangeRaw]);

  const handlePropertyTypeChange = useCallback((value: string) => {
    handleFieldChangeRaw("propertyTypeId", value);
  }, [handleFieldChangeRaw]);

  const refreshToken = searchParams.get("_refresh");
  const refreshedOldPropertyNo = searchParams.get("oldPropertyNo") || "";

  const oldPropertyFields = useMemo<OldFieldState>(() => {
    if (!oldPropertyFetchResult) {
      return {
        oldRV: formData.oldRV,
        oldTax: formData.oldTax,
        oldArea: formData.oldArea,
        oldUseType: formData.oldUseType,
        oldConstructionType: formData.oldConstructionType,
        oldConstructionYear: formData.oldConstructionYear,
        oldCSN: formData.oldCSN,
      };
    }

    if (oldPropertyFetchResult.success && oldPropertyFetchResult.data && hasAnyOldPropertyData(oldPropertyFetchResult.data)) {
      return mapOldPropertyFields(oldPropertyFetchResult.data);
    }

    return mapOldPropertyFields(null);
  }, [oldPropertyFetchResult, formData.oldRV, formData.oldTax, formData.oldArea, formData.oldUseType, formData.oldConstructionType, formData.oldConstructionYear, formData.oldCSN]);

  const handleOldPropertyRefresh = useCallback(async () => {
    if (!formData.oldPropertyNo) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("oldPropertyNo", formData.oldPropertyNo);
    params.set("_refresh", Date.now().toString());

    router.push(`${pathname}?${params.toString()}`);
  }, [formData.oldPropertyNo, searchParams, pathname, router]);

  const syncedPropertyIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    const propertyId = propertyData?.id;
    if (!propertyId || syncedPropertyIdRef.current === propertyId) return;

    syncedPropertyIdRef.current = propertyId;

    const initialOldNo = propertyData.oldPropertyNo || "";
    const currentUrlOldNo = searchParams.get("oldPropertyNo") || "";

    if (currentUrlOldNo !== initialOldNo) {
      const params = new URLSearchParams(searchParams.toString());
      if (initialOldNo) params.set("oldPropertyNo", initialOldNo);
      else params.delete("oldPropertyNo");

      params.delete("_refresh");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [propertyData, pathname, router, searchParams]);

  const processedRefreshTokenRef = useRef<string | null>(refreshToken);

  useEffect(() => {
    if (!oldPropertyFetchResult || !refreshToken || processedRefreshTokenRef.current === refreshToken) {
      return;
    }

    processedRefreshTokenRef.current = refreshToken;

    if (oldPropertyFetchResult.success && oldPropertyFetchResult.data) {
      if (!hasAnyOldPropertyData(oldPropertyFetchResult.data)) {
        const fallbackMsg = `No old-property record found for '${refreshedOldPropertyNo}'.`;
        const errorMsg = tHas('messages.oldPropertyNotFound')
          ? t('messages.oldPropertyNotFound', { oldPropertyNo: refreshedOldPropertyNo })
          : fallbackMsg;
        toastError(errorMsg);
      } else {
        const successMsg = tHas('messages.oldPropertyDataRefreshed')
          ? t('messages.oldPropertyDataRefreshed')
          : "Old property data refreshed";
        toastSuccess(oldPropertyFetchResult.message || successMsg);
      }
    } else {
      const defaultErrorMsg = tHas('messages.noOldPropertyDataFound')
        ? t('messages.noOldPropertyDataFound')
        : "No old property data found";
      toastError(oldPropertyFetchResult.error || defaultErrorMsg);
    }
  }, [oldPropertyFetchResult, refreshToken, refreshedOldPropertyNo, toastError, toastSuccess, t, tHas]);

  const handleUpdate = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const propertyId = propertyData?.id;
    if (!propertyId) {
      toastError("Property ID not found.");
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formData.ownerName?.trim()) newErrors.ownerName = t('basicInfo.validation.ownerNameRequired', { fallback: "Owner name is required" });
    if (!formData.occupierName?.trim()) newErrors.occupierName = t('basicInfo.validation.occupierNameRequired', { fallback: "Occupier name is required" });
    if (!formData.flatOrShopNo?.trim()) newErrors.flatOrShopNo = t('basicInfo.validation.flatOrShopNoRequired', { fallback: "Flat/Shop No. is required" });

    if (formData.mobileNo && formData.mobileNo.trim().length > 0) {
      if (!MOBILE_10_REGEX.test(formData.mobileNo)) {
        newErrors.mobileNo = t('basicInfo.validation.invalidMobile', { fallback: "Valid 10-digit mobile number required (starting with 6-9)" });
      }
    }

    if (formData.emailId && formData.emailId.trim().length > 0) {
      if (!EMAIL_REGEX.test(formData.emailId)) {
        newErrors.emailId = t('basicInfo.validation.invalidEmail', { fallback: "Invalid email format" });
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    confirm({
      variant: "update",
      title: tQ('property.updateConfirmTitle'),
      description: tQ('property.updateConfirmText'),
      confirmText: tQ('property.updateConfirmButton'),
      onConfirm: async () => {
        startTransition(async () => {
          const payload = {
            ownerName: formData.ownerName,
            occupierName: formData.occupierName,
            renterName: formData.renterName,
            propertyType: formData.propertyTypeId ? Number(formData.propertyTypeId) : undefined,
            bhk: formData.bhk,
            mobileNo: formData.mobileNo,
            emailId: formData.emailId,
            wing: formData.wingName,
            flatOrShopNo: formData.flatOrShopNo,
            flatOrShopName: formData.flatOrShopName,
            oldPropertyNo: formData.oldPropertyNo,
          };

          const result = await updateBasicDetailsAction(propertyId, payload);
          if (result.success) {
            toastSuccess(result.message || "Updated successfully");
            setHasChanges(false);
          } else {
            toastError(result.error || "Failed to update");
          }
        });
      },
      onCancel: () => {
        const updateBtn = document.getElementById('update-basic-info-btn');
        if (updateBtn) {
          updateBtn.focus();
        }
      }
    });
  }, [formData, propertyData?.id, t, tQ, confirm, toastError, toastSuccess]);

  // TO REMOVE ENTER KEY FUNCTIONALITY: 
  // 1. Remove this line and the `useEnterKeyNavigation` import at the top.
  // 2. Remove `handleKeyDown` from the return statement of this hook.
  // 3. In `Propertybasicform.tsx`, remove `handleKeyDown` from `usePropertyBasicForm` output and the `onKeyDownCapture` prop from the form.
  const handleKeyDown = useEnterKeyNavigation();

  return {
    formData,
    propertyTypeOptions,
    oldPropertyFields,
    errors,
    isPending,
    hasChanges,
    handleFieldChange,
    handlePropertyTypeChange,
    handleOldPropertyRefresh,
    handleUpdate,
    handleKeyDown
  };
}
