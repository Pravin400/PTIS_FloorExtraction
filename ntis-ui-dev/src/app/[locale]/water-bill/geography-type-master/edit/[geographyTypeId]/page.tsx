import GeographyTypeForm from "@/components/modules/water-bill/geography-type-master/GeographyTypeForm";
import { GeographyTypeMaster } from "@/components/modules/water-bill/geography-type-master";
import { fetchGeographyTypePagedServerAction, getGeographyTypeByIdAction } from "../../action";
import { notFound } from "next/navigation";
import React from "react";
import type { GeographyType } from "@/types/water-bill/geographyType.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("GeographyTypeMaster");

interface PageProps {
  params: Promise<{
    geographyTypeId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { geographyTypeId: geographyTypeIdParam } = await params;
  const result = await fetchGeographyTypePagedServerAction(1, 10);

  const geographyTypeId = Number(geographyTypeIdParam);
  if (!Number.isFinite(geographyTypeId) || geographyTypeId <= 0) {
    notFound();
  }

  let geographyTypeData: GeographyType;
  try {
    geographyTypeData = await getGeographyTypeByIdAction(geographyTypeId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch geography type", { geographyTypeId }, error);
    throw error;
  }

  return (
    <>
      <GeographyTypeMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <GeographyTypeForm id={geographyTypeId} initialData={geographyTypeData} />
    </>
  );
}
