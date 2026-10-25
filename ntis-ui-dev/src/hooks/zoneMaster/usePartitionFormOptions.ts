import { useMemo } from "react";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { PartitionFormState } from "@/types/zone-master/properties/partition-form.types";
import { BuildingListItem } from "@/types/zone-master/properties/building-list.types";

interface UsePartitionFormOptionsProps {
  allProperties: ZonePropertyItem[];
  wingDetailsMast: WingDetailsMastItem[];
  wings: WingItem[];
  floors: Floor[];
  form: PartitionFormState;
  categoryMap?: Map<number, string>;
  /** Building list from Building-list API - used for Main Property dropdown */
  buildingList?: BuildingListItem[];
}

export function usePartitionFormOptions({
  allProperties,
  wingDetailsMast,
  wings,
  floors,
  form,
  categoryMap,
  buildingList,
}: UsePartitionFormOptionsProps) {
  // Property options - prefer building list if available
  const propertyOptions = useMemo(() => {
    // Use building list if available (from Building-list API)
    if (buildingList && buildingList.length > 0) {
      return buildingList
        .filter((property) => !property.partitionNo || property.partitionNo === "" || property.partitionNo === "0")
        .map((property) => ({
          value: String(property.propertyId),
          label: `${property.propertyNo} - ${property.catPropertyCategoryName}`,
        }));
    }

    // Fallback to allProperties with categoryMap lookup
    return allProperties
      .filter((property) => !property.partitionNo || property.partitionNo === "0")
      .map((property) => {
        let categoryName: string | null = null;
        if (property.categoryId && categoryMap) {
          categoryName = categoryMap.get(property.categoryId) || null;
        }
        const label = categoryName
          ? `${property.propertyNo} - ${categoryName}`
          : property.propertyNo;
        return {
          value: String(property.id),
          label,
        };
      });
  }, [allProperties, categoryMap, buildingList]);

  // Wing options for Select dropdown - built from this property's
  // WingDetailsMast records (one per existing wing), cross-referenced with
  // the Wing master list for the short wingNo code used as the option value.
  const wingOptions = useMemo(() => {
    return wingDetailsMast
      .filter(w => !w.markedForDeletion)
      .map((wingDetail) => {
        const wingMaster = wings.find(w => w.id === wingDetail.wingMasterId);
        return {
          wingNo: wingMaster?.wingNo ?? "",
          wingName: wingDetail.wingName ?? wingMaster?.wingNo ?? "",
        };
      })
      .filter(w => w.wingNo)
      .map((wing) => ({
        value: wing.wingNo,
        label: `${wing.wingNo} - ${wing.wingName}`,
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [wings, wingDetailsMast]);

  // Generation Type static options
  const generationTypeOptions = [
    { value: "V", label: "V - Vertical" },
    { value: "H", label: "H - Horizontal" },
    { value: "VC", label: "VC - Vertical Custom" },
    { value: "HC", label: "HC - Horizontal Custom" },
  ];

  // From Floor options (all active floors, sorted by ID)
  const fromFloorOptions = useMemo(() => {
    // Sort floors by ID to ensure proper ordering
    const sortedFloors = [...floors].sort((a, b) => a.id - b.id);
    
    return sortedFloors.map((floor) => ({
      value: String(floor.id),
      label: `${floor.floorCode} - ${floor.description}`,
    }));
  }, [floors]);

  // To Floor options (filtered based on From Floor selection, sorted by ID)
  const toFloorOptions = useMemo(() => {
    if (!form.fromFloor || floors.length === 0) {
      return [];
    }

    // Parse the selected floor ID
    const selectedFromFloorId = parseInt(form.fromFloor, 10);
    if (isNaN(selectedFromFloorId)) {
      return [];
    }

    // Sort floors by ID
    const sortedFloors = [...floors].sort((a, b) => a.id - b.id);
    
    // Filter floors: only show floors with ID >= selected fromFloor ID
    return sortedFloors
      .filter((floor) => floor.id >= selectedFromFloorId)
      .map((floor) => ({
        value: String(floor.id),
        label: `${floor.floorCode} - ${floor.description}`,
      }));
  }, [floors, form.fromFloor]);

  return {
    propertyOptions,
    wingOptions,
    generationTypeOptions,
    fromFloorOptions,
    toFloorOptions,
  };
}
