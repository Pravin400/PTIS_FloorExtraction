import type {
  OldFloorDetailsData,
  OldDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';

export interface UseIndividualOldDetailsTabParams {
  propertyId?: number | string | null;
  showOldFloorInfo?: boolean;
  setShowOldFloorInfo?: (value: boolean) => void;
  showOldTaxInfo?: boolean;
  setShowOldTaxInfo?: (value: boolean) => void;
  showOldMapInfo?: boolean;
  setShowOldMapInfo?: (value: boolean) => void;
  oldFloorTableData?: OldFloorDetailsData[];
  oldDetailsData?: OldDetailsData;
  oldTaxesData?: OldTaxesData | null;
  mappedPropertiesData?: MappedPropertyItem[];
  onPropertyMapping?: () => void;
}

export interface UseIndividualOldDetailsTabReturn {
  effectiveShowFloor: boolean;
  effectiveShowTax: boolean;
  effectiveShowMap: boolean;
  currentDetails: OldDetailsData | undefined;
  currentFloors: OldFloorDetailsData[];
  currentTaxes: OldTaxesData | null | undefined;
  currentMapped: MappedPropertyItem[];
  isLoadingFloors: boolean;
  isLoadingTaxes: boolean;
  isLoadingMapped: boolean;
  handleToggleMapDetails: () => void;
  handleToggleFloorDetails: () => void;
  handleToggleOldTax: () => void;
  handleNavigatePropertyMapping: () => void;
}
