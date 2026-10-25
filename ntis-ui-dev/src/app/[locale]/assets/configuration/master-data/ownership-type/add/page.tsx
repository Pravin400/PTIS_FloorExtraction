import React from "react";
import { OwnershipTypeForm } from "@/components/modules/assets/configuration/master-data/ownership-type-master";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  return <OwnershipTypeForm id={undefined} initialData={undefined} />;
}
