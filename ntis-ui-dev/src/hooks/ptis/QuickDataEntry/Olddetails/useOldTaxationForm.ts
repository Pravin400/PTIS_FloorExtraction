import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/components/common';
import { PropertyOldDetailsApiItem } from '@/types/OldDetails/property-old-details.types';
import { updatePropertyOldDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/old-taxation/action';
import {
  sanitizePlotArea,
  sanitizePropertyPartitionNo,
  sanitizeZoneName,
  sanitizeWardNo,
  sanitizeEgovNo,
  sanitizePlotNo,
  translateDevanagariDigits,
} from '@/lib/utils/input-sanitization';
import { isValidDecimalField } from '@/components/modules/property-tax/ptis/QuickDataEntry/old-details/OldTaxation/utils/inputValidation';

export function useOldTaxationForm(propertyOldDetails: PropertyOldDetailsApiItem | null) {
  const t = useTranslations('quickDataEntry');
  const { confirm } = useConfirm();
  const params = useParams();
  const propertyId = Number(params.propertyId);
  const locale = params.locale as string;

  const [formData, setFormData] = useState({
    oldZoneNo: propertyOldDetails?.oldZoneNo ?? '',
    oldWardNo: propertyOldDetails?.oldWardNo ?? '',
    oldPropertyNo: propertyOldDetails?.oldPropertyNo ?? '',
    oldPartitionNo: propertyOldDetails?.oldPartitionNo ?? '',
    oldEgovNo: propertyOldDetails?.oldEgovNo ?? '',
    oldPlotArea:
      propertyOldDetails?.oldPlotArea && propertyOldDetails.oldPlotArea !== 0
        ? propertyOldDetails.oldPlotArea.toString()
        : '',
    oldPlotNo: propertyOldDetails?.oldPlotNo ?? '',
    oldCarpetAreaSqFeet: propertyOldDetails?.oldCarpetAreaSqFeet ?? 0,
    oldConstructionArea:
      propertyOldDetails?.oldConstructionArea && propertyOldDetails.oldConstructionArea !== 0
        ? propertyOldDetails.oldConstructionArea.toString()
        : '',
    oldRV:
      propertyOldDetails?.oldRV && propertyOldDetails.oldRV !== 0
        ? propertyOldDetails.oldRV.toString()
        : '',
    oldALV:
      propertyOldDetails?.oldALV && propertyOldDetails.oldALV !== 0
        ? propertyOldDetails.oldALV.toString()
        : '',
    oldGeneralTax:
      propertyOldDetails?.oldGeneralTax && propertyOldDetails.oldGeneralTax !== 0
        ? propertyOldDetails.oldGeneralTax.toString()
        : '',
    oldTotalTax: propertyOldDetails?.oldTotalTax ?? 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isChanged =
    translateDevanagariDigits(formData.oldZoneNo) !==
      translateDevanagariDigits(propertyOldDetails?.oldZoneNo ?? '') ||
    translateDevanagariDigits(formData.oldWardNo) !==
      translateDevanagariDigits(propertyOldDetails?.oldWardNo ?? '') ||
    translateDevanagariDigits(formData.oldPropertyNo) !==
      translateDevanagariDigits(propertyOldDetails?.oldPropertyNo ?? '') ||
    translateDevanagariDigits(formData.oldPartitionNo) !==
      translateDevanagariDigits(propertyOldDetails?.oldPartitionNo ?? '') ||
    translateDevanagariDigits(formData.oldEgovNo) !==
      translateDevanagariDigits(propertyOldDetails?.oldEgovNo ?? '') ||
    translateDevanagariDigits(formData.oldPlotArea || '0') !==
      (propertyOldDetails?.oldPlotArea?.toString() ?? '0') ||
    translateDevanagariDigits(formData.oldPlotNo) !==
      translateDevanagariDigits(propertyOldDetails?.oldPlotNo ?? '') ||
    formData.oldCarpetAreaSqFeet !== (propertyOldDetails?.oldCarpetAreaSqFeet ?? 0) ||
    translateDevanagariDigits(formData.oldConstructionArea || '0') !==
      (propertyOldDetails?.oldConstructionArea?.toString() ?? '0') ||
    translateDevanagariDigits(formData.oldRV || '0') !==
      (propertyOldDetails?.oldRV?.toString() ?? '0') ||
    translateDevanagariDigits(formData.oldALV || '0') !==
      (propertyOldDetails?.oldALV?.toString() ?? '0') ||
    translateDevanagariDigits(formData.oldGeneralTax || '0') !==
      (propertyOldDetails?.oldGeneralTax?.toString() ?? '0') ||
    formData.oldTotalTax !== (propertyOldDetails?.oldTotalTax ?? 0);

  const isRequiredFieldsValid =
    formData.oldZoneNo.trim().length > 0 &&
    formData.oldWardNo.trim().length > 0 &&
    formData.oldPropertyNo.trim().length > 0 &&
    isValidDecimalField(translateDevanagariDigits(formData.oldPlotArea));
  /**
   * Helper to determine if an error should be shown for a specific field
   */
  const showError = useCallback(
    (_field: string, isValid: boolean) => {
      return attemptedSubmit && !isValid;
    },
    [attemptedSubmit]
  );

  const handleUpdate = () => {
    const isZoneValid = formData.oldZoneNo.trim().length > 0;
    const isWardValid = formData.oldWardNo.trim().length > 0;
    const isPropertyValid = formData.oldPropertyNo.trim().length > 0;
    const isPlotAreaValid = isValidDecimalField(translateDevanagariDigits(formData.oldPlotArea));

    setAttemptedSubmit(true);

    if (!isZoneValid || !isWardValid || !isPropertyValid || !isPlotAreaValid) {
      toast.error(t('oldDetails.validation.fillRequiredFields'));
      return;
    }

    confirm({
      title: t('property.updateConfirmTitle'),
      description: t('property.updateConfirmText'),
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const payload = {
            propertyId,
            oldZoneNo: formData.oldZoneNo,
            oldWardNo: formData.oldWardNo,
            oldPropertyNo: formData.oldPropertyNo,
            oldPartitionNo: formData.oldPartitionNo,
            oldEgovNo: formData.oldEgovNo,
            oldPlotArea: Number(translateDevanagariDigits(formData.oldPlotArea)) || 0,
            oldPlotNo: formData.oldPlotNo,
            oldConstructionArea:
              Number(translateDevanagariDigits(formData.oldConstructionArea)) || 0,
            oldRV: Number(translateDevanagariDigits(formData.oldRV)) || 0,
            oldALV: Number(translateDevanagariDigits(formData.oldALV)) || 0,
            oldGeneralTax: Number(translateDevanagariDigits(formData.oldGeneralTax)) || 0,
            oldTotalTax: formData.oldTotalTax,
            oldCSN: propertyOldDetails?.oldCSN ?? null,
          };
          const result = await updatePropertyOldDetailsAction(propertyId, payload, locale);
          if (result.success) {
            toast.success(t('oldDetails.oldTaxation.updateSuccess'));
          } else {
            toast.error(result.error || t('oldDetails.oldTaxation.updateError'));
          }
        } catch (_error) {
          toast.error(t('oldDetails.oldTaxation.updateError'));
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleInputChange = (key: keyof typeof formData, value: string | number) => {
    let sanitizedValue = value;

    // Apply sanitization based on field type
    if (typeof value === 'string') {
      let tempValue = value;
      // Strip leading zeros for numeric/area/tax fields (supporting Devanagari zero and digits)
      if (
        ['oldPlotArea', 'oldConstructionArea', 'oldRV', 'oldALV', 'oldGeneralTax'].includes(key)
      ) {
        tempValue = value.replace(/^[0०]+(?=[0-9०-९])/, '');
      }

      if (key === 'oldPlotArea') {
        sanitizedValue = sanitizePlotArea(tempValue);
      } else if (key === 'oldPropertyNo' || key === 'oldPartitionNo') {
        sanitizedValue = sanitizePropertyPartitionNo(tempValue);
      } else if (key === 'oldZoneNo') {
        sanitizedValue = sanitizeZoneName(tempValue);
      } else if (key === 'oldWardNo') {
        sanitizedValue = sanitizeWardNo(tempValue);
      } else if (key === 'oldEgovNo') {
        sanitizedValue = sanitizeEgovNo(tempValue);
      } else if (key === 'oldPlotNo') {
        sanitizedValue = sanitizePlotNo(tempValue);
      } else if (
        key === 'oldConstructionArea' ||
        key === 'oldRV' ||
        key === 'oldALV' ||
        key === 'oldGeneralTax'
      ) {
        sanitizedValue = sanitizePlotArea(tempValue);
      }
    }
    setFormData((prev) => ({ ...prev, [key]: sanitizedValue }));
  };

  return {
    formData,
    isSubmitting,
    attemptedSubmit,
    showError,
    handleUpdate,
    handleInputChange,
    isChanged,
    isRequiredFieldsValid,
    t,
  };
}
