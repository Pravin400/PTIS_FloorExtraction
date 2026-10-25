"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { HardHat } from "lucide-react";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { ConstructionType, ConstructionTypeProps } from "@/types/construction.types";
import { deleteConstructionTypeAction } from "@/app/[locale]/property-tax/constructiontype/action";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { PageContainer, SearchInput, Select } from "@/components/common";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { getConstructionTypeColumns } from "./ConstructionTypeColumns";
import { useConstructionSearch } from "@/hooks/constructiontypemaster/useConstructionSearch";
import { useConstructionPagination } from "@/hooks/constructiontypemaster/useConstructionPagination";

/* ================= PAGE ================= */
export function ConstructionTypeMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: ConstructionTypeProps): React.ReactElement {
  const router = useRouter();
  /* ===== TRANSLATIONS ===== */
  const t = useTranslations("construction.constructionType");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const constructionTypeLabel = useAliasLabel("Construction_Type", t("aliasFallback.entity"));
  const values = React.useMemo(
    () => ({ constructionType: constructionTypeLabel, entity: constructionTypeLabel }),
    [constructionTypeLabel]
  );

  const { confirm } = useConfirm();
  const [isPending, startTransition] = React.useTransition();
  /* ================= SEARCH ================= */
  const { search, currentSearchTerm, handleSearchChange } = useConstructionSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
    startTransition,
  });
  /* ================= PAGINATION ================= */
  const { buildUrl, changePage, handlePageSizeChange, paginationInfo } = useConstructionPagination({
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

  const columns = getConstructionTypeColumns(t, tCommon, sortBy, sortOrder, handleSort, constructionTypeLabel);

  const handleEdit = useCallback(
    (row: ConstructionType) => {
      startTransition(() => {
        router.push(`/${locale}/property-tax/constructiontype/edit/${row.id}`);
      });
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    (row: ConstructionType) => {
      confirm({
        variant: "delete",
        title: `${t("list.table.constructionCode", values)}: ${row.constructionCode}`,
        description: `${t("delete.confirmDescription", values)}`,
        meta: {
          name: row.description,
        },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const result = await deleteConstructionTypeAction(fd);
          if (result.success) {
            toast.success(
              t("success.deleted", { code: row.constructionCode, ...values })
            );
            startTransition(() => {
              router.refresh();
            });
          } else {
            // Show appropriate error message based on status code
            let errorMessage = tCommon("errors.deleteError");

            if (result.statusCode === 409) {
              // Record linked with another record or in use
              errorMessage = t("apiErrors.inUse", values);
            } else if (result.statusCode === 400) {
              // Bad request / validation error
              errorMessage = t("apiErrors.validationError", values);
            } else if (result.statusCode === 404) {
              errorMessage = t("apiErrors.notFound", values);
            } else if (result.message) {
              errorMessage = result.message;
            }
            toast.error(errorMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon, values]
  );
  /* ================= UI ================= */
  const { start, end, total } = paginationInfo;
  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("list.title", values)}
          subtitle={t("list.subtitle", values)}
          icon={HardHat}
          actionLabel={t("list.buttons.add", values)}
          onActionClick={() => {
            startTransition(() => {
              router.push(`/${locale}/property-tax/constructiontype/add`);
            });
          }}
          rightContent={
            <div
              className={
                locale === "en"
                  ? "flex w-[23rem] max-[899px]:w-full justify-end"
                  : "flex w-full justify-end"
              }
            >
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("list.filters.search", values) || "Search Construction Type..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />
        <MasterTable<ConstructionType>
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
                  onChange={(e) => handlePageSizeChange(e.target.value)}
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
    </PageContainer>
  );
}