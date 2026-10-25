"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { AssetFieldDefinition, AssetFieldDefinitionProps } from "@/types/asset-masters/asset-field-definition.types";
import { deleteAssetFieldDefinitionAction } from "@/app/[locale]/assets/configuration/master-data/asset-field-definition/action";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { PageContainer, SearchInput, Select } from "@/components/common";
import { getAssetFieldDefinitionColumns } from "./AssetFieldDefinitionColumns";
import { FieldOptionsDrawer } from "./FieldOptionsDrawer";
import {
  useAssetFieldDefinitionSearch,
  useAssetFieldDefinitionList,
} from "@/hooks/asset-masters/asset-field-definition/useAssetFieldDefinitionList";
import { resolveFieldDefinitionBackendError } from "@/hooks/asset-masters/asset-field-definition/validation";

export function AssetFieldDefinitionMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  sortBy,
  sortOrder,
}: AssetFieldDefinitionProps): React.ReactElement {
  const router = useRouter();
  const t = useTranslations("assetFieldDefinition");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [optionsDrawerRow, setOptionsDrawerRow] = useState<AssetFieldDefinition | null>(null);

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
      router.replace(`/${locale}/assets/configuration/master-data/asset-field-definition?${params.toString()}`);
    }
  }, [pageNumber, pageSize, totalPages, locale, router]);

  const { search, setSearch } = useAssetFieldDefinitionSearch({
    pageSize,
    locale,
    sortBy,
    sortOrder,
  });

  const { handleSort } = useAssetFieldDefinitionList(sortBy, sortOrder, locale);

  const handleViewOptions = useCallback((row: AssetFieldDefinition) => {
    setOptionsDrawerRow(row);
  }, []);

  const columns = getAssetFieldDefinitionColumns(
    t,
    tCommon,
    sortBy,
    sortOrder,
    handleSort,
    handleViewOptions
  );

  const handleEdit = useCallback(
    (row: AssetFieldDefinition) => {
      router.push(`/${locale}/assets/configuration/master-data/asset-field-definition/edit/${row.id}`);
    },
    [router, locale]
  );

  const { confirm } = useConfirm();

  const handleDelete = useCallback(
    (row: AssetFieldDefinition) => {
      confirm({
        variant: "delete",
        title: `${t("list.table.fieldCode")}: ${row.fieldCode}`,
        description: `${t("delete.confirmDescription")}`,
        meta: { name: row.fieldName },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const result = await deleteAssetFieldDefinitionAction(fd);
          if (result.success) {
            toast.success(t("success.deleted", { code: row.fieldCode }));
            router.refresh();
          } else {
            toast.error(resolveFieldDefinitionBackendError(result.message, t, tCommon).toastMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon]
  );

  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(pageNumber * pageSize, totalCount);

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("list.title")}
          subtitle={t("list.subtitle")}
          icon={FileText}
          actionLabel={t("list.buttons.add")}
          onActionClick={() =>
            router.push(`/${locale}/assets/configuration/master-data/asset-field-definition/add`)
          }
          className="[&>div>div:last-child>button]:!bg-[#0f3d8a] [&>div>div:last-child>button:hover]:!bg-[#0b2f6b] [&>div>div:last-child>button]:!text-white"
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder={t("list.filters.search") || "Search Field Definition..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />
        <MasterTable<AssetFieldDefinition>
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
          onPageChange={(page) => {
            const params = new URLSearchParams(window.location.search);
            params.set("page", String(page));
            router.push(`/${locale}/assets/configuration/master-data/asset-field-definition?${params.toString()}`);
          }}
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
                {tCommon("table.showing")} {start} {tCommon("table.to")} {end} {tCommon("table.of")} {totalCount} {tCommon("table.entries")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e: unknown) => {
                    const val = typeof e === "string" ? e : (e as { target: { value: string } })?.target?.value || String(pageSize);
                    const params = new URLSearchParams(window.location.search);
                    params.set("pageSize", val);
                    params.set("page", "1");
                    router.push(`/${locale}/assets/configuration/master-data/asset-field-definition?${params.toString()}`);
                  }}
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
        <FieldOptionsDrawer
          open={Boolean(optionsDrawerRow)}
          onClose={() => setOptionsDrawerRow(null)}
          fieldDefinition={optionsDrawerRow}
          t={t}
          tCommon={tCommon}
        />
      </div>
    </PageContainer>
  );
}
