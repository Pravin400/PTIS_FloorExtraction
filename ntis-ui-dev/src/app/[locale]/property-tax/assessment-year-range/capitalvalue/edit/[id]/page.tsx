import React from "react";
import { notFound } from "next/navigation";
import { AssessmentYearRangeForm, AssessmentYearRangeMaster } from "@/components/modules/property-tax/assessment-year-range";
import { capitalValueConfig } from "@/components/modules/property-tax/assessment-year-range/config";
import {
  getAssessmentYearRangeCVByIdAction,
  createAssessmentYearRangeCVAction,
  updateAssessmentYearRangeCVAction,
  deleteAssessmentYearRangeCVAction,
  fetchAssessmentYearRangeCVPagedAction,
} from "../../action";
import { AssessmentYearRangeCV } from "@/types/assessment-year-range.types";

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
    getAssessmentYearRangeCVByIdAction(id),
    fetchAssessmentYearRangeCVPagedAction(1, 10, "fromYear", "asc"),
  ]);

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
        id={id}
        initialData={data}
        createAction={createAssessmentYearRangeCVAction}
        updateAction={updateAssessmentYearRangeCVAction}
      />
    </>
  );
}
