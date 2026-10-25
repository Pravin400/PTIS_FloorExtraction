import React from "react";
import { setRequestLocale } from "next-intl/server";
import GrievanceWorkflowStageMasterForm from "@/components/modules/assets/configuration/master-data/grievance-workflow-stage/GrievanceWorkflowStageMasterForm";

export const dynamic = "force-dynamic";

export default async function AddPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrievanceWorkflowStageMasterForm initialData={null} />;
}

