import React, { useEffect } from "react";
import type { MatrixRow } from "./useMatrixState";

interface SessionStorageManagerProps {
  matrixStorageKey: string;
  matrixData: MatrixRow[];
}

/**
 * Hook to manage matrix data persistence in sessionStorage
 */
export function useSessionStorageManager({
  matrixStorageKey,
  matrixData,
}: SessionStorageManagerProps) {
  
  const keyRef = React.useRef(matrixStorageKey);
  
  // Keep keyRef updated
  useEffect(() => {
    keyRef.current = matrixStorageKey;
  }, [matrixStorageKey]);

  // Save matrix data to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && matrixData.length > 0) {
      sessionStorage.setItem(keyRef.current, JSON.stringify(matrixData));
    }
  }, [matrixData]);

  // Clear sessionStorage when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(matrixStorageKey);
      }
    };
  }, [matrixStorageKey]);
}
