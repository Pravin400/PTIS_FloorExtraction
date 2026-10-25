import { SubFloorForm } from "@/components/modules/property-tax/Floormaster/subfloor";
import SubFloorMaster from "@/components/modules/property-tax/Floormaster/subfloor/SubFloorMaster";
import { fetchSubFloorPagedServerAction } from "@/app/[locale]/property-tax/floormaster/actions";
import { getSubFloorById } from "@/lib/api/subfloor.service";
import React from "react";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const subFloorId = Number(id);
  const [result, subFloor] = await Promise.all([
    fetchSubFloorPagedServerAction(1, 10, ""),
    getSubFloorById(subFloorId),
  ]);
  
  return (
    <>
      <SubFloorMaster subFloorPaged={result} />
      <SubFloorForm id={subFloorId} initialData={subFloor} />
    </>
  );
}
