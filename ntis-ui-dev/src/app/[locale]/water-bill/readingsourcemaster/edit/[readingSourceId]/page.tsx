import React from "react";
import { notFound } from "next/navigation";
import { ReadingSourceMaster, ReadingSourceForm } from "@/components/modules/water-bill/reading-source-master";
import { fetchReadingSourcesPagedServerAction, getReadingSourceByIdAction } from "../../action";
import type { ReadingSource } from "@/types/water-bill/reading-source-master.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("ReadingSourceMaster");

interface PageProps {
  params: Promise<{
    readingSourceId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { readingSourceId: readingSourceIdParam } = await params;
  const result = await fetchReadingSourcesPagedServerAction(1, 10);

  const readingSourceId = Number(readingSourceIdParam);
  if (!Number.isFinite(readingSourceId) || readingSourceId <= 0) {
    notFound();
  }

  let readingSourceData: ReadingSource;
  try {
    readingSourceData = await getReadingSourceByIdAction(readingSourceId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch reading source", { readingSourceId }, error);
    throw error;
  }

  return (
    <>
      <ReadingSourceMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <ReadingSourceForm id={readingSourceId} initialData={readingSourceData} />
    </>
  );
}
