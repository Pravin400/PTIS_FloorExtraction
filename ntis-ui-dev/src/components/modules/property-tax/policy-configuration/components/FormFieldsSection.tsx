import { Input, TextArea, ValidationMessage, Select } from "@/components/common";
import type { PolicyConfigurationFormModel } from "@/types/policy-configuration.types";
import {
  BIT_OPTIONS,
  getPlaceholderForDataType,
  getInputTypeForDataType,
} from "@/lib/validations/policy-configuration-datatype";

interface FormFieldsSectionProps {
  formData: PolicyConfigurationFormModel;
  errors: Record<string, string>;
  showError: (field: keyof PolicyConfigurationFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>, value: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectBlur: (e: React.FocusEvent<HTMLSelectElement>) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  categoryLabel?: string;
  isEdit?: boolean;
}

const READONLY_INPUT_CLASS =
  "disabled:opacity-100 disabled:text-gray-700 disabled:font-normal disabled:bg-gray-100 disabled:cursor-not-allowed";

export function FormFieldsSection({
  formData,
  errors,
  showError,
  onChange,
  onSelectChange,
  onBlur,
  onSelectBlur,
  t,
  categoryLabel,
  isEdit,
}: FormFieldsSectionProps) {
  const category = categoryLabel || t("aliasFallback.category");
  const readonlyInputClass = isEdit ? READONLY_INPUT_CLASS : undefined;

  const valuePlaceholder = formData.dataType
    ? getPlaceholderForDataType(formData.dataType)
    : t("form.fields.policyValue.placeholder");
  const defaultValuePlaceholder = formData.dataType
    ? getPlaceholderForDataType(formData.dataType)
    : t("form.fields.defaultValue.placeholder");
  const inputType = getInputTypeForDataType(formData.dataType);

  // BIT type check
  const isBitType = formData.dataType?.toUpperCase() === "BIT";

  const allowedOptions: { label: string; value: string }[] | null = (() => {
    if (formData.allowedValues && formData.allowedValues.trim()) {
      return formData.allowedValues
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => ({ label: v, value: v }));
    }
    if (isBitType) {
      return [...BIT_OPTIONS];
    }
    return null;
  })();

  // Dropdown dikhao agar allowedOptions available hai
  const useDropdown = allowedOptions !== null && allowedOptions.length > 0;
  const dropdownPlaceholder = isBitType ? "Select Enable or Disable" : "Select a value";

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">

      {/* Row 1: Policy Code + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            name="policyCode"
            label={t("form.fields.policyCode.label")}
            required
            value={formData.policyCode}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.policyCode.placeholder")}
            fullWidth
            disabled={isEdit}
            className={readonlyInputClass}
          />
          <ValidationMessage message={errors.policyCode} visible={showError("policyCode")} />
        </div>
        <div>
          <Input
            name="category"
            label={t("form.fields.category.label", { category })}
            required
            value={formData.category}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.category.placeholder")}
            fullWidth
            disabled={isEdit}
            className={readonlyInputClass}
          />
          <ValidationMessage message={errors.category} visible={showError("category")} />
        </div>
      </div>

      {/* Row 2: Display Name */}
      <div>
        <Input
          name="displayName"
          label={t("form.fields.displayName.label")}
          required
          value={formData.displayName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.displayName.placeholder")}
          fullWidth
          disabled={isEdit}
          className={readonlyInputClass}
        />
        <ValidationMessage message={errors.displayName} visible={showError("displayName")} />
      </div>

      {/* Row 3: Description */}
      <div>
        <TextArea
          name="description"
          label={t("form.fields.description.label")}
          required
          value={formData.description}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.description.placeholder")}
          rows={3}
          error={showError("description")}
          errorMessage={errors.description}
          disabled={isEdit}
          className={readonlyInputClass}
        />
      </div>

      {/* Row 4: Policy Value + Default Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {useDropdown ? (
             <div className="[&_ul[role='listbox']]:!top-full [&_ul[role='listbox']]:!bottom-auto [&_ul[role='listbox']]:!mt-1 [&_ul[role='listbox']]:!mb-0">
            <Select
              name="policyValue"
              label={t("form.fields.policyValue.label")}
              required
              options={allowedOptions!}
              value={formData.policyValue}
              onChange={onSelectChange}
              onBlur={onSelectBlur}
              placeholder={dropdownPlaceholder}
              error={showError("policyValue") ? errors.policyValue : undefined}
            />
              </div>
          ) : (
            <Input
              name="policyValue"
              label={t("form.fields.policyValue.label")}
              required
              type={inputType}
              value={formData.policyValue}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={valuePlaceholder}
              fullWidth
            />
          )}
          <ValidationMessage message={errors.policyValue} visible={showError("policyValue")} />
        </div>

        <div>
          {useDropdown && !isEdit ? (
             <div className="[&_ul[role='listbox']]:!top-full [&_ul[role='listbox']]:!bottom-auto [&_ul[role='listbox']]:!mt-1 [&_ul[role='listbox']]:!mb-0">
            <Select
              name="defaultValue"
              label={t("form.fields.defaultValue.label")}
              required
              options={allowedOptions!}
              value={formData.defaultValue}
              onChange={onSelectChange}
              onBlur={onSelectBlur}
              placeholder={dropdownPlaceholder}
              error={showError("defaultValue") ? errors.defaultValue : undefined}
              disabled={isEdit}
              className={readonlyInputClass}
            />
              </div>
          ) : (
            <Input
              name="defaultValue"
              label={t("form.fields.defaultValue.label")}
              required
              type={inputType}
              value={formData.defaultValue}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={defaultValuePlaceholder}
              fullWidth
              disabled={isEdit}
              className={readonlyInputClass}
            />
          )}
          <ValidationMessage message={errors.defaultValue} visible={showError("defaultValue")} />
        </div>
      </div>

      {/* Row 5: Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            name="unit"
            label={t("form.fields.unit.label")}
            value={formData.unit}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.unit.placeholder")}
            fullWidth
          />
        </div>
      </div>
 </div>
  );
}
