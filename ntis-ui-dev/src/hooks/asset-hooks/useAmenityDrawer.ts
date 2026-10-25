/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sqmToSqft } from "@/lib/utils/asset-utils/room-utils";
import { mapIncomingAmenities } from '@/lib/utils/asset-utils/new-add-new-asset/space-mapping.utils';
import { Amenity, blankAmenity, computeAmenity, makeAmenityId } from '@/lib/utils/asset-utils/new-add-new-asset/amenity.model';
import { useAmenityOffsetPopup } from "./useAmenityOffsetPopup";

export type { Amenity } from '@/lib/utils/asset-utils/new-add-new-asset/amenity.model';
export { blankAmenity, computeAmenity } from '@/lib/utils/asset-utils/new-add-new-asset/amenity.model';

export function useAmenityDrawer(
  isOpen: boolean,
  initialSpaces: any[],
  onSaveSpaces: (spaces: any[], calculatedAreaSqFt: number) => void
) {
  const [spacesList, setSpacesList] = useState<Amenity[]>([]);
  const [form, setForm] = useState<Amenity>(blankAmenity(1));
  const [editingId, setEditingId] = useState<string | null>(null);

  const offsetPopup = useAmenityOffsetPopup(isOpen, spacesList, setSpacesList, form, setForm);
  const { setIsFormOffsetOpen, offsetPopupSpaceId, setOffsetPopupSpaceId } = offsetPopup;

  useEffect(() => {
    if (!isOpen || !initialSpaces) return;
    const mapped = mapIncomingAmenities(initialSpaces);
    setTimeout(() => {
      setSpacesList(mapped);
      setForm(blankAmenity(mapped.length + 1));
      setEditingId(null);
    }, 0);
    setIsFormOffsetOpen(false);
  }, [isOpen, initialSpaces, setIsFormOffsetOpen]);

  const toggleOffset = (spaceId: string, val: "Yes" | "No") => {
    setSpacesList((prev: any) => prev.map((s: any) => {
      if (s.id !== spaceId) return s;
      if (val === "No") return computeAmenity({ ...s, hasOffset: "No", offsets: [], offsetAreaSqM: 0 });
      return { ...s, hasOffset: "Yes" };
    }));
    if (val === "Yes") setOffsetPopupSpaceId(spaceId);
    else setOffsetPopupSpaceId(null);
  };

  const handleFormOffsetToggle = (val: "Yes" | "No") => {
    if (val === "No") {
      setForm((prev: any) => computeAmenity({ ...prev, hasOffset: "No", offsets: [], offsetAreaSqM: 0 }));
      setIsFormOffsetOpen(false);
    } else {
      setForm((prev: any) => computeAmenity({ ...prev, hasOffset: "Yes" }));
      setIsFormOffsetOpen(true);
    }
  };

  const handleAdd = () => {
    if (!form.name) {
      toast.error("Please select an Amenity Type.");
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
    const computed = computeAmenity(form);
    let updated: Amenity[];
    if (editingId) {
      updated = spacesList.map((s: any) => s.id === editingId ? { ...computed, id: editingId } : s);
      setEditingId(null);
    } else {
      updated = [...spacesList, { ...computed, id: makeAmenityId() }];
    }
    setSpacesList(updated);
    setForm(blankAmenity(updated.length + 1));
    setIsFormOffsetOpen(false);
    const totalNetSqFt = updated.reduce((acc, s) => acc + s.netAreaSqFt * s.count, 0);
    onSaveSpaces(updated, totalNetSqFt);
  };

  const handleEdit = (s: Amenity) => {
    setEditingId(s.id);
    setForm({ ...s });
    setIsFormOffsetOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = spacesList.filter((s: any) => s.id !== id);
    setSpacesList(updated);
    if (editingId === id) { setEditingId(null); setForm(blankAmenity(updated.length + 1)); }
    if (offsetPopupSpaceId === id) setOffsetPopupSpaceId(null);
    const totalNetSqFt = updated.reduce((acc, s) => acc + s.netAreaSqFt * s.count, 0);
    onSaveSpaces(updated, totalNetSqFt);
  };

  const totalNetSqM = spacesList.reduce((acc, s) => acc + s.netAreaSqM * s.count, 0);
  const totalNetSqFt = spacesList.reduce((acc, s) => acc + s.netAreaSqFt * s.count, 0);
  const totalGrossSqM = spacesList.reduce((acc, s) => acc + s.areaSqM * s.count, 0);
  const totalGrossSqFt = sqmToSqft(totalGrossSqM);

  return {
    spacesList,
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
    totalNetSqM,
    totalNetSqFt,
    totalGrossSqM,
    totalGrossSqFt,
  };
}
