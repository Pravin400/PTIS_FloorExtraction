import React from "react";
import AliasMasterForm from "@/components/modules/configuration-settings/alias-master/AliasMasterForm";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  return <AliasMasterForm id={null} initialData={null} />;
}
