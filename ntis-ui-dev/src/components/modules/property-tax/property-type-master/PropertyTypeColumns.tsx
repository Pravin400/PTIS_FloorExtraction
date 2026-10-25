import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { PropertyType, PropertyTypeAndTypeOfUseValidation } from "@/types/property-type.types";
import type { PropertyTypeCategory } from "@/types/property-type-category.types";
import type { UseType } from "@/types/typeOfUse.types";
import { SortAscButton, SortDescButton, SortDefaultButton, BadgeListButton } from "@/components/common/ActionButtons";

/**
 * Renders a sortable column header with sort icon
 */
function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  /** Returns the localized verb phrase, e.g. "Sort ascending" / "Sort by" */
  tCommon: (key: string) => string;
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  const renderSortButton = () => {
    if (isAsc) {
      return (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`}
        />
      );
    }
    if (isDesc) {
      return (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`}
        />
      );
    }
    return (
      <SortDefaultButton
        onClick={() => onSort(columnKey)}
        aria-label={`${tCommon("table.sort.by")} ${label}`}
      />
    );
  };

  return (
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

/**
 * Returns the table column configuration for Property Type Master.
 *
 * @param t       - Translation function from useTranslations("propertyType.propertyType")
 * @param tCommon - Translation function from useTranslations("common"); must be passed
 *                  from a component/hook so that no hook is called inside this plain function.
 * @param sortBy  - Current sort column key
 * @param sortOrder - Current sort order ("asc" | "desc")
 * @param onSort  - Callback invoked when a column header is clicked
 * @param categories - Array of property type categories for display lookup
 * @param typeOfUseList - Array of UseType for display lookup
 * @param typeOfUseValidation - Array of PropertyType to TypeOfUse validation mappings
 * @param onTypeOfUseClick - Callback invoked when type of use badge is clicked
 * @returns Array of column definitions
 */
export function getPropertyTypeColumns(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  categories?: PropertyTypeCategory[],
  typeOfUseList?: UseType[],
  typeOfUseValidation?: PropertyTypeAndTypeOfUseValidation[],
  onTypeOfUseClick?: (row: PropertyType) => void,
  categoryLabel?: string,
  typeOfUseLabel?: string
): Column<PropertyType>[] {
  // Only descriptionEnglish, propertyDescription and type are sortable
  const sortableColumns = ["descriptionEnglish", "propertyDescription", "type"];

  const createSortableLabel = (label: string, key: string) => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={(k) => tCommon(k)}
        />
      );
    }
    return label;
  };

  // Create category lookup map
  const categoryMap = new Map<number, string>();
  if (categories) {
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat.propertyTypeCategory);
    });
  }

  // Create typeOfUse lookup map (typeOfUseId -> typeOfUseCode)
  const typeOfUseMap = new Map<number, string>();
  if (typeOfUseList) {
    typeOfUseList.forEach((tou) => {
      typeOfUseMap.set(tou.typeOfUseId, tou.typeOfUseCode);
    });
  }

  // Create propertyTypeId -> typeOfUseIds mapping
  const propertyTypeToTypeOfUseIds = new Map<number, number[]>();
  if (typeOfUseValidation) {
    typeOfUseValidation.forEach((v) => {
      if (!propertyTypeToTypeOfUseIds.has(v.propertyTypeId)) {
        propertyTypeToTypeOfUseIds.set(v.propertyTypeId, []);
      }
      propertyTypeToTypeOfUseIds.get(v.propertyTypeId)!.push(v.typeOfUseId);
    });
  }

  return [
    {
      key: "descriptionEnglish",
      label: createSortableLabel(t("list.table.descriptionEnglish"), "descriptionEnglish"),
      width: "16%",
      render: (value, row) => {
        if (typeof value === "string" && value.trim()) {
          return value;
        }
        if (typeof row?.propertyDescriptionEnglish === "string" && row.propertyDescriptionEnglish.trim()) {
          return row.propertyDescriptionEnglish;
        }
        return value ? String(value) : "-";
      },
    },
    {
      key: "propertyDescription",
      label: createSortableLabel(t("list.table.propertyDescription"), "propertyDescription"),
      width: "16%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "type",
      label: createSortableLabel(t("list.table.type"), "type"),
      width: "10%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "propertyTypeCategoryId",
      label: createSortableLabel(t("list.table.category", { category: categoryLabel ?? t("aliasFallback.category") }), "propertyTypeCategoryId"),
      width: "14%",
      render: (value) => {
        if (value === null || value === undefined) return "-";
        const categoryId = typeof value === "number" ? value : Number(value);
        return categoryMap.get(categoryId) || "-";
      },
    },
    {
      key: "searchSequence",
      label: createSortableLabel(t("list.table.searchSequence"), "searchSequence"),
      width: "8%",
      render: (value) => (typeof value === "number" ? value : ""),
    },
    {
      key: "typeOfUseValidation",
      label: t("list.table.typeOfUseValidation", { typeOfUse: typeOfUseLabel ?? t("aliasFallback.typeOfUse") }),
      width: "16%",
      render: (_value, row) => {
        const propertyTypeId = row?.id;
        if (!propertyTypeId) return "-";
        const typeOfUseIds = propertyTypeToTypeOfUseIds.get(propertyTypeId) || [];
        if (typeOfUseIds.length === 0) return "-";
        const codes = typeOfUseIds
          .map((id) => typeOfUseMap.get(id))
          .filter(Boolean);
        if (codes.length === 0) return "-";
        
        return (
          <BadgeListButton
            items={codes as string[]}
            maxVisible={3}
            onClick={() => {
              if (onTypeOfUseClick && row) {
                onTypeOfUseClick(row);
              }
            }}
            title={tCommon("table.clickToView")}
            className="underline"
          />
        );
      },
    },
    {
      key: "isActive",
      label: createSortableLabel(t("list.table.status"), "isActive"),
      width: "8%",
      isStatus: true,
    },
  ];
}
