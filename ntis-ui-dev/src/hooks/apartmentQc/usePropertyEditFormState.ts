import { useState, useCallback } from 'react';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';
import type {
  PropertyBasicInfoFormData,
  FloorDataRow,
  PropertyEditFormStateReturn,
} from '@/types/propertyEdit.types';

/**
 * Initial empty floor row data
 */
const INITIAL_FLOOR_ROW: FloorDataRow = {
  id: 'row-1',
  pdnId: null,
  floorId: '',
  conYear: '',
  asstYear: '',
  constructionTypeId: '',
  typeOfUseId: '',
  subTypeOfUseId: '',
  noOfRooms: '',
  area: '',
  rentMY: '',
  rateMY: '',
  rentalValue: '',
  depreciation: '',
  alv: '',
  mr: '',
  rv: '',
  sdrr: '',
  baseValue: '',
  floorFactor: '',
  ageFactor: '',
  ntbFactor: '',
  useFactor: '',
  capitalValue: '',
};

/**
 * Maps ApartmentQCDetail to FloorDataRow
 */
function mapToFloorDataRow(item: ApartmentQCDetail, index: number): FloorDataRow {
  return {
    id: `row-${item.pdnId || index + 1}`,
    pdnId: item.pdnId || null,
    floorId: String(item.floor || ''),
    conYear: String(item.constructionYear || ''),
    asstYear: String(item.assessmentYear || ''),
    constructionTypeId: String(item.constructionType || ''),
    typeOfUseId: String(item.typeOfUse || ''),
    subTypeOfUseId: String(item.subTypeOfUse || ''),
    noOfRooms: String(item.noOfRooms ?? ''),
    area: String(item.carpetASqMtr || item.builtupASqMtr || ''),
    rentMY: String(item.rentMonthly || ''),
    rateMY: String(item.monthlyRate || ''),
    rentalValue: String(item.annualRentalValue || ''),
    depreciation: String(item.depreciation || ''),
    alv: String(item.annualRentalValue || ''),
    mr: String(item.maintenance || ''),
    rv: String(item.rateableValue || item.rVorCVValue || ''),
    sdrr: String(item.sdrr || ''),
    baseValue: String(item.baseValue || ''),
    floorFactor: String(item.floorFactor || ''),
    ageFactor: String(item.ageFactor || ''),
    ntbFactor: String(item.natureFactor || ''),
    useFactor: String(item.useFactor || ''),
    capitalValue: String(item.capitalValue || item.rVorCVValue || ''),
  };
}

/**
 * Creates initial basic info form data from property data
 */
function createInitialBasicInfoFormData(propertyData: ApartmentQCDetail): PropertyBasicInfoFormData {
  return {
    ownerName: propertyData.ownerName || '',
    occupierName: propertyData.occupierName || '',
    renterName: propertyData.renterName || '',
    propertyDescription: '',
    propertyTypeId: String((propertyData as unknown as Record<string, unknown>).propertyType || ''),
    bhk: String((propertyData as unknown as Record<string, unknown>).bhk || ''),
    mobileNo: propertyData.mobileNo || '',
    emailId: propertyData.emailId || '',
    flatOrShopName: propertyData.flatOrShopName || '',
    wingName: String((propertyData as unknown as Record<string, unknown>).wing || ''),
    flatOrShopNo: propertyData.flatOrShopNo || '',
    oldPropertyNo: propertyData.oldPropertyNo || '',
    remark: String((propertyData as unknown as Record<string, unknown>).remark || ''),
    oldRV: String(propertyData.oldRV || ''),
    newRV: String(propertyData.rVorCVValue || ''),
    oldTax: String(propertyData.oldTotalTax || ''),
    newTax: String(propertyData.newTaxTotal || ''),
    oldArea: String(propertyData.oldConstructionArea || ''),
    newArea: String(propertyData.carpetASqMtr || propertyData.builtupASqMtr || ''),
    oldUseType: propertyData.oldUseType || '',
    oldConstructionType: propertyData.oldConstructionType || '',
    oldCSN: propertyData.oldCSN || '',
    oldConstructionYear: propertyData.oldConstructionYear || '',
  };
}

interface UsePropertyEditFormStateArgs {
  propertyData: ApartmentQCDetail;
  floorQCData: ApartmentQCDetail[];
}

/**
 * Hook for managing property edit form state
 * 
 * Handles:
 * - Basic info form data initialization and state
 * - Floor QC table data initialization and state
 * - Section toggle states
 * - Field update handlers
 */
export function usePropertyEditFormState({
  propertyData,
  floorQCData,
}: UsePropertyEditFormStateArgs): PropertyEditFormStateReturn {
  // Basic info form state
  const [formData, setFormData] = useState<PropertyBasicInfoFormData>(() =>
    createInitialBasicInfoFormData(propertyData)
  );

  // Floor QC table state
  const [floorData, setFloorData] = useState<FloorDataRow[]>(() => {
    if (floorQCData && floorQCData.length > 0) {
      return floorQCData.map(mapToFloorDataRow);
    }
    return [INITIAL_FLOOR_ROW];
  });

  // UI toggle states
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(true);
  const [isFloorQCOpen, setIsFloorQCOpen] = useState(true);
  const [dualMethodTab, setDualMethodTab] = useState<'rateable' | 'capital'>('rateable');

  // Update a single form field and clear its error
  const updateFormField = useCallback((
    field: keyof PropertyBasicInfoFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update a floor row field
  const updateFloorRow = useCallback((
    id: string,
    field: keyof FloorDataRow,
    value: string
  ) => {
    setFloorData(prev => prev.map(row => {
      if (row.id === id) {
        // Reset subTypeOfUseId when typeOfUseId changes
        if (field === 'typeOfUseId') {
          return { ...row, [field]: value, subTypeOfUseId: '' };
        }
        return { ...row, [field]: value };
      }
      return row;
    }));
  }, []);

  return {
    formData,
    setFormData,
    floorData,
    setFloorData,
    isBasicInfoOpen,
    setIsBasicInfoOpen,
    isFloorQCOpen,
    setIsFloorQCOpen,
    dualMethodTab,
    setDualMethodTab,
    updateFormField,
    updateFloorRow,
  };
}
