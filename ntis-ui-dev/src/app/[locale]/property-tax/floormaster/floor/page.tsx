import { Suspense } from "react";
import { fetchFloorPagedServerAction } from "@/app/[locale]/property-tax/floormaster/actions";
import type { FloorPagedResponse } from "@/types/floor.types";
import FloorMaster from "@/components/modules/property-tax/Floormaster/floor/FloorMaster";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function Page({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const pageNumber = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  const searchQuery = params?.q || "";
  const sortBy = params?.sortBy;
  const sortOrder = params?.sortOrder;

  const result: FloorPagedResponse =
    await fetchFloorPagedServerAction(
      pageNumber,
      pageSize,
      searchQuery,
      sortBy,
      sortOrder
    );

  return (
    <Suspense fallback={null}>
      <FloorMaster 
        floorPaged={result} 
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </Suspense>
  );
}