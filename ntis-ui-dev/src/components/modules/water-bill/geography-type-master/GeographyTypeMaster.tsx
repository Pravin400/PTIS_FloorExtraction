"use client";

import React, { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { Button } from "@/components/common/ActionButton";
import { deleteGeographyTypeAction } from "@/app/[locale]/water-bill/geography-type-master/action";
import TableHeader from "@/components/common/TableHeader";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { AddButton, PageContainer, SearchInput, Select } from "@/components/common";
import { GeographyUserManualModal } from "../geography-shared/GeographyUserManualModal";
import { GeographyMasterTabs } from "../geography-shared/GeographyMasterTabs";
import { getGeographyTypeColumns } from "./GeographyTypeColumns";
import { useGeographyTypeSearch } from "@/hooks/water-bill/geographytypemaster/useGeographyTypeSearch";
import { useGeographyTypePagination } from "@/hooks/water-bill/geographytypemaster/useGeographyTypePagination";
import { GeographyType, GeographyTypeProps } from "@/types/water-bill/geographyType.types";

/* ================= PAGE ================= */
export function GeographyTypeMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
}: GeographyTypeProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("geographyTypeMaster");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const { confirm } = useConfirm();
  const [isPending, startTransition] = React.useTransition();

  const openUserManual = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("showUserManual", "true");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const { search, currentSearchTerm, handleSearchChange } = useGeographyTypeSearch({
    pageSize,
    locale,
    startTransition,
  });

  const { changePage, handlePageSizeChange, paginationInfo } = useGeographyTypePagination({
    pageNumber,
    pageSize,
    totalCount,
    locale,
    currentSearchTerm,
    startTransition,
  });

  const columns = getGeographyTypeColumns(t);

  const handleEdit = useCallback(
    (row: GeographyType) => {
      startTransition(() => {
        router.push(`/${locale}/water-bill/geography-type-master/edit/${row.id}`);
      });
    },
    [router, locale]
  );

  const handleDelete = useCallback(
    (row: GeographyType) => {
      confirm({
        variant: "delete",
        title: `${t("list.table.geographyTypeCode")}: ${row.geographyTypeCode}`,
        description: t("delete.confirmDescription"),
        meta: {
          name: row.geographyType,
        },
        onConfirm: async () => {
          const fd = new FormData();
          fd.append("id", String(row.id));
          const result = await deleteGeographyTypeAction(fd);
          if (result.success) {
            toast.success(t("success.deleted", { code: row.geographyTypeCode }));
            startTransition(() => {
              router.refresh();
            });
          } else {
            let errorMessage = tCommon("errors.deleteError");

            if (result.statusCode === 409) {
              errorMessage = t("apiErrors.inUse");
            } else if (result.statusCode === 400) {
              errorMessage = t("apiErrors.validationError");
            } else if (result.statusCode === 404) {
              errorMessage = t("apiErrors.notFound");
            } else if (result.message) {
              errorMessage = result.message;
            }
            toast.error(errorMessage);
          }
        },
      });
    },
    [confirm, router, t, tCommon]
  );

  const { start, end, total } = paginationInfo;
  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("list.title")}
          subtitle={t("list.subtitle")}
          icon={MapPin}
          rightContent={<GeographyMasterTabs />}
        />
        <MasterTable<GeographyType>
          columns={columns}
          data={data}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          headerExtra={
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("list.filters.search")}
                className="mb-0 min-w-48 text-gray-900"
              />
              <Button variant="secondary" size="sm" icon={BookOpen} onClick={openUserManual}>
                {tCommon("buttons.userManual")}
              </Button>
              <AddButton
                label={t("list.buttons.add")}
                onClick={() => {
                  startTransition(() => {
                    router.push(`/${locale}/water-bill/geography-type-master/add`);
                  });
                }}
              />
            </div>
          }
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
                {tCommon("table.showing")} {start} {tCommon("table.to")} {end} {tCommon("table.of")} {total}{" "}
                {tCommon("table.entries")}
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
      <GeographyUserManualModal />
    </PageContainer>
  );
}
