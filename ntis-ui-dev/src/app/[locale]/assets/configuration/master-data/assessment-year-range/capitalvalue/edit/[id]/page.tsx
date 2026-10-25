import React from "react";
import { notFound } from "next/navigation";
import { AssessmentYearRangeForm } from "@/components/modules/assets/configuration/master-data/assessment-year-range";
import { capitalValueConfig } from "@/components/modules/assets/configuration/master-data/assessment-year-range/config";
import {
  getAssessmentYearRangeCVByIdAction,
  createAssessmentYearRangeCVAction,
  updateAssessmentYearRangeCVAction,
} from "../../action";
import { AssessmentYearRangeCV } from "@/types/asset-masters/assessment-year-range.types";
import { ApiError } from "@/lib/utils/api";

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

  // Fetch data server-side
  let data: AssessmentYearRangeCV;
  try {
    data = await getAssessmentYearRangeCVByIdAction(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    console.error("Failed to fetch assessment year range:", error);
    throw error;
  }

  return (
    <AssessmentYearRangeForm<AssessmentYearRangeCV>
      config={capitalValueConfig}
      id={id}
      initialData={data}
      createAction={createAssessmentYearRangeCVAction}
      updateAction={updateAssessmentYearRangeCVAction}
    />
  );
}
