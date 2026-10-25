/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";

export function useChildAssetDrawer(isOpen: boolean, floorId: number | null, onClose: () => void) {
  const { formData, updateFormData } = useNAAssetForm();
  
  const [localUnits, setLocalUnits] = useState<any[]>([]);
  
  const [bulkType, setBulkType] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkStartNum, setBulkStartNum] = useState(101);
  const [bulkCount, setBulkCount] = useState(5);

  const [activeUnit, setActiveUnit] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && floorId !== null) {
      const floor = (formData.floors || []).find((f: any) => f.id === floorId);
      if (floor) {
        setTimeout(() => { setLocalUnits((floor as any).units || []); }, 0);
      }
    }
  }, [isOpen, floorId, formData.floors]);

  const currentFloor = useMemo(() => {
    return (formData.floors || []).find((f: any) => f.id === floorId);
  }, [formData.floors, floorId]);

  const handleGenerateBulk = () => {
    const newUnits = [];
    let nextId = localUnits.length > 0 ? Math.max(...localUnits.map(u => u.id)) + 1 : 1;
    
    for (let i = 0; i < bulkCount; i++) {
      newUnits.push({
        id: nextId++,
        unitNumber: `${bulkPrefix}${bulkStartNum + i}`,
        unitType: bulkType,
        carpetAreaSqFt: 0,
        status: "Vacant",
        baseValue: 0,
        floorId: floorId,
        floorDetailsId: floorId,
      });
    }
    
    setLocalUnits([...localUnits, ...newUnits]);
  };

  const handleDeleteUnit = (id: number) => {
    setLocalUnits(localUnits.filter(u => u.id !== id));
  };

  const handleSave = () => {
    const updatedFloors = (formData.floors || []).map((f: any) => {
      if (f.id === floorId) {
        return { ...f, units: localUnits };
      }
      return f;
    });
    
    updateFormData({ floors: updatedFloors });
    onClose();
  };

  const handleSaveUnitDetail = (updatedUnit: any) => {
    setLocalUnits(localUnits.map(u => u.id === updatedUnit.id ? updatedUnit : u));
    setActiveUnit(null);
  };

  return {
    localUnits,
    bulkType, setBulkType,
    bulkPrefix, setBulkPrefix,
    bulkStartNum, setBulkStartNum,
    bulkCount, setBulkCount,
    activeUnit, setActiveUnit,
    currentFloor,
    // Already-available floor-details data for this asset — lets the drawer pass it
    // to SubUnitDetailedConfigurator so it never needs its own client-side fallback fetch.
    floors: formData.floors || [],
    handleGenerateBulk,
    handleDeleteUnit,
    handleSave,
    handleSaveUnitDetail
  };
}
