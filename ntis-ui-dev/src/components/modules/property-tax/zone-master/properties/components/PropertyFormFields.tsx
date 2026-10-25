"use client";

import { Input, ValidationMessage } from "@/components/common";
import { SearchSelect } from "@/components/common/SearchSelect";
import { CreatePropertyFormData, CreatePropertyFormErrors } from "@/types/zone-master/properties/create-property-drawer.types";
import { WardItem } from "@/types/wardMaster.types";
import { Option } from "@/components/common";
import { useTranslations } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface PropertyFormFieldsProps {
  selectedWard: WardItem | null;
  formData: CreatePropertyFormData;
  errors: CreatePropertyFormErrors;
  propertyTypeOptions: Option[];
  categoryOptions: Option[];
  taxZoneOptions: Option[];
  handleFieldChange: (field: keyof CreatePropertyFormData, value: string | boolean) => void;
  t: ReturnType<typeof useTranslations<"zoneMaster">>;
  wardAlias?: string;
}

export function PropertyFormFields({
  selectedWard,
  formData,
  errors,
  propertyTypeOptions,
  categoryOptions,
  taxZoneOptions,
  handleFieldChange,
  t,
  wardAlias,
}: PropertyFormFieldsProps) {
  const resolvedWardAlias = useAliasLabel("Ward", wardAlias ?? t("defaults.ward"));
  const categoryAlias = useAliasLabel("Category", t("defaults.category"));
  const taxZoneAlias = useAliasLabel(
    "Tax_Zone",
    useAliasLabel("Tax Zone", t("defaults.taxZone"))
  );

  return (
    <>
      {/* Ward (Read-only) */}
      <div>
        <Input
          label={t("createProperty.ward", { ward: resolvedWardAlias })}
          value={selectedWard ? `${selectedWard.wardNo}${selectedWard.description ? ` - ${selectedWard.description}` : ""}` : ""}
          disabled
          className="bg-gray-50"
        />
      </div>

      {/* Property Type & Category Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SearchSelect
            label={t("createProperty.propertyType")}
            options={propertyTypeOptions}
            value={formData.propertyTypeId}
            onChange={(_, value) => handleFieldChange("propertyTypeId", value)}
            placeholder={t("createProperty.selectPropertyType")}
            required
          />
          <ValidationMessage
            message={errors.propertyTypeId}
            visible={!!errors.propertyTypeId}
            type="error"
          />
        </div>

        <div>
          <SearchSelect
            label={t("createProperty.category", { category: categoryAlias })}
            options={categoryOptions}
            value={formData.categoryId}
            onChange={(_, value) => handleFieldChange("categoryId", value)}
            placeholder={t("createProperty.selectCategory", { category: categoryAlias })}
            required
          />
          <ValidationMessage
            message={errors.categoryId}
            visible={!!errors.categoryId}
            type="error"
          />
        </div>
      </div>

      {/* Tax Zone ID */}
      <div>
        <SearchSelect
          label={t("createProperty.taxZoneId", { taxZone: taxZoneAlias })}
          options={taxZoneOptions}
          value={formData.taxZoneId}
          onChange={(_, value) => handleFieldChange("taxZoneId", value)}
          placeholder={t("createProperty.selectTaxZone", { taxZone: taxZoneAlias })}
          required
        />
        <ValidationMessage
          message={errors.taxZoneId}
          visible={!!errors.taxZoneId}
          type="error"
        />
      </div>

    </>
  );
}
