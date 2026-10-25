"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Select } from "@/components/common";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

import type { Floor, FloorMasterProps } from "@/types/floor.types";

import { deleteFloorAction } from "@/app/[locale]/property-tax/floormaster/actions";
import { floorColumns } from "./floorColumns";

/* ================= MAIN ================= */
export default function FloorMaster({
  floorPaged,
  sortBy,
  sortOrder,
}: Readonly<FloorMasterProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const t = useTranslations("floor.floor");
  const tCommon = useTranslations("common");
  const floorLabel = useAliasLabel("Floor", t("aliasFallback.floor"));

  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const {
    items: data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
  } = floorPaged;

  const currentSearchTerm = searchParams.get("q") || "";

  /* ================= URL BUILDER ================= */
  const buildUrl = useCallback(
    (
      page: number,
      size: number,
      searchTerm?: string,
      newSortBy?: string,
      newSortOrder?: string
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));

      if (searchTerm) params.set("q", searchTerm);
      if (newSortBy) params.set("sortBy", newSortBy);
      if (newSortOrder) params.set("sortOrder", newSortOrder);

      return `/${locale}/property-tax/floormaster/floor?${params.toString()}`;
    },
    [locale]
  );

  /* ================= SORTING ================= */
  const handleSort = useCallback(
    (columnKey: string) => {
      const newSortOrder =
        sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
      router.push(buildUrl(pageNumber, pageSize, currentSearchTerm, columnKey, newSortOrder));
    },
    [sortBy, sortOrder, router, buildUrl, pageNumber, pageSize, currentSearchTerm]
  );

  const columns = floorColumns(t, tCommon, sortBy, sortOrder, handleSort, floorLabel);

  /* ================= PAGINATION ================= */
  const changePage = (
    page: number,
    size: number = pageSize,
    searchTerm: string = currentSearchTerm,
    newSortBy: string = sortBy ?? "",
    newSortOrder: string = sortOrder ?? ""
  ) => {
    router.push(buildUrl(page, size, searchTerm, newSortBy, newSortOrder));
  };

  /* ================= EDIT ================= */
  const handleEdit = useCallback(
    (row: Floor) => {
      router.push(`/${locale}/property-tax/floormaster/floor/edit/${row.id}`);
    },
    [router, locale]
  );

  /* ================= DELETE ================= */
  const handleDelete = useCallback(
    (row: Floor) => {
      confirm({
        variant: "delete",
        title: `${t("table.columns.floorCode", { floor: floorLabel })}: ${row.floorCode}`,
        description: t("delete.confirmDescription", { floor: floorLabel }),
        meta: { name: row.descriptionEnglish || row.description },

        onConfirm: async () => {
          const result = await deleteFloorAction(row.id);

          if (result.success) {
            toast.success(t("messages.deleteSuccess", { floor: floorLabel }));
            router.refresh();
          } else {
            let msg = tCommon("errors.deleteError");

            if (
              result.statusCode === 409 ||
              (result.statusCode === 400 &&
                result.message &&
                (result.message.toLowerCase().includes("referenced") ||
                  result.message.toLowerCase().includes("in use") ||
                  result.message.toLowerCase().includes("cannot deactivate"))) ||
              (result.message &&
                (result.message.toLowerCase().includes("invalid object name") ||
                  result.message.toLowerCase().includes("floorfactorcvmaster") ||
                  result.message.toLowerCase().includes("reference constraint") ||
                  result.message.toLowerCase().includes("foreign key")))
            ) {
              msg = t("apiErrors.inUse", { floor: floorLabel });
            } else if (result.statusCode === 404) {
              msg = tCommon("errors.notFound");
            } else if (result.messageKey) {
              // Translate i18n key from server
              msg = t(result.messageKey);
            } else if (result.message) {
              msg = result.message;
            }

            toast.error(msg);
          }
        },
      });
    },
    [confirm, router, t, tCommon, floorLabel]
  );

  /* ================= FOOTER ================= */
  const start =
    totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount);

  /* ================= UI ================= */
  return (
    <div className="space-y-4">
      <MasterTable<Floor>
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
            <EditButton onClick={() => handleEdit(row)} />
            <DeleteButton onClick={() => handleDelete(row)} />
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  startTransition(() => {
                    router.push(
                      buildUrl(1, Number(e.target.value), currentSearchTerm, sortBy, sortOrder)
                    );
                  });
                }}
                options={[10, 20, 30, 50].map((s) => ({
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