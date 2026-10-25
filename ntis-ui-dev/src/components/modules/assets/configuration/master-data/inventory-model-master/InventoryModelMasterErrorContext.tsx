"use client";

import { createContext, useContext, useState } from "react";

import type { InventoryModelMasterErrorContextType } from "@/types/asset-masters/inventory-model.types";

const InventoryModelMasterErrorContext = createContext<InventoryModelMasterErrorContextType | undefined>(undefined);

export function InventoryModelMasterErrorProvider({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  return (
    <InventoryModelMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </InventoryModelMasterErrorContext.Provider>
  );
}

export function useInventoryModelMasterError() {
  const context = useContext(InventoryModelMasterErrorContext);
  if (context === undefined) {
    throw new Error("useInventoryModelMasterError must be used within an InventoryModelMasterErrorProvider");
  }
  return context;
}
