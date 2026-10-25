"use client";

import { Trash2 } from "lucide-react";
import { MasterTable } from "@/components/common";
import type { Column } from "@/components/common";
import { IconOnlyActionButton } from "@/components/common/ActionButtons";
import { Checkbox } from "@/components/common/checkbox";
import type { SocietyAmenityDetailItem } from "@/types/zone-master/properties/society-amenity-details.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type TableRow = SocietyAmenityDetailItem & Record<string, unknown>;

interface PropertyAmenityTableProps {
  tableData: SocietyAmenityDetailItem[];
  tableLoading: boolean;
  isAmenity: boolean;
  selectedRows: Set<number>;
  allSelected: boolean;
  someSelected: boolean;
  toggleSelectAll: () => void;
  toggleRow: (id: number) => void;
  onSingleDelete: (item: SocietyAmenityDetailItem) => void;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function PropertyAmenityTable({
  tableData,
  tableLoading,
  isAmenity,
  selectedRows,
  allSelected,
  someSelected,
  toggleSelectAll,
  toggleRow,
  onSingleDelete,
  t,
}: PropertyAmenityTableProps) {
  const propertyNoAlias = useAliasLabel(
    "Property_No",
    useAliasLabel("Property No.", useAliasLabel("Property No", t("defaults.propertyNo")))
  );

  const columns: Column<TableRow>[] = [
    {
      key: "propertyId",
      label: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={toggleSelectAll}
          disabled={tableData.length === 0}
          aria-label="Select all"
        />
      ),
      width: "48px",
      align: "center",
      render: (_value, row) => (
        <Checkbox
          checked={selectedRows.has((row as SocietyAmenityDetailItem).propertyId)}
          onCheckedChange={() => toggleRow((row as SocietyAmenityDetailItem).propertyId)}
          aria-label="Select row"
        />
      ),
    },
    {
      key: "propertyIdentifier",
      label: t("createProperty.propertyNoLabel", { propertyNo: propertyNoAlias }),
      render: (_value, row) => {
        const item = row as SocietyAmenityDetailItem;
        return (
          <span className="font-medium text-gray-800">
  {[item.wardNo, item.propertyNo, item.partitionNo]
    .filter(Boolean)
    .join(" - ")}
</span>
        );
      },
    },
    {
      key: "partType",
      label: t("createProperty.action"),
      align: "center",
      render: (_value, row) => (
        <IconOnlyActionButton
          icon={Trash2}
          onClick={() => onSingleDelete(row as unknown as SocietyAmenityDetailItem)}
          aria-label={isAmenity ? t("createProperty.deleteAmenityConfirm") : t("createProperty.deletePropertyConfirm")}
          variant="ghost"
          size="sm"
          disabled={selectedRows.size > 0 || tableLoading}
          className="text-red-500 hover:scale-110 transition-transform p-1.5 hover:bg-transparent"
        />
      ),
    },
  ];

  return (
    <MasterTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      data={tableData as unknown as Record<string, unknown>[]}
      loading={tableLoading}
      emptyText={isAmenity ? t("createProperty.noAmenitiesFound") : t("createProperty.noPropertiesFound")}
      height="sm"
      paginationConfig={{ enabled: false }}
    />
  );
}
