import React from "react";
import AssetGrievanceRemarkForm from "@/components/modules/assets/configuration/master-data/grievance-remark-master/AssetGrievanceRemarkForm";
import { getGrievanceCategoriesAction } from "../action";

export default async function AddPage(): Promise<React.ReactElement> {
  const categories = await getGrievanceCategoriesAction();
  return (
    <AssetGrievanceRemarkForm
      id={null}
      initialData={undefined}
      categories={categories.map((c) => ({
        id: c.id,
        grievanceTypeName: c.grievanceTypeName,
      }))}
    />
  );
}
