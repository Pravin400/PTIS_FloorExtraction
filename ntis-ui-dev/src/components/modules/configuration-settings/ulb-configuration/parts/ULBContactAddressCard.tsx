'use client';

import { Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import * as ULB_VALIDATION from '@/lib/api/configuration-settings/ulb-configuration/ulb-form-validation.constants';
import type { ULBContactAddressCardProps } from '@/types/ulbconfig-master.types';
import { UlbInput, UlbTextArea } from '../ULBFormField';

export function ULBContactAddressCard({
  formData,
  t,
  onFieldChange,
  onFieldBlur,
  getFieldError,
}: ULBContactAddressCardProps) {
  return (
    <Card className="flex flex-col border-none bg-white/80 ring-1 ring-slate-200/60 lg:col-span-3">
      <CardHeader className="px-3.5 pt-3 pb-1.5">
        <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-tight text-slate-800">
          <Mail className="h-3.5 w-3.5 text-primary" />
          {t('sections.contactInfo')} & {t('fields.address')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-3.5 pb-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <UlbInput
              label={t('fields.email')}
              required
              type="email"
              placeholder={t('placeholders.email')}
              value={formData.email}
              maxLength={ULB_VALIDATION.EMAIL_MAX}
              error={getFieldError('email')}
              onChange={(e) => onFieldChange('email', e.target.value)}
              onBlur={() => onFieldBlur('email')}
            />
            <div className="grid grid-cols-2 gap-3">
              <UlbInput
                label={t('fields.phone')}
                required
                type="tel"
                inputMode="numeric"
                placeholder={t('placeholders.phone')}
                value={formData.phone}
                maxLength={ULB_VALIDATION.PHONE_LENGTH}
                error={getFieldError('phone')}
                onChange={(e) => onFieldChange('phone', e.target.value)}
                onBlur={() => onFieldBlur('phone')}
              />
              <UlbInput
                label={t('fields.alternatePhone')}
                type="tel"
                inputMode="numeric"
                placeholder={t('placeholders.phone')}
                value={formData.alternatePhone}
                maxLength={ULB_VALIDATION.PHONE_LENGTH}
                error={getFieldError('alternatePhone')}
                onChange={(e) => onFieldChange('alternatePhone', e.target.value)}
                onBlur={() => onFieldBlur('alternatePhone')}
              />
            </div>
            <UlbInput
              label={t('fields.website')}
              type="url"
              placeholder={t('placeholders.website')}
              value={formData.website}
              maxLength={ULB_VALIDATION.WEBSITE_MAX}
              error={getFieldError('website')}
              onChange={(e) => onFieldChange('website', e.target.value)}
              onBlur={() => onFieldBlur('website')}
            />
          </div>
          <UlbTextArea
            label={t('fields.address')}
            required
            placeholder="Enter complete address with street, locality, landmarks"
            value={formData.address}
            maxLength={ULB_VALIDATION.ADDRESS_MAX}
            error={!!getFieldError('address')}
            errorMessage={getFieldError('address')}
            onChange={(e) => onFieldChange('address', e.target.value)}
            onBlur={() => onFieldBlur('address')}
            className="min-h-[85px] flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
