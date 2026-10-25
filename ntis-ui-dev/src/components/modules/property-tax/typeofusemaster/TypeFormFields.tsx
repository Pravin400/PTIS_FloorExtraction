/**
 * TypeFormFields Component
 * 
 * Reusable form field components for UseType forms
 * Includes type selector, group selector, and input fields
 */

import { useMemo } from 'react';
import type { UseGroup, TypeOfUseCategory, TranslatorFunction } from '@/types/typeOfUse.types';
import { Input } from '@/components/common/Input';
import { SearchSelect } from '@/components/common/SearchSelect';
import { ValidationMessage } from '@/components/common';
import { Label } from '@/components/common/label';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface TypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onClearError?: () => void;
  error?: string;
  showError?: boolean;
  t: TranslatorFunction;
}

export function TypeSelector({
  value,
  onChange,
  onClearError,
  error,
  showError,
  t,
}: TypeSelectorProps) {
  return (
    <div className="flex flex-col">
      <Label htmlFor="type-select" required>
        {t('type.fields.type')}
      </Label>
      <SearchSelect
        name="type-select"
        value={value}
        onChange={(_, val) => {
          onChange(val);
          onClearError?.();
        }}
        placeholder={t('type.selectType')}
        options={[
          { value: "R", label: t('type.options.residential') },
          { value: "C", label: t('type.options.commercial') },
          { value: "I", label: t('type.options.industrial') },
          { value: "N", label: t('type.options.nontaxable') },
        ]}
      />
      <ValidationMessage message={error} visible={showError ?? false} />
    </div>
  );
}

interface GroupSelectorProps {
  allGroups: UseGroup[];
  selectedGroupId: number;
  onChange: (groupId: number) => void;
  onClearError?: () => void;
  error?: string;
  showError?: boolean;
  t: TranslatorFunction;
}

export function GroupSelector({
  allGroups,
  selectedGroupId,
  onChange,
  onClearError,
  error,
  showError,
  t,
}: GroupSelectorProps) {
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  const filteredGroups = useMemo(() => {
    return allGroups.filter((g) => {
      const isTotalGroup =
        g.typeOfUseGroupCode === "TOTAL" ||
        g.typeOfUseGroupCode === "ALL" ||
        g.typeOfUseGroupId === 0 ||
        g.groupName?.toLowerCase() === "all groups";

      if (isTotalGroup) return false;

      return g.isActive === true && g.status !== "Inactive";
    });
  }, [allGroups]);

  return (
    <div className="flex flex-col">
      <Label htmlFor="use-type-group-select" required>
        {t('type.fields.useTypeGroup', { use: useLabel })}
      </Label>

      <SearchSelect
        name="use-type-group-select"
        value={selectedGroupId ? String(selectedGroupId) : ""}
        onChange={(_, val) => {
          onChange(Number(val) || 0);
          onClearError?.();
        }}
        placeholder={t('type.selectUseTypeGroup', { use: useLabel, typeOfUse: typeOfUseLabel })}
        options={filteredGroups.map((g) => ({
          value: String(g.typeOfUseGroupId),
          label: g.groupName || '',
        }))}
      />

      <ValidationMessage message={error} visible={showError ?? false} />
    </div>
  );
}

interface TypeCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showError?: boolean;
  t: TranslatorFunction;
}

export function TypeCodeInput({
  value,
  onChange,
  error,
  showError,
  t,
}: TypeCodeInputProps) {
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  return (
    <div className="flex flex-col">
      <Input
        label={t('type.fields.typeId', { typeOfUse: typeOfUseLabel })}
        name="typeOfUseCode"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('type.placeholders.typeId', { typeOfUse: typeOfUseLabel })}
        fullWidth
        required={true}
        className="rounded-xl px-4 py-2"
        maxLength={10}
      />
      <ValidationMessage message={error} visible={showError ?? false} />
    </div>
  );
}

interface SearchSequenceInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  showError?: boolean;
  t: TranslatorFunction;
}

export function SearchSequenceInput({
  value,
  onChange,
  error,
  showError,
  t,
}: SearchSequenceInputProps) {
  return (
    <div className="flex flex-col">
      <Input
        label={t('messages.searchSequenceLabel')}
        name="searchSequence"
        type="number"
        value={String(value ?? 0)}
        onChange={(e) => {
          const rawValue = e.target.value;
          if (rawValue === "") {
            onChange(0);
            return;
          }

          // Restrict to 3 digits maximum
          if (rawValue.length > 3) {
            return; // Don't update if more than 3 digits
          }

          const parsedValue = parseInt(rawValue, 10);
          if (Number.isNaN(parsedValue)) {
            return; // Don't update on invalid input
          }

          // Ensure value doesn't exceed 999
          if (parsedValue > 999) {
            onChange(999);
            return;
          }

          onChange(parsedValue);
        }}
        onKeyDown={(e) => {
          // Prevent typing numbers only when the resulting value would exceed 3 digits
          const currentValue = e.currentTarget.value;
          const isNumber = /^[0-9]$/.test(e.key);
          const selectionStart = e.currentTarget.selectionStart ?? currentValue.length;
          const selectionEnd = e.currentTarget.selectionEnd ?? currentValue.length;
          const selectedLength = selectionEnd - selectionStart;

          if (isNumber && currentValue.length - selectedLength + 1 > 3) {
            e.preventDefault();
          }
        }}
        placeholder="0"
        min={0}
        max={999}
        fullWidth
        className="rounded-xl px-4 py-2"
      />
      <ValidationMessage message={error} visible={showError ?? false} />
    </div>
  );
}

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showError?: boolean;
  t: TranslatorFunction;
}

export function DescriptionInput({
  value,
  onChange,
  error,
  showError,
  t,
}: DescriptionInputProps) {
  return (
    <div className="flex flex-col col-span-2">
      <Input
        label={t('type.fields.description')}
        name="description"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('type.placeholders.description')}
        fullWidth
        className="rounded-xl px-4 py-2"
        maxLength={80}
        required
      />
      <ValidationMessage message={error} visible={showError ?? false} />
    </div>
  );
}

interface CategorySelectorProps {
  allCategories: TypeOfUseCategory[];
  selectedCategoryId: number | null | undefined;
  onChange: (categoryId: number | null) => void;
  error?: string;
  showError?: boolean;
  t: TranslatorFunction;
}

export function CategorySelector({
  allCategories,
  selectedCategoryId,
  onChange,
  error,
  showError,
  t,
}: CategorySelectorProps) {
  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));

  return (
    <div className="flex flex-col">
      <Label htmlFor="category-select">
        {t('category.fields.categoryName', { category: categoryLabel })}
      </Label>
      <SearchSelect
        name="category-select"
        value={selectedCategoryId ? String(selectedCategoryId) : ""}
        onChange={(_, val) => {
          onChange(val ? Number(val) : null);
        }}
        placeholder={t('type.selectCategory', { category: categoryLabel })}
        options={[
          { value: "", label: t('type.selectCategory', { category: categoryLabel }) },
          ...allCategories.filter((c) => c.isActive === true).map((c) => ({
            value: String(c.id),
            label: `${c.typeOfUseCategoryCode} - ${c.typeOfUseCategoryName}`,
          })),
        ]}
      />
      <ValidationMessage message={error} visible={showError ?? false} />
    </div>
  );
}
