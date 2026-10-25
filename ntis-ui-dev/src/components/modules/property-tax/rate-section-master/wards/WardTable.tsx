"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Unlink } from "lucide-react";
import { SectionItem, WardTableProps } from "@/types/rateSectionMaster.types";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, Button } from "@/components/common";
import { getWardColumns } from "./WardColumns";

export default function WardTable({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  emptyText,
  wardAlias,
}: WardTableProps) {
  const t = useTranslations("rateSectionMaster");
  const ward = wardAlias || t("defaults.ward");

  const columns = useMemo(
    () =>
      getWardColumns({
        t,
        wardAlias: ward,
      }),
    [t, ward]
  );

  return (
    <MasterTable<SectionItem>
      columns={columns}
      data={data}
      renderActions={(row) => (
        <>
          <EditButton size="xs" onClick={() => onEdit(row)} />
          <Button
            size="xs"
            variant="delete"
            icon={Unlink}
            onClick={() => onDelete(row)}
            title={t("wards.unlinkWard", { ward })}
            aria-label={t("wards.unlinkWard", { ward })}
          >
            {t("wards.unlinkWard", { ward })}
          </Button>
        </>
      )}
      emptyText={emptyText}
      height="md"
      pageNumber={pageNumber}
      pageSize={pageSize}
      totalCount={totalCount}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      paginationConfig={{ enabled: true, showPageSizeSelector: true }}
    />
  );
}
