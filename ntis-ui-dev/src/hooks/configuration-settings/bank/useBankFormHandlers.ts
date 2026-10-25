'use client';

import React, { useCallback } from 'react';
import { BankMasterFormData } from '@/types/bank-master.types';
import {
  BankMasterErrors,
  validateBankMaster,
  normalizeBankData,
} from '@/lib/api/configuration-settings/bank/bank-master.validator';

interface UseBankFormHandlersProps {
  formData: BankMasterFormData;
  setFormData: React.Dispatch<React.SetStateAction<BankMasterFormData>>;
  setErrors: React.Dispatch<React.SetStateAction<BankMasterErrors>>;
}

export function useBankFormHandlers({
  formData,
  setFormData,
  setErrors,
}: UseBankFormHandlersProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { name } = e.target;
      let { value } = e.target;

      // Real-time character filtering based on field type
      if (name === 'bankCode' || name === 'ifscCode') {
        value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      } else if (name === 'bankName' || name === 'branchName') {
        // Allows letters (any language), spaces, hyphens, and parentheses
        value = value.replace(/[^\p{L}\p{M}\s\-()]/gu, '');
      } else if (name === 'city' || name === 'state') {
        // Allows only letters (any language) and spaces
        value = value.replace(/[^\p{L}\p{M}\s]/gu, '');
      } else if (name === 'address') {
        // Allows letters, numbers, spaces, and basic punctuation: / , . - () &
        value = value.replace(/[^\p{L}\p{M}\p{N}\s\/,.\-()&]/gu, '');
      } else if (name === 'pincode') {
        // Allows only numbers
        value = value.replace(/[^0-9]/g, '');
      }

      setFormData((p) => ({
        ...p,
        [name]: value,
      }));

      setErrors((prev) => {
        if (!prev[name as keyof BankMasterErrors]) return prev;
        const next = { ...prev };
        delete next[name as keyof BankMasterErrors];
        return next;
      });
    },
    [setFormData, setErrors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { name, value } = e.target;

      const updatedFormData = {
        ...formData,
        [name]: value,
      };

      const normalizedData = normalizeBankData(updatedFormData);

      setFormData(normalizedData);
      setErrors(validateBankMaster(normalizedData));
    },
    [formData, setFormData, setErrors]
  );

  const handleToggleStatus = useCallback((): void => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  }, [setFormData]);

  return {
    handleChange,
    handleBlur,
    handleToggleStatus,
  };
}
