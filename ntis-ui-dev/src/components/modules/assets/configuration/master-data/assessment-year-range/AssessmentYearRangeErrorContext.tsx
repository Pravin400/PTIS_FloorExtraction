"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AssessmentYearRangeErrorContextValue {
  hasError: boolean;
  setHasError: (hasError: boolean) => void;
}

const AssessmentYearRangeErrorContext = createContext<AssessmentYearRangeErrorContextValue | null>(null);

interface AssessmentYearRangeErrorProviderProps {
  children: ReactNode;
}

export function AssessmentYearRangeErrorProvider({ children }: AssessmentYearRangeErrorProviderProps) {
  const [hasError, setHasErrorState] = useState(false);

  const setHasError = useCallback((value: boolean) => {
    setHasErrorState(value);
  }, []);

  return (
    <AssessmentYearRangeErrorContext.Provider value={{ hasError, setHasError }}>
      {children}
    </AssessmentYearRangeErrorContext.Provider>
  );
}

export function useAssessmentYearRangeError(): AssessmentYearRangeErrorContextValue {
  const context = useContext(AssessmentYearRangeErrorContext);
  if (!context) {
    throw new Error(
      "useAssessmentYearRangeError must be used within an AssessmentYearRangeErrorProvider"
    );
  }
  return context;
}
