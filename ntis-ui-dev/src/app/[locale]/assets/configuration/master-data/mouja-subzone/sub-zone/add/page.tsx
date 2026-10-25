import React from "react";
import SubZoneFormDrawer from "@/components/modules/assets/configuration/master-data/mouja-subzone-master/SubZoneFormDrawer";
import { getMoujaDropdownAction } from "../../action";

interface AddSubZonePageProps {
  searchParams: Promise<{
    moujaId?: string;
  }>;
}

export default async function AddSubZonePage({
  searchParams,
}: AddSubZonePageProps): Promise<React.ReactElement> {
  const unwrappedSearchParams = await searchParams;
  const moujas = await getMoujaDropdownAction();
  const selectedMoujaId = unwrappedSearchParams.moujaId ? Number(unwrappedSearchParams.moujaId) : undefined;

  return (
    <SubZoneFormDrawer
      id={null}
      selectedMoujaId={selectedMoujaId}
      moujas={moujas}
    />
  );
}
