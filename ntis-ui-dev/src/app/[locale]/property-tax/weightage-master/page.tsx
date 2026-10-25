import React from "react";
import FloorCvWeightageMaster from "@/components/modules/property-tax/weightage-mastercv/floorFactorCv/FloorCvWeightageMaster";
import { fetchFloorFactorCVMasterPagedServerAction } from "./action";
import { getAssessmentYearsPagedServerCV, getFloorPaged } from "@/lib/api/floor-cv-weightageMaster.service";


/** Allowed column names accepted by the API (PascalCase as required by backend) */
const ALLOWED_SORT_COLUMNS = ["FloorCode", "FloorDescription", "FromYear"] as const;
const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

interface PageProps {
  searchParams?: {
    page?: string;
    pageSize?: string;
    q?: string;
    selectedYearRange?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params =await searchParams ?? {};
  
  // Sanitize and clamp pagination params to safe defaults
  // Protects against malformed query params (NaN, negative, excessive values)
  let pageNumber = Number(params.page);
  let pageSize = Number(params.pageSize);
  
  // Clamp pageNumber: must be finite, >= 1, and <= 10000 (reasonable upper bound)
  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    pageNumber = 1;
  } else if (pageNumber > 10000) {
    pageNumber = 10000;
  } else {
    pageNumber = Math.floor(pageNumber); // Ensure integer
  }
  
  // Clamp pageSize: must be finite, between 1 and 100
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    pageSize = 10;
  } else if (pageSize > 100) {
    pageSize = 100;
  } else {
    pageSize = Math.floor(pageSize); // Ensure integer
  }
  
  // Sanitize string params - trim and limit length to prevent injection/overflow
  const searchTerm = params.q?.trim().slice(0, 200) || undefined;
  const selectedYearRange = params.selectedYearRange?.trim().slice(0, 50) || undefined;

  // Whitelist-based sort validation
  const sortByRaw = params.sortBy?.trim() ?? "";
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
    : undefined;

  const sortOrderRaw = params.sortOrder?.trim().toLowerCase() ?? "";
  const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
    : undefined;

  // Fetch assessment years for dropdowns
  const assessmentYearData = await getAssessmentYearsPagedServerCV(1, -1);
  const assessmentYearOptions = assessmentYearData.items
    .filter((year) => year.isActive)
    .map((year) => ({
      label: `${year.fromYear}-${year.toYear}`,
      value: year.id.toString(),
    }));

  const result = await fetchFloorFactorCVMasterPagedServerAction(pageNumber, pageSize, searchTerm, selectedYearRange, sortBy, sortOrder);

  // Fetch floor data for dropdowns
  const floorData = await getFloorPaged(1, -1); // Fetch all floors
  const floorOptions = floorData.items
    .filter((floor) => floor.isActive)
    .map((floor) => ({
      label: `${floor.floorCode} - ${floor.description}`,
      value: floor.id.toString(),
    }));

  return (
    <div className="pt-6">
      <FloorCvWeightageMaster
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
        floorOptions={floorOptions}
        assessmentYearOptions={assessmentYearOptions}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}