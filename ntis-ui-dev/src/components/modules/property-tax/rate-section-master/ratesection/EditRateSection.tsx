import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { toast } from "sonner";
import { ToggleSwitch } from "@/components/common";
import { updateRateSectionAction } from "@/app/[locale]/property-tax/rate-section-master/actions";
import { RateItem, RateSectionFormState, RateSectionFormErrors, EditRateSectionHookProps, EditRateSectionContentProps } from "@/types/rateSectionMaster.types";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { validateRateSectionForm, sanitizeRateSectionInput } from "./RateSectionForm";

export function useEditRateSection({ onClose, onUpdate, zoneId, initialData, rates }: EditRateSectionHookProps) {
  const t = useTranslations("rateSectionMaster");
  const rateSection = useAliasLabel(
    "Rate_Section",
    useAliasLabel("Rate_Section_Name", useAliasLabel("Rate Section", t("defaults.rateSection")))
  );
  const router = useRouter();
  const rate = initialData || rates.find((r: RateItem) => String(r.id) === String(zoneId));

  const [form, setForm] = useState<RateSectionFormState>(() => rate ? {
    zoneCode: "", zoneEnglish: "", zoneRegional: rate.description || "",
    description: rate.description || "", wards: [], isActive: Boolean(rate.isActive),
  } : { zoneCode: "", zoneEnglish: "", zoneRegional: "", description: "", wards: [], isActive: true });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RateSectionFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const prevRateRef = useRef(rate);

  useEffect(() => {
    // Only update if rate has actually changed to prevent cascading renders
    if (rate && rate !== prevRateRef.current) {
      prevRateRef.current = rate;
      setForm(p => ({ ...p, zoneCode: "", zoneRegional: rate.description || "",
        description: rate.description || "", isActive: Boolean(rate.isActive) }));
    }
  }, [rate]);

  // Use shared validation from RateSectionForm
  const validate = useCallback((data: RateSectionFormState): RateSectionFormErrors => {
    return validateRateSectionForm(data, t, rateSection);
  }, [t, rateSection]);

  const showError = (field: keyof RateSectionFormErrors): boolean => (submittedOnce || touched[field]) && !!errors[field];

  // Use shared sanitization from RateSectionForm
  const handleChange = (name: string, value: string): void => {
    const sanitizedValue = sanitizeRateSectionInput(name, value);
    setForm((p) => ({ ...p, [name]: sanitizedValue }));
  };

  const handleBlur = (name: string): void => {
    setTouched((p) => ({ ...p, [name]: true }));
    const fieldErrors = validate(form);
    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof RateSectionFormErrors;
      if (fieldErrors[fieldName]) newErrors[fieldName] = fieldErrors[fieldName];
      else delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else router.back();
  }, [onClose, router]);

  const handleSave = async () => {
    if (!rate) return;
    setSubmittedOnce(true);
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    const trimmedName = form.zoneRegional.trim();
    try {
      const result = await updateRateSectionAction(rate.id!, {
        description: trimmedName, isActive: form.isActive ?? false
      });
      if (result.success) {
        toast.success(t('messages.updateSuccess', { name: trimmedName, rateSection }));
        handleClose();
        router.refresh();
        if (onUpdate) onUpdate({ ...rate, description: trimmedName, isActive: form.isActive } as RateItem);
      } else toast.error(result.error || t('messages.updateError', { rateSection }));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (): Promise<void> => {
    if (!rate || loading) return;
    
    const newStatus = !form.isActive;
    const trimmedName = form.zoneRegional.trim();

    setLoading(true);
    try {
      const result = await updateRateSectionAction(rate.id!, {
        description: trimmedName,
        isActive: newStatus
      });
      
      if (result.success) {
        setForm((p) => ({ ...p, isActive: newStatus }));
        toast.success(t('messages.updateSuccess', { name: `${form.zoneCode ? `${form.zoneCode} - ` : ''}${trimmedName}`, rateSection }));
        router.refresh();
        if (onUpdate) {
          onUpdate({ ...rate, description: trimmedName, isActive: newStatus } as RateItem);
        }
      } else {
        const errorMsg = result.message || result.error || t('messages.updateError', { rateSection });
        toast.error(errorMsg);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMsg = err.message || t('messages.updateError', { rateSection });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, errors, showError, handleChange, handleBlur, handleClose, handleSave, handleToggleStatus };
}

export function EditRateSectionContent({ form, handleToggleStatus }: EditRateSectionContentProps) {
  const t = useTranslations("rateSectionMaster");
  const rateSection = useAliasLabel(
    "Rate_Section",
    useAliasLabel("Rate_Section_Name", useAliasLabel("Rate Section", t("defaults.rateSection")))
  );
  const isActiveStatus = Boolean(form.isActive);

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
      <div className={cn("rounded-xl p-2 flex items-center justify-between transition-colors",
        isActiveStatus ? "border border-blue-200 bg-[#F0F6FF]" : "border border-gray-200 bg-gray-50")}>
        <div className="flex items-center gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-full",
            isActiveStatus ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500")}>
            {isActiveStatus ? <CheckCircle2 size={18} /> : <X size={18} />}
          </div>
          <div>
            <div className={cn("font-medium", isActiveStatus ? "text-[#1E3A8A]" : "text-gray-700")}>
              {t('form.activeStatus')}
            </div>
            <div className={cn("text-sm", isActiveStatus ? "text-gray-500" : "text-gray-400")}>
              {isActiveStatus ? t('form.activeStatusText', { rateSection }) : t('form.inactiveStatusText', { rateSection })}
            </div>
          </div>
        </div>
        <ToggleSwitch checked={isActiveStatus} onChange={handleToggleStatus} showPopup={false} />
      </div>
    </div>
  );
}
