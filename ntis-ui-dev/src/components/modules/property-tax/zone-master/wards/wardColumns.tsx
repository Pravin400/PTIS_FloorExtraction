"use client";

import { Column } from "@/components/common/MasterTable";
import { WardItem } from "@/types/wardMaster.types";
import { StatusBadge } from "@/components/common";

interface GetWardColumnsParams {
  t: (key: string, values?: Record<string, unknown>) => string;
  pageNumber: number;
  pageSize: number;
  wardAlias?: string;
}

export function getWardColumns({
  t,
  pageNumber,
  pageSize,
  wardAlias,
}: GetWardColumnsParams): Column<Record<string, unknown>>[] {
  return [
    {
      key: "srNo",
      label: t("wardList.columns.srNo"),
      render: (_, __, index) => (pageNumber - 1) * pageSize + index + 1,
    },
    {
      key: "wardNo",
      label: t("wardList.columns.wardNo", { ward: wardAlias }),
      render: (_, row) => (row as unknown as WardItem).wardNo,
    },
    {
      key: "description",
      label: t("wardList.columns.desc"),
      render: (_, row) => (row as unknown as WardItem).description || "-",
    },
    {
      key: "sequenceNo",
      label: t("wardList.columns.seqNo"),
      render: (_, row) => (row as unknown as WardItem).sequenceNo ?? "-",
    },
    {
      key: "isActive",
      label: t("wardList.columns.status"),
      render: (_, row) => (
        <StatusBadge value={(row as unknown as WardItem).isActive ? "active" : "inactive"} />
      ),
    },
  ];
}
