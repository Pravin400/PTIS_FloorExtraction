"use client";

import { createContext, useContext, useState } from "react";

import type { AssetTypeMasterErrorContextType } from "@/types/asset-masters/asset-type.types";

const AssetTypeMasterErrorContext = createContext<AssetTypeMasterErrorContextType | undefined>(undefined);

export function AssetTypeMasterErrorProvider({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  return (
    <AssetTypeMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </AssetTypeMasterErrorContext.Provider>
  );
}

export function useAssetTypeMasterError() {
  const context = useContext(AssetTypeMasterErrorContext);
  if (context === undefined) {
    throw new Error("useAssetTypeMasterError must be used within an AssetTypeMasterErrorProvider");
  }
  return context;
}
