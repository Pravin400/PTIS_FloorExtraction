"use client";

import { createContext, useContext, useState } from "react";

import type { InventoryConditionMasterErrorContextType } from "@/types/asset-masters/inventory-condition.types";

const InventoryConditionMasterErrorContext = createContext<InventoryConditionMasterErrorContextType>({
  hasError: false,
  setHasError: () => {},
});

export function InventoryConditionMasterErrorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <InventoryConditionMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </InventoryConditionMasterErrorContext.Provider>
  );
}

export function useInventoryConditionMasterError() {
  return useContext(InventoryConditionMasterErrorContext);
}
