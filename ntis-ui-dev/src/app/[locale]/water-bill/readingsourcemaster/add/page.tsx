import React from "react";
import { ReadingSourceMaster, ReadingSourceForm } from "@/components/modules/water-bill/reading-source-master";
import { fetchReadingSourcesPagedServerAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchReadingSourcesPagedServerAction(1, 10);

  return (
    <>
      <ReadingSourceMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
      />
      <ReadingSourceForm id={null} />
    </>
  );
}
