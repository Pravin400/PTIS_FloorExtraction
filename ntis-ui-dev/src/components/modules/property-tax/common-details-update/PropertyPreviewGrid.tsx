"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Eye } from "lucide-react";
import { Badge, Card, CardHeader, Input, MasterTable, SearchInput } from "@/components/common";
import { PropertyPreviewRow, BulkUpdateMaster, BulkUpdateFieldConfig, SelectOption } from "@/types/common-details-update/common-details-update.types";
import { getPreviewColumns } from "./CommonDetailsUpdateColumns";
import { Column } from "@/components/common/MasterTable";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface PaginationInfo {
  start: number;
  end: number;
  total: number;
}

interface PropertyPreviewGridProps {
  t: (key: string, values?: any) => string;
  properties: PropertyPreviewRow[];
  filteredProperties: PropertyPreviewRow[];
  pagedProperties: PropertyPreviewRow[];
  totalCount: number;
  loading: boolean;
  selectedPropertyIds: Set<number>;
  allSelected: boolean;
  isPropertySelected?: (id: number) => boolean;
  onSelectAll: () => void;
  onPropertySelect: (id: number, checked: boolean) => void;
  propertiesPage: number;
  setPropertiesPage: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedMenuItem: BulkUpdateMaster | undefined;
  fieldConfigs: BulkUpdateFieldConfig[];
  paginationInfo?: PaginationInfo;
  wardId?: string;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  actions?: Record<string, any>;
  hideCheckbox?: boolean;
  optionsMap?: Record<string, SelectOption[]>;
  lookupMap?: Record<string, Record<string, string>>;
}

export const PropertyPreviewGrid = ({
  t,
  properties,
  pagedProperties,
  totalCount,
  loading,
  selectedPropertyIds,
  allSelected,
  isPropertySelected,
  onSelectAll,
  onPropertySelect,
  propertiesPage,
  setPropertiesPage,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  searchTerm,
  onSearchChange,
  selectedMenuItem,
  fieldConfigs,
  hideCheckbox = false,
  optionsMap = {},
  lookupMap = {},
}: PropertyPreviewGridProps) => {
  const propertyNoLabel = useAliasLabel("Property_No", t("aliasFallback.propertyNo"));
  const partitionLabel = useAliasLabel("Partition", t("aliasFallback.partition"));

  const baseColumns = getPreviewColumns(t, fieldConfigs, optionsMap, lookupMap, propertyNoLabel);

  // Prepend checkbox column for selection if not hidden
  const columns: Column<PropertyPreviewRow>[] = [
    ...(hideCheckbox ? [] : [{
      key: "id" as keyof PropertyPreviewRow,
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onSelectAll}
          aria-label={t("preview.selectAll")}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ),
      width: "40px",
      render: (_value: any, row: PropertyPreviewRow) => (
        <Input
          type="checkbox"
          checked={isPropertySelected ? isPropertySelected(row.id) : (allSelected || selectedPropertyIds.has(row.id))}
          onChange={(e) => onPropertySelect(row.id, e.target.checked)}
          aria-label={t("preview.selectRow", { id: row.propertyNo })}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ),
    }]),
    ...baseColumns,
  ];

  const totalPages = Math.ceil(totalCount / pageSize);


  // Empty state when no menu item selected
  if (!selectedMenuItem) {
    return (
      <Card
        variant="default"
        padding="none"
      >
        <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-blue-200 bg-[#F8FAFF] rounded-t-xl mb-0 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-[#1E3A8A]">
              {t("preview.title")}
            </span>
          </div>
        </CardHeader>
        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
          <div className="w-10 h-10 mb-2 rounded-full bg-blue-50 flex items-center justify-center">
            <Eye className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {t("preview.selectFilters")}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MasterTable<PropertyPreviewRow>
        columns={columns}
        data={pagedProperties}
        loading={loading}
        pageNumber={propertiesPage}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPropertiesPage}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        getRowKey={(row) => String(row.id)}
        containerClassName="flex flex-col min-h-0 flex-1 [&>div]:flex [&>div]:flex-col [&>div]:min-h-0 [&>div]:flex-1 [&>div]:h-full [&>div]:overflow-hidden"
        maxBodyHeightClassName="flex-1 overflow-y-auto"
        emptyText={t("preview.noProperties")}
        loadingText={t("preview.loading")}
        tableClassName="min-w-max"
        rowClassName={(row) =>
          (isPropertySelected ? isPropertySelected(row.id) : selectedPropertyIds.has(row.id)) ? "bg-blue-50" : ""
        }
        headerTitle={t("preview.title")}
        headerExtra={
          <div className="flex items-center gap-3 ml-auto">
            {properties.length > 0 && (
              <Badge
                variant="default"
                size="md"
                className="w-fit whitespace-nowrap mb-0"
                title={`${totalCount} ${t("preview.propertiesLoaded")}`}
              >
                {totalCount} {t("preview.propertiesLoaded")}
              </Badge>
            )}
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder={t("preview.searchPlaceholder", { propertyNo: propertyNoLabel, partition: partitionLabel })}
              className="w-80 mb-0"
            />
          </div>
        }
      />
    </div>
  );
};
