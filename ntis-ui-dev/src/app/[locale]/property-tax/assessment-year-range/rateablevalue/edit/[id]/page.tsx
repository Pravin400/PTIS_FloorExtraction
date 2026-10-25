import React from "react";
import { notFound } from "next/navigation";
import { AssessmentYearRangeForm, AssessmentYearRangeMaster } from "@/components/modules/property-tax/assessment-year-range";
import { rateableValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import {
  getAssessmentYearRangeRVByIdAction,
  createAssessmentYearRangeRVAction,
  updateAssessmentYearRangeRVAction,
  deleteAssessmentYearRangeRVAction,
  fetchAssessmentYearRangeRVPagedAction,
} from "../../action";
import { AssessmentYearRangeRV } from "@/types/assessment-year-range.types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id: idParam } = await params;

  // Parse and validate the ID
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  const [data, result] = await Promise.all([
    getAssessmentYearRangeRVByIdAction(id),
    fetchAssessmentYearRangeRVPagedAction(1, 10, "fromYear", "asc"),
  ]);

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
        id={id}
        initialData={data}
        createAction={createAssessmentYearRangeRVAction}
        updateAction={updateAssessmentYearRangeRVAction}
      />
    </>
  );
}
