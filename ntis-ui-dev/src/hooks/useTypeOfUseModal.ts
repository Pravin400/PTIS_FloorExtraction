"use client";

import { useState, useCallback } from "react";
import type { PropertyType, PropertyTypeAndTypeOfUseValidation } from "@/types/property-type.types";
import type { UseType, TypeOfUseItem } from "@/types/typeOfUse.types";

interface UseTypeOfUseModalProps {
  typeOfUseList: UseType[];
  typeOfUseValidation: PropertyTypeAndTypeOfUseValidation[];
}

/**
 * Hook for managing Type of Use modal state in PropertyTypeMaster
 * 
 * Handles:
 * - Modal open/close state
 * - Modal items based on property type selection
 * - Property description for modal title
 * 
 * @param props - Modal configuration
 * @returns Modal state and handlers
 */
export function useTypeOfUseModal({
  typeOfUseList,
  typeOfUseValidation,
}: UseTypeOfUseModalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<TypeOfUseItem[]>([]);
  const [modalPropertyDescription, setModalPropertyDescription] = useState<string | null>(null);

  const handleTypeOfUseClick = useCallback(
    (row: PropertyType) => {
      // Get the typeOfUseIds for this property type
      const typeOfUseIds = typeOfUseValidation
        .filter((v) => v.propertyTypeId === row.id)
        .map((v) => v.typeOfUseId);

      // Map to TypeOfUseItem format
      const items: TypeOfUseItem[] = typeOfUseIds
        .map((touId) => {
          const typeOfUse = typeOfUseList.find((t) => t.typeOfUseId === touId);
          if (!typeOfUse) return null;
          return {
            id: typeOfUse.typeOfUseCode,
            description: typeOfUse.description,
          };
        })
        .filter((item): item is TypeOfUseItem => item !== null);

      setModalItems(items);
      setModalPropertyDescription(row.propertyDescription);
      setModalOpen(true);
    },
    [typeOfUseList, typeOfUseValidation]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return {
    modalOpen,
    modalItems,
    modalPropertyDescription,
    handleTypeOfUseClick,
    closeModal,
  };
}
