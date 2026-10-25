import { FloorForm } from "@/components/modules/property-tax/Floormaster/floor";
import FloorMaster from "@/components/modules/property-tax/Floormaster/floor/FloorMaster";
import { fetchFloorPagedServerAction } from "@/app/[locale]/property-tax/floormaster/actions";
import { getFloorById } from "@/lib/api/floor.service";
import React from "react";

export const dynamic = "force-dynamic";

export default async function EditPage({ 
  params 
}: Readonly<{ params: Promise<{ id: string }> }>): Promise<React.ReactElement> {
  const { id } = await params;
  const floorId = Number(id);
  const [result, floor] = await Promise.all([
    fetchFloorPagedServerAction(1, 10, "", undefined, undefined),
    getFloorById(floorId),
  ]);
  
  return (
    <>
      <FloorMaster floorPaged={result} />
      <FloorForm id={floorId} initialData={floor} />
    </>
  );
}