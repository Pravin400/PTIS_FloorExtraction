import React from "react";
import SubZoneFormDrawer from "@/components/modules/assets/configuration/master-data/mouja-subzone-master/SubZoneFormDrawer";
import { fetchSubZoneByIdAction, getMoujaDropdownAction } from "../../../action";

interface EditSubZonePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSubZonePage({
  params,
}: EditSubZonePageProps): Promise<React.ReactElement> {
  const unwrappedParams = await params;
  const id = Number(unwrappedParams.id);
  
  const data = await fetchSubZoneByIdAction(id);
  const moujas = await getMoujaDropdownAction(data?.moujaId);

  return (
    <SubZoneFormDrawer
      id={id}
      initialData={data}
      moujas={moujas}
    />
  );
}
