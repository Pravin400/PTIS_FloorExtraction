 
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { calcAreaSqM, OffsetEntry } from "@/lib/utils/asset-utils/room-utils";
import { OpenSpace, computeOpenSpace } from '@/lib/utils/asset-utils/new-add-new-asset/open-space.model';

function makeId() {
  return Math.random().toString(36).substr(2, 9);
}

/** Owns the offset-popup state shared by the open-space form and the saved
 * open-spaces table. */
export function useOpenSpaceOffsetPopup(
  _isOpen: boolean,
  spacesList: OpenSpace[],
  setSpacesList: React.Dispatch<React.SetStateAction<OpenSpace[]>>,
  form: OpenSpace,
  setForm: React.Dispatch<React.SetStateAction<OpenSpace>>
) {
  const [offsetPopupSpaceId, setOffsetPopupSpaceId] = useState<string | null>(null);
  const [isFormOffsetOpen, setIsFormOffsetOpen] = useState(false);

  const [tempOffsetShape, setTempOffsetShape] = useState("Rectangle");
  const [tempOffsetLength, setTempOffsetLength] = useState(0);
  const [tempOffsetWidth, setTempOffsetWidth] = useState(0);
  const [tempOffsetHeight, setTempOffsetHeight] = useState(0);
  const [tempOffsetBase1, setTempOffsetBase1] = useState(0);
  const [tempOffsetBase2, setTempOffsetBase2] = useState(0);
  const [tempOffsetRadius, setTempOffsetRadius] = useState(0);
  const [tempOffsetOp, setTempOffsetOp] = useState<"Add" | "Subtract">("Subtract");

  const [drawerOffsets, setDrawerOffsets] = useState<OffsetEntry[]>([]);

  // The space currently being edited in the offset popup
  const offsetSpace = isFormOffsetOpen
    ? form
    : spacesList.find((s) => s.id === offsetPopupSpaceId) || null;

  // Initialize popup state when it opens
  useEffect(() => {
    if (!isFormOffsetOpen && !offsetPopupSpaceId) {
      setTimeout(() => { setDrawerOffsets([]); }, 0);
      return;
    }
    if (offsetSpace) {
      setTimeout(() => { setDrawerOffsets(Array.isArray(offsetSpace.offsets) ? [...offsetSpace.offsets] : []); }, 0);
    }
  }, [isFormOffsetOpen, offsetPopupSpaceId, offsetSpace]);

  const tempOffsetAreaSqM = calcAreaSqM(
    tempOffsetShape,
    tempOffsetLength,
    tempOffsetWidth,
    tempOffsetHeight,
    tempOffsetBase1,
    tempOffsetBase2,
    tempOffsetRadius
  );

  const drawerNetAdjustmentSqM = drawerOffsets.reduce(
    (acc, off) => acc + off.areaSqM * (off.op === "Add" ? 1 : -1), 0,
  );

  const handleAddOffsetToHistory = () => {
    if (tempOffsetAreaSqM <= 0) {
      toast.error("Please enter valid dimensions for the offset.");
      return;
    }
    setDrawerOffsets((prev) => [
      ...prev,
      {
        id: makeId(),
        shape: tempOffsetShape,
        length: tempOffsetLength,
        width: tempOffsetWidth,
        height: tempOffsetHeight,
        base1: tempOffsetBase1,
        base2: tempOffsetBase2,
        radius: tempOffsetRadius,
        areaSqM: tempOffsetAreaSqM,
        op: tempOffsetOp,
      },
    ]);
    setTimeout(() => { setTempOffsetLength(0); }, 0); setTimeout(() => { setTempOffsetWidth(0); }, 0); setTimeout(() => { setTempOffsetHeight(0); }, 0);
    setTimeout(() => { setTempOffsetBase1(0); }, 0); setTimeout(() => { setTempOffsetBase2(0); }, 0); setTimeout(() => { setTempOffsetRadius(0); }, 0);
  };

  const handleRemoveOffsetFromHistory = (entryId: string) => {
    setTimeout(() => { setDrawerOffsets((prev) => prev.filter((o) => o.id !== entryId)); }, 0);
  };

  const handleOkSave = () => {
    if (isFormOffsetOpen) {
      setForm((prev: OpenSpace) => computeOpenSpace({
        ...prev, hasOffset: drawerOffsets.length > 0 ? "Yes" : "No", offsets: drawerOffsets,
      }));
    } else if (offsetPopupSpaceId) {
      setSpacesList((prev) => prev.map((s) => {
        if (s.id !== offsetPopupSpaceId) return s;
        return computeOpenSpace({
          ...s, hasOffset: drawerOffsets.length > 0 ? "Yes" : "No", offsets: drawerOffsets,
        });
      }));
    }
    setOffsetPopupSpaceId(null);
    setIsFormOffsetOpen(false);
  };

  const handleDrawerClose = () => {
    if (isFormOffsetOpen) {
      setForm((prev: OpenSpace) => computeOpenSpace({
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
    setDrawerOffsets,
    tempOffsetAreaSqM,
    drawerNetAdjustmentSqM,
    handleAddOffsetToHistory,
    handleRemoveOffsetFromHistory,
    handleOkSave,
    handleDrawerClose,
  };
}
