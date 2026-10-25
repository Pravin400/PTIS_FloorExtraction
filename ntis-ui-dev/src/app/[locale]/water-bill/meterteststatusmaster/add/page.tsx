import React from "react";
import { MeterTestStatusMaster, MeterTestStatusForm } from "@/components/modules/water-bill/meter-test-status-master";
import { fetchMeterTestStatusesPagedServerAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchMeterTestStatusesPagedServerAction(1, 10);

  return (
    <>
      <MeterTestStatusMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <MeterTestStatusForm id={null} />
    </>
  );
}
