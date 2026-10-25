import React from "react";
import { notFound } from "next/navigation";
import { MeterTypeMaster, MeterTypeForm } from "@/components/modules/water-bill/meter-type-master";
import { fetchMeterTypesPagedServerAction, getMeterTypeByIdAction } from "../../action";
import type { MeterType } from "@/types/water-bill/meter-type-master.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("MeterTypeMaster");

interface PageProps {
  params: Promise<{
    meterTypeId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { meterTypeId: meterTypeIdParam } = await params;
  const result = await fetchMeterTypesPagedServerAction(1, 10);

  const meterTypeId = Number(meterTypeIdParam);
  if (!Number.isFinite(meterTypeId) || meterTypeId <= 0) {
    notFound();
  }

  let meterTypeData: MeterType;
  try {
    meterTypeData = await getMeterTypeByIdAction(meterTypeId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch meter type", { meterTypeId }, error);
    throw error;
  }

  return (
    <>
      <MeterTypeMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <MeterTypeForm id={meterTypeId} initialData={meterTypeData} />
    </>
  );
}
