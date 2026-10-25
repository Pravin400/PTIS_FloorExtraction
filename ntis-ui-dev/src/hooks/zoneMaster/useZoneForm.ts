import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getZoneByIdAction, createZoneAction, updateZoneAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { ZoneItem } from "@/types/zoneMaster.types";
import { ZoneFormState, ZoneFormErrors } from "@/components/modules/property-tax/zone-master/zones/ZoneFormFields";
import { ZONE_WARD_NO_MAX_LENGTH, ZONE_NAME_MAX_LENGTH, DESCRIPTION_ENGLISH_REGEX } from "@/components/modules/property-tax/zone-master/constants";
import { isAllZeros } from "@/lib/utils/validation-rules";

const INITIAL: ZoneFormState = {
  zoneNo: "",
  descriptionEnglish: "",
  description: "",
  isActive: true,
};

interface UseZoneFormProps {
  mode: "add" | "edit";
  open: boolean;
  zoneId?: string;
  initialData?: ZoneItem | null;
  zones?: ZoneItem[];
  existingZones: ZoneItem[];
  zoneAlias?: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function useZoneForm({
  mode,
  open,
  zoneId,
  initialData,
  zones,
  existingZones,
  zoneAlias,
  t,
}: UseZoneFormProps) {
  // Initialize form state
  const getInitialFormState = (): ZoneFormState => {
    if (mode === "edit" && initialData && zoneId && String(initialData.id) === String(zoneId)) {
      return {
        zoneNo: initialData.zoneNo,
        descriptionEnglish: initialData.descriptionEnglish || "",
        description: initialData.description || "",
        isActive: initialData.isActive,
      };
    }
    return INITIAL;
  };

  const [form, setForm] = useState<ZoneFormState>(getInitialFormState());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<ZoneFormErrors>({});

  // Track if we've already fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);

  // Fetch zone details for edit mode - ONLY if SSR data not available
  useEffect(() => {
    if (mode !== "edit" || !open) return;
    
    // Skip fetch if we already have valid SSR data (compare by zoneId)
    if (initialData && zoneId && String(initialData.id) === String(zoneId)) {
      // SSR data is available and matches - no client fetch needed
      return;
    }
    
    // Skip if already fetched
    if (hasFetchedRef.current) {
      return;
    }
    
    const fetchZoneDetails = async () => {
      if (!zoneId) return;

      hasFetchedRef.current = true;
      setFetching(true);
      try {
        const res = await getZoneByIdAction(zoneId);

        if (res.success && res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawData = res.data as any;
          const zone = rawData.zoneNo ? rawData : rawData.data;

          if (zone) {
            setForm({
              zoneNo: zone.zoneNo,
              descriptionEnglish: zone.descriptionEnglish || "",
              description: zone.description || "",
              isActive: zone.isActive,
            });
          } else {
            toast.error(t("messages.loadError", { zone: zoneAlias }));
          }
        } else {
          // Fallback to zones prop if fetch fails
          const zone = zones?.find((z) => String(z.id) === String(zoneId));
          if (zone) {
            setForm({
              zoneNo: zone.zoneNo,
              descriptionEnglish: zone.descriptionEnglish || "",
              description: zone.description || "",
              isActive: zone.isActive,
            });
          } else {
            toast.error(res.error || t("messages.loadError", { zone: zoneAlias }));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[useZoneForm] Failed to fetch zone details:", { zoneId, error: errorMessage });
        toast.error(t("messages.loadError", { zone: zoneAlias }));
      } finally {
        setFetching(false);
      }
    };

    fetchZoneDetails();
  }, [mode, open, initialData, zoneId, zones, zoneAlias, t]);
  
  // Reset the fetch ref when drawer closes
  useEffect(() => {
    if (!open) {
      hasFetchedRef.current = false;
    }
  }, [open]);

  // Validation logic
  const validate = (data: ZoneFormState) => {
    const newErrors: ZoneFormErrors = {};
    if (!data.zoneNo?.trim()) newErrors.zoneNo = t("validation.zoneNoRequired", { zone: zoneAlias });
    else if (isAllZeros(data.zoneNo)) newErrors.zoneNo = t("validation.zoneNoAllZeros", { zone: zoneAlias });
    else if (data.zoneNo.length > ZONE_WARD_NO_MAX_LENGTH) newErrors.zoneNo = t("validation.zoneNoMaxLength", { count: ZONE_WARD_NO_MAX_LENGTH, zone: zoneAlias });
    
    // English name validation
    if (!data.descriptionEnglish?.trim()) {
      newErrors.descriptionEnglish = t("validation.nameEnRequired", { zone: zoneAlias });
    } else if (isAllZeros(data.descriptionEnglish)) {
      newErrors.descriptionEnglish = t("validation.nameEnAllZeros", { zone: zoneAlias });
    } else if (data.descriptionEnglish.length > ZONE_NAME_MAX_LENGTH) {
      newErrors.descriptionEnglish = t("validation.nameEnMaxLength", { count: ZONE_NAME_MAX_LENGTH, zone: zoneAlias });
    } else if (!DESCRIPTION_ENGLISH_REGEX.test(data.descriptionEnglish.trim())) {
      newErrors.descriptionEnglish = t("validation.englishOnly");
    }

    // Regional name validation
    if (!data.description?.trim()) {
      newErrors.description = t("validation.nameRegRequired", { zone: zoneAlias });
    } else if (isAllZeros(data.description)) {
      newErrors.description = t("validation.zoneNameAllZeros", { zone: zoneAlias });
    } else if (data.description.length > ZONE_NAME_MAX_LENGTH) {
      newErrors.description = t("validation.zoneNameMaxLength", { count: ZONE_NAME_MAX_LENGTH, zone: zoneAlias });
    }
    return newErrors;
  };

  const checkDuplicateZone = (
    zoneNo: string,
    zoneName: string,
    zoneNameEnOrZoneId?: string | number,
    currentZoneId?: number
  ) => {
    const zoneNoValue = zoneNo.trim().toUpperCase();
    const nameValue = zoneName.trim().toLowerCase();
    
    let nameEnValue: string | undefined;
    let actualZoneId = currentZoneId;

    if (typeof zoneNameEnOrZoneId === "number") {
      actualZoneId = zoneNameEnOrZoneId;
    } else if (typeof zoneNameEnOrZoneId === "string" && zoneNameEnOrZoneId.trim()) {
      nameEnValue = zoneNameEnOrZoneId.trim().toLowerCase();
    }

    // Check duplicate zone number (excluding current record in edit mode)
    const duplicateByNo = existingZones.find((zone) => {
      if (mode === "edit" && actualZoneId !== undefined && zone.id === actualZoneId) return false;
      return zone.zoneNo?.trim().toUpperCase() === zoneNoValue;
    });

    if (duplicateByNo) {
      toast.error(
        t("messages.duplicateZone", { name: duplicateByNo.description || duplicateByNo.zoneNo, zone: zoneAlias })
      );
      return true;
    }

    // Check duplicate zone name (excluding current record in edit mode)
    const duplicateByName = existingZones.find((zone) => {
      if (mode === "edit" && actualZoneId !== undefined && zone.id === actualZoneId) return false;
      return zone.description?.trim().toLowerCase() === nameValue;
    });

    if (duplicateByName) {
      toast.error(
        t("messages.duplicateZoneName", { name: duplicateByName.description || duplicateByName.zoneNo, zone: zoneAlias })
      );
      return true;
    }

    // Check duplicate English zone name if provided
    if (nameEnValue) {
      const duplicateByNameEn = existingZones.find((zone) => {
        if (mode === "edit" && actualZoneId !== undefined && zone.id === actualZoneId) return false;
        return zone.descriptionEnglish?.trim().toLowerCase() === nameEnValue;
      });

      if (duplicateByNameEn) {
        toast.error(
          t("messages.duplicateZoneName", { name: duplicateByNameEn.descriptionEnglish || duplicateByNameEn.zoneNo, zone: zoneAlias })
        );
        return true;
      }
    }

    return false;
  };

  const resetForm = () => {
    setForm(INITIAL);
    setErrors({});
  };

  const handleBlur = (fieldName: keyof ZoneFormState) => {
    const fieldErrors = validate(form);
    setErrors((prev) => {
      const newErrors = { ...prev };
      const fieldErrorKey = fieldName as keyof ZoneFormErrors;
      
      // Update or clear the specific field error
      if (fieldErrors[fieldErrorKey]) {
        newErrors[fieldErrorKey] = fieldErrors[fieldErrorKey];
      } else {
        delete newErrors[fieldErrorKey];
      }
      
      return newErrors;
    });
  };

  const handleSave = async (
    onSuccess: ((newZoneNo: string) => void) | undefined,
    onUpdate: ((updatedZone: ZoneItem) => void) | undefined,
    handleClose: () => void,
    refreshRouter: () => void
  ) => {
    const validationErrors = validate(form);
    setErrors(validationErrors);

    const currentZoneId = zoneId ? parseInt(zoneId, 10) : undefined;
    const isDuplicate = checkDuplicateZone(form.zoneNo, form.description, form.descriptionEnglish, currentZoneId);
    if (Object.keys(validationErrors).length > 0 || isDuplicate) return;

    setLoading(true);
    try {
      if (mode === "add") {
        const result = await createZoneAction(form);
        if (result.success) {
          toast.success(t("messages.createSuccess", { name: form.zoneNo, zone: zoneAlias }));
          const newZoneNo = form.zoneNo;
          resetForm();
          if (onSuccess) onSuccess(newZoneNo);
          handleClose();
          refreshRouter();
        } else {
          const errorMsg = result.error || "";
          if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
            setErrors({ zoneNo: t("messages.duplicateZoneNo", { zoneNo: form.zoneNo, zone: zoneAlias }) });
          } else {
            toast.error(errorMsg || t("messages.createError", { zone: zoneAlias }));
          }
        }
      } else {
        const result = await updateZoneAction(Number(zoneId), form);
        if (result.success) {
          const zoneName = form.description || form.zoneNo || "";
          toast.success(t("messages.updateSuccess", { name: zoneName, zone: zoneAlias }));

          const updatedZone: Partial<ZoneItem> & { id: number } = {
            id: Number(zoneId),
            ...form
          };

          onUpdate?.(updatedZone as ZoneItem);
          handleClose();
        } else {
          toast.error(result.error || t("messages.updateError", { zone: zoneAlias }));
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("messages.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    loading,
    setLoading,
    fetching,
    errors,
    setErrors,
    validate,
    checkDuplicateZone,
    resetForm,
    handleBlur,
    handleSave,
    INITIAL,
  };
}
