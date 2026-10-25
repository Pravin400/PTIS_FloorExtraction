 
import type { ApiResponse } from "@/types/common.types";
import type { AssetFieldDefinition } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-definition.service";

import type {
  ProcessedField,
  MergedFieldSection,
  FieldOptionSource,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { ProcessedField, MergedFieldSection, FieldOptionSource };

export const groupAndMergeFields = (fields: ProcessedField[]): MergedFieldSection[] => {
  const sections: MergedFieldSection[] = [];
  fields.forEach((field) => {
    const groupName = field.fieldGroup && field.fieldGroup.trim() ? field.fieldGroup.trim() : "General Specifications";
    let sec = sections.find((s) => s.title.toLowerCase() === groupName.toLowerCase());
    if (!sec) {
      sec = { title: groupName, fields: [] };
      sections.push(sec);
    }
    sec.fields.push(field);
  });
  return sections;
};


export const safeParseOptions = (options: string | number | FieldOptionSource[] | null | undefined): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map(opt => {
      if (typeof opt === "object" && opt !== null) {
        return String(opt.label || opt.value || opt.name || opt.text || opt.Name || opt.Value || JSON.stringify(opt));
      }
      return String(opt);
    }).filter(Boolean);
  }
  if (typeof options === "string") {
    const trimmed = options.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((opt: FieldOptionSource) => {
            if (typeof opt === "object" && opt !== null) {
              return String(opt.label || opt.value || opt.name || opt.text || opt.Name || opt.Value || JSON.stringify(opt));
            }
            return String(opt);
          }).filter(Boolean);
        }
      } catch {
      }
    }
    return trimmed.split(",").map(opt => opt.trim()).filter(Boolean);
  }
  return [];
};

export const processFieldDefinitions = (data: ApiResponse<AssetFieldDefinition[]>): ProcessedField[] => {
  if (!data.success || !data.data) {
    return [];
  }

  return data.data.map((field: AssetFieldDefinition) => {
    const rawFieldName =
      field.fieldName ||
      field.FieldName ||
      field.name ||
      field.Name ||
      "";
    const rawFieldCode = field.fieldCode || field.FieldCode;
    const rawFieldLabel =
      field.fieldLabel ||
      field.FieldLabel ||
      field.label ||
      field.Label ||
      field.displayName ||
      field.DisplayName ||
      rawFieldName;
    const rawFieldType =
      field.fieldType ||
      field.FieldType ||
      field.type ||
      field.Type ||
      "text";
    const rawFieldGroup =
      field.fieldGroup ||
      field.FieldGroup ||
      "General Specifications";
    const rawRequired = Boolean(
      field.isRequired ?? field.IsRequired ?? field.required ?? field.Required
    );
    const rawOptions =
      field.optionsJson ||
      field.OptionsJson ||
      field.options ||
      field.Options;

    return {
      id: Number(field.id || field.Id || 0),
      fieldName: rawFieldName,
      fieldCode: rawFieldCode,
      fieldLabel: rawFieldLabel,
      fieldType: rawFieldType,
      fieldGroup: rawFieldGroup,
      isRequired: rawRequired,
      options: safeParseOptions(rawOptions),
    };
  });
};
