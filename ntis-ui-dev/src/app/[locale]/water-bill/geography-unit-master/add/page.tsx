import {
  GeographyUnitForm,
  GeographyUnitMaster,
} from "@/components/modules/water-bill/geography-unit-master";
import React from "react";
import { getGeographyUnitPaged } from "@/lib/api/water-bill/geographyunitmaster/geography-unit-crud.service";
import type { GeographyUnit } from "@/types/water-bill/geographyUnit.types";
import { fetchGeographyUnitPagedServerAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const [allForMax, result] = await Promise.all([
    getGeographyUnitPaged(1, 100),
    fetchGeographyUnitPagedServerAction(1, 10),
  ]);

  const maxSearchSequence = allForMax.items.reduce((max, item) => Math.max(max, item.searchSequence || 0), 0);

  const initialData = {
    id: 0,
    geographyTypeId: 0,
    geographyTypeCode: "",
    geographyType: "",
    parentGeographyUnitId: null,
    parentGeographyUnitName: null,
    geographyUnitCode: "",
    geographyUnitName: "",
    searchSequence: maxSearchSequence > 0 ? maxSearchSequence + 1 : 1,
    markedForDeletion: false,
    markedForDeletionDate: null,
    isActive: true,
    createdDate: new Date().toISOString(),
    updatedDate: null,
  } as GeographyUnit;

  return (
    <>
      <GeographyUnitMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <GeographyUnitForm id={null} initialData={initialData} />
    </>
  );
}
