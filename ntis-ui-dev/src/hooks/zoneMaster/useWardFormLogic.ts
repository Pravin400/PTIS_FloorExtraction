import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getWardByIdAction, updateWardAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { WardItem } from "@/types/wardMaster.types";
import { WardFormState, WardFormErrors } from "@/components/modules/property-tax/zone-master/wards/WardFormFields";
import { ZONE_WARD_NO_MAX_LENGTH, ZONE_WARD_NAME_MAX_LENGTH } from "@/components/modules/property-tax/zone-master/constants";
import { POSITIVE_INTEGER_REGEX } from "@/lib/utils/validation-rules";

interface UseWardFormLogicProps {
  open: boolean;
  wardId: string;
  wards: WardItem[];
  initialData?: WardItem | null;
  onClose: () => void;
  onSuccess?: () => void;
  wardAlias?: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function useWardFormLogic({
  open,
  wardId,
  wards,
  initialData,
  onClose,
  onSuccess,
  wardAlias,
  t,
}: UseWardFormLogicProps) {
  const [form, setForm] = useState<WardFormState>({
    wardNo: "",
    description: "",
    sequenceNo: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState<WardFormErrors>({});
  const [originalData, setOriginalData] = useState<Partial<WardItem> | null>(null);
  const prevWardIdRef = useRef<string | null>(null);

  // Use SSR data if available, otherwise fetch from API
  useEffect(() => {
    if (!open || !wardId) {
      // Reset ward ID reference when dialog closes
      if (!open) {
        prevWardIdRef.current = null;
      }
      return;
    }

    // Skip if we've already loaded this ward
    if (prevWardIdRef.current === wardId) return;

    // Mark as loaded before making any state changes
    prevWardIdRef.current = wardId;

    // If SSR data is available and matches the wardId, use it directly
    if (initialData && String(initialData.id) === String(wardId)) {
      // Use a single batch update
      Promise.resolve().then(() => {
        setOriginalData(initialData);
        setForm({
          wardNo: initialData.wardNo,
          description: initialData.description || "",
          sequenceNo: initialData.sequenceNo?.toString() || "",
          isActive: initialData.isActive ?? true,
        });
      });
      return;
    }

    // Fallback: check if ward exists in wards array
    const wardFromList = wards.find(w => String(w.id) === String(wardId));
    if (wardFromList) {
      Promise.resolve().then(() => {
        setOriginalData(wardFromList);
        setForm({
          wardNo: wardFromList.wardNo,
          description: wardFromList.description || "",
          sequenceNo: wardFromList.sequenceNo?.toString() || "",
          isActive: wardFromList.isActive ?? true,
        });
      });
      return;
    }

    // Last resort: fetch from API (should rarely happen with proper SSR)
    const fetchWard = async () => {
      setFetching(true);
      try {
        const res = await getWardByIdAction(wardId);
        if (res.success && res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = res.data as any;
          const ward: WardItem | null =
            (raw && (raw.wardNo || raw.WardNo || raw.id))
              ? {
                  id: raw.id ?? raw.Id ?? 0,
                  wardNo: raw.wardNo,
                  zoneId: raw.zoneId ?? 0,
                  description: raw.description ?? null,
                  sequenceNo: raw.sequenceNo ?? null,
                  isActive: typeof raw.isActive === "boolean" ? raw.isActive : true,
                  createdDate: raw.createdDate ?? "",
                  updatedDate: raw.updatedDate ?? null,
                }
              : (raw?.data ?? null);

          if (ward) {
            setOriginalData(ward);
            setForm({
              wardNo: ward.wardNo,
              description: ward.description || "",
              sequenceNo: ward.sequenceNo?.toString() || "",
              isActive: ward.isActive ?? true,
            });
          } else {
            toast.info(t("wardForm.loadError", { ward: wardAlias }));
            onClose();
          }
        } else {
          toast.info(res.error || t("wardForm.loadError", { ward: wardAlias }));
          onClose();
        }
      } catch (error) {
        toast.info(error instanceof Error ? error.message : t("wardForm.loadError", { ward: wardAlias }));
        onClose();
      } finally {
        setFetching(false);
      }
    };

    const runFetch = async () => {
      await fetchWard();
    };
    runFetch();
  }, [open, wardId, initialData, wards, onClose, wardAlias, t]);

  const validate = (data: WardFormState) => {
    const newErrors: WardFormErrors = {};
    if (!data.wardNo?.trim()) newErrors.wardNo = t("validation.wardNoRequired", { ward: wardAlias });
    else if (data.wardNo.length > ZONE_WARD_NO_MAX_LENGTH) newErrors.wardNo = t("validation.wardNoMaxLength", { count: ZONE_WARD_NO_MAX_LENGTH, ward: wardAlias });
    if (!data.description?.trim()) newErrors.description = t("validation.wardNameRequired", { ward: wardAlias });
    else if (data.description.length > ZONE_WARD_NAME_MAX_LENGTH) newErrors.description = t("validation.wardNameMaxLength", { count: ZONE_WARD_NAME_MAX_LENGTH, ward: wardAlias });
    
    if (!data.sequenceNo) {
      newErrors.sequenceNo = t("validation.sequenceNoRequired");
    } else if (!POSITIVE_INTEGER_REGEX.test(data.sequenceNo.toString())) {
      newErrors.sequenceNo = t("validation.sequenceNoNumber");
    } else {
      const seqNum = parseInt(data.sequenceNo, 10);
      if (seqNum < 1 || seqNum > 999) {
        newErrors.sequenceNo = t("validation.sequenceNoRange");
      }
    }
    return newErrors;
  };

  const checkDuplicateWard = (wardNo: string, sequenceNo: string): boolean => {
    const currentWardId = originalData?.id;
    const wardNoValue = wardNo.trim().toUpperCase();
    const seqValue = sequenceNo ? parseInt(sequenceNo, 10) : null;

    const duplicateByNo = wards.find((ward) => {
      return ward.id !== currentWardId && ward.wardNo?.trim().toUpperCase() === wardNoValue;
    });

    if (duplicateByNo) {
      toast.error(
        t("messages.duplicateWardNo", { wardNo: duplicateByNo.wardNo, ward: wardAlias })
      );
      return true;
    }

    if (seqValue !== null) {
      const duplicateBySeq = wards.find((ward) => {
        return ward.id !== currentWardId && ward.sequenceNo === seqValue;
      });

      if (duplicateBySeq) {
        toast.error(
          t("messages.duplicateSequenceNo", { seqNo: seqValue, wardNo: duplicateBySeq.wardNo, ward: wardAlias })
        );
        return true;
      }
    }

    return false;
  };

  const handleSave = async (refreshRouter: () => void) => {
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const isDuplicate = checkDuplicateWard(form.wardNo, form.sequenceNo);
    if (isDuplicate) return;

    setLoading(true);
    try {
      const result = await updateWardAction(Number(wardId), {
        ...originalData,
        ...form,
        sequenceNo: Number(form.sequenceNo)
      });

      if (result.success) {
        toast.success(t("wardForm.updateSuccess", { wardNo: form.wardNo, ward: wardAlias }));
        onClose();
        refreshRouter();
        if (onSuccess) onSuccess();
      } else {
        const errorMsg = result.error || "";
        let handled = false;
        
        if (errorMsg.includes('"errors":')) {
          try {
            const parsed = JSON.parse(errorMsg);
            if (parsed.errors) {
              const serverErrors: WardFormErrors = {};
              
              if (parsed.errors.Description) {
                const descErr = parsed.errors.Description[0];
                serverErrors.description = descErr.includes("MaxLen") ? t("validation.wardNameMaxLength", { count: ZONE_WARD_NAME_MAX_LENGTH, ward: wardAlias }) : descErr;
                handled = true;
              }
              
              if (parsed.errors.WardNo) {
                const noErr = parsed.errors.WardNo[0];
                serverErrors.wardNo = noErr.includes("MaxLen") ? t("validation.wardNoMaxLength", { count: ZONE_WARD_NO_MAX_LENGTH, ward: wardAlias }) : noErr;
                handled = true;
              }
              
              if (parsed.errors.SequenceNo) {
                serverErrors.sequenceNo = parsed.errors.SequenceNo[0];
                handled = true;
              }
              
              if (handled) {
                setErrors(serverErrors);
                toast.error(parsed.title || t("wardForm.updateError", { ward: wardAlias }));
              }
            }
          } catch (_e) {
            // Ignore parse errors
          }
        }
        
        if (!handled) {
          const lowerMsg = errorMsg.toLowerCase();
          if (lowerMsg.includes("name") || lowerMsg.includes("description") || lowerMsg.includes("maxlen")) {
            setErrors({ description: lowerMsg.includes("maxlen") ? t("validation.wardNameMaxLength", { count: ZONE_WARD_NAME_MAX_LENGTH, ward: wardAlias }) : t("messages.duplicateWardName", { name: form.description, ward: wardAlias }) });
          } else if (lowerMsg.includes("ward") || lowerMsg.includes("already exists") || lowerMsg.includes("duplicate")) {
            setErrors({ wardNo: t("messages.duplicateWardNo", { wardNo: form.wardNo, ward: wardAlias }) });
          } else {
            toast.error(errorMsg || t("wardForm.updateError", { ward: wardAlias }));
            setErrors({ wardNo: errorMsg || t("wardForm.updateError", { ward: wardAlias }) });
          }
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
    fetching,
    errors,
    setErrors,
    handleSave,
  };
}
