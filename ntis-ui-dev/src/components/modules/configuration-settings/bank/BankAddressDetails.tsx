'use client';

import { ChangeEvent, FocusEvent } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/label';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { cn } from '@/lib/utils/cn';
import { BankMasterFormData } from '@/types/bank-master.types';
import * as CONST from '@/lib/api/configuration-settings/bank/bank-master.constants';
import { BankMasterErrors } from '@/lib/api/configuration-settings/bank/bank-master.validator';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface BankAddressDetailsProps {
  formData: BankMasterFormData;
  errors: BankMasterErrors;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
}

export function BankAddressDetails({
  formData,
  errors,
  t,
  handleChange,
  handleBlur,
}: BankAddressDetailsProps) {
  const streetAddressLabel = useAliasLabel('Street_Address', t('aliasFallback.streetAddress'));
  const cityLabel = useAliasLabel('City', t('aliasFallback.city'));
  const stateLabel = useAliasLabel('State', t('aliasFallback.state'));
  const pincodeLabel = useAliasLabel('Pincode', t('aliasFallback.pincode'));

  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border-2 border-violet-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-violet-600 text-white rounded-md">
          <MapPin className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-violet-900">{t('drawer.sections.addressDetails')}</h3>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 space-y-1.5">
          <Label htmlFor="address" className="text-sm font-medium">
            {streetAddressLabel} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            required
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.streetAddress')}
            maxLength={CONST.ADDRESS_MAX}
            aria-describedby={errors.address ? 'address-error' : undefined}
            className={cn(
              'bg-white',
              errors.address && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          <ValidationMessage
            id="address-error"
            message={
              errors.address
                ? t(`validation.${errors.address}`, { count: CONST.ADDRESS_MAX })
                : undefined
            }
          />
        </div>

        <div className="col-span-5 space-y-1.5">
          <Label htmlFor="city" className="text-sm font-medium">
            {cityLabel} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            required
            name="city"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.city')}
            maxLength={CONST.CITY_MAX}
            aria-describedby={errors.city ? 'city-error' : undefined}
            className={cn(
              'h-9 bg-white',
              errors.city && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          <ValidationMessage
            id="city-error"
            message={
              errors.city ? t(`validation.${errors.city}`, { count: CONST.CITY_MAX }) : undefined
            }
          />
        </div>

        <div className="col-span-5 space-y-1.5">
          <Label htmlFor="state" className="text-sm font-medium">
            {stateLabel} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="state"
            required
            name="state"
            value={formData.state}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.state')}
            maxLength={CONST.STATE_MAX}
            aria-describedby={errors.state ? 'state-error' : undefined}
            className={cn(
              'h-9 bg-white',
              errors.state && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          <ValidationMessage
            id="state-error"
            message={
              errors.state ? t(`validation.${errors.state}`, { count: CONST.STATE_MAX }) : undefined
            }
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="pincode" className="text-sm font-medium">
            {pincodeLabel} <span className="text-red-500">*</span>
          </Label>

          <Input
            id="pincode"
            required
            name="pincode"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.pincode}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('drawer.placeholders.pincode')}
            maxLength={CONST.PINCODE_MAX}
            aria-describedby={errors.pincode ? 'pincode-error' : undefined}
            className={cn(
              'h-9 font-mono bg-white',
              errors.pincode && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          <ValidationMessage
            id="pincode-error"
            message={
              errors.pincode
                ? t(`validation.${errors.pincode}`, { count: CONST.PINCODE_MAX })
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
