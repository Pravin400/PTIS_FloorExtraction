"use client";

import { Select, ValidationMessage } from "@/components/common";
import { Option } from "@/components/common";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export interface SelectedPropertyHeaderInfo {
  id?: number;
  propertyId?: number;
  propertyNo?: string;
}

interface PropertySelectionSectionProps {
  selectedProperty: SelectedPropertyHeaderInfo | null;
  propertyOptions: Option[];

  onPropertyChange: (
    e: React.ChangeEvent<HTMLSelectElement>,
    value: string
  ) => void;

  error?: string;

  t: (key: string, values?: Record<string, string | number | Date>) => string;

  isApartmentCategory: boolean;

  label?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  hidePropertyInfo?: boolean;
}

export function PropertySelectionSection({
  selectedProperty,
  propertyOptions,
  onPropertyChange,
  error,
  t,
  isApartmentCategory,
  label,
  placeholder,
  disabled,
  value,
  hidePropertyInfo = false,
}: PropertySelectionSectionProps) {
  const categoryAlias = useAliasLabel("Category", t("defaults.category"));
  const propertyNoAlias = useAliasLabel(
    "Property_No",
    useAliasLabel("Property No.", useAliasLabel("Property No", t("defaults.propertyNo")))
  );

  // Use explicit value prop if provided, otherwise try to get from selectedProperty
  const selectValue = value ?? (selectedProperty ? String(selectedProperty.id ?? selectedProperty.propertyId ?? "") : "");

  return (
    <div className="space-y-2">
      <Select
        label={label || t("defaults.property")}
        options={propertyOptions}
        value={selectValue}
        onChange={onPropertyChange}
        placeholder={
          placeholder || t("partitionForm.placeholders.selectMainProperty")
        }
        selectSize="md"
        disabled={disabled}
        required
      />

      <ValidationMessage
        message={error}
        visible={!!error}
        type="error"
      />

      {selectedProperty && !hidePropertyInfo && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">
                {propertyNoAlias}:
              </span>

              <span className="ml-2 font-semibold text-blue-900">
                {selectedProperty.propertyNo}
              </span>
            </div>

            <div>
              <span className="text-gray-600">
                {t("createProperty.category", { category: categoryAlias })}:
              </span>

              <span className="ml-2 font-semibold text-blue-900">
                {isApartmentCategory
                  ? t("partitionForm.apartment")
                  : t("partitionForm.nonApartment.label")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}