'use client';

import { Landmark } from 'lucide-react';
import { Drawer } from '@/components/common/Drawer';
import { BankMasterData } from '@/types/bank-master.types';
import { useBankForm } from '@/hooks/configuration-settings/bank/useBankForm';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { BankBasicDetails } from './BankBasicDetails';
import { BankAddressDetails } from './BankAddressDetails';
import { BankStatusToggle } from './BankStatusToggle';
import { BankFormFooter } from './BankFormFooter';

interface BankFormProps {
  id: string | null;
  initialData?: BankMasterData;
}

export function BankForm({ id, initialData }: BankFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    open,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    t,
    tCommon,
    isEdit,
  } = useBankForm({
    id,
    initialData,
  });

  const bankLabel = useAliasLabel('Bank', t('aliasFallback.bank'));

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      width="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit
                ? t('drawer.editTitle', { bank: bankLabel })
                : t('drawer.addTitle', { bank: bankLabel })}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('drawer.subtitle', { bank: bankLabel })}
            </p>
          </div>
        </div>
      }
      footer={
        <BankFormFooter
          isEdit={isEdit}
          isSubmitting={isSubmitting}
          bankName={formData.bankName}
          onCancel={handleCancel}
          t={t}
          tCommon={tCommon}
          bankLabel={bankLabel}
        />
      }
    >
      <form
        id="bank-form"
        onSubmit={handleSubmit}
        noValidate
        className="p-5 space-y-4 bg-gray-50/50"
      >
        <BankBasicDetails
          formData={formData}
          errors={errors}
          t={t}
          handleChange={handleChange}
          handleBlur={handleBlur}
        />

        <BankAddressDetails
          formData={formData}
          errors={errors}
          t={t}
          handleChange={handleChange}
          handleBlur={handleBlur}
        />

        {isEdit && (
          <BankStatusToggle
            isActive={formData.isActive}
            onChange={handleToggleStatus}
            t={t}
            tCommon={tCommon}
          />
        )}
      </form>
    </Drawer>
  );
}
