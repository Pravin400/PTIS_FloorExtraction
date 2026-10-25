"use client";

import { Column } from "@/components/common/MasterTable";
import { StatusBadge } from "@/components/common";
import { WardItem } from "@/types/wardMaster.types";

interface PropertyCategoryMap {
  [key: number]: string;
}

interface PropertyTypeMap {
  [key: number]: string;
}

interface GetPropertyColumnsParams {
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  pageNumber: number;
  pageSize: number;
  wards: WardItem[];
  categoryMap: PropertyCategoryMap;
  propertyTypeMap: PropertyTypeMap;
  propertyNoAlias?: string;
  categoryAlias?: string;
}

export function getPropertyColumns({
  t,
  pageNumber,
  pageSize,
  wards,
  categoryMap,
  propertyTypeMap,
  propertyNoAlias,
  categoryAlias,
}: GetPropertyColumnsParams): Column<Record<string, unknown>>[] {
  return [
    {
      key: "srNo",
      label: t("propertyList.columns.srNo"),
      width: "60px",
      render: (_: unknown, __: Record<string, unknown>, rowIndex: number) =>
        (pageNumber - 1) * pageSize + rowIndex + 1,
    },
    {
      key: "propertyNo",
      label: t("propertyList.columns.propertyNo", {
        propertyNo: propertyNoAlias ?? "Property No",
      }),
      width: "200px",
      render: (_: unknown, row: Record<string, unknown>) => {
        const ward = wards.find((w) => w.id === row.wardId);
        const parts = [
          ward?.wardNo,
          row.propertyNo as string | undefined,
          row.partitionNo as string | undefined,
        ].filter(Boolean);
        return parts.length ? parts.join("-") : "-";
      },
    },
    {
      key: "categoryId",
      label: t("propertyList.columns.category", { category: categoryAlias ?? "Category" }),
      width: "180px",
      render: (value: unknown) => {
        const categoryId = value as number | null;
        if (!categoryId) return "-";
        const categoryName = categoryMap[categoryId];
        return categoryName ? (
          <StatusBadge label={categoryName} variant="info" />
        ) : (
          "-"
        );
      },
    },
    {
      key: "propertyTypeId",
      label: t("propertyList.columns.type"),
      width: "150px",
      render: (value: unknown) => {
        const propertyTypeId = value as number | null;

        if (!propertyTypeId) return "-";

        const typeName = propertyTypeMap[propertyTypeId];

        return typeName ? (
          <StatusBadge label={typeName} variant="pending" />
        ) : (
          "-"
        );
      },
    },
  ];
}
