import { ReactNode } from "react";
import { Column } from "@/components/common/MasterTable";
import { PropertyPreviewRow, BulkUpdateFieldConfig, SelectOption } from "@/types/common-details-update/common-details-update.types";
import { TruncatedText } from "@/components/common/TruncatedText";

export const getPreviewColumns = (
  t: (key: string, values?: Record<string, string | number>) => string,
  fieldConfigs?: BulkUpdateFieldConfig[],
  optionsMap?: Record<string, SelectOption[]>,
  lookupMap?: Record<string, Record<string, string>>,
  propertyNoLabel?: string
): Column<PropertyPreviewRow>[] => {
  const base: Column<PropertyPreviewRow>[] = [
    {
      key: "propertyNo" as keyof PropertyPreviewRow,
      label: propertyNoLabel ? t("columns.propertyNo", { propertyNo: propertyNoLabel }) : (t("columns.propertyNo", { propertyNo: "Property No." }) || "Property No."),
      headerClassName: "p-2 text-[12px] whitespace-nowrap text-center",
      cellClassName: "whitespace-nowrap text-center",
      render: (_: unknown, row: PropertyPreviewRow) => {
        const ward = String(row.wardNo || "").trim();
        const prop = String(row.propertyNo || "").trim();
        const part = String(row.partitionNo || "").trim();

        const parts: string[] = [];
        if (ward) parts.push(ward);
        if (prop) parts.push(prop);
        if (part && part !== "0") parts.push(part);

        return <TruncatedText text={parts.join("-")} maxLength={22} className="block truncate" />;
      }
    }
  ];

  if (fieldConfigs && fieldConfigs.length > 0) {
    const seenKeys = new Set<string>();

    fieldConfigs.forEach((config) => {
      // The API returns currentValues which we flatten, converting PascalCase keys to camelCase
      // Convert PascalCase fieldName to camelCase to match flattened keys
      const camelKey = config.fieldName.charAt(0).toLowerCase() + config.fieldName.slice(1);

      if (seenKeys.has(camelKey)) return;
      seenKeys.add(camelKey);

      base.push({
        key: camelKey as keyof PropertyPreviewRow,
        label: config.displayName,
        headerClassName: "p-2 text-[12px] whitespace-nowrap text-center",
        cellClassName: "whitespace-nowrap text-center",
        // Custom render to handle dynamic keys from flattened currentValues
        render: (
          _value: PropertyPreviewRow[keyof PropertyPreviewRow] | undefined,
          row: PropertyPreviewRow
        ): ReactNode => {
          const rawRow = row as Record<string, unknown>;
          let value = rawRow[camelKey] ?? rawRow[config.fieldName];

          if (value === null || value === undefined) {
            // Smart case-insensitive matching for misaligned API keys (e.g. CATEGORY vs CategoryId)
            const target = config.fieldName.toLowerCase().replace(/_/g, '');
            const targetId = target + 'id';

            const rowKeys = Object.keys(rawRow);
            for (const rk of rowKeys) {
              const rkLower = rk.toLowerCase().replace(/_/g, '');
              if (rkLower === target || rkLower === targetId || target === rkLower + 'id') {
                value = rawRow[rk];
                break;
              }
            }
          }

          // Map ID to label if it's a dropdown/select and we have lookup/options for it
          let displayValue = value === null || value === undefined || value === '' ? '-' : String(value);
          
          if (displayValue !== '-') {
            const strVal = String(value);
            // 1. Check cumulative lookup map first (immune to dropdown search clearing)
            if (lookupMap && config.fieldName in lookupMap && lookupMap[config.fieldName][strVal]) {
              displayValue = lookupMap[config.fieldName][strVal];
            } else if (optionsMap && config.fieldName in optionsMap) {
              const options = optionsMap[config.fieldName];
              const matchedOption = options.find(opt => String(opt.value) === strVal);
              if (matchedOption) {
                displayValue = matchedOption.label;
              }
            }
          }

          return <TruncatedText text={displayValue} maxLength={22} className="block truncate" />;
        },
      });
    });
  }

  return base;
};
