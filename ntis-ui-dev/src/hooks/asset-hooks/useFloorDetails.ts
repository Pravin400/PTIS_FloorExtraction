/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

export function useFloorDetails(formData: any, updateFormData: (patch: Partial<any>) => void) {
  const [isChildDrawerOpen, setIsChildDrawerOpen] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  const [newFloor, setNewFloor] = useState({
    floor: "Ground",
    conYear: "2024",
    asstYear: "2024",
    conType: "RCC",
    useType: "Residential",
    subUseType: "Bungalow",
    rooms: 1,
    carpetAreaSqFt: 500,
    builtUpAreaSqFt: 600,
    baseValue: 2000
  });

  const handleAddFloor = () => {
    const nextId = (formData.floors || []).length > 0
      ? Math.max(...(formData.floors || []).map((f: any) => f.id)) + 1
      : 1;

    const carpetAreaSqM = parseFloat((Number(newFloor.carpetAreaSqFt) * 0.092903).toFixed(2));
    const builtUpAreaSqM = parseFloat((Number(newFloor.builtUpAreaSqFt) * 0.092903).toFixed(2));

    const addedFloor = {
      id: nextId,
      checked: true,
      floor: newFloor.floor,
      conYear: newFloor.conYear,
      asstYear: newFloor.asstYear,
      conType: newFloor.conType,
      useType: newFloor.useType,
      subUseType: newFloor.subUseType,
      rooms: Number(newFloor.rooms),
      carpetAreaSqFt: Number(newFloor.carpetAreaSqFt),
      carpetAreaSqM,
      builtUpAreaSqFt: Number(newFloor.builtUpAreaSqFt),
      builtUpAreaSqM,
      baseValue: Number(newFloor.baseValue),
      floorFactor: `1.00 / ${Number(newFloor.baseValue).toLocaleString()}`,
      ageFactor: 1.0
    };

    updateFormData({
      floors: [...(formData.floors || []), addedFloor]
    });

    setNewFloor(prev => ({
      ...prev,
      rooms: 1,
      carpetAreaSqFt: 500,
      builtUpAreaSqFt: 600,
      baseValue: 2000
    }));
  };

  const handleDeleteFloor = (id: number) => {
    updateFormData({
      floors: (formData.floors || []).filter((f: any) => f.id !== id)
    });
  };

  const handleToggleFloor = (id: number) => {
    updateFormData({
      floors: (formData.floors || []).map((f: any) =>
        f.id === id ? { ...f, checked: !f.checked } : f
      )
    });
  };

  const allChecked = (formData.floors || []).length > 0 && (formData.floors || []).every((f: any) => f.checked);
  
  const handleToggleAllFloors = () => {
    const targetState = !allChecked;
    updateFormData({
      floors: (formData.floors || []).map((f: any) => ({ ...f, checked: targetState }))
    });
  };

  return {
    isChildDrawerOpen,
    setIsChildDrawerOpen,
    selectedFloorId,
    setSelectedFloorId,
    newFloor,
    setNewFloor,
    handleAddFloor,
    handleDeleteFloor,
    handleToggleFloor,
    allChecked,
    handleToggleAllFloors
  };
}
