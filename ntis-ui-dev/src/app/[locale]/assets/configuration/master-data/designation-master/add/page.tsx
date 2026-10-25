import React from "react";
import { DesignationForm } from "@/components/modules/assets/configuration/master-data/designation-master";
import { getOwningDepartmentsAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const departments = await getOwningDepartmentsAction();

  return (
    <DesignationForm
      id={null}
      initialData={undefined}
      departments={departments}
    />
  );
}
