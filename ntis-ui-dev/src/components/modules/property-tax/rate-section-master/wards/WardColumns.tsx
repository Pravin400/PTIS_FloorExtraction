"use client";

import { Column } from "@/components/common/MasterTable";
import { SectionItem, GetWardColumnsParams } from "@/types/rateSectionMaster.types";
import { StatusBadge } from "@/components/common/StatusBadge";

export function getWardColumns({
  t,
  wardAlias,
}: GetWardColumnsParams): Column<SectionItem>[] {
  const ward = wardAlias || t('defaults.ward');

  return [
    {
      key: "wardNo",
      label: t('wards.wardNo', { ward }),
      render: (_, row) => {
        const wardNo = row.wardNo ?? row["WardNo"] ?? "-";
        return (
          <div className="flex justify-center">
            <StatusBadge label={String(wardNo)} variant="info" />
          </div>
        );
      },
    },
  ];
}
