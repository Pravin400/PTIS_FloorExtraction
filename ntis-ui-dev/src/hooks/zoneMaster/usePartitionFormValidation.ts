import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { Floor } from "@/types/floor.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface UsePartitionFormValidationProps {
  selectedProperty: ZonePropertyItem | null;
  allProperties: ZonePropertyItem[];
  floors: Floor[];
}

export function usePartitionFormValidation({
  selectedProperty,
  allProperties,
  floors,
}: UsePartitionFormValidationProps) {
  const t = useTranslations("zoneMaster");
  const wingAlias = useAliasLabel("Wing", t("defaults.wing"));
  const floorAlias = useAliasLabel("Floor", t("defaults.floor"));
  const flatNoShopNoAlias = useAliasLabel(
    "Flat_No_Shop_No",
    useAliasLabel("Flat No/Shop No", t("defaults.flatNoShopNo"))
  );

  // Calculate max partition number for the selected property
  const calculateMaxPartition = useCallback((): number => {
    if (!selectedProperty) return 0;
    
    // Get all partitions for this property
    const existingPartitions = allProperties.filter(
      (p) => p.propertyNo === selectedProperty.propertyNo && p.partitionNo && p.partitionNo !== "0"
    );

    // Find max numeric partition
    const numericPartitions = existingPartitions
      .map((p) => parseInt(p.partitionNo || "0", 10))
      .filter((n) => !isNaN(n));

    return numericPartitions.length > 0 ? Math.max(...numericPartitions) : 0;
  }, [selectedProperty, allProperties]);

  // Calculate max amenity number for the selected property (with optional wing filter)
  const calculateMaxAmenity = useCallback((wingName?: string | null): number => {
    if (!selectedProperty) return 0;
    
    // Get all amenities for this property (partitions containing AM)
    const existingAmenities = allProperties.filter(
      (p) => p.propertyNo === selectedProperty.propertyNo && 
             p.partitionNo && 
             p.partitionNo.includes("AM")
    );

    // If wing is specified, filter by wing prefix
    const filteredAmenities = wingName 
      ? existingAmenities.filter(a => a.partitionNo?.startsWith(`${wingName}-AM`))
      : existingAmenities.filter(a => a.partitionNo?.startsWith("AM") && !a.partitionNo?.includes("-"));

    // Extract numeric part from amenity partition numbers
    const numericAmenities = filteredAmenities
      .map((p) => {
        const match = p.partitionNo?.match(/AM(\d+)$/);
        return match ? parseInt(match[1], 10) : NaN;
      })
      .filter((n) => !isNaN(n));

    return numericAmenities.length > 0 ? Math.max(...numericAmenities) : 0;
  }, [selectedProperty, allProperties]);

  // Validate form
  const validate = useCallback((data: PartitionFormState): { valid: boolean; errors: PartitionFormErrors } => {
    const newErrors: PartitionFormErrors = {};

    if (!data.mainPropertyId) {
      newErrors.mainPropertyId = t("partitionForm.validation.mainPropertyRequired");
    }

    // Validate based on partition type
    if (data.partitionType === "wing") {
      // Validate wing-specific fields
      if (!data.wingLetter?.trim()) {
        newErrors.wingLetter = t("partitionForm.validation.wingLetterRequired", { wing: wingAlias });
      }
      if (!data.fromFloor?.trim()) {
        newErrors.fromFloor = t("partitionForm.validation.fromFloorRequired", { floor: floorAlias });
      }
      if (!data.toFloor?.trim()) {
        newErrors.toFloor = t("partitionForm.validation.toFloorRequired", { floor: floorAlias });
      }
      if (!data.noOfFlatOnOneFloor?.trim()) {
        newErrors.noOfFlatOnOneFloor = t("partitionForm.validation.noOfFlatOnOneFloorRequired", { flatNoShopNo: flatNoShopNoAlias, floor: floorAlias });
      }
      if (!data.flatStart?.trim()) {
        newErrors.flatStart = t("partitionForm.validation.flatStartRequired", { flatNoShopNo: flatNoShopNoAlias });
      }
      if (!data.incrementedBy?.trim()) {
        newErrors.incrementedBy = t("partitionForm.validation.incrementedByRequired");
      }
      if (!data.generationType?.trim()) {
        newErrors.generationType = t("partitionForm.validation.generationTypeRequired");
      }
      
      // Check if toFloor is greater than or equal to fromFloor using floor IDs
      if (data.fromFloor && data.toFloor && floors.length > 0) {
        const fromFloorId = parseInt(data.fromFloor, 10);
        const toFloorId = parseInt(data.toFloor, 10);
        const fromFloorIndex = floors.findIndex(f => f.id === fromFloorId);
        const toFloorIndex = floors.findIndex(f => f.id === toFloorId);
        
        if (fromFloorIndex !== -1 && toFloorIndex !== -1 && toFloorIndex < fromFloorIndex) {
          newErrors.toFloor = t("partitionForm.validation.toFloorMustBeGreaterOrEqual", { floor: floorAlias });
        }
      }
      
      // Validate positive numbers
      const numericFields = [
        { value: data.noOfFlatOnOneFloor, key: 'noOfFlatOnOneFloor' },
        { value: data.flatStart, key: 'flatStart' },
        { value: data.incrementedBy, key: 'incrementedBy' }
      ];
      
      numericFields.forEach(({ value, key }) => {
        if (value) {
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) {
            newErrors[key as keyof PartitionFormErrors] = t("partitionForm.validation.mustBeNumber");
          } else if (numValue <= 0) {
            newErrors[key as keyof PartitionFormErrors] = t("partitionForm.wing.validation.invalidValue");
          }
        }
      });
      
      // Check if incrementedBy is greater than or equal to noOfFlatOnOneFloor only for non-custom generation types
    if (data.generationType !== "VC" && data.generationType !== "HC") {
      const noOfFlats = parseInt(data.noOfFlatOnOneFloor, 10);
      const incrementBy = parseInt(data.incrementedBy, 10);
      if (!isNaN(noOfFlats) && !isNaN(incrementBy) && incrementBy < noOfFlats) {
        newErrors.incrementedBy = t("partitionForm.validation.incrementedByMustBeGreater");
      }
    }
    } else if (data.partitionType === "amenity") {
      // Validate amenity fields for Apartment Categories
      if (!data.toAmenity?.trim()) {
        newErrors.toAmenity = t("partitionForm.validation.toAmenityRequired");
      }

      // Validate numeric values
      const fromAmenity = parseInt(data.fromAmenity, 10);
      const toAmenity = parseInt(data.toAmenity, 10);
      
      if (data.toAmenity && isNaN(toAmenity)) {
        newErrors.toAmenity = t("partitionForm.validation.mustBeNumber");
      }
      
      // Validate from <= to
      if (!isNaN(fromAmenity) && !isNaN(toAmenity) && fromAmenity > toAmenity) {
        newErrors.toAmenity = t("partitionForm.validation.toAmenityMustBeGreater");
      }

      // Check for duplicate amenities in the range
      if (selectedProperty && !isNaN(fromAmenity) && !isNaN(toAmenity)) {
        const selectedWing = data.selectedWingForAmenity?.trim();
        
        // Get existing amenities for this property, scoped to selected wing (or no-wing)
        const existingAmenities = allProperties.filter((p) => {
          if (p.propertyNo !== selectedProperty.propertyNo || !p.partitionNo) return false;
          const partitionNo = p.partitionNo;
          if (!partitionNo.includes("AM")) return false;
          
          // If wing is selected, filter by wing prefix
          if (selectedWing) {
            return partitionNo.startsWith(`${selectedWing}-AM`);
          }
          
          // No wing selected - only match amenities without wing prefix
          return partitionNo.startsWith("AM") && !partitionNo.includes("-");
        });
        
        // Extract numeric part from amenity partition numbers
        const existingAmenityNums = existingAmenities
          .map((p) => {
            const match = p.partitionNo?.match(/AM(\d+)$/);
            return match ? parseInt(match[1], 10) : NaN;
          })
          .filter((n) => !isNaN(n));
        
        for (let i = fromAmenity; i <= toAmenity; i++) {
          if (existingAmenityNums.includes(i)) {
            newErrors.toAmenity = t("partitionForm.validation.duplicateAmenityInRange", { amenity: i });
            break;
          }
        }
      }
    } else {
      // Validate partition fields for Non-Apartment Categories
      if (!data.fromPartition?.trim()) {
        newErrors.fromPartition = t("partitionForm.validation.fromPartitionRequired");
      }
      if (!data.toPartition?.trim()) {
        newErrors.toPartition = t("partitionForm.validation.toPartitionRequired");
      }

      // Validate numeric values
      const fromPartition = parseInt(data.fromPartition, 10);
      const toPartition = parseInt(data.toPartition, 10);
      
      if (data.fromPartition && isNaN(fromPartition)) {
        newErrors.fromPartition = t("partitionForm.validation.mustBeNumber");
      }
      if (data.toPartition && isNaN(toPartition)) {
        newErrors.toPartition = t("partitionForm.validation.mustBeNumber");
      }
      
      // Validate from <= to
      if (!isNaN(fromPartition) && !isNaN(toPartition) && fromPartition > toPartition) {
        newErrors.toPartition = t("partitionForm.validation.toMustBeGreater");
      }

      // Check for duplicate partitions in the range
      if (selectedProperty && !isNaN(fromPartition) && !isNaN(toPartition)) {
        const existingPartitions = allProperties.filter(
          (p) => p.propertyNo === selectedProperty.propertyNo && p.partitionNo && p.partitionNo !== "0"
        );
        const existingPartitionNums = existingPartitions.map(p => parseInt(p.partitionNo || "0", 10));
        
        for (let i = fromPartition; i <= toPartition; i++) {
          if (existingPartitionNums.includes(i)) {
            newErrors.fromPartition = t("partitionForm.validation.duplicatePartitionInRange", { partition: i });
            break;
          }
        }
      }
    }

    return {
      valid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  }, [selectedProperty, allProperties, floors, t, wingAlias, floorAlias, flatNoShopNoAlias]);

  return {
    calculateMaxPartition,
    calculateMaxAmenity,
    validate,
  };
}
