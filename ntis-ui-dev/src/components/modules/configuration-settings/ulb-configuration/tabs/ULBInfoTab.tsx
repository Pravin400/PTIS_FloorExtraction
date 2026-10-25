'use client';

import { Building2, ChevronRight, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, SaveButton } from '@/components/common';
import {
  INDIAN_STATES,
  ULB_TYPES,
  getDistrictsForState,
  toOptions,
} from '@/config/ulb-configuration.config';
import * as ULB_VALIDATION from '@/lib/api/configuration-settings/ulb-configuration/ulb-form-validation.constants';
import type { ULBInfoTabProps } from '@/types/ulbconfig-master.types';
import { UlbInput, UlbSelect } from '../ULBFormField';
import { ULBContactAddressCard } from '../parts/ULBContactAddressCard';

const CARD_CLASS = 'flex h-full flex-col border-none bg-white/80 ring-1 ring-slate-200/60';
const TITLE_CLASS =
  'flex items-center gap-2 text-xs font-black uppercase tracking-tight text-slate-800';

export function ULBInfoTab({
  formData,
  t,
  onFieldChange,
  onFieldBlur,
  getFieldError,
  onStateChange,
  onSave,
  onNext,
  footerClassName,
}: ULBInfoTabProps) {
  const districtOptions = toOptions(getDistrictsForState(formData.state));

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
          <Card className={CARD_CLASS}>
            <CardHeader className="px-3.5 pt-3 pb-1.5">
              <CardTitle className={TITLE_CLASS}>
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {t('sections.ulbDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 px-3.5 pb-3">
              <UlbInput
                label={t('fields.ulbName')}
                required
                placeholder={t('placeholders.ulbName')}
                value={formData.ulbName}
                maxLength={ULB_VALIDATION.ULB_NAME_MAX}
                error={getFieldError('ulbName')}
                onChange={(e) => onFieldChange('ulbName', e.target.value)}
                onBlur={() => onFieldBlur('ulbName')}
              />
              <div className="grid grid-cols-2 gap-3">
                <UlbInput
                  label={t('fields.ulbCode')}
                  required
                  placeholder={t('placeholders.ulbCode')}
                  value={formData.ulbCode}
                  maxLength={ULB_VALIDATION.ULB_CODE_MAX}
                  error={getFieldError('ulbCode')}
                  onChange={(e) => onFieldChange('ulbCode', e.target.value)}
                  onBlur={() => onFieldBlur('ulbCode')}
                />
                <UlbSelect
                  label={t('fields.ulbType')}
                  required
                  options={toOptions(ULB_TYPES)}
                  value={formData.ulbType}
                  error={getFieldError('ulbType')}
                  onChange={(v) => onFieldChange('ulbType', v)}
                  onBlur={() => onFieldBlur('ulbType')}
                  placeholder={t('placeholders.selectType')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={CARD_CLASS}>
            <CardHeader className="px-3.5 pt-3 pb-1.5">
              <CardTitle className={TITLE_CLASS}>
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {t('sections.locationInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 px-3.5 pb-3">
              <UlbSelect
                label={t('fields.state')}
                required
                options={toOptions(INDIAN_STATES)}
                value={formData.state}
                error={getFieldError('state')}
                onChange={onStateChange}
                onBlur={() => onFieldBlur('state')}
                placeholder={t('placeholders.selectState')}
              />
              <UlbSelect
                label={t('fields.district')}
                required
                options={districtOptions}
                value={formData.district}
                error={getFieldError('district')}
                onChange={(v) => onFieldChange('district', v)}
                onBlur={() => onFieldBlur('district')}
                disabled={!formData.state}
                placeholder={formData.state ? t('placeholders.district') : t('placeholders.selectState')}
              />
              <UlbInput
                label={t('fields.pincode')}
                required
                placeholder={t('placeholders.pincode')}
                value={formData.pincode}
                inputMode="numeric"
                maxLength={ULB_VALIDATION.PINCODE_LENGTH}
                error={getFieldError('pincode')}
                onChange={(e) => onFieldChange('pincode', e.target.value)}
                onBlur={() => onFieldBlur('pincode')}
                className="max-w-[180px]"
              />
            </CardContent>
          </Card>

          <Card className={CARD_CLASS}>
            <CardHeader className="px-3.5 pt-3 pb-1.5">
              <CardTitle className={TITLE_CLASS}>
                <User className="h-3.5 w-3.5 text-primary" />
                {t('sections.contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 px-3.5 pb-3">
              <UlbInput
                label={t('fields.contactPerson')}
                required
                placeholder={t('placeholders.contactName')}
                value={formData.contactPerson}
                maxLength={ULB_VALIDATION.CONTACT_PERSON_MAX}
                error={getFieldError('contactPerson')}
                onChange={(e) => onFieldChange('contactPerson', e.target.value)}
                onBlur={() => onFieldBlur('contactPerson')}
              />
              <UlbInput
                label={t('fields.designation')}
                required
                placeholder={t('placeholders.designation')}
                value={formData.designation}
                maxLength={ULB_VALIDATION.DESIGNATION_MAX}
                error={getFieldError('designation')}
                onChange={(e) => onFieldChange('designation', e.target.value)}
                onBlur={() => onFieldBlur('designation')}
              />
            </CardContent>
          </Card>

          <ULBContactAddressCard
            formData={formData}
            t={t}
            onFieldChange={onFieldChange}
            onFieldBlur={onFieldBlur}
            getFieldError={getFieldError}
          />
        </div>
      </div>

      <div className={`${footerClassName} justify-end`}>
        <SaveButton label={t('buttons.save')} onClick={onSave} className="h-11 rounded-xl px-6" />
        <Button
          onClick={onNext}
          icon={ChevronRight}
          iconPosition="right"
          className="inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-blue-700 px-8 font-black text-white hover:bg-blue-800"
        >
          {t('buttons.next')}
        </Button>
      </div>
    </>
  );
}

