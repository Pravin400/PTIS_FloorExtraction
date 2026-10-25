import React from "react";
import OfficeForm from "@/components/modules/configuration-settings/office-master/OfficeForm";
import { getOfficeByIdAction } from "@/app/[locale]/configuration-settings/office-master/action";
import { notFound } from "next/navigation";

export default async function EditOfficePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const officeId = parseInt(id, 10);
  
  if (isNaN(officeId) || officeId <= 0) {
    notFound();
  }

  let officeData;
  try {
    officeData = await getOfficeByIdAction(officeId);
  } catch (_error) {
    notFound();
  }

  return <OfficeForm officeId={officeId} initialData={officeData} />;
}
