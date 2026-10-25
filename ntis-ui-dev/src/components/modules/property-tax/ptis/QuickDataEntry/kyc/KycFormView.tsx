'use client';
import React from 'react';
import { useConfirm } from '@/components/common';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { KycDetails, OwnerTypeApiItem } from '@/types/property-kyc.types';
import { useKycForm } from '@/hooks/ptis/QuickDataEntry/kyc/useKycForm';
import { KycFormFields } from './KycFormFields';
import { KycFormActions } from './KycFormActions';
interface KycFormViewProps {
  KycDetailsData?: KycDetails | null;
  OwnerTypeMasterList?: OwnerTypeApiItem[];
  locale: string;
}

const KycFormView: React.FC<KycFormViewProps> = ({ KycDetailsData, OwnerTypeMasterList, locale }) => {
  const t = useTranslations('quickDataEntry');
  const { confirm } = useConfirm();
  const router = useRouter();

  const {
    formRef,
    formData,
    setFormData,
    mobileInput,
    alternateMobileInput,
    aadharInput,
    isUpdating,
    hasChanges,
    isSubmitted,
    ownerTypeOptions,
    canSubmit,
    handleSubmit
  } = useKycForm({ KycDetailsData, OwnerTypeMasterList, locale }, t, confirm, router);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="mt-0 p-4 space-y-3 min-h-100">
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-300">
            {t('kyc.title')}
          </h3>

          <KycFormFields
            t={t}
            formData={formData}
            setFormData={setFormData}
            ownerTypeOptions={ownerTypeOptions}
            mobileInput={mobileInput}
            alternateMobileInput={alternateMobileInput}
            aadharInput={aadharInput}
            isSubmitted={isSubmitted}
          />

          <KycFormActions
            t={t}
            isUpdating={isUpdating}
            hasChanges={hasChanges}
            canSubmit={canSubmit()}
          />
        </div>
      </div>
    </form>
  );
};


export default KycFormView;
