import React from "react";
import OwningDepartmentForm from "@/components/modules/assets/configuration/master-data/owning-department/OwningDepartmentForm";
import { getOwningDepartmentByIdAction } from "../../action";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("owning-department/edit");

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id: departmentIdParam } = await params;

  const departmentId = Number(departmentIdParam);
  if (!Number.isFinite(departmentId) || departmentId <= 0) {
    notFound();
  }

  let departmentData = null;
  try {
    departmentData = await getOwningDepartmentByIdAction(departmentId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to load details for editing", { error });
    throw error;
  }

  return <OwningDepartmentForm id={departmentId} initialData={departmentData} />;
}
