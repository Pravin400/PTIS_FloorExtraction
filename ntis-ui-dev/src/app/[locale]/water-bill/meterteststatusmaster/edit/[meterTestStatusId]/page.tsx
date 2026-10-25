import React from "react";
import { notFound } from "next/navigation";
import { MeterTestStatusMaster, MeterTestStatusForm } from "@/components/modules/water-bill/meter-test-status-master";
import { fetchMeterTestStatusesPagedServerAction, getMeterTestStatusByIdAction } from "../../action";
import type { MeterTestStatus } from "@/types/water-bill/meter-test-status-master.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("MeterTestStatusMaster");

interface PageProps {
  params: Promise<{
    meterTestStatusId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { meterTestStatusId: meterTestStatusIdParam } = await params;
  const result = await fetchMeterTestStatusesPagedServerAction(1, 10);

  const meterTestStatusId = Number(meterTestStatusIdParam);
  if (!Number.isFinite(meterTestStatusId) || meterTestStatusId <= 0) {
    notFound();
  }

  let meterTestStatusData: MeterTestStatus;
  try {
    meterTestStatusData = await getMeterTestStatusByIdAction(meterTestStatusId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch meter test status", { meterTestStatusId }, error);
    throw error;
  }

  return (
    <>
      <MeterTestStatusMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <MeterTestStatusForm id={meterTestStatusId} initialData={meterTestStatusData} />
    </>
  );
}
