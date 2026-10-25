/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sqmToSqft } from "@/lib/utils/asset-utils/room-utils";
import { mapIncomingOpenSpaces } from '@/lib/utils/asset-utils/new-add-new-asset/space-mapping.utils';
import { OpenSpace, blankOpenSpace, computeOpenSpace } from '@/lib/utils/asset-utils/new-add-new-asset/open-space.model';
import { useOpenSpaceOffsetPopup } from "./useOpenSpaceOffsetPopup";

export type { OpenSpace } from '@/lib/utils/asset-utils/new-add-new-asset/open-space.model';
export { blankOpenSpace, computeOpenSpace } from '@/lib/utils/asset-utils/new-add-new-asset/open-space.model';

export function useOpenSpaceDrawer(isOpen: boolean, initialSpaces: any[], onSaveSpaces: (spaces: any[], calculatedAreaSqFt: number) => void) {
  const [spacesList, setSpacesList] = useState<OpenSpace[]>([]);
  const [form, setForm] = useState<OpenSpace>(blankOpenSpace(1));
  const [editingId, setEditingId] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  const offsetPopup = useOpenSpaceOffsetPopup(isOpen, spacesList, setSpacesList, form, setForm);
  const { setIsFormOffsetOpen, offsetPopupSpaceId, setOffsetPopupSpaceId } = offsetPopup;

  // Populate list from parent when drawer opens
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const mapped = mapIncomingOpenSpaces(initialSpaces || []);
    setSpacesList(mapped);

    if (mapped.length > 0) {
      const firstEmpty = mapped.find((s) => !s.areaSqM || s.areaSqM <= 0);
      if (firstEmpty) {
        setTimeout(() => { setForm({ ...firstEmpty }); }, 0);
        setTimeout(() => { setEditingId(firstEmpty.id); }, 0);
      } else {
        setTimeout(() => { setForm(blankOpenSpace(mapped.length + 1)); }, 0);
        setTimeout(() => { setEditingId(null); }, 0);
      }
    } else {
      setTimeout(() => { setForm(blankOpenSpace(1)); }, 0);
      setTimeout(() => { setEditingId(null); }, 0);
    }
    
    setIsFormOffsetOpen(false);
  }, [isOpen, initialSpaces, setIsFormOffsetOpen]);

  const toggleOffset = (spaceId: string, val: "Yes" | "No") => {
    setSpacesList((prev) => prev.map((s) => {
      if (s.id !== spaceId) return s;
      if (val === "No") return computeOpenSpace({ ...s, hasOffset: "No", offsets: [], offsetAreaSqM: 0 });
      return { ...s, hasOffset: val };
    }));
    if (val === "Yes") setOffsetPopupSpaceId(spaceId);
    else setOffsetPopupSpaceId(null);
  };

  const handleFormOffsetToggle = (val: "Yes" | "No") => {
    if (val === "No") {
      setForm((prev: OpenSpace) => computeOpenSpace({ ...prev, hasOffset: "No", offsets: [], offsetAreaSqM: 0 }));
      setIsFormOffsetOpen(false);
    } else {
      setForm((prev: OpenSpace) => computeOpenSpace({ ...prev, hasOffset: "Yes" }));
      setIsFormOffsetOpen(true);
    }
  };

  const handleAdd = () => {
    if (!form.name) {
      toast.error("Please select an Open Space Type.");
      return;
    }
    if (!form.shape) {
      toast.error("Please select a Shape.");
      return;
    }
    if (form.areaSqM <= 0) {
      toast.error("Please enter valid dimensions (area must be > 0).");
      return;
    }
    if (!form.count || form.count <= 0) {
      toast.error("Count must be greater than 0.");
      return;
    }
    const computed = computeOpenSpace(form);
    let updated: OpenSpace[];
    if (editingId) {
      updated = spacesList.map((s) => s.id === editingId ? { ...computed, id: editingId } : s);
    } else {
      updated = [...spacesList, { ...computed, id: Math.random().toString(36).substr(2, 9) }];
    }
    setSpacesList(updated);

    // After updating or adding, clear form so all fields become blank for the next open space entry
    setTimeout(() => { setForm(blankOpenSpace(updated.length + 1)); }, 0);
    setTimeout(() => { setEditingId(null); }, 0);
    setIsFormOffsetOpen(false);

    const totalNetSqFt = updated.reduce((acc, s) => acc + s.netAreaSqFt * s.count, 0);
    onSaveSpaces(updated, totalNetSqFt);
  };

  const handleEdit = (s: OpenSpace) => {
    setEditingId(s.id);
    setForm({ ...s });
    setIsFormOffsetOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = spacesList.filter((s) => s.id !== id);
    setSpacesList(updated);
    if (editingId === id) {
      setTimeout(() => { setEditingId(null); }, 0);
      setTimeout(() => { setForm(blankOpenSpace(updated.length + 1)); }, 0);
      setIsFormOffsetOpen(false);
    }
    if (offsetPopupSpaceId === id) setOffsetPopupSpaceId(null);
    const totalNetSqFt = updated.reduce((acc, s) => acc + s.netAreaSqFt * s.count, 0);
    onSaveSpaces(updated, totalNetSqFt);
  };

  const totalNetSqM = spacesList.reduce((acc, s) => acc + s.netAreaSqM * s.count, 0);
  const totalNetSqFt = spacesList.reduce((acc, s) => acc + s.netAreaSqFt * s.count, 0);
  const totalGrossSqM = spacesList.reduce((acc, s) => acc + s.areaSqM * s.count, 0);
  const totalGrossSqFt = sqmToSqft(totalGrossSqM);

  const handleSaveAndClose = () => {
    onSaveSpaces?.(spacesList, totalNetSqFt);
  };

  return {
    spacesList,
    setSpacesList,
    form,
    setForm,
    editingId,
    setEditingId,
    ...offsetPopup,
    toggleOffset,
    handleFormOffsetToggle,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSaveAndClose,
    totalNetSqM,
    totalNetSqFt,
    totalGrossSqM,
    totalGrossSqFt,
  };
}
