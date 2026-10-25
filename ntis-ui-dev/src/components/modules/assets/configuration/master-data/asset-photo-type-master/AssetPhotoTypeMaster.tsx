"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Image } from "lucide-react";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { AssetPhotoType, AssetPhotoTypeProps } from "@/types/asset-masters/asset-photo-type.types";
import { deleteAssetPhotoTypeAction } from "@/app/[locale]/assets/configuration/master-data/asset-photo-type/action";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { PageContainer, SearchInput, Select } from "@/components/common";


import { getAssetPhotoTypeColumns } from "./AssetPhotoTypeColumns";
import { useAssetPhotoSearch } from "@/hooks/asset-masters/assetphototype/useAssetPhotoSearch";
import { useAssetPhotoPagination } from "@/hooks/asset-masters/assetphototype/useAssetPhotoPagination";
import { getErrorMessage } from "@/hooks/asset-masters/assetphototype/validation";


export function AssetPhotoTypeMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: AssetPhotoTypeProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("assetPhotoType");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const { confirm } = useConfirm();



  const { search, currentSearchTerm, handleSearchChange } = useAssetPhotoSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  const { buildUrl, changePage, handlePageSizeChange, paginationInfo } = useAssetPhotoPagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    currentSearchTerm,
    sortBy,
    sortOrder,
  });

  React.useEffect(() => {
    const allowed = [10, 20, 30, 40, 50];
    let newPageSize = pageSize;
    let hasChanged = false;
    const params = new URLSearchParams(window.location.search);

    if (!allowed.includes(pageSize)) {
      newPageSize = allowed.reduce((prev, curr) =>
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
      router.replace(`/${locale}/assets/configuration/master-data/asset-photo-type?${params.toString()}`);
    }
  }, [pageNumber, pageSize, totalPages, locale, router]);

  const handleSort = useCallback(
    (columnKey: string) => {
      let newSortOrder = "asc";
      if (sortBy === columnKey) {
        newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      }
      router.push(buildUrl(1, pageSize, currentSearchTerm, columnKey, newSortOrder));
    },
    [sortBy, sortOrder, router, buildUrl, pageSize, currentSearchTerm]
  );

  const columns = getAssetPhotoTypeColumns(t, tCommon, sortBy, sortOrder, handleSort);

  const handleEdit = useCallback((row: AssetPhotoType) => {
    router.push(`/${locale}/assets/configuration/master-data/asset-photo-type/edit/${row.id}`);
  }, [router, locale]);

  const handleDelete = useCallback((row: AssetPhotoType) => {
    confirm({
      variant: "delete",
      title: `${t("list.table.photoTypeCode")}: ${row.photoTypeCode}`,
      description: `${t("delete.confirmDescription")}`,
      meta: { name: row.photoTypeName },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(row.id));
        const result = await deleteAssetPhotoTypeAction(fd);
        if (result.success) {
          toast.success(t("success.deleted", { code: row.photoTypeCode }));
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
          icon={Image}
          actionLabel={t("list.buttons.add")}
          onActionClick={() => router.push(`/${locale}/assets/configuration/master-data/asset-photo-type/add`)}
          className="[&>div>div:last-child>button]:!bg-[#0f3d8a] [&>div>div:last-child>button:hover]:!bg-[#0b2f6b] [&>div>div:last-child>button]:!text-white"
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("list.filters.search") || "Search Asset Photo Type..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />
        <MasterTable<AssetPhotoType>
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
              <EditButton aria-label={tCommon("table.actions.edit")} onClick={() => handleEdit(row)} />
              <DeleteButton aria-label={tCommon("table.actions.delete")} onClick={() => handleDelete(row)} />
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


