"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { PropertyType, PropertyTypeProps } from "@/types/property-type.types";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { PageContainer, SearchInput, Select } from "@/components/common";
import { getPropertyTypeColumns } from "./PropertyTypeColumns";
import { usePropertyTypeSearch } from "@/hooks/usePropertyTypeSearch";
import { usePropertyTypePagination } from "@/hooks/usePropertyTypePagination";
import { useTypeOfUseModal } from "@/hooks/useTypeOfUseModal";
import { usePropertyTypeMasterHandlers } from "@/hooks/usePropertyTypeMasterHandlers";
import TypeOfUseModal from "./TypeOfUseModal";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

/* ================= PAGE ================= */
export function PropertyTypeMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
  categories,
  typeOfUseList,
  typeOfUseValidation,
}: PropertyTypeProps): React.ReactElement {
  const router = useRouter();
  /* ===== TRANSLATIONS ===== */
  const t = useTranslations("propertyType.propertyType");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  const wardLabel = useAliasLabel("Ward", t("aliasFallback.ward"));

  const { confirm } = useConfirm();
  const [isPending, startTransition] = React.useTransition();
  
  /* ================= TYPE OF USE MODAL ================= */
  const {
    modalOpen,
    modalItems,
    modalPropertyDescription,
    handleTypeOfUseClick,
    closeModal,
  } = useTypeOfUseModal({ typeOfUseList, typeOfUseValidation });
  
  /* ================= TABLE ACTION HANDLERS ================= */
  const { handleEdit, handleDelete } = usePropertyTypeMasterHandlers({
    locale,
    t,
    tCommon,
    confirm,
    startTransition,
    wardLabel,
  });
  
  /* ================= SEARCH ================= */
  const { search, currentSearchTerm, handleSearchChange } = usePropertyTypeSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
    startTransition,
  });
  
  /* ================= PAGINATION ================= */
  const { buildUrl, changePage, handlePageSizeChange, paginationInfo } = usePropertyTypePagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    currentSearchTerm,
    sortBy,
    sortOrder,
    startTransition,
  });
  
  /* ================= TABLE COLUMNS ================= */
  const handleSort = useCallback(
    (columnKey: string) => {
      // Toggle sort order: if same column, toggle; if different column, default to asc
      let newSortOrder = "asc";
      if (sortBy === columnKey) {
        newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      }
      startTransition(() => {
        router.push(buildUrl(1, pageSize, currentSearchTerm, columnKey, newSortOrder));
      });
    },
    [sortBy, sortOrder, router, buildUrl, pageSize, currentSearchTerm]
  );

  const columns = getPropertyTypeColumns(
    t,
    tCommon,
    sortBy,
    sortOrder,
    handleSort,
    categories,
    typeOfUseList,
    typeOfUseValidation,
    handleTypeOfUseClick,
    categoryLabel,
    typeOfUseLabel
  );

  /* ================= UI ================= */
  const { start, end, total } = paginationInfo;
  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("list.title")}
          subtitle={t("list.subtitle")}
          icon={Building2}
          actionLabel={t("list.buttons.add")}
          onActionClick={() => {
            startTransition(() => {
              router.push(`/${locale}/property-tax/propertytype/add`);
            });
          }}
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("list.filters.search") || "Search Property Type..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />
        <MasterTable<PropertyType>
          columns={columns}
          data={data}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          renderActions={(row) => (
            <>
              <EditButton
                aria-label={tCommon("table.actions.edit")}
                onClick={() => handleEdit(row)}
              />
              <DeleteButton
                aria-label={tCommon("table.actions.delete")}
                onClick={() => handleDelete(row)}
                hidden
              />
            </>
          )}
          actionLabel={tCommon("table.columns.actions")}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon("table.showing")} {start} {tCommon("table.to")} {end} {tCommon("table.of")} {total} {tCommon("table.entries")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(_, value) => handlePageSizeChange(value)}
                  options={[10, 20, 30, 40, 50].map((s) => ({
                    label: String(s),
                    value: String(s),
                  }))}
                  selectSize="sm"
                  className="w-20"
                  ariaLabel={tCommon("table.rowsPerPage") || "Rows per page"}
                />
              </div>
            </div>
          }
          getRowKey={(row) => String(row.id)}
        />
      </div>

      {/* Type of Use Modal */}
      <TypeOfUseModal
        open={modalOpen}
        items={modalItems}
        onClose={closeModal}
        propertyDescription={modalPropertyDescription}
        typeOfUseLabel={typeOfUseLabel}
      />
    </PageContainer>
  );
}
