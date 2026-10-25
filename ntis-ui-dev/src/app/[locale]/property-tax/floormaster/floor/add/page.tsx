import { FloorForm } from "@/components/modules/property-tax/Floormaster/floor";
import FloorMaster from "@/components/modules/property-tax/Floormaster/floor/FloorMaster";
import { fetchFloorPagedServerAction } from "@/app/[locale]/property-tax/floormaster/actions";
import React from "react";
import { getFloorPaged, getMaxFlatGenerationSeq } from "@/lib/api/floor.service";
import type { Floor } from "@/types/floor.types";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchFloorPagedServerAction(1, 10, "", undefined, undefined);

  // Fetch the max sequence and prefill the next one for convenience.
  let maxSequenceNo = 0;
  let maxFlatGenerationSeq = 0;

  try {
    const response = await getFloorPaged(1, 1, undefined, "sequenceNo", "desc");
    if (response?.items?.length) {
      maxSequenceNo = response.items[0].sequenceNo || 0;
    }
  } catch {
    // Ignore error when prefilling max sequenceNo
  }

  try {
    maxFlatGenerationSeq = await getMaxFlatGenerationSeq(1);
  } catch {
    // Ignore error when prefilling flat generation sequence
  }

  const initialData = {
    id: 0,
    floorCode: "",
    descriptionEnglish: "",
    description: "",
    sequenceNo: maxSequenceNo > 0 ? maxSequenceNo + 1 : 1,
    fLatGenerationGroupId: 1,
    fLatGenerationSeq: maxFlatGenerationSeq > 0 ? maxFlatGenerationSeq + 1 : 1,
    isActive: true,
  } as Floor;

  return (
    <>
      <FloorMaster floorPaged={result} />
      <FloorForm id={null} initialData={initialData} />
    </>
  );
}