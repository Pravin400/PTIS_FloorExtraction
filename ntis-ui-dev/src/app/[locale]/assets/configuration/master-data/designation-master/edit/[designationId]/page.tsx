import DesignationForm from "@/components/modules/assets/configuration/master-data/designation-master/DesignationForm";
import { getDesignationByIdAction, getOwningDepartmentsAction } from "../../action";
import { notFound } from "next/navigation";
import type { Designation } from "@/types/asset-masters/designation.types";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("EditDesignationPage");

interface PageProps {
  params: Promise<{
    designationId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { designationId: designationIdParam } = await params;

  const designationId = Number(designationIdParam);
  if (!Number.isFinite(designationId) || designationId <= 0) {
    notFound();
  }

  let designationData: Designation;
  try {
    designationData = await getDesignationByIdAction(designationId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch designation", { designationId }, error);
    throw error;
  }

  const departments = await getOwningDepartmentsAction();

  return (
    <DesignationForm
      id={designationId}
      initialData={designationData}
      departments={departments}
    />
  );
}
