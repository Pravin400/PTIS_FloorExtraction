"use client";

import { useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import type { Column } from "@/components/common/MasterTable";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useTranslations, useLocale } from "next-intl";
import { getInventoryNameColumns } from "./InventoryNameColumns";
import type { SortDirection } from "@/components/common/SortableColumnHeader";
import { deleteInventoryNameAction } from "@/app/[locale]/assets/configuration/master-data/inventory-name/actions";
import { mapInventoryNameApiError } from "@/hooks/asset-masters/inventory-name/validation";
import type { InventoryNameProps, InventoryName } from "@/types/asset-masters/inventory-name.types";

export function InventoryNameMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  categories,
}: InventoryNameProps & { search?: string }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("inventoryName");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const base = `/${locale}/assets/configuration/master-data/inventory-name`;

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "inventoryName";
  const sortOrder = (searchParams.get("sortOrder") as SortDirection) || "asc";

  const handleSort = useCallback((field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortOrder", newOrder);
    startTransition(() => {
      router.push(`${base}?${params.toString()}`);
    });
  }, [sortBy, sortOrder, searchParams, router, base]);

  const columns = useMemo(() => getInventoryNameColumns(t, tCommon, sortBy, sortOrder, handleSort, categories), [t, tCommon, sortBy, sortOrder, handleSort, categories]);

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

  const handleDelete = useCallback((row: InventoryName) => {
    confirm({
      variant: "delete",
      meta: {
        name: row.subTypeName,
      },
      onConfirm: async () => {
        try {
          const result = await deleteInventoryNameAction(String(row.id));

          if (!result.success) {
            toast.error(mapInventoryNameApiError(result, t, tCommon));
            return;
          }

          toast.success(tCommon("messages.deleteSuccess"));
          router.refresh();
        } catch {
          toast.error(tCommon("errors.deleteError"));
        }
      },
    });
  }, [confirm, t, tCommon, router]);

  return (
    <div className="space-y-6">
      <MasterTable<InventoryName>
        theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
        footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
        columns={columns as Column<InventoryName>[]}
        data={data as InventoryName[]}
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
