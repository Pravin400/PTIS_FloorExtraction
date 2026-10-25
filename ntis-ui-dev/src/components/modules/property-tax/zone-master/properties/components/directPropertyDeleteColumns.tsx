import { Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/common";
import type { Column } from "@/components/common";
import { IconOnlyActionButton } from "@/components/common/ActionButtons";
import { Checkbox } from "@/components/common/checkbox";
import type { DirectPropertyDeleteRow } from "@/types/zoneMaster.types";

interface BuildDirectPropertyDeleteColumnsArgs {
  allSelected: boolean;
  someSelected: boolean;
  selectedRows: Set<string>;
  isDeleting: boolean;
  hasSubRows: boolean;
  onSubRowDeleted?: () => void;
  onDeleted: () => void;
  toggleSelectAll: () => void;
  toggleRow: (id: string) => void;
  createDeleteHandler: (
    id: string,
    propertyNo: string,
    callback: () => void
  ) => () => void;
  tableData: DirectPropertyDeleteRow[];
  t: (key: string, params?: Record<string, string | number | Date>) => string;
  propertyNoAlias?: string;
  categoryAlias?: string;
}

export function buildDirectPropertyDeleteColumns({
  allSelected,
  someSelected,
  selectedRows,
  isDeleting,
  hasSubRows,
  onSubRowDeleted,
  onDeleted,
  toggleSelectAll,
  toggleRow,
  createDeleteHandler,
  tableData,
  t,
  propertyNoAlias,
  categoryAlias,
}: BuildDirectPropertyDeleteColumnsArgs): Column<
  DirectPropertyDeleteRow & Record<string, unknown>
>[] {
  return [
    {
      key: "select",
      label: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={toggleSelectAll}
          disabled={tableData.length === 0}
        />
      ),
      width: "48px",
      align: "center",
      render: (_value, row) => {
        const item = row as DirectPropertyDeleteRow;
        return (
          <Checkbox
            checked={selectedRows.has(item.propertyId)}
            onCheckedChange={() => toggleRow(item.propertyId)}
          />
        );
      },
    },
    {
      key: "propertyIdentifier",
      label: t("createProperty.propertyNoLabel", {
        propertyNo: propertyNoAlias ?? "Property No",
      }),
      render: (_value, currentRow) => {
        const item = currentRow as DirectPropertyDeleteRow;
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
      key: "categoryName",
      label: t("createProperty.category", { category: categoryAlias ?? "Category" }),
      render: (value) =>
        value && value !== "-" ? (
          <StatusBadge label={value as string} variant="info" />
        ) : (
          "-"
        ),
    },
    {
      key: "propertyId",
      label: t("createProperty.action"),
      align: "center",
      render: (_value, currentRow) => {
        const item = currentRow as DirectPropertyDeleteRow;
        const callback = hasSubRows ? (onSubRowDeleted ?? (() => {})) : onDeleted;
        return (
          <IconOnlyActionButton
            icon={Trash2}
            onClick={createDeleteHandler(item.propertyId, item.propertyNo, callback)}
            aria-label={t("createProperty.deletePropertyConfirm")}
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            className="text-red-500 hover:scale-110 transition-transform p-1.5 hover:bg-transparent"
          />
        );
      },
    },
  ];
}
