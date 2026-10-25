import React from "react";
import PenaltyRuleMasterForm from "@/components/modules/assets/configuration/master-data/penalty-rule-master/PenaltyRuleMasterForm";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  return <PenaltyRuleMasterForm id={null} initialData={null} />;
}
