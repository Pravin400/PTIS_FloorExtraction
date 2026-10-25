import GeographyUnitForm from "@/components/modules/water-bill/geography-unit-master/GeographyUnitForm";
import { GeographyUnitMaster } from "@/components/modules/water-bill/geography-unit-master";
import { fetchGeographyUnitPagedServerAction, getGeographyUnitByIdAction } from "../../action";
import { notFound } from "next/navigation";
import React from "react";
import type { GeographyUnit } from "@/types/water-bill/geographyUnit.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("GeographyUnitMaster");

interface PageProps {
  params: Promise<{
    geographyUnitId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { geographyUnitId: geographyUnitIdParam } = await params;
  const result = await fetchGeographyUnitPagedServerAction(1, 10);

  const geographyUnitId = Number(geographyUnitIdParam);
  if (!Number.isFinite(geographyUnitId) || geographyUnitId <= 0) {
    notFound();
  }

  let geographyUnitData: GeographyUnit;
  try {
    geographyUnitData = await getGeographyUnitByIdAction(geographyUnitId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch geography unit", { geographyUnitId }, error);
    throw error;
  }

  return (
    <>
      <GeographyUnitMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <GeographyUnitForm id={geographyUnitId} initialData={geographyUnitData} />
    </>
  );
}
