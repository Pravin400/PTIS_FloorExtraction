import { useMemo } from 'react';
import type { UseSubType } from '@/types/typeOfUse.types';
import type { Validator } from '@/lib/utils/validation-helpers';
import { DESCRIPTION_REGEX, isAllZeros } from '@/lib/utils/validation-rules';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

// Translator function type
type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

interface UseSubTypeFormValidationProps {
  formData: UseSubType;
  allSubTypes: UseSubType[];
  isEdit: boolean;
  t: TranslatorFunction;
}

export function useSubTypeFormValidation({
  formData,
  allSubTypes,
  isEdit,
  t,
}: UseSubTypeFormValidationProps) {
  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));
  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));

  // Normalization helper
  const normalize = (v: string) => v.trim().toLowerCase();

  // Duplicate check helper
  const isDuplicateDescription = (desc: string): boolean => {
    const d = normalize(desc);
    if (!d) return false;
    return allSubTypes.some((s) => {
      if (isEdit && s.subTypeOfUseId === formData.subTypeOfUseId) return false;
      return normalize(s.description ?? '') === d;
    });
  };

  // Validation schema
  const validationSchema: Record<string, Validator> = useMemo(
    () => ({
      typeOfUseId: (value: unknown) => {
        const typeId = Number(value);
        if (!typeId) return t('messages.typeMissing');
        return undefined;
      },

      typeOfUseCategoryId: (value: unknown) => {
        const categoryId = Number(value);
        if (!categoryId) return t('messages.categoryRequired', { category: categoryLabel });
        return undefined;
      },

      description: (value: unknown) => {
        const desc = String(value ?? '').trim();

        if (!desc) return t('messages.subTypeNameRequired', { subTypeOfUse: subTypeOfUseLabel });
        if (isAllZeros(desc)) return t('messages.subTypeNameLabel', { subTypeOfUse: subTypeOfUseLabel }) + ' ' + t('messages.cannotBeAllZeros');
        if (desc.length > 80)
          return t('messages.subTypeNameLabel', { subTypeOfUse: subTypeOfUseLabel }) + ' ' + t('messages.maxLength', { count: 80 });
        if (!DESCRIPTION_REGEX.test(desc))
          return t('messages.subTypeNameLabel', { subTypeOfUse: subTypeOfUseLabel }) + ' ' + t('messages.allowedChars');
        if (isDuplicateDescription(desc)) return t('messages.duplicateSubTypeName', { subTypeOfUse: subTypeOfUseLabel });

        return undefined;
      },

      searchSequence: (value: unknown) => {
        const seq = Number(value);
        if (!Number.isFinite(seq) || seq < 0) {
          return t('messages.searchSequenceLabel') + ' ' + t('messages.sequenceNonNegative');
        }
        if (seq > 999) {
          return t('messages.searchSequenceLabel') + ' ' + t('messages.maxThreeDigits');
        }
        return undefined;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData.subTypeOfUseId, allSubTypes, isEdit, t]
  );

  return {
    validationSchema,
    isDuplicateDescription,
  };
}
