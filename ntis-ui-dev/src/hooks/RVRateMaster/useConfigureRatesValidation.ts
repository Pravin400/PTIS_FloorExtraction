import { useCallback } from "react";
import { CODE_REGEX, TEXT_ALLOWED } from "@/lib/utils/validation-rules";
import { normalize, sanitizeCode, sanitizeText } from "@/lib/utils/sanitization";
import type { UseGroup } from "@/types/typeOfUse.types";

interface GroupFormState {
  code: string;
  name: string;
  icon: string;
  errors: {
    code?: string;
    name?: string;
  };
  isSaved: boolean;
  isSaving: boolean;
  selectedExistingGroupId?: string;
  isMappingExisting: boolean;
}

const isAllZeros = (str: string) => /^[0]+$/.test(str);

interface UseConfigureRatesValidationProps {
  existingGroups: UseGroup[];
  setGroupForms: React.Dispatch<React.SetStateAction<Record<number, GroupFormState>>>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function useConfigureRatesValidation({
  existingGroups,
  setGroupForms,
  t,
}: UseConfigureRatesValidationProps) {

  const handleFieldChange = useCallback((id: number, field: 'code' | 'name' | 'icon', val: string) => {
    setGroupForms(prev => {
      const form = prev[id];
      if (!form) return prev;

      let cleanedVal = val;
      if (field === 'code') {
        cleanedVal = sanitizeCode(val, 10);
      } else if (field === 'name') {
        cleanedVal = sanitizeText(val, 50);
      }

      const updatedForm = {
        ...form,
        [field === 'code' ? 'code' : field === 'name' ? 'name' : 'icon']: cleanedVal,
        isSaved: false
      };

      const errors: { code?: string; name?: string } = {};
      if (field === 'code' || form.code) {
        const codeVal = field === 'code' ? cleanedVal : form.code;
        const codeTrimmed = codeVal.trim();
        if (!codeTrimmed) {
          errors.code = t("configureRates.validation.codeRequired");
        } else if (isAllZeros(codeTrimmed)) {
          errors.code = t("configureRates.validation.codeAllZeros");
        } else if (codeTrimmed.length > 10) {
          errors.code = t("configureRates.validation.codeTooLong");
        } else if (!CODE_REGEX.test(codeTrimmed)) {
          errors.code = t("configureRates.validation.codeAlphanumericOnly");
        } else {
          const normalized = normalize(codeTrimmed);
          const isDup = existingGroups.some(g => normalize(g.typeOfUseGroupCode || '') === normalized);
          if (isDup) {
            errors.code = t("configureRates.validation.codeExists");
          }
        }
      }

      if (field === 'name' || form.name) {
        const nameVal = field === 'name' ? cleanedVal : form.name;
        const nameTrimmed = nameVal.trim();
        if (!nameTrimmed) {
          errors.name = t("configureRates.validation.nameRequired");
        } else if (isAllZeros(nameTrimmed)) {
          errors.name = t("configureRates.validation.nameAllZeros");
        } else if (nameTrimmed.length > 50) {
          errors.name = t("configureRates.validation.nameTooLong");
        } else if (!TEXT_ALLOWED.test(nameTrimmed)) {
          errors.name = t("configureRates.validation.nameInvalidChars");
        } else {
          const normalized = normalize(nameTrimmed);
          const isDup = existingGroups.some(g => normalize(g.groupName || '') === normalized);
          if (isDup) {
            errors.name = t("configureRates.validation.nameExists");
          }
        }
      }

      updatedForm.errors = errors;
      return { ...prev, [id]: updatedForm };
    });
  }, [existingGroups, setGroupForms, t]);

  return {
    handleFieldChange,
  };
}
