'use client';

import { ChangeEvent, FocusEvent } from 'react';
import { Landmark } from 'lucide-react';
import { BankMasterFormData } from '@/types/bank-master.types';
import * as CONST from '@/lib/api/configuration-settings/bank/bank-master.constants';
import { BankMasterErrors } from '@/lib/api/configuration-settings/bank/bank-master.validator';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { BankFormField } from './BankFormField';

interface BankBasicDetailsProps {
  formData: BankMasterFormData;
  errors: BankMasterErrors;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
}

export function BankBasicDetails({
  formData,
  errors,
  t,
  handleChange,
  handleBlur,
}: BankBasicDetailsProps) {
  const bankLabel = useAliasLabel('Bank', t('aliasFallback.bank'));
  const bankCodeLabel = useAliasLabel('Bank_Code', t('aliasFallback.bankCode'));
  const bankNameLabel = useAliasLabel('Bank_Name', t('aliasFallback.bankName'));
  const branchNameLabel = useAliasLabel('Branch_Name', t('aliasFallback.branchName'));
  const ifscCodeLabel = useAliasLabel('IFSC_Code', t('aliasFallback.ifscCode'));

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-600 text-white rounded-md">
          <Landmark className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-blue-900">
          {t('drawer.sections.basicDetails', { bank: bankLabel })}
        </h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-3">
          <BankFormField
            id="bankCode"
            label={bankCodeLabel}
            value={formData.bankCode}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.bankCode')}
            maxLength={CONST.BANK_CODE_MAX}
            error={
              errors.bankCode
                ? t(`validation.${errors.bankCode}`, { count: CONST.BANK_CODE_MAX })
                : undefined
            }
            className="h-9 font-mono uppercase"
          />
        </div>

        <div className="col-span-5">
          <BankFormField
            id="bankName"
            label={bankNameLabel}
            value={formData.bankName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.bankName')}
            maxLength={CONST.BANK_NAME_MAX}
            error={
              errors.bankName
                ? t(`validation.${errors.bankName}`, { count: CONST.BANK_NAME_MAX })
                : undefined
            }
            className="h-9"
          />
        </div>

        <div className="col-span-4">
          <BankFormField
            id="ifscCode"
            label={ifscCodeLabel}
            value={formData.ifscCode}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.ifscCode')}
            maxLength={CONST.IFSC_CODE_MAX}
            error={
              errors.ifscCode
                ? t(`validation.${errors.ifscCode}`, { count: CONST.IFSC_CODE_MAX })
                : undefined
            }
            className="h-9 font-mono uppercase"
          />
        </div>

        <div className="col-span-12">
          <BankFormField
            id="branchName"
            label={branchNameLabel}
            value={formData.branchName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.branchName')}
            maxLength={CONST.BRANCH_NAME_MAX}
            error={
              errors.branchName
                ? t(`validation.${errors.branchName}`, { count: CONST.BRANCH_NAME_MAX })
                : undefined
            }
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}
