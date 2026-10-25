import React from "react";
import { MeterTypeMaster, MeterTypeForm } from "@/components/modules/water-bill/meter-type-master";
import { fetchMeterTypesPagedServerAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchMeterTypesPagedServerAction(1, 10);

  return (
    <>
      <MeterTypeMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <MeterTypeForm id={null} />
    </>
  );
}
