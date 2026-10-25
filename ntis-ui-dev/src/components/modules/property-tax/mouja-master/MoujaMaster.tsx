"use client";

import React, { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { Mouja, MoujaProps } from "@/types/mouja.types";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Select } from "@/components/common";
import { getMoujaColumns } from "./MoujaColumns";
import { useMoujaPagination } from "@/hooks/moujamaster/useMoujaPagination";
import { useMoujaMasterHandlers } from "@/hooks/moujamaster/useMoujaMasterHandlers";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

/* ================= PAGE ================= */
export function MoujaMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: MoujaProps): React.ReactElement {
  const router = useRouter();
  /* ===== TRANSLATIONS ===== */
  const t = useTranslations("mouja.moujaMaster");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const moujaLabel = useAliasLabel("Mouja", t("aliasFallback.entity"));

  const { confirm } = useConfirm();
  const [isPending, startTransition] = React.useTransition();

  // Get current search term from URL for pagination purposes
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get('q') || '';
  
  /* ================= PAGINATION ================= */
  const { buildUrl, changePage, handlePageSizeChange, paginationInfo } = useMoujaPagination({
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
    [sortBy, sortOrder, router, buildUrl, pageSize, currentSearchTerm, startTransition]
  );

  const columns = getMoujaColumns(t, tCommon, sortBy, sortOrder, handleSort, moujaLabel);

  /* ================= TABLE ACTION HANDLERS ================= */
  const { handleEdit, handleDelete } = useMoujaMasterHandlers({
    locale,
    t,
    tCommon,
    confirm,
    startTransition,
    moujaLabel,
  });

  /* ================= UI ================= */
  const { start, end, total } = paginationInfo;
  return (
    <div className="space-y-4">
      <MasterTable<Mouja>
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
  );
}
