"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MasterTable } from "@/components/common/MasterTable";
import { PageContainer } from "@/components/common/PageContainer";
import TableHeader from "@/components/common/TableHeader";
import type { TaxZone, TaxZoneMasterProps } from "@/types/taxzone.types";
import { deleteTaxZoneAction } from "@/app/[locale]/property-tax/taxzone-master/taxzone/action";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useTranslations, useLocale } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { getTaxZoneColumns } from "./TaxZoneColumn";
import { TaxZoneMasterToolbar } from "./TaxZoneMasterToolbar";

export default function TaxZoneMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  search = "",
}: TaxZoneMasterProps) {
  const router = useRouter();
  const { confirm } = useConfirm();

  const t = useTranslations("taxZone");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const zoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));
  const taxZonesLabel = useAliasLabel("Tax_Zones", t("aliasFallback.taxZones"));
  const wardNoLabel = useAliasLabel("Ward", t("aliasFallback.ward"));

  const base = `/${locale}/property-tax/taxzone-master/taxzone`;

  const normalizedData = useMemo(
    () => (data ?? []).map((x) => ({ ...x, status: x.isActive })),
    [data]
  );

  const columns = useMemo(() => getTaxZoneColumns(t, zoneLabel), [t, zoneLabel]);

  /**
   * ✅ BACKEND PAGINATION
   */
  const changePage = (p: number) => {
    const trimmedSearch = search.trim();
    const url = trimmedSearch
      ? `${base}?page=${p}&pageSize=${pageSize}&search=${encodeURIComponent(trimmedSearch)}`
      : `${base}?page=${p}&pageSize=${pageSize}`;
    router.push(url);
  };

  const changePageSize = (size: number) => {
    const trimmedSearch = search.trim();
    const url = trimmedSearch
      ? `${base}?page=1&pageSize=${size}&search=${encodeURIComponent(trimmedSearch)}`
      : `${base}?page=1&pageSize=${size}`;
    router.push(url);
  };

  const handleDelete = (row: TaxZone) => {
    confirm({
      variant: "delete",
      meta: {
        name: row.taxZoneType,
      },
      onConfirm: async () => {
        try {
          const fd = new FormData();
          fd.append("id", String(row.id));
          fd.append("locale", locale);
          await deleteTaxZoneAction(fd);

          toast.success(t("delete.success", { zone: zoneLabel }));

          router.refresh();
        }
        catch (error) {
          toast.error(t("delete.error", { zone: zoneLabel }));
          console.error(error);
        }
      },
    });
  };

  return (
    <PageContainer className="p-4 sm:p-6">
      <div className="space-y-6">
        <TableHeader
          title={t("list.title", { zone: zoneLabel })}
          subtitle={t("list.subtitle", { tax_zones: taxZonesLabel, ward_no: wardNoLabel })}
          icon="mapPin"
          rightContent={<TaxZoneMasterToolbar />}
        />
        <MasterTable<TaxZone>
          columns={columns}
          data={normalizedData}
          loading={false}
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
                onClick={() =>
                  router.push(`${base}/edit/${row.id}`)
                }
              />
              <DeleteButton aria-label={tCommon("table.actions.delete")} onClick={() => handleDelete(row)} />
            </>
          )}
          actionLabel={t("list.table.actions")}
          getRowKey={(row) => row.id}
        />
      </div>
    </PageContainer>
  );
}
