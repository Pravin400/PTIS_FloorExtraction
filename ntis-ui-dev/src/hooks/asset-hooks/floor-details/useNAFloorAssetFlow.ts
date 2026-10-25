/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import type { FloorDropdownOptions } from "@/types/asset/floor-details.types";
import { useFloorAssetMedia } from "./useFloorAssetMedia";

// NA = NewAddNewAsset copy of useFloorAssetFlow
export function useNAFloorAssetFlow(initialDropdownOptions?: any) {
  const { formData, updateFormData } = useNAAssetForm();

  const [dropdownOptions] = useState<FloorDropdownOptions | null>(
    initialDropdownOptions && Object.keys(initialDropdownOptions).length > 0 ? initialDropdownOptions : null
  );

  const mediaFlow = useFloorAssetMedia(updateFormData);

  return {
    dropdownOptions,
    formData,
    ...mediaFlow,
  };
}
