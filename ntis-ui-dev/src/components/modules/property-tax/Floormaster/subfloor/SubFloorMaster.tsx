"use client";

import {
  useCallback,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { DeleteButton, EditButton, Select } from "@/components/common";

import type {
  SubFloor,
  SubFloorMasterProps,
} from "@/types/floor.types";

import { deleteSubFloorAction } from "@/app/[locale]/property-tax/floormaster/actions";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { subFloorColumns } from "./subFloorColumns";

/* ============================================================
   COMPONENT
============================================================ */

export default function SubFloorMaster({
  subFloorPaged,
}: Readonly<SubFloorMasterProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const t = useTranslations("floor.subfloor");
  const tCommon = useTranslations("common");
  const floorLabel = useAliasLabel("Floor", t("aliasFallback.floor"));

  const { confirm } = useConfirm();

  const {
    items: data,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
  } = subFloorPaged;

  const currentSearchTerm = searchParams.get("q") ?? "";

  /* ============================================================
     URL BUILDER
  ============================================================ */

  const buildUrl = useCallback(
    (page: number, size: number, searchTerm?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(size));
      if (searchTerm) params.set("q", searchTerm);
      return `/${locale}/property-tax/floormaster/subfloor?${params.toString()}`;
    },
    [locale]
  );

  /* ============================================================
     PAGINATION
  ============================================================ */

  const changePage = useCallback(
    (page: number) => {
      router.push(buildUrl(page, pageSize, currentSearchTerm));
    },
    [router, pageSize, currentSearchTerm, buildUrl]
  );

  /* ============================================================
     FOOTER
  ============================================================ */
  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount);

  /* ============================================================
     DELETE
  ============================================================ */

  const handleDelete = useCallback(
    (row: SubFloor) => {
      confirm({
        variant: "delete",
        title: t("delete.confirmTitle", { id: row.id, floor: floorLabel }),
        description: t("delete.confirmDescription", { floor: floorLabel }),
        meta: { id: row.id, name: row.description },
        onConfirm: async () => {
          const result = await deleteSubFloorAction(row.id);
          if (result.success) {
            toast.success(t("messages.deleteSuccess", { floor: floorLabel }));
            router.refresh();
          } else {
            let msg = t("messages.deleteFailed", { floor: floorLabel });
            if (result.message) {
              const match = result.message.match(/(?:referenced in:\s*([^.\n]+)|referenced by other entities \((.*?)\))/i);
              if (match) {
                const rawTables = (match[1] || match[2] || "").trim();
                const tables = rawTables.replace(/([a-z])([A-Z])/g, "$1 $2");
                msg = t("apiErrors.referencedIn", { tables, floor: floorLabel });
              } else {
                msg = result.message;
              }
            } else if (result.statusCode === 409) {
              msg = t("messages.deleteInUse", { floor: floorLabel });
            } else if (result.messageKey) {
              msg = t(result.messageKey);
            }
            toast.error(msg);
          }
        },
      });
    },
    [t, confirm, router, floorLabel]
  );

  /* ============================================================
     TABLE COLUMNS
  ============================================================ */

  const columns = subFloorColumns(t, floorLabel);

  /* ============================================================
     UI
  ============================================================ */

  return (
    <MasterTable<SubFloor>
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
            onClick={() =>
              router.push(
                `/${locale}/property-tax/floormaster/subfloor/edit/${row.id}`
              )
            }
          />
          <DeleteButton onClick={() => handleDelete(row)} />
        </>
      )}

      actionLabel={tCommon("table.columns.actions")}

      paginationConfig={{ enabled: true, showPageSizeSelector: false }}

      footerLeftContent={
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            {tCommon("table.showing")} {start} {tCommon("table.to")} {end}{" "}
            {tCommon("table.of")} {totalCount} {tCommon("table.entries")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
            <Select
              value={String(pageSize)}
              onChange={(e) =>
                router.push(
                  buildUrl(1, Number(e.target.value), currentSearchTerm)
                )
              }
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

      getRowKey={(row) => row.id}
    />
  );
}
