import React from "react";
import { OwnershipTypeForm } from "@/components/modules/assets/configuration/master-data/ownership-type-master";
import { getOwnershipTypeByIdAction } from "../../actions";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  
  const typeData = await getOwnershipTypeByIdAction(id);

  if (!typeData) {
    notFound();
  }

  return <OwnershipTypeForm id={Number(id)} initialData={typeData as unknown as import("@/types/asset-masters/ownership-type.types").OwnershipTypeFormModel} />;
}
