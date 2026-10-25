/**
 * useGroupFormValidation Hook
 * 
 * Handles validation logic for UseGroup forms (create/edit)
 * Provides field validators and duplicate checking
 */

import { useMemo } from 'react';
import type { UseGroup } from '@/types/typeOfUse.types';
import type { Validator } from '@/lib/utils/validation-helpers';
import { CODE_REGEX, TEXT_ALLOWED, isAllZeros } from '@/lib/utils/validation-rules';
import { normalize } from '@/lib/utils/sanitization';

type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

interface UseGroupFormValidationProps {
  formData: UseGroup;
  allGroups: UseGroup[];
  isEdit: boolean;
  t: TranslatorFunction;
}

export function useGroupFormValidation({
  formData,
  allGroups,
  isEdit,
  t,
}: UseGroupFormValidationProps) {
  
  // Duplicate check for group code
  const isDuplicateCode = (code: string): boolean => {
    const c = normalize(code);
    if (!c) return false;
    return allGroups.some((g) => {
      if (isEdit && g.typeOfUseGroupId === formData.typeOfUseGroupId) return false;
      return normalize(g.typeOfUseGroupCode || '') === c;
    });
  };

  // Duplicate check for group name
  const isDuplicateGroupName = (name: string): boolean => {
    const nm = normalize(name);
    if (!nm) return false;
    return allGroups.some((g) => {
      if (isEdit && g.typeOfUseGroupId === formData.typeOfUseGroupId) return false;
      return normalize(g.groupName || '') === nm;
    });
  };

  // Validation schema
  const validationSchema: Record<string, Validator> = useMemo(
    () => ({
      typeOfUseGroupCode: (value: unknown) => {
        const code = String(value ?? '').trim();
        
        if (!code) return t('group.fields.groupId') + ' ' + t('messages.createError');
        if (isAllZeros(code)) return t('group.fields.groupId') + ' ' + t('messages.cannotBeAllZeros');
        if (code.length > 10) return t('group.fields.groupId') + ' ' + t('messages.maxLength', { count: 10 });
        if (!CODE_REGEX.test(code)) return t('group.fields.groupId') + ' ' + t('messages.onlyAlphanumeric');
        if (isDuplicateCode(code)) return t('messages.duplicateGroupId');
        
        return undefined;
      },
      
      groupName: (value: unknown) => {
        const name = String(value ?? '').trim();
        
        if (!name) return t('group.fields.groupName') + ' ' + t('messages.createError');
        if (isAllZeros(name)) return t('group.fields.groupName') + ' ' + t('messages.cannotBeAllZeros');
        if (name.length > 50) return t('group.fields.groupName') + ' ' + t('messages.maxLength', { count: 50 });
        if (!TEXT_ALLOWED.test(name)) return t('group.fields.groupName') + ' ' + t('messages.allowedChars');
        if (isDuplicateGroupName(name)) return t('messages.duplicateGroupName');
        
        return undefined;
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, allGroups, formData.typeOfUseGroupId, isEdit]
  );

  return {
    validationSchema,
    isDuplicateCode,
    isDuplicateGroupName,
  };
}
