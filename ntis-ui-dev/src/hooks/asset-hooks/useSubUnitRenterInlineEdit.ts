/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTransliteration } from '@/hooks/asset-hooks/useTransliteration';
import { calculateDuration } from '@/lib/utils/asset-utils/new-add-new-asset/child-asset/date-utils';

export function useSubUnitRenterInlineEdit(
  formData: any,
  setFormData: React.Dispatch<React.SetStateAction<any>>,
  t: any,
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Auto-transliterate: debounced 600ms after the user stops typing in the English
  // name, triggered from the field's onChange handler (scheduleUnitNameTransliterate /
  // scheduleRenterNameTransliterate below) rather than a useEffect watching the value.
  const { handleBlurTransliterate, scheduleAutoTransliterate: scheduleUnitNameTransliterate } = useTransliteration(
    locale,
    formData.unitNameLocal || '',
    (converted) => {
      setFormData((prev: any) => ({ ...prev, unitNameLocal: converted }));
    }
  );

  const { handleBlurTransliterate: handleRenterNameBlurTransliterate, scheduleAutoTransliterate: scheduleRenterNameTransliterate } = useTransliteration(
    locale,
    formData.renterNameLocal || '',
    (converted) => {
      setFormData((prev: any) => ({ ...prev, renterNameLocal: converted }));
    }
  );

  // Dedicated handler for the local (Marathi) name field — allows all Unicode characters
  const handleLocalNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev: any) => ({ ...prev, unitNameLocal: val }));
  };

  const handleLocalNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    await handleBlurTransliterate(e.target.value);
  };

  const handleLocalRenterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev: any) => ({ ...prev, renterNameLocal: val }));
  };

  const handleLocalRenterNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    await handleRenterNameBlurTransliterate(e.target.value);
  };

  // Auto-transliterate unitName/renterName into their local-language counterparts,
  // debounced from this onChange rather than a useEffect watching formData.
  const handleChangeWithTransliteration = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    if (e.target.name === 'unitName') scheduleUnitNameTransliterate(e.target.value);
    else if (e.target.name === 'renterName') scheduleRenterNameTransliterate(e.target.value);
  };

  useEffect(() => {
    if (formData.leaseStart && formData.leaseEnd) {
      const computed = calculateDuration(formData.leaseStart, formData.leaseEnd, t);
      if (computed && formData.duration !== computed) {
        setFormData((prev: any) => ({ ...prev, duration: computed }));
      }
    } else {
      if (formData.duration) {
        setFormData((prev: any) => ({ ...prev, duration: '' }));
      }
    }
  }, [formData.leaseStart, formData.leaseEnd, formData.duration, setFormData, t]);

  const handleRenterToggle = (val: string) => {
    const isTrue = val === 'true';
    setFormData((prev: any) => ({
      ...prev,
      isRenter: isTrue,
      isRented: isTrue,
      ...(isTrue && !prev.rentType && {
        rentType: 'Rent',
        rentFreq: prev.rentFreq || 'Monthly',
        depositType: prev.depositType || 'Refundable',
      }),
      ...(!isTrue && {
        rentType: '',
        leaseStart: '',
        leaseEnd: '',
        duration: '',
        rentFreq: '',
        rentAmount: '',
        securityDeposit: '',
        depositType: '',
      }),
    }));
  };

  return {
    locale,
    handleLocalNameChange,
    handleLocalNameBlur,
    handleLocalRenterNameChange,
    handleLocalRenterNameBlur,
    handleRenterToggle,
    handleChangeWithTransliteration,
  };
}
