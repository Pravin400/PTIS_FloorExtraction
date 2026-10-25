"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

import type { OwnershipTypeMasterErrorContextType } from "@/types/asset-masters/ownership-type.types";

const OwnershipTypeMasterErrorContext = createContext<OwnershipTypeMasterErrorContextType>({
  hasError: false,
  setHasError: () => {},
});

export function OwnershipTypeMasterErrorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <OwnershipTypeMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </OwnershipTypeMasterErrorContext.Provider>
  );
}

export function useOwnershipTypeMasterError() {
  return useContext(OwnershipTypeMasterErrorContext);
}
