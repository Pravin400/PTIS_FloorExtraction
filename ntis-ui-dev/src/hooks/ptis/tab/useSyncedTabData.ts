import { useState, useMemo } from 'react';
import {
  defaultPropertyDetails,
  defaultKycDetails,
  defaultSocietyDetails,
  defaultOldDetails,
  defaultDiscountData,
  defaultBuildingPermission,
} from '@/lib/constants/ptis.constants';
import type {
  PropertyDetailsData,
  KYCDetailsData,
  SocietyDetailsData,
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  DiscountData,
  BuildingPermissionData,
  MappedPropertyItem,
} from '@/types/ptis.types';

export function useSyncedTabData(
  initialPropertyDetails?: PropertyDetailsData,
  initialKycDetails?: KYCDetailsData,
  initialSocietyDetails?: SocietyDetailsData,
  initialOldDetails?: OldDetailsData,
  initialOldFloorTableData?: OldFloorDetailsData[],
  initialShowOldFloorInfo?: boolean,
  initialOldTaxesData?: OldTaxesData | null,
  initialShowOldTaxInfo?: boolean,
  initialDiscountDetails?: DiscountData,
  initialBuildingPermission?: BuildingPermissionData,
  initialShowOldMapInfo?: boolean,
  initialMappedPropertiesData?: MappedPropertyItem[]
) {
  const data = useMemo<PropertyDetailsData>(
    () => ({ ...defaultPropertyDetails, ...(initialPropertyDetails ?? {}) }),
    [initialPropertyDetails]
  );

  const kycDetailsData = useMemo<KYCDetailsData>(
    () => ({ ...defaultKycDetails, ...(initialKycDetails ?? {}) }),
    [initialKycDetails]
  );

  const societyDetailsData = useMemo<SocietyDetailsData>(
    () => ({ ...defaultSocietyDetails, ...(initialSocietyDetails ?? {}) }),
    [initialSocietyDetails]
  );

  const oldDetailsData = useMemo<OldDetailsData>(
    () => ({ ...defaultOldDetails, ...(initialOldDetails ?? {}) }),
    [initialOldDetails]
  );

  const oldFloorTableData = useMemo<OldFloorDetailsData[]>(
    () => initialOldFloorTableData ?? [],
    [initialOldFloorTableData]
  );

  const oldTaxesData = useMemo<OldTaxesData | null>(
    () => initialOldTaxesData ?? null,
    [initialOldTaxesData]
  );

  // UI-controlled state: user toggles these with buttons, so useState is correct here.
  const [showOldFloorInfo, setShowOldFloorInfo] = useState(initialShowOldFloorInfo ?? false);
  const [showOldTaxInfo, setShowOldTaxInfo] = useState(initialShowOldTaxInfo ?? false);
  const [showOldMapInfo, setShowOldMapInfo] = useState(initialShowOldMapInfo ?? false);

  const discountDetails = useMemo<DiscountData>(
    () => ({ ...defaultDiscountData, ...(initialDiscountDetails ?? {}) }),
    [initialDiscountDetails]
  );

  const buildingPermissionData = useMemo<BuildingPermissionData>(
    () => ({ ...defaultBuildingPermission, ...(initialBuildingPermission ?? {}) }),
    [initialBuildingPermission]
  );

  const mappedPropertiesData = useMemo<MappedPropertyItem[]>(
    () => initialMappedPropertiesData ?? [],
    [initialMappedPropertiesData]
  );

  return {
    data,
    kycDetailsData,
    societyDetailsData,
    buildingPermissionData,
    oldDetailsData,
    showOldFloorInfo,
    setShowOldFloorInfo,
    oldFloorTableData,
    oldTaxesData,
    showOldTaxInfo,
    setShowOldTaxInfo,
    showOldMapInfo,
    setShowOldMapInfo,
    discountDetails,
    mappedPropertiesData,
  };
}
