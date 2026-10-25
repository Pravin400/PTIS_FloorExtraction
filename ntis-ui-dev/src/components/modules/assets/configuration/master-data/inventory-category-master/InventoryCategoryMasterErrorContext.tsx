"use client";

import { createContext, useContext, useState } from "react";

import type { InventoryCategoryMasterErrorContextType } from "@/types/asset-masters/inventory-category.types";

const InventoryCategoryMasterErrorContext = createContext<InventoryCategoryMasterErrorContextType | undefined>(undefined);

export function InventoryCategoryMasterErrorProvider({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  return (
    <InventoryCategoryMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </InventoryCategoryMasterErrorContext.Provider>
  );
}

export function useInventoryCategoryMasterError() {
  const context = useContext(InventoryCategoryMasterErrorContext);
  if (context === undefined) {
    throw new Error("useInventoryCategoryMasterError must be used within an InventoryCategoryMasterErrorProvider");
  }
  return context;
}
