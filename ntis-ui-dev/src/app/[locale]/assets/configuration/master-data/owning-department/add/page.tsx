import React from "react";
import OwningDepartmentForm from "@/components/modules/assets/configuration/master-data/owning-department/OwningDepartmentForm";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  return <OwningDepartmentForm id={null} initialData={null} />;
}
