 
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Room, OffsetEntry, computeRoom, makeId, calcAreaSqM } from "@/lib/utils/asset-utils/room-utils";

/** Owns the offset-popup state shared by the room form and the saved-rooms
 * table: which room/form the popup is editing, the temp dimension fields,
 * and the running offset history for whichever target is currently open. */
export function useRoomWiseOffsetPopup(
  isOpen: boolean,
  rooms: Room[],
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>,
  form: Room,
  setForm: React.Dispatch<React.SetStateAction<Room>>,
  t: (key: string) => string
) {
  const [offsetPopupRoomId, setOffsetPopupRoomId] = useState<string | null>(null);
  const [isFormOffsetOpen, setIsFormOffsetOpen] = useState(false);

  const offsetRoom = offsetPopupRoomId
    ? rooms.find((r) => r.id === offsetPopupRoomId)
    : isFormOffsetOpen
      ? form
      : null;

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
    if (offsetRoom) {
      setTimeout(() => { setDrawerOffsets(Array.isArray(offsetRoom.offsets) ? offsetRoom.offsets : []); }, 0);
      setTimeout(() => { setTempOffsetShape("Rectangle"); }, 0);
      setTimeout(() => { setTempOffsetLength(0); }, 0); setTimeout(() => { setTempOffsetWidth(0); }, 0); setTimeout(() => { setTempOffsetHeight(0); }, 0);
      setTimeout(() => { setTempOffsetBase1(0); }, 0); setTimeout(() => { setTempOffsetBase2(0); }, 0); setTimeout(() => { setTempOffsetRadius(0); }, 0);
      setTimeout(() => { setTempOffsetOp("Subtract"); }, 0);
    } else {
      setTimeout(() => { setDrawerOffsets([]); }, 0);
    }
  }, [offsetPopupRoomId, isFormOffsetOpen, offsetRoom, isOpen]);

  const tempOffsetAreaSqM = calcAreaSqM(
    tempOffsetShape, tempOffsetLength, tempOffsetWidth, tempOffsetHeight,
    tempOffsetBase1, tempOffsetBase2, tempOffsetRadius
  );

  const drawerNetAdjustmentSqM = drawerOffsets.reduce((acc, off) => {
    return acc + off.areaSqM * (off.op === "Add" ? 1 : -1);
  }, 0);

  const handleAddOffsetToHistory = () => {
    if (tempOffsetAreaSqM <= 0) {
      toast.error(t("subunit.toasts.failed") || "Please enter valid dimensions for the offset.");
      return;
    }
    const newEntry: OffsetEntry = {
      id: makeId(), shape: tempOffsetShape, length: tempOffsetLength, width: tempOffsetWidth, height: tempOffsetHeight,
      base1: tempOffsetBase1, base2: tempOffsetBase2, radius: tempOffsetRadius, areaSqM: tempOffsetAreaSqM, op: tempOffsetOp,
    };
    setTimeout(() => { setDrawerOffsets((prev) => [...prev, newEntry]); }, 0);
    setTimeout(() => { setTempOffsetLength(0); }, 0); setTimeout(() => { setTempOffsetWidth(0); }, 0); setTimeout(() => { setTempOffsetHeight(0); }, 0);
    setTimeout(() => { setTempOffsetBase1(0); }, 0); setTimeout(() => { setTempOffsetBase2(0); }, 0); setTimeout(() => { setTempOffsetRadius(0); }, 0);
  };

  const handleRemoveOffsetFromHistory = (entryId: string) => {
    setTimeout(() => { setDrawerOffsets((prev) => prev.filter((off) => off.id !== entryId)); }, 0);
  };

  const handleOkSave = () => {
    if (isFormOffsetOpen && form.id === offsetRoom?.id) {
      setForm((prev) => computeRoom({
        ...prev, hasOffset: drawerOffsets.length > 0 ? "Yes" : "No", offsets: drawerOffsets,
      }));
    } else if (offsetPopupRoomId) {
      setRooms((prev) => prev.map((r) => {
        if (r.id !== offsetPopupRoomId) return r;
        return computeRoom({
          ...r, hasOffset: drawerOffsets.length > 0 ? "Yes" : "No", offsets: drawerOffsets,
        });
      }));
    }
    setOffsetPopupRoomId(null);
    setIsFormOffsetOpen(false);
  };

  const handleDrawerClose = () => {
    if (isFormOffsetOpen) {
      setForm((prev) => computeRoom({
        ...prev,
        hasOffset: Array.isArray(prev.offsets) && prev.offsets.length > 0 ? "Yes" : "No",
      }));
    }
    setOffsetPopupRoomId(null);
    setIsFormOffsetOpen(false);
  };

  return {
    offsetPopupRoomId,
    setOffsetPopupRoomId,
    isFormOffsetOpen,
    setIsFormOffsetOpen,
    offsetRoom,
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
