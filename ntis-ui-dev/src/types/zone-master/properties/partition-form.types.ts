import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "./zoneProperty.types";
import { WingItem } from "./wing.types";
import { Floor } from "@/types/floor.types";
import { SocietyDetailItem } from "./societyDetails.types";

/**
 * State for the partition form in Zone Master
 */
export interface PartitionFormState {
  mainPropertyId: number | null;
  partitionNo: string;
  partitionType: "partition" | "wing" | "amenity";
  isActive: boolean;
  bulkCreateMode: boolean;
  alphanumericMode: boolean;
  // Wing-specific fields
  createNewWing: boolean;
  wingLetter: string;
  fromFloor: string;
  toFloor: string;
  noOfFlatOnOneFloor: string;
  flatStart: string;
  incrementedBy: string;
  prefix: string;
  generationType: string;
  // Non-Apartment partition fields
  fromPartition: string;
  toPartition: string;
  // Amenity fields
  selectedWingForAmenity: string; // Wing letter/number for amenity (empty if no wing)
  fromAmenity: string;
  toAmenity: string;
}

/**
 * Validation errors for the partition form
 */
export interface PartitionFormErrors {
  mainPropertyId?: string;
  partitionNo?: string;
  wingLetter?: string;
  wingName?: string;
  fromFloor?: string;
  toFloor?: string;
  noOfFlatOnOneFloor?: string;
  flatStart?: string;
  incrementedBy?: string;
  generationType?: string;
  fromPartition?: string;
  toPartition?: string;
  // Amenity errors
  selectedWingForAmenity?: string;
  fromAmenity?: string;
  toAmenity?: string;
}

/**
 * Props for the PropertyPartitionForm component
 */
export interface PropertyPartitionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedWard?: WardItem | null;
  categoryMap?: Map<number, string>;
  // SSR data props
  ssrProperties?: ZonePropertyItem[];
  ssrWings?: WingItem[];
  ssrFloors?: Floor[];
  selectedPropertyId?: number | null;
  ssrSocietyDetails?: SocietyDetailItem[];
  ssrNextPartitionNumber?: number | null;
}
