/**
 * useCategoryFormValidation Hook
 * 
 * Handles validation logic for TypeOfUseCategory forms (create/edit)
 * Provides field validators and duplicate checking
 */

import { useMemo } from 'react';
import type { TypeOfUseCategory } from '@/types/typeOfUse.types';
import type { Validator } from '@/lib/utils/validation-helpers';
import { CODE_REGEX, TEXT_ALLOWED, isAllZeros } from '@/lib/utils/validation-rules';
import { normalize } from '@/lib/utils/sanitization';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

interface UseCategoryFormValidationProps {
  categoryId: number | null;
  allCategories: TypeOfUseCategory[];
  isEdit: boolean;
  t: TranslatorFunction;
}

export function useCategoryFormValidation({
  categoryId,
  allCategories,
  isEdit,
  t,
}: UseCategoryFormValidationProps) {
  const categoryLabel = useAliasLabel('Category', t('aliasFallback.category'));
  
  // Duplicate check for category code
  const isDuplicateCode = (code: string): boolean => {
    const c = normalize(code);
    if (!c) return false;
    return allCategories.some((cat) => {
      if (isEdit && cat.id === categoryId) return false;
      return normalize(cat.typeOfUseCategoryCode || '') === c;
    });
  };

  // Duplicate check for category name
  const isDuplicateCategoryName = (name: string): boolean => {
    const nm = normalize(name);
    if (!nm) return false;
    return allCategories.some((cat) => {
      if (isEdit && cat.id === categoryId) return false;
      return normalize(cat.typeOfUseCategoryName || '') === nm;
    });
  };

  // Validation schema
  const validationSchema: Record<string, Validator> = useMemo(
    () => ({
      code: (value: unknown) => {
        const code = String(value ?? '').trim();
        
        if (!code) return t('category.fields.categoryCode', { category: categoryLabel }) + ' ' + t('messages.createError');
        if (isAllZeros(code)) return t('category.fields.categoryCode', { category: categoryLabel }) + ' ' + t('messages.cannotBeAllZeros');
        if (code.length > 20) return t('category.fields.categoryCode', { category: categoryLabel }) + ' ' + t('messages.maxLength', { count: 20 });
        if (!CODE_REGEX.test(code)) return t('category.fields.categoryCode', { category: categoryLabel }) + ' ' + t('messages.onlyAlphanumeric');
        if (isDuplicateCode(code)) return t('category.messages.duplicateCode', { category: categoryLabel });
        
        return undefined;
      },
      
      name: (value: unknown) => {
        const name = String(value ?? '').trim();
        
        if (!name) return t('category.fields.categoryName', { category: categoryLabel }) + ' ' + t('messages.createError');
        if (isAllZeros(name)) return t('category.fields.categoryName', { category: categoryLabel }) + ' ' + t('messages.cannotBeAllZeros');
        if (name.length > 50) return t('category.fields.categoryName', { category: categoryLabel }) + ' ' + t('messages.maxLength', { count: 50 });
        if (!TEXT_ALLOWED.test(name)) return t('category.fields.categoryName', { category: categoryLabel }) + ' ' + t('messages.allowedChars');
        if (isDuplicateCategoryName(name)) return t('category.messages.duplicateName', { category: categoryLabel });
        
        return undefined;
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, allCategories, categoryId, isEdit, categoryLabel]
  );

  return {
    validationSchema,
    isDuplicateCode,
    isDuplicateCategoryName,
  };
}
