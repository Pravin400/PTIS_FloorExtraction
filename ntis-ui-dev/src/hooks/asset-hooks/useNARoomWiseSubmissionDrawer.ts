/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Room, blankRoom, computeRoom, makeId, sqmToSqft } from "@/lib/utils/asset-utils/room-utils";
import { mapUnitRoomsToDrawerRooms } from '@/lib/utils/asset-utils/new-add-new-asset/room-wise-submission-mapping.utils';
import { useRoomWiseOffsetPopup } from "./useRoomWiseOffsetPopup";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";

export function useNARoomWiseSubmissionDrawer({
  isOpen,
  onClose,
  unit,
  onSaveRooms,
}: {
  isOpen: boolean;
  onClose: () => void;
  unit: any;
  onSaveRooms: (rooms: Room[], calculatedAreaSqFt: number) => void;
}) {
  const t = useTranslations("addAssetForm");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<Room>(blankRoom(1));
  const [editingId, setEditingId] = useState<string | null>(null);

  const offsetPopup = useRoomWiseOffsetPopup(isOpen, rooms, setRooms, form, setForm, t);
  const { drawerOffsets: _drawerOffsets, setIsFormOffsetOpen, offsetPopupRoomId, setOffsetPopupRoomId } = offsetPopup;

  const { formData: assetFormData } = useNAAssetForm();
  const [roomTypes, setRoomTypes] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!isOpen || !unit) return;
    const existing = mapUnitRoomsToDrawerRooms(unit);
    setTimeout(() => { setRooms(existing); }, 0);

    if (existing.length > 0) {
      // Find the first room that hasn't been filled out yet (0 area), or default to the first room.
      const firstEmpty = existing.find((r) => !r.areaSqM || r.areaSqM <= 0) || existing[0];
      setTimeout(() => { setForm({ ...firstEmpty }); }, 0);
      setTimeout(() => { setEditingId(firstEmpty.id); }, 0);
    } else {
      setTimeout(() => { setForm(blankRoom(1)); }, 0);
      setTimeout(() => { setEditingId(null); }, 0);
    }
    
    setIsFormOffsetOpen(false);

    // Fetch dynamic room types based on asset category/type
    if (assetFormData?.categoryId && assetFormData?.typeId) {
      import('@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions')
        .then((m) => m.fetchRoomTypesAction(assetFormData.categoryId, assetFormData.typeId))
        .then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setRoomTypes(res.data);
          }
        })
        .catch((err) => console.error('Failed to load dynamic room types', err));
    }
  }, [isOpen, unit, assetFormData?.categoryId, assetFormData?.typeId, setIsFormOffsetOpen]);

  const setMainDim = (key: any, val: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: parseFloat(val) || 0 };
      return computeRoom(next);
    });
  };

  const setShape = (shape: string) => {
    setForm((prev) => computeRoom({ ...prev, shape, length: 0, width: 0, height: 0, base1: 0, base2: 0, radius: 0 }));
  };

  const handleAdd = () => {
    if (form.areaSqM <= 0) { toast.error(t("subunit.toasts.failed") || "Enter valid dimensions (area must be > 0)."); return; }
    if (!form.count || form.count <= 0) { toast.error("Count must be greater than 0."); return; }
    const computed = computeRoom(form);
    let updatedRooms: Room[];
    if (editingId) {
      updatedRooms = rooms.map((r) => r.id === editingId ? { ...computed, id: editingId } : r);
      setRooms(updatedRooms);
    } else {
      updatedRooms = [...rooms, { ...computed, id: makeId() }];
      setRooms(updatedRooms);
    }

    // Auto-select the next empty room (area 0) if it exists, otherwise prepare a new blank room
    const nextEmpty = updatedRooms.find((r) => !r.areaSqM || r.areaSqM <= 0);
    if (nextEmpty) {
      setForm({ ...nextEmpty });
      setEditingId(nextEmpty.id);
    } else {
      setTimeout(() => { setForm(blankRoom(updatedRooms.length + 1)); }, 0);
      setTimeout(() => { setEditingId(null); }, 0);
    }
    setIsFormOffsetOpen(false);
  };

  const handleEdit = (r: Room) => {
    setEditingId(r.id);
    setForm({ ...r });
    setIsFormOffsetOpen(false);
  };

  const handleDelete = (id: string) => {
    const updatedRooms = rooms.filter((r) => r.id !== id);
    setRooms(updatedRooms);
    if (editingId === id) { 
      setTimeout(() => { setEditingId(null); }, 0); 
      const nextEmpty = updatedRooms.find((r) => !r.areaSqM || r.areaSqM <= 0);
      if (nextEmpty) {
        setForm({ ...nextEmpty });
        setEditingId(nextEmpty.id);
      } else {
        const totalRoomsCount = updatedRooms.reduce((sum, r) => sum + (Number(r.count) || 1), 0);
        setTimeout(() => { setForm(blankRoom(totalRoomsCount + 1)); }, 0);
      }
      setIsFormOffsetOpen(false); 
    }
    if (offsetPopupRoomId === id) setOffsetPopupRoomId(null);
  };

  const toggleOffset = (roomId: string, val: "Yes" | "No") => {
    setRooms((prev) => prev.map((r) => {
      if (r.id !== roomId) return r;
      if (val === "No") {
        return computeRoom({
          ...r, hasOffset: "No", offsetAreaSqM: 0,
          offsetLength: 0, offsetWidth: 0, offsetHeight: 0, offsetBase1: 0, offsetBase2: 0, offsetRadius: 0
        });
      }
      return { ...r, hasOffset: "Yes" };
    }));
    if (val === "Yes") setOffsetPopupRoomId(roomId);
    else setOffsetPopupRoomId(null);
  };

  const handleFormOffsetToggle = (val: "Yes" | "No") => {
    if (val === "No") {
      setForm((prev) => computeRoom({
        ...prev, hasOffset: "No", offsetAreaSqM: 0,
        offsetLength: 0, offsetWidth: 0, offsetHeight: 0, offsetBase1: 0, offsetBase2: 0, offsetRadius: 0
      }));
      setIsFormOffsetOpen(false);
    } else {
      setForm((prev) => computeRoom({ ...prev, hasOffset: "Yes" }));
      setIsFormOffsetOpen(true);
    }
  };

  const carpetSqM = rooms.reduce((acc, r) => {
    const netA = r.netAreaSqM * r.count;
    if (r.minus === "Yes") return acc - netA;
    if (r.outer === "Yes") return acc + netA * 0.8;
    return acc + netA;
  }, 0);
  const builtUpSqM = Math.max(0, carpetSqM) * 1.2;
  const carpetSqFt = sqmToSqft(Math.max(0, carpetSqM));
  const builtUpSqFt = sqmToSqft(builtUpSqM);

  const handleSaveAndClose = () => {
    onSaveRooms(rooms, carpetSqFt);
    onClose();
  };

  return {
    t,
    rooms,
    form,
    setForm,
    editingId,
    setEditingId,
    ...offsetPopup,
    handleAdd,
    handleEdit,
    handleDelete,
    toggleOffset,
    handleFormOffsetToggle,
    carpetSqM,
    carpetSqFt,
    builtUpSqM,
    builtUpSqFt,
    handleSaveAndClose,
    setMainDim,
    setShape,
    roomTypes,
  };
}
