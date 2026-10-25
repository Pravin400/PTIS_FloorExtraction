/**
 * useTypeFormValidation Hook
 * 
 * Handles validation logic for UseType forms (create/edit)
 * Provides field validators and duplicate checking
 */

import { useMemo } from 'react';
import type { UseType } from '@/types/typeOfUse.types';
import type { Validator } from '@/lib/utils/validation-helpers';
import { CODE_REGEX, DESCRIPTION_REGEX, isAllZeros } from '@/lib/utils/validation-rules';
import { normalize } from '@/lib/utils/sanitization';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

interface UseTypeFormValidationProps {
  formData: UseType;
  typeValue: string;
  allTypes: UseType[];
  isEdit: boolean;
  t: TranslatorFunction;
}

export function useTypeFormValidation({
  formData,
  typeValue,
  allTypes,
  isEdit,
  t,
}: UseTypeFormValidationProps) {
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  
  // Duplicate check for type code
  const isDuplicateCode = (code: string): boolean => {
    const c = normalize(code);
    if (!c) return false;
    return allTypes.some((t) => {
      if (isEdit && t.typeOfUseId === formData.typeOfUseId) return false;
      return normalize(t.typeOfUseCode) === c;
    });
  };

  // Duplicate check for description
  const isDuplicateDescription = (desc: string): boolean => {
    const d = normalize(desc);
    if (!d) return false;
    return allTypes.some((t) => {
      if (isEdit && t.typeOfUseId === formData.typeOfUseId) return false;
      return normalize(t.description ?? '') === d;
    });
  };

  // Validation schema
  const validationSchema: Record<string, Validator> = useMemo(
    () => ({
      typeOfUseCode: (value: unknown) => {
        const code = String(value ?? '').trim();
        
        if (!code) return t('type.fields.typeId', { typeOfUse: typeOfUseLabel }) + ' ' + t('messages.createError');
        if (isAllZeros(code)) return t('type.fields.typeId', { typeOfUse: typeOfUseLabel }) + ' ' + t('messages.cannotBeAllZeros');
        if (code.length > 10) return t('type.fields.typeId', { typeOfUse: typeOfUseLabel }) + ' ' + t('messages.maxLength', { count: 10 });
        if (!CODE_REGEX.test(code)) return t('type.fields.typeId', { typeOfUse: typeOfUseLabel }) + ' ' + t('messages.onlyAlphanumeric');
        if (isDuplicateCode(code)) return t('messages.duplicateTypeId', { typeOfUse: typeOfUseLabel });
        
        return undefined;
      },
      
      type: (value: unknown) => {
        const type = String(value ?? '').trim();
        if (!type) return t('messages.typeRequired');
        return undefined;
      },
      
      typeOfUseGroupId: (value: unknown) => {
        const groupId = Number(value);
        if (!groupId) return t('messages.groupRequired', { typeOfUse: typeOfUseLabel });
        return undefined;
      },
      
      description: (value: unknown) => {
        const desc = String(value ?? '').trim();
        
        if (!desc) return t('messages.descriptionRequired');
        if (isAllZeros(desc)) return t('type.fields.description') + ' ' + t('messages.cannotBeAllZeros');
        if (desc.length > 80) return t('type.fields.description') + ' ' + t('messages.maxLength', { count: 80 });
        if (!DESCRIPTION_REGEX.test(desc)) return t('type.fields.description') + ' ' + t('messages.allowedChars');
        if (isDuplicateDescription(desc)) return t('messages.duplicateDescription');
        
        return undefined;
      },
      
      searchSequence: (value: unknown) => {
        const seq = Number(value);
        if (!Number.isFinite(seq) || seq < 0) {
          return t('type.fields.sequence') + ' ' + t('messages.sequenceNonNegative');
        }
        if (seq > 999) {
          return t('type.fields.sequence') + ' ' + t('messages.maxThreeDigits');
        }
        return undefined;
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, allTypes, formData.typeOfUseId, isEdit, typeValue]
  );

  return {
    validationSchema,
    isDuplicateCode,
    isDuplicateDescription,
  };
}
