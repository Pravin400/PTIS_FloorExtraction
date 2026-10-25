"use client";

import { createContext, useContext, useState } from "react";

import type { InventoryNameMasterErrorContextType } from "@/types/asset-masters/inventory-name.types";

const InventoryNameMasterErrorContext = createContext<InventoryNameMasterErrorContextType>({
  hasError: false,
  setHasError: () => {},
});

export function InventoryNameMasterErrorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <InventoryNameMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </InventoryNameMasterErrorContext.Provider>
  );
}

export function useInventoryNameMasterError() {
  return useContext(InventoryNameMasterErrorContext);
}
