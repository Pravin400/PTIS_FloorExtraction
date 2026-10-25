"use client";

import { useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MasterTable, type Column } from "@/components/common/MasterTable";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useTranslations, useLocale } from "next-intl";
import { getInventoryModelColumns } from "./InventoryModelColumn";
import type { SortDirection } from "@/components/common/SortableColumnHeader";
import { deleteInventoryModelAction } from "@/app/[locale]/assets/configuration/master-data/inventory-model/actions";
import { mapInventoryModelApiError } from "@/hooks/asset-masters/inventory-model/validation";
import type { MasterDataRecord } from "@/types/asset-masters/master-data.types";
import type { InventoryModelMasterProps } from "@/types/asset-masters/inventory-model.types";

export default function InventoryModelMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  search = "",
}: InventoryModelMasterProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("inventoryModel.configuration.masterData.form");
  const tRoot = useTranslations("inventoryModel");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const base = `/${locale}/assets/configuration/master-data/inventory-model`;

  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = (searchParams.get("sortOrder") as SortDirection) || undefined;

  const handleSort = useCallback((field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortOrder", newOrder);
    startTransition(() => {
      router.push(`${base}?${params.toString()}`);
    });
  }, [sortBy, sortOrder, searchParams, router, base]);

  const columns = useMemo(() => getInventoryModelColumns(t, sortBy, sortOrder, handleSort), [t, sortBy, sortOrder, handleSort]);

  const changePage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`${base}?${params.toString()}`);
    });
  }, [searchParams, pageSize, search, base, router]);

  const changePageSize = useCallback((size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("pageSize", String(size));
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`${base}?${params.toString()}`);
    });
  }, [searchParams, search, base, router]);

  const handleDelete = useCallback((row: MasterDataRecord) => {
    confirm({
      variant: "delete",
      meta: {
        name: row.name,
      },
      onConfirm: async () => {
        try {
          const fd = new FormData();
          fd.append("id", String(row.id));
          fd.append("locale", locale);
          const result = await deleteInventoryModelAction(fd);

          if (!result.ok) {
            toast.error(mapInventoryModelApiError(result, tRoot, tCommon));
            return;
          }

          toast.success(tCommon("messages.deleteSuccess"));
          startTransition(() => router.refresh());
        } catch {
          toast.error(tCommon("errors.deleteError"));
        }
      },
    });
  }, [confirm, locale, tRoot, tCommon, router]);

  return (
    <div className="space-y-6">
      <MasterTable<MasterDataRecord>
        theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
        footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
        columns={columns as Column<MasterDataRecord>[]}
        data={data as MasterDataRecord[]}
        loading={isPending}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        renderActions={(row) => (
          <>
            <EditButton
              aria-label={tCommon("table.actions.edit")}
              onClick={() => router.push(`${base}/edit/${row.id}`)}
            />
            <DeleteButton
              aria-label={tCommon("table.actions.delete")}
              onClick={() => handleDelete(row)}
            />
          </>
        )}
        actionLabel={tCommon("table.columns.actions")}
        getRowKey={(row) => String(row.id)}
      />
    </div>
  );
}
