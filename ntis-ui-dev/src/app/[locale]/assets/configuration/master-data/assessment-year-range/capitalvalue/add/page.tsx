import React from "react";
import { AssessmentYearRangeForm } from "@/components/modules/assets/configuration/master-data/assessment-year-range";
import { capitalValueConfig } from "@/components/modules/assets/configuration/master-data/assessment-year-range/config";
import { createAssessmentYearRangeCVAction, updateAssessmentYearRangeCVAction } from "../action";
import { AssessmentYearRangeCV } from "@/types/asset-masters/assessment-year-range.types";

export default async function AddPage(): Promise<React.ReactElement> {
  return (
    <AssessmentYearRangeForm<AssessmentYearRangeCV>
      config={capitalValueConfig}
      id={null}
      initialData={undefined}
      createAction={createAssessmentYearRangeCVAction}
      updateAction={updateAssessmentYearRangeCVAction}
    />
  );
}
