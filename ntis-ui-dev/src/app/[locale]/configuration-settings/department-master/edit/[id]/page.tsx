import React from "react";
import { getDepartmentByIdAction } from "@/app/[locale]/configuration-settings/department-master/action";
import { notFound } from "next/navigation";
import EditDepartmentClient from "./EditDepartmentClient";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const departmentId = parseInt(id, 10);
  
  if (isNaN(departmentId) || departmentId <= 0) {
    notFound();
  }

  let departmentData;
  try {
    departmentData = await getDepartmentByIdAction(departmentId);
  } catch (_error) {
    notFound();
  }

  return (
    <EditDepartmentClient 
      departmentData={departmentData} 
    />
  );
}
