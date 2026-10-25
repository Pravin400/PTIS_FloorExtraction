import React from "react";
import { setRequestLocale } from "next-intl/server";
import GrievanceWorkflowStageMasterForm from "@/components/modules/assets/configuration/master-data/grievance-workflow-stage/GrievanceWorkflowStageMasterForm";
import { getGrievanceWorkflowStageMasterByIdAction } from "../../action";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ stageId: string; locale: string }>;
}

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { stageId: stageIdParam, locale } = await params;
  setRequestLocale(locale);

  const stageId = Number(stageIdParam);
  if (!Number.isInteger(stageId) || stageId <= 0) {
    notFound();
  }

  let initialData = null;
  try {
    initialData = await getGrievanceWorkflowStageMasterByIdAction(stageIdParam);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  if (!initialData) {
    notFound();
  }

  return <GrievanceWorkflowStageMasterForm initialData={initialData} />;
}

