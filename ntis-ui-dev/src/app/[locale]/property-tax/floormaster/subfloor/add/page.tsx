import { SubFloorForm } from "@/components/modules/property-tax/Floormaster/subfloor";
import SubFloorMaster from "@/components/modules/property-tax/Floormaster/subfloor/SubFloorMaster";
import { fetchSubFloorPagedServerAction } from "@/app/[locale]/property-tax/floormaster/actions";
import React from "react";
import { getSubFloorPaged } from "@/lib/api/subfloor.service";
import type { SubFloor } from "@/types/floor.types";

export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  const result = await fetchSubFloorPagedServerAction(1, 10, "");

  // Fetch the max sequence and prefill the next one for convenience.
  let maxSequenceNo = 0;

  try {
    const response = await getSubFloorPaged(1, 1, undefined, "sequenceNo", "desc");
    if (response?.items?.length) {
      const firstItem = response.items[0];
      maxSequenceNo = firstItem.sequenceNo ?? 0;
    }
  } catch {
    // Ignore error when prefilling max sequenceNo
  }

  const initialData = {
    id: 0,
    subFloorCode: "",
    description: "",
    sequenceNo: maxSequenceNo > 0 ? maxSequenceNo + 1 : 1,
    isActive: true,
    createdDate: "",
    updatedDate: null,
  } as SubFloor;

  return (
    <>
      <SubFloorMaster subFloorPaged={result} />
      <SubFloorForm id={null} initialData={initialData} />
    </>
  );
}