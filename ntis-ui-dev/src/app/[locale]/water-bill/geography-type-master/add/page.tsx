import {
  GeographyTypeForm,
  GeographyTypeMaster,
} from "@/components/modules/water-bill/geography-type-master";
import React from "react";
import { getGeographyTypePaged } from "@/lib/api/water-bill/geographytypemaster/geography-type-crud.service";
import type { GeographyType } from "@/types/water-bill/geographyType.types";
import { fetchGeographyTypePagedServerAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const [allForMax, result] = await Promise.all([
    getGeographyTypePaged(1, 100),
    fetchGeographyTypePagedServerAction(1, 10),
  ]);

  const maxLevelNo = allForMax.items.reduce((max, item) => Math.max(max, item.levelNo || 0), 0);

  const initialData = {
    id: 0,
    geographyTypeCode: "",
    geographyType: "",
    levelNo: maxLevelNo > 0 ? maxLevelNo + 1 : 1,
    isActive: true,
  } as GeographyType;

  return (
    <>
      <GeographyTypeMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <GeographyTypeForm id={null} initialData={initialData} />
    </>
  );
}
