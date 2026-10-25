'use client';

import { Wallet, AlertCircle, CheckCircle2, X, TrendingUp } from 'lucide-react';

import { Drawer } from '@/components/common/Drawer';
import { AddButton, CancelButton } from '@/components/common/ActionButtons';
import { Input } from '@/components/common/Input';
import { ValidationMessage } from '@/components/common/ValidationMessage';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import { Select } from '@/components/common/select';
import type { PaymentModeFormProps } from '@/types/paymentMode.types';
import { cn } from '@/lib/utils/cn';
import { Label } from '@/components/common/label';
import { TextArea } from '@/components/common/Textarea';
import { useTranslations } from 'next-intl';
import { usePaymentModeForm } from '@/hooks/configuration-settings/payment-mode/usePaymentModeForm';
import { PAYMENT_TYPES, PAYMENT_CATEGORIES, CHARGE_TYPES } from '@/lib/constants/payment-mode.constants';

/* ================= MAIN ================= */
export default function PaymentModeForm(props: PaymentModeFormProps) {
  const { open, onClose } = props;
  const t = useTranslations('paymentModeMaster');

  const {
    formData,
    errors,
    isSubmitting,
    isActive,
    isEdit,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    showError,
    setFieldValue,
    resetForm,
  } = usePaymentModeForm({ ...props, t });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ================= UI ================= */
  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('form.title.edit') : t('form.title.add')}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t('form.subtitle.edit') : t('form.subtitle.add')}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t('form.buttons.cancel')} onClick={handleClose} />
          <AddButton
            label={isEdit ? t('form.buttons.update') : t('form.buttons.save')}
            type="submit"
            form="payment-mode-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="payment-mode-form"
        data-testid="payment-mode-form"
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#F8FAFF] p-5 text-left"
      >
        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                name="code"
                label={t('form.fields.code')}
                placeholder={t('form.fields.codePlaceholder')}
                required={true}
                value={formData.code}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isEdit}
                fullWidth
              />
              <ValidationMessage message={errors.code} visible={showError('code')} />
            </div>
            <div>
              <Input
                name="paymentModeName"
                label={t('form.fields.paymentModeName')}
                placeholder={t('form.fields.paymentModeNamePlaceholder')}
                required={true}
                value={formData.paymentModeName}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
              <ValidationMessage
                message={errors.paymentModeName}
                visible={showError('paymentModeName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('form.fields.type')}
              value={formData.type}
              onChange={(_, value) => setFieldValue('type', value)}
              options={PAYMENT_TYPES.map((type) => ({ 
                label: t(`form.fields.paymentTypes.${type.toLowerCase()}`, { defaultValue: type }), 
                value: type 
              }))}
            />
            <Select
              label={t('form.fields.category')}
              value={formData.category}
              onChange={(_, value) => setFieldValue('category', value)}
              options={PAYMENT_CATEGORIES.map((category) => ({ 
                label: t(`form.fields.categories.${category.toLowerCase().replace(/\s+/g, '')}`, { defaultValue: category }), 
                value: category 
              }))}
            />
          </div>

          <div className="text-gray-700">
            <label className="block mb-1 font-medium">{t('form.fields.description')}</label>

            <TextArea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={2}
              placeholder={t('form.fields.descriptionPlaceholder')}
              className="w-full dark:text-black"
              maxLength={200}
              showCharCount
              error={showError('description')}
              errorMessage={showError('description') ? errors.description : undefined}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-bold text-blue-900 flex items-center gap-2">
            <TrendingUp size={16} />
            {t('form.fields.transactionCharge')}
          </Label>
          <div className="rounded-xl border border-[#DCEAFF] bg-white p-5 space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('form.fields.chargeType')}
                value={formData.chargeType}
                onChange={(_, value) => setFieldValue('chargeType', value)}
                options={CHARGE_TYPES.map((type) => ({ 
                  label: t(`form.fields.chargeTypes.${type.toLowerCase()}`, { defaultValue: type }), 
                  value: type 
                }))}
              />
              <div>
                <Input
                  label={t('form.fields.transactionCharge')}
                  type="number"
                  step="0.01"
                  min="0"
                  name="transactionCharge"
                  value={formData.transactionCharge}
                  onChange={(e) => {
                    const rawValue = e.target.value;

                    if (rawValue === '') {
                      setFieldValue('transactionCharge', '');
                      return;
                    }

                    const val = parseFloat(rawValue);
                    setFieldValue('transactionCharge', Number.isNaN(val) ? '' : val);
                  }}
                  onBlur={handleBlur}
                  onFocus={(e) => e.target.select()}
                  placeholder={t('form.fields.transactionChargePlaceholder')}
                  disabled={formData.chargeType === 'None'}
                  error={showError('transactionCharge') ? errors.transactionCharge : undefined}
                  fullWidth
                />
              </div>
            </div>
          </div>
        </div>

        {isEdit && (
          <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
            <div
              className={cn(
                'rounded-xl p-3 flex items-center justify-between',
                isActive
                  ? 'border border-blue-200 bg-[#F0F6FF]'
                  : 'border border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-9 w-9 flex items-center justify-center rounded-full',
                    isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-900'
                  )}
                >
                  {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{t('form.fields.isActive')}</div>
                  <div className="text-sm text-gray-500">
                    {t('form.fields.statusText', {
                      status: isActive ? t('status.active') : t('status.inactive'),
                    })}
                  </div>
                </div>
              </div>

              <ToggleSwitch checked={isActive} onChange={handleToggleStatus} showPopup={false} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>
            {t.rich('form.mandatory', {
              b: (chunks) => <b>{chunks}</b>,
            })}
          </span>
        </div>
      </form>
    </Drawer>
  );
}
