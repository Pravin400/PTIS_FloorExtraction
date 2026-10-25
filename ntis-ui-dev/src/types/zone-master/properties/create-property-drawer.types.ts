import { WardItem } from "@/types/wardMaster.types";
import { PropertyType } from "@/types/property-type.types";
import { PropertyCategory } from "@/types/property-category.types";
import { TaxZone } from "@/types/taxzoning.types";

/**
 * Props for the CreatePropertyDrawer component
 */
export interface CreatePropertyDrawerProps {
  isOpen: boolean;
  selectedWard: WardItem | null;
  propertyTypes: PropertyType[];
  propertyCategories: PropertyCategory[];
  taxZones: TaxZone[];
  /** Next available property number for auto-population (SSR fetched) */
  nextPropertyNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Form data for creating properties
 */
export interface CreatePropertyFormData {
  propertyTypeId: string;
  categoryId: string;
  taxZoneId: string;
  propertyNo: string;
  ownerName: string;
  societyName: string;
  isBulkCreate: boolean;
  fromPropertyNo: string;
  toPropertyNo: string;
}

/**
 * Validation errors for the create property form
 */
export interface CreatePropertyFormErrors {
  propertyTypeId?: string;
  categoryId?: string;
  taxZoneId?: string;
  propertyNo?: string;
  ownerName?: string;
  fromPropertyNo?: string;
  toPropertyNo?: string;
}
