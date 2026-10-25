"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface WeightageMasterErrorContextValue {
  hasError: boolean;
  setHasError: (hasError: boolean) => void;
}

const WeightageMasterErrorContext = createContext<WeightageMasterErrorContextValue | null>(null);

interface WeightageMasterErrorProviderProps {
  children: ReactNode;
}

export function WeightageMasterErrorProvider({ children }: WeightageMasterErrorProviderProps) {
  const [hasError, setHasErrorState] = useState(false);

  const setHasError = useCallback((value: boolean) => {
    setHasErrorState(value);
  }, []);

  return (
    <WeightageMasterErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </WeightageMasterErrorContext.Provider>
  );
}

export function useWeightageMasterError(): WeightageMasterErrorContextValue {
  const context = useContext(WeightageMasterErrorContext);
  if (!context) {
    throw new Error(
      "useWeightageMasterError must be used within a WeightageMasterErrorProvider"
    );
  }
  return context;
}
