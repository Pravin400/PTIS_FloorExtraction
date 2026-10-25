import React from "react";
import { AssessmentYearRangeForm, AssessmentYearRangeMaster } from "@/components/modules/property-tax/assessment-year-range";
import { rateableValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import { createAssessmentYearRangeRVAction, updateAssessmentYearRangeRVAction, deleteAssessmentYearRangeRVAction, fetchAssessmentYearRangeRVPagedAction } from "../action";
import { AssessmentYearRangeRV } from "@/types/assessment-year-range.types";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchAssessmentYearRangeRVPagedAction(1, 10, "fromYear", "asc");

  return (
    <>
      <AssessmentYearRangeMaster<AssessmentYearRangeRV>
        config={rateableValueConfig}
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
        sortBy="fromYear"
        sortOrder="asc"
        deleteAction={deleteAssessmentYearRangeRVAction}
      />
      <AssessmentYearRangeForm<AssessmentYearRangeRV>
        config={rateableValueConfig}
        id={null}
        initialData={undefined}
        createAction={createAssessmentYearRangeRVAction}
        updateAction={updateAssessmentYearRangeRVAction}
      />
    </>
  );
}
