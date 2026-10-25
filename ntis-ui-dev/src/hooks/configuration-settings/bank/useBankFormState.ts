'use client';

import { useState } from 'react';
import { BankMasterData, BankMasterFormData } from '@/types/bank-master.types';

import { BankMasterErrors } from '@/lib/api/configuration-settings/bank/bank-master.validator';

const INITIAL_FORM_DATA: BankMasterFormData = {
  bankCode: '',
  bankName: '',
  branchName: '',
  ifscCode: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  isActive: true,
};

export function useBankFormState(initialData?: BankMasterData) {
  const [formData, setFormData] = useState<BankMasterFormData>(
    initialData
      ? {
          bankCode: initialData.bankCode ?? '',
          bankName: initialData.bankName ?? '',
          branchName: initialData.branchName ?? '',
          ifscCode: initialData.ifscCode ?? '',
          address: initialData.address ?? '',
          city: initialData.city ?? '',
          state: initialData.state ?? '',
          pincode: initialData.pincode ?? '',
          isActive: initialData.isActive,
        }
      : INITIAL_FORM_DATA
  );

  const [errors, setErrors] = useState<BankMasterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(true);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    open,
    setOpen,
  };
}
