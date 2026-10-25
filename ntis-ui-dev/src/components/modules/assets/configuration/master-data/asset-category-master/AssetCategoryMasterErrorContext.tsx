"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import type { AssetCategoryMasterErrorContextType } from "@/types/asset-masters/asset-category.types";

const AssetCategoryMasterErrorContext = createContext<AssetCategoryMasterErrorContextType>({
  hasError: false,
  setError: () => { },
  resetError: () => { },
});

export const useAssetCategoryMasterError = () => useContext(AssetCategoryMasterErrorContext);

export const AssetCategoryMasterErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  const setError = useCallback((error: boolean) => {
    setHasError(error);
  }, []);

  const resetError = useCallback(() => {
    setHasError(false);
  }, []);

  return (
    <AssetCategoryMasterErrorContext.Provider value={{ hasError, setError, resetError }}>
      {children}
    </AssetCategoryMasterErrorContext.Provider>
  );
};
