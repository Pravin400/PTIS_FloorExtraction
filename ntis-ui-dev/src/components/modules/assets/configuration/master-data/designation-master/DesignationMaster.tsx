"use client";

import React, { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { deleteDesignationAction } from "@/app/[locale]/assets/configuration/master-data/designation-master/action";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { PageContainer, SearchInput, Select } from "@/components/common";


import { getDesignationColumns } from "./DesignationColumns";
import { useDesignationSearch } from "@/hooks/asset-masters/designation/useDesignationSearch";
import { useDesignationPagination } from "@/hooks/asset-masters/designation/useDesignationPagination";
import { DesignationProps, Designation } from "@/types/asset-masters/designation.types";
import { getErrorMessage } from "@/hooks/asset-masters/designation/validation";


export function DesignationMaster({
  data,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  locale,
  sortBy,
  sortOrder,
}: DesignationProps & { locale: string }) {
  const router = useRouter();
  const t = useTranslations("designation");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const [, startTransition] = useTransition();

  const { search, currentSearchTerm, handleSearchChange } = useDesignationSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  const handleSort = useCallback(
    (columnKey: string) => {
      startTransition(() => {
        const isCurrent = sortBy === columnKey;
        const newOrder = isCurrent && sortOrder === "asc" ? "desc" : "asc";
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("pageSize", String(pageSize));
        if (currentSearchTerm) params.set("q", currentSearchTerm);
        params.set("sortBy", columnKey);
        params.set("sortOrder", newOrder);
        router.push(
          `/${locale}/assets/configuration/master-data/designation-master?${params.toString()}`
        );
      });
    },
    [pageSize, currentSearchTerm, sortBy, sortOrder, locale, router, startTransition]
  );

  const columns = getDesignationColumns(t, tCommon, sortBy, sortOrder, handleSort);

  const { changePage, handlePageSizeChange, paginationInfo } = useDesignationPagination({
    pageNumber, pageSize, totalCount, locale, currentSearchTerm, sortBy, sortOrder,
  });

  React.useEffect(() => {
    const allowed = [10, 20, 30, 40, 50];
    let hasChanged = false;
    const params = new URLSearchParams(window.location.search);
    if (!allowed.includes(pageSize)) {
      const newPageSize = allowed.reduce((prev, curr) =>
        Math.abs(curr - pageSize) < Math.abs(prev - pageSize) ? curr : prev
      );
      params.set("pageSize", String(newPageSize));
      hasChanged = true;
    }
    const rawPageStr = params.get("page");
    if (rawPageStr !== null) {
      const rawPage = parseInt(rawPageStr, 10);
      if (!Number.isFinite(rawPage) || rawPage < 1) {
        params.set("page", "1");
        hasChanged = true;
      } else if (totalPages > 0 && rawPage > totalPages) {
        params.set("page", String(totalPages));
        hasChanged = true;
      }
    }
    if (hasChanged) {
      router.replace(`/${locale}/assets/configuration/master-data/designation-master?${params.toString()}`);
    }
  }, [pageNumber, pageSize, totalPages, locale, router]);

  const handleEdit = useCallback((row: Designation) => {
    router.push(`/${locale}/assets/configuration/master-data/designation-master/edit/${row.id}`);
  }, [router, locale]);

  const handleDelete = useCallback((row: Designation) => {
    confirm({
      variant: "delete",
      title: `${t("list.table.designationCode")}: ${row.designationCode}`,
      description: `${t("delete.confirmDescription")}`,
      meta: { name: row.designationName },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(row.id));
        const result = await deleteDesignationAction(fd);
        if (result.success) {
          toast.success(t("success.deleted", { code: row.designationCode }));
          router.refresh();
        } else {
          toast.error(getErrorMessage(result.message, result.statusCode, t, tCommon, t("list.title")));
        }
      },
    });
  }, [confirm, router, t, tCommon]);

  const { start, end, total } = paginationInfo;

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("list.title")}
          subtitle={t("list.subtitle")}
          icon={Briefcase}
          actionLabel={t("list.buttons.add")}
          onActionClick={() => {
            router.push(`/${locale}/assets/configuration/master-data/designation-master/add`);
          }}
          className="[&>div>div:last-child>button]:!bg-[#0f3d8a] [&>div>div:last-child>button:hover]:!bg-[#0b2f6b] [&>div>div:last-child>button]:!text-white"
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("list.filters.search") || "Search Designation..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />

        <MasterTable<Designation>
          theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
          footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
          columns={columns}
          data={data}
          loading={false}
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
                  value={[10, 20, 30, 40, 50].includes(pageSize) ? String(pageSize) : pageSize > 50 ? "50" : "10"}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  options={[10, 20, 30, 40, 50].map((s) => ({ label: String(s), value: String(s) }))}
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

