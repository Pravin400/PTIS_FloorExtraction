import React from "react";
import MoujaFormDrawer from "@/components/modules/assets/configuration/master-data/mouja-subzone-master/MoujaFormDrawer";
import { fetchMoujaByIdAction } from "../../../action";

interface EditMoujaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditMoujaPage({
  params,
}: EditMoujaPageProps): Promise<React.ReactElement> {
  const unwrappedParams = await params;
  const id = Number(unwrappedParams.id);
  const data = await fetchMoujaByIdAction(id);

  return (
    <MoujaFormDrawer
      id={id}
      initialData={data}
    />
  );
}
