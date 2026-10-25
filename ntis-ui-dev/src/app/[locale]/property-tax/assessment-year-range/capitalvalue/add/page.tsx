import React from "react";
import { AssessmentYearRangeForm, AssessmentYearRangeMaster } from "@/components/modules/property-tax/assessment-year-range";
import { capitalValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import {
  createAssessmentYearRangeCVAction,
  updateAssessmentYearRangeCVAction,
  deleteAssessmentYearRangeCVAction,
  fetchAssessmentYearRangeCVPagedAction,
} from "../action";
import { AssessmentYearRangeCV } from "@/types/assessment-year-range.types";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchAssessmentYearRangeCVPagedAction(1, 10, "fromYear", "asc");

  return (
    <>
      <AssessmentYearRangeMaster<AssessmentYearRangeCV>
        config={capitalValueConfig}
        data={result.items}
        pageNumber={result.pageNumber}
        pageSize={result.pageSize}
        totalCount={result.totalCount}
        totalPages={result.totalPages}
        sortBy="fromYear"
        sortOrder="asc"
        deleteAction={deleteAssessmentYearRangeCVAction}
      />
      <AssessmentYearRangeForm<AssessmentYearRangeCV>
        config={capitalValueConfig}
        id={null}
        initialData={undefined}
        createAction={createAssessmentYearRangeCVAction}
        updateAction={updateAssessmentYearRangeCVAction}
      />
    </>
  );
}
