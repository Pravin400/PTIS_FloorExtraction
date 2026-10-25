'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useLoading } from '@/hooks/useLoading';
import { useDigitInputs } from '@/hooks/useDigitInputs';
import { SocietyDetailItem } from '@/types/zone-master/properties/societyDetails.types';
import { WingItem } from '@/types/zone-master/properties/wing.types';
import { societyValidators } from '@/lib/utils/society-validation/society-validation';
import { kycValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { updateApartmentQcWingDetailsAction } from '@/app/[locale]/property-tax/ptis/apartment/action';

export interface UseWingFormProps {
  propertyId: number;
  locale: string;
  initialWingDetailId?: number | null;
  initialSocietyDetailId?: number | null;
  societyWings: SocietyDetailItem[];
  wingMaster: WingItem[];
}

export type WingFormField =
  | 'wingName'
  | 'managerName'
  | 'managerNameEnglish'
  | 'managerMobile'
  | 'managerEmail'
  | 'secretaryName'
  | 'secretaryNameEnglish'
  | 'secretaryMobile'
  | 'secretaryEmail';

export const useWingForm = ({
  propertyId: _propertyId,
  initialWingDetailId,
  initialSocietyDetailId,
  societyWings: initialSocietyWings,
  wingMaster,
}: UseWingFormProps) => {
  const t = useTranslations('quickDataEntry');
  const { confirm } = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const { isLoading: isUpdating, startLoading, stopLoading } = useLoading(false);

  const [societyWings, setSocietyWings] = useState<SocietyDetailItem[]>(initialSocietyWings);

  // Read wingDetailId / wingId from URL query params
  const urlWingId = useMemo(() => {
    const raw = searchParams?.get('wingDetailId') || searchParams?.get('wingId');
    if (raw) {
      const parsed = Number(raw);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  }, [searchParams]);

  const targetWingId = initialWingDetailId ?? urlWingId ?? initialSocietyDetailId;

  // Selected wing ID
  const [selectedSocietyDetailId, setSelectedSocietyDetailId] = useState<number | null>(() => {
    if (targetWingId) {
      const matched = initialSocietyWings.find(
        (w) => w.id === targetWingId || w.wingId === targetWingId
      );
      if (matched) return matched.id;
      return targetWingId;
    }
    return initialSocietyWings[0]?.id ?? null;
  });

  // Find active wing record by ID or wingId
  const currentWing = useMemo(() => {
    const activeId = selectedSocietyDetailId ?? targetWingId;
    if (activeId) {
      const found = societyWings.find(
        (w) => w.id === activeId || w.wingId === activeId
      );
      if (found) return found;
    }
    return societyWings[0] ?? null;
  }, [selectedSocietyDetailId, targetWingId, societyWings]);

  // Extract mobile digits & country code
  const parseMobile = useCallback((rawMobile?: string | null) => {
    if (!rawMobile) return { countryCode: '91', digits: '' };
    const clean = rawMobile.replace(/\D/g, '');
    if (clean.length > 10) {
      return {
        countryCode: clean.slice(0, clean.length - 10) || '91',
        digits: clean.slice(-10),
      };
    }
    return { countryCode: '91', digits: clean };
  }, []);

  // Form Fields State (9 fields)
  const [wingName, setWingName] = useState<string>('');
  const [managerName, setManagerName] = useState<string>('');
  const [managerNameEnglish, setManagerNameEnglish] = useState<string>('');
  const [managerMobileCountryCode, setManagerMobileCountryCode] = useState<string>('91');
  const [rawManagerMobile, setRawManagerMobile] = useState<string>('');
  const [managerEmailId, setManagerEmailId] = useState<string>('');
  const [secretaryName, setSecretaryName] = useState<string>('');
  const [secretaryNameEnglish, setSecretaryNameEnglish] = useState<string>('');
  const [secretaryMobileCountryCode, setSecretaryMobileCountryCode] = useState<string>('91');
  const [rawSecretaryMobile, setRawSecretaryMobile] = useState<string>('');
  const [secretaryEmailId, setSecretaryEmailId] = useState<string>('');

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Initialize fields when currentWing changes
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional prop-to-state sync when selected wing changes */
  useEffect(() => {
    if (currentWing) {
      setWingName(currentWing.wingName || currentWing.wingNo || '');
      setManagerName(currentWing.managerName || '');
      setManagerNameEnglish(currentWing.managerNameEnglish || '');
      const mgr = parseMobile(currentWing.managerMobileNo);
      setManagerMobileCountryCode(mgr.countryCode);
      setRawManagerMobile(mgr.digits);
      setManagerEmailId(currentWing.managerEmailId || '');

      setSecretaryName(currentWing.secretaryName || '');
      setSecretaryNameEnglish(currentWing.secretaryNameEnglish || '');
      const sec = parseMobile(currentWing.secretaryMobileNo);
      setSecretaryMobileCountryCode(sec.countryCode);
      setRawSecretaryMobile(sec.digits);
      setSecretaryEmailId(currentWing.secretaryEmailId || '');

      setIsSubmitted(false);
    }
  }, [currentWing, parseMobile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Multi-digit inputs for Manager and Secretary mobile numbers
  const managerMobileInput = useDigitInputs(10, rawManagerMobile);
  const secretaryMobileInput = useDigitInputs(10, rawSecretaryMobile);

  // Reactive unsaved changes check
  const hasChanges = useMemo(() => {
    if (!currentWing) return false;
    const mgrMobile = managerMobileInput.value;
    const secMobile = secretaryMobileInput.value;
    const origMgr = parseMobile(currentWing.managerMobileNo).digits;
    const origSec = parseMobile(currentWing.secretaryMobileNo).digits;

    return (
      wingName.trim() !== (currentWing.wingName || currentWing.wingNo || '').trim() ||
      managerName.trim() !== (currentWing.managerName || '').trim() ||
      managerNameEnglish.trim() !== (currentWing.managerNameEnglish || '').trim() ||
      mgrMobile !== origMgr ||
      managerEmailId.trim() !== (currentWing.managerEmailId || '').trim() ||
      secretaryName.trim() !== (currentWing.secretaryName || '').trim() ||
      secretaryNameEnglish.trim() !== (currentWing.secretaryNameEnglish || '').trim() ||
      secMobile !== origSec ||
      secretaryEmailId.trim() !== (currentWing.secretaryEmailId || '').trim()
    );
  }, [
    currentWing,
    wingName,
    managerName,
    managerNameEnglish,
    managerMobileInput.value,
    managerEmailId,
    secretaryName,
    secretaryNameEnglish,
    secretaryMobileInput.value,
    secretaryEmailId,
    parseMobile,
  ]);

  const checkFormChanges = useCallback(() => {
    // Kept for backward compatibility with form onChange prop
  }, []);

  // Wing selector dropdown options
  const wingOptions = useMemo(() => {
    if (societyWings.length > 0) {
      return societyWings.map((w) => ({
        label: w.wingName || w.wingNo || `Wing ${w.wingId}`,
        value: String(w.id),
      }));
    }
    return wingMaster.map((w) => ({
      label: w.wingNo,
      value: String(w.id),
    }));
  }, [societyWings, wingMaster]);

  const handleWingSelectChange = (_name: string | undefined, value: string) => {
    const id = Number(value);
    if (!isNaN(id)) {
      setSelectedSocietyDetailId(id);
    }
  };

  // Error visibility logic
  const showError = useCallback(
    (field: WingFormField, isValid: boolean): boolean => {
      if (focusedField === field && !isSubmitted) return false;
      if (isSubmitted) return !isValid;

      if (field === 'managerMobile') {
        return (
          !isValid &&
          ((!managerMobileInput.isFocused && managerMobileInput.value.length > 0) ||
            (managerMobileInput.isFocused && managerMobileInput.value.length >= 8))
        );
      }
      if (field === 'secretaryMobile') {
        return (
          !isValid &&
          ((!secretaryMobileInput.isFocused && secretaryMobileInput.value.length > 0) ||
            (secretaryMobileInput.isFocused && secretaryMobileInput.value.length >= 8))
        );
      }
      if (field === 'wingName') return !!wingName && !isValid;
      if (field === 'managerName') return !!managerName && !isValid;
      if (field === 'managerNameEnglish') return !!managerNameEnglish && !isValid;
      if (field === 'managerEmail') return !!managerEmailId && !isValid;
      if (field === 'secretaryName') return !!secretaryName && !isValid;
      if (field === 'secretaryNameEnglish') return !!secretaryNameEnglish && !isValid;
      if (field === 'secretaryEmail') return !!secretaryEmailId && !isValid;

      return false;
    },
    [
      focusedField,
      isSubmitted,
      managerMobileInput.isFocused,
      managerMobileInput.value.length,
      secretaryMobileInput.isFocused,
      secretaryMobileInput.value.length,
      wingName,
      managerName,
      managerNameEnglish,
      managerEmailId,
      secretaryName,
      secretaryNameEnglish,
      secretaryEmailId,
    ]
  );

  // canSubmit validation check
  const canSubmit = useCallback((): boolean => {
    if (!wingName.trim()) return false;
    const mgrMobile = managerMobileInput.value;
    const secMobile = secretaryMobileInput.value;

    const isMgrMobileValid = !mgrMobile || societyValidators.isValidMobile(mgrMobile);
    const isSecMobileValid = !secMobile || societyValidators.isValidMobile(secMobile);
    const isMgrEmailValid = !managerEmailId || societyValidators.isValidEmail(managerEmailId, true);
    const isSecEmailValid = !secretaryEmailId || societyValidators.isValidEmail(secretaryEmailId, true);
    const isMgrNameValid = !managerName || societyValidators.isValidPersonName(managerName);
    const isMgrNameEnValid = !managerNameEnglish || societyValidators.isValidPersonName(managerNameEnglish);
    const isSecNameValid = !secretaryName || societyValidators.isValidPersonName(secretaryName);
    const isSecNameEnValid = !secretaryNameEnglish || societyValidators.isValidPersonName(secretaryNameEnglish);

    return (
      isMgrMobileValid &&
      isSecMobileValid &&
      isMgrEmailValid &&
      isSecEmailValid &&
      isMgrNameValid &&
      isMgrNameEnValid &&
      isSecNameValid &&
      isSecNameEnValid
    );
  }, [
    wingName,
    managerMobileInput.value,
    secretaryMobileInput.value,
    managerEmailId,
    secretaryEmailId,
    managerName,
    managerNameEnglish,
    secretaryName,
    secretaryNameEnglish,
  ]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!wingName.trim()) {
      toast.error(t('wing.validation.wingNameRequired') || 'Wing Name is required');
      return;
    }

    const mgrMobile = managerMobileInput.value;
    const secMobile = secretaryMobileInput.value;

    if (mgrMobile && !societyValidators.isValidMobile(mgrMobile)) {
      if (kycValidators.hasRepeatedSequence(mgrMobile, 5)) {
        toast.error(t('wing.validation.invalidRepeatedSequence') || 'Repeated number sequences are not allowed.');
      } else if (!/^[6-9]/.test(mgrMobile)) {
        toast.error(t('wing.validation.invalidMobileStart') || 'Mobile number must start with 6 to 9.');
      } else {
        toast.error(t('wing.validation.invalidManagerMobile') || 'Manager Mobile Number must be 10 digits.');
      }
      return;
    }

    if (secMobile && !societyValidators.isValidMobile(secMobile)) {
      if (kycValidators.hasRepeatedSequence(secMobile, 5)) {
        toast.error(t('wing.validation.invalidRepeatedSequence') || 'Repeated number sequences are not allowed.');
      } else if (!/^[6-9]/.test(secMobile)) {
        toast.error(t('wing.validation.invalidMobileStart') || 'Mobile number must start with 6 to 9.');
      } else {
        toast.error(t('wing.validation.invalidSecretaryMobile') || 'Secretary Mobile Number must be 10 digits.');
      }
      return;
    }

    if (managerEmailId && !societyValidators.isValidEmail(managerEmailId, true)) {
      toast.error(t('wing.validation.invalidManagerEmail') || 'Invalid Manager Email address format.');
      return;
    }

    if (secretaryEmailId && !societyValidators.isValidEmail(secretaryEmailId, true)) {
      toast.error(t('wing.validation.invalidSecretaryEmail') || 'Invalid Secretary Email address format.');
      return;
    }

    const payload = {
      wingName: wingName.trim(),
      managerName: managerName.trim() || undefined,
      managerNameEnglish: managerNameEnglish.trim() || undefined,
      managerMobileNo: mgrMobile ? `+${managerMobileCountryCode}${mgrMobile}` : undefined,
      managerEmailId: managerEmailId.trim() || undefined,
      secretaryName: secretaryName.trim() || undefined,
      secretaryNameEnglish: secretaryNameEnglish.trim() || undefined,
      secretaryMobileNo: secMobile ? `+${secretaryMobileCountryCode}${secMobile}` : undefined,
      secretaryEmailId: secretaryEmailId.trim() || undefined,
    };

    confirm({
      variant: 'update',
      title: t('common.confirm') || 'Confirm Update',
      description: `Are you sure you want to update details for "${wingName.trim()}"?`,
      confirmText: t('commonbuttonmessages.UpdateChanges') || 'Update Changes',
      onConfirm: async () => {
        startLoading();
        try {
          // Resolve the wingDetailId (from currentWing or active IDs)
          const qcWingId = currentWing?.id ?? targetWingId ?? selectedSocietyDetailId;

          if (qcWingId && qcWingId > 0) {
            // Primary & only approach: PATCH /ApartmentQC/wing-details/{wingDetailId}
            const qcRes = await updateApartmentQcWingDetailsAction(qcWingId, payload);

            if (qcRes && !qcRes.success && qcRes.error) {
              toast.error(qcRes.error || t('wing.errors.updateFailed'));
              return;
            }

            // Update local state
            setSocietyWings((prev) =>
              prev.map((item) =>
                item.id === qcWingId || item.wingId === qcWingId
                  ? {
                      ...item,
                      wingName: payload.wingName,
                      managerName: payload.managerName || '',
                      managerNameEnglish: payload.managerNameEnglish || '',
                      managerMobileNo: payload.managerMobileNo || '',
                      managerEmailId: payload.managerEmailId || '',
                      secretaryName: payload.secretaryName || '',
                      secretaryNameEnglish: payload.secretaryNameEnglish || '',
                      secretaryMobileNo: payload.secretaryMobileNo || '',
                      secretaryEmailId: payload.secretaryEmailId || '',
                    }
                  : item
              )
            );

            toast.success(t('wing.success.wingUpdated') || 'Wing details updated successfully!');
            router.refresh();
          } else {
            toast.error(t('wing.errors.notFound') || 'Wing detail record not found.');
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t('wing.errors.updateFailed'));
        } finally {
          stopLoading();
        }
      },
    });
  };

  return {
    formRef,
    hasChanges,
    isUpdating,
    selectedWingDetailId: selectedSocietyDetailId,
    selectedSocietyDetailId,
    societyWings,
    currentWing,
    wingOptions,
    handleWingSelectChange,
    wingName,
    setWingName,
    managerName,
    setManagerName,
    managerNameEnglish,
    setManagerNameEnglish,
    managerMobileCountryCode,
    setManagerMobileCountryCode,
    managerMobileInput,
    managerEmailId,
    setManagerEmailId,
    secretaryName,
    setSecretaryName,
    secretaryNameEnglish,
    setSecretaryNameEnglish,
    secretaryMobileCountryCode,
    setSecretaryMobileCountryCode,
    secretaryMobileInput,
    secretaryEmailId,
    setSecretaryEmailId,
    showError,
    canSubmit,
    handleSubmit,
    checkFormChanges,
    focusedField,
    setFocusedField,
  };
};
