/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { calcAreaSqM, OffsetEntry } from "@/lib/utils/asset-utils/room-utils";
import { Amenity, computeAmenity, makeAmenityId } from '@/lib/utils/asset-utils/new-add-new-asset/amenity.model';

/** Owns the offset-popup state shared by the amenity form and the saved
 * amenities table. */
export function useAmenityOffsetPopup(
  isOpen: boolean,
  spacesList: Amenity[],
  setSpacesList: React.Dispatch<React.SetStateAction<Amenity[]>>,
  form: Amenity,
  setForm: React.Dispatch<React.SetStateAction<Amenity>>
) {
  const [offsetPopupSpaceId, setOffsetPopupSpaceId] = useState<string | null>(null);
  const [isFormOffsetOpen, setIsFormOffsetOpen] = useState(false);
  const offsetSpace = offsetPopupSpaceId
    ? spacesList.find((s: any) => s.id === offsetPopupSpaceId)
    : isFormOffsetOpen ? form : null;

  const [tempOffsetShape, setTempOffsetShape] = useState<string>("Rectangle");
  const [tempOffsetLength, setTempOffsetLength] = useState<number>(0);
  const [tempOffsetWidth, setTempOffsetWidth] = useState<number>(0);
  const [tempOffsetHeight, setTempOffsetHeight] = useState<number>(0);
  const [tempOffsetBase1, setTempOffsetBase1] = useState<number>(0);
  const [tempOffsetBase2, setTempOffsetBase2] = useState<number>(0);
  const [tempOffsetRadius, setTempOffsetRadius] = useState<number>(0);
  const [tempOffsetOp, setTempOffsetOp] = useState<"Add" | "Subtract">("Subtract");
  const [drawerOffsets, setDrawerOffsets] = useState<OffsetEntry[]>([]);

  useEffect(() => {
    if (offsetSpace) {
      setTimeout(() => { setDrawerOffsets(Array.isArray(offsetSpace.offsets) ? offsetSpace.offsets : []); }, 0);
      setTimeout(() => { setTempOffsetShape("Rectangle"); }, 0);
      setTimeout(() => { setTempOffsetLength(0); }, 0); setTimeout(() => { setTempOffsetWidth(0); }, 0); setTimeout(() => { setTempOffsetHeight(0); }, 0);
      setTimeout(() => { setTempOffsetBase1(0); }, 0); setTimeout(() => { setTempOffsetBase2(0); }, 0); setTimeout(() => { setTempOffsetRadius(0); }, 0);
      setTimeout(() => { setTempOffsetOp("Subtract"); }, 0);
    } else {
      setTimeout(() => { setDrawerOffsets([]); }, 0);
    }
  }, [offsetPopupSpaceId, isFormOffsetOpen, offsetSpace, isOpen]);

  const tempOffsetAreaSqM = calcAreaSqM(
    tempOffsetShape, tempOffsetLength, tempOffsetWidth, tempOffsetHeight,
    tempOffsetBase1, tempOffsetBase2, tempOffsetRadius
  );

  const drawerNetAdjustmentSqM = drawerOffsets.reduce(
    (acc, off) => acc + off.areaSqM * (off.op === "Add" ? 1 : -1), 0
  );

  const handleAddOffsetToHistory = () => {
    if (tempOffsetAreaSqM <= 0) {
      toast.error("Please enter valid dimensions for the offset.");
      return;
    }
    setDrawerOffsets((prev: any) => [
      ...prev,
      {
        id: makeAmenityId(), shape: tempOffsetShape,
        length: tempOffsetLength, width: tempOffsetWidth, height: tempOffsetHeight,
        base1: tempOffsetBase1, base2: tempOffsetBase2, radius: tempOffsetRadius,
        areaSqM: tempOffsetAreaSqM, op: tempOffsetOp,
      },
    ]);
    setTimeout(() => { setTempOffsetLength(0); }, 0); setTimeout(() => { setTempOffsetWidth(0); }, 0); setTimeout(() => { setTempOffsetHeight(0); }, 0);
    setTimeout(() => { setTempOffsetBase1(0); }, 0); setTimeout(() => { setTempOffsetBase2(0); }, 0); setTimeout(() => { setTempOffsetRadius(0); }, 0);
  };

  const handleRemoveOffsetFromHistory = (entryId: string) => {
    setTimeout(() => { setDrawerOffsets((prev: any) => prev.filter((o: any) => o.id !== entryId)); }, 0);
  };

  const handleOkSave = () => {
    if (isFormOffsetOpen) {
      setForm((prev: any) => computeAmenity({
        ...prev, hasOffset: drawerOffsets.length > 0 ? "Yes" : "No", offsets: drawerOffsets,
      }));
    } else if (offsetPopupSpaceId) {
      setSpacesList((prev: any) => prev.map((s: any) => {
        if (s.id !== offsetPopupSpaceId) return s;
        return computeAmenity({
          ...s, hasOffset: drawerOffsets.length > 0 ? "Yes" : "No", offsets: drawerOffsets,
        });
      }));
    }
    setOffsetPopupSpaceId(null);
    setIsFormOffsetOpen(false);
  };

  const handleDrawerClose = () => {
    if (isFormOffsetOpen) {
      setForm((prev: Amenity) => computeAmenity({
        ...prev,
        hasOffset: Array.isArray(prev.offsets) && prev.offsets.length > 0 ? "Yes" : "No",
      }));
    }
    setOffsetPopupSpaceId(null);
    setIsFormOffsetOpen(false);
  };

  return {
    offsetPopupSpaceId,
    setOffsetPopupSpaceId,
    isFormOffsetOpen,
    setIsFormOffsetOpen,
    offsetSpace,
    tempOffsetShape,
    setTempOffsetShape,
    tempOffsetLength,
    setTempOffsetLength,
    tempOffsetWidth,
    setTempOffsetWidth,
    tempOffsetHeight,
    setTempOffsetHeight,
    tempOffsetBase1,
    setTempOffsetBase1,
    tempOffsetBase2,
    setTempOffsetBase2,
    tempOffsetRadius,
    setTempOffsetRadius,
    tempOffsetOp,
    setTempOffsetOp,
    drawerOffsets,
    tempOffsetAreaSqM,
    drawerNetAdjustmentSqM,
    handleAddOffsetToHistory,
    handleRemoveOffsetFromHistory,
    handleOkSave,
    handleDrawerClose,
  };
}
