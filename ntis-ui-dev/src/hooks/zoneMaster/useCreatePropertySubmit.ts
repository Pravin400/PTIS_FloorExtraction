import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { WardItem } from "@/types/wardMaster.types";
import { CreatePropertyFormData } from "@/types/zone-master/properties/create-property-drawer.types";
import { PropertyRangeCreatePayload } from "@/types/zone-master/properties/property-range.types";
import { createPropertyRangeAction } from "@/app/[locale]/property-tax/zone-master/property.actions";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface UseCreatePropertySubmitProps {
  formData: CreatePropertyFormData;
  selectedWard: WardItem | null;
  validateForm: () => boolean;
  resetForm: () => void;
  onSuccess: () => void;
  onClose: () => void;
  startTransition: React.TransitionStartFunction;
  t: ReturnType<typeof useTranslations<"zoneMaster">>;
}

export function useCreatePropertySubmit({
  formData,
  selectedWard,
  validateForm,
  resetForm,
  onSuccess,
  onClose,
  startTransition,
  t,
}: UseCreatePropertySubmitProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const taxZoneAlias = useAliasLabel(
    "Tax_Zone",
    useAliasLabel("Tax Zone", t("defaults.taxZone"))
  );

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !selectedWard) return;

    startTransition(async () => {
      try {
        // Build the payload for Range API
        const payload: PropertyRangeCreatePayload = {
          rangeFrom: formData.isBulkCreate ? formData.fromPropertyNo : formData.propertyNo,
          rangeTo: formData.isBulkCreate ? formData.toPropertyNo : formData.propertyNo,
          template: {
            propertyTypeId: parseInt(formData.propertyTypeId, 10),
            categoryId: parseInt(formData.categoryId, 10),
            taxZoneId: parseInt(formData.taxZoneId, 10),
            wardId: selectedWard.id,
            ownerName: formData.ownerName || undefined,
            ...(formData.societyName.trim()
              ? { societyName: formData.societyName.trim() }
              : {}),
            // createdBy will be set by server action from authenticated user
          },
          startSequenceNo: 0,
        };

        const result = await createPropertyRangeAction(locale, payload);

        if (result.success) {
          // Show success toast
          if (formData.isBulkCreate) {
            const count = parseInt(formData.toPropertyNo, 10) - parseInt(formData.fromPropertyNo, 10) + 1;
            toast.success(
              t("createProperty.success.bulkPropertiesCreated", {
                from: formData.fromPropertyNo,
                to: formData.toPropertyNo,
                count,
              })
            );
          } else {
            toast.success(
              t("createProperty.success.singlePropertyCreated", {
                propertyNo: formData.propertyNo,
              })
            );
          }

          resetForm();
          onSuccess();
          onClose();
        } else {
          // Handle API validation errors
          if (result.error) {
            const errorMsg = result.error;
            if (errorMsg.includes('TaxZoneId')) {
              toast.error(t("createProperty.errors.taxZoneRequired", { taxZone: taxZoneAlias }));
            } else {
              toast.error(errorMsg);
            }
          } else {
            toast.error(t("createProperty.errors.createFailed"));
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '';
        if (errorMsg.includes('TaxZoneId')) {
          toast.error(t("createProperty.errors.taxZoneRequired", { taxZone: taxZoneAlias }));
        } else {
          toast.error(t("createProperty.errors.createFailed"));
        }
      }
    });
  }, [formData, selectedWard, validateForm, resetForm, onSuccess, onClose, startTransition, t, locale, taxZoneAlias]);

  const handleClose = useCallback(() => {
    resetForm();
    
    // Remove createProperty param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("createProperty");
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  }, [router, pathname, searchParams, resetForm, onClose]);

  return {
    handleSubmit,
    handleClose,
  };
}
