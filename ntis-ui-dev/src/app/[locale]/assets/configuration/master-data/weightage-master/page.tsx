import React from "react";
import FloorCvWeightageMaster from "@/components/modules/assets/configuration/master-data/weightage-mastercv/floorFactorCv/FloorCvWeightageMaster";
import {
  fetchFloorFactorCVMasterPagedServerAction,
  fetchAssessmentYearsPagedAction,
  fetchFloorPagedAction,
} from "./action";
import { PagedResponse } from "@/types/common.types";
import { FloorFactorCVMaster } from "@/types/asset-masters/floor-cv-weightageMaster.types";
import { createLogger } from "@/lib/utils/server-logger";

const ALLOWED_SORT_COLUMNS = [
  "FloorId",
  "YearRangeCVId",
  "IsActive",
  "FloorCode",
  "FloorDescription",
  "FromYear",
] as const;

const ALLOWED_SORT_ORDERS = ["asc", "desc"] as const;

interface PageProps {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    selectedYearRange?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const logger = createLogger('page/weightage-master');
  const params = await searchParams ?? {};

  // ---------------------------------------------------------------------------
  // Sanitize and clamp pagination params to safe defaults.
  // Protects against malformed query params (NaN, negative, excessive values).
  // ---------------------------------------------------------------------------

  let pageNumber = Number(params.page);
  let pageSize = Number(params.pageSize);

  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    pageNumber = 1;
  } else if (pageNumber > 10000) {
    pageNumber = 10000;
  } else {
    pageNumber = Math.floor(pageNumber);
  }

  if (!Number.isFinite(pageSize) || pageSize < 1) {
    pageSize = 10;
  } else if (pageSize > 100) {
    pageSize = 100;
  } else {
    pageSize = Math.floor(pageSize);
  }

  // Sanitize string params — trim and limit length to prevent injection/overflow
  const searchTerm = params.q?.trim().slice(0, 200) || undefined;
  const selectedYearRange = params.selectedYearRange?.trim().slice(0, 50) || undefined;

  // Whitelist-based sort validation — uses the same constant as action.ts
  const sortByRaw = params.sortBy?.trim() ?? "";
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
    : undefined;

  const sortOrderRaw = params.sortOrder?.trim().toLowerCase() ?? "";
  const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
    : undefined;

  // ---------------------------------------------------------------------------
  // Limit max options fetched during SSR to prevent unbounded payload allocation
  const MAX_DROPDOWN_OPTION_SIZE = 500;

  const [assessmentYearResult, tableResult, floorResult] = await Promise.allSettled([
    fetchAssessmentYearsPagedAction(1, MAX_DROPDOWN_OPTION_SIZE),
    fetchFloorFactorCVMasterPagedServerAction(
      pageNumber, pageSize, searchTerm, selectedYearRange, sortBy, sortOrder
    ),
    fetchFloorPagedAction(1, MAX_DROPDOWN_OPTION_SIZE),
  ]);

  // Assessment year options
  let assessmentYearOptions: { label: string; value: string }[] = [];
  if (assessmentYearResult.status === 'fulfilled') {
    assessmentYearOptions = (assessmentYearResult.value?.items || []).map((year) => ({
      label: `${year.fromYear}-${year.toYear}`,
      value: (year.id || year.yearId || '').toString(),
    }));
  } else {
    logger.error("Failed to load assessment year options", {}, assessmentYearResult.reason);
  }

  // Table data
  const emptyResult: PagedResponse<FloorFactorCVMaster> = {
    items: [],
    totalCount: 0,
    pageNumber,
    pageSize,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  };
  let result: PagedResponse<FloorFactorCVMaster> = emptyResult;
  if (tableResult.status === 'fulfilled') {
    result = tableResult.value;
  } else {
    logger.error("Failed to load floor factor CV master records", {}, tableResult.reason);
  }

  // Floor options for dropdowns
  let floorOptions: { label: string; value: string }[] = [];
  if (floorResult.status === 'fulfilled') {
    floorOptions = (floorResult.value?.items || []).map((floor) => ({
      label: `${floor.floorCode} - ${floor.description}`,
      value: floor.id.toString(),
    }));
  } else {
    logger.error("Failed to load floor options", {}, floorResult.reason);
  }

  return (
    <div className="pt-6">
      <FloorCvWeightageMaster
        data={result.items || []}
        pageNumber={result.pageNumber || pageNumber}
        pageSize={result.pageSize || pageSize}
        totalCount={result.totalCount || 0}
        totalPages={result.totalPages || 0}
        floorOptions={floorOptions}
        assessmentYearOptions={assessmentYearOptions}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  );
}