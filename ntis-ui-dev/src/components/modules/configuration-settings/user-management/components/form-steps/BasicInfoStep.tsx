'use client';

import { useEffect, useState } from 'react';
import { Building2, Mail, Phone, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Label, Input, ToggleSwitch, ValidationMessage, Button } from '@/components/common';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { BasicInfoStepProps } from '@/types/user-management';
import { TwoFactorSetupWizard } from '../TwoFactorSetupWizard';
import {
  requireUserTwoFactorAction,
  unrequireUserTwoFactorAction,
  resetUserTwoFactorAction,
} from '@/app/[locale]/configuration-settings/user-management/actions.mutations';
import { getCurrentUserIdAction } from '@/app/[locale]/configuration-settings/user-management/actions';

function resolveActionError(
  t: (key: string) => string,
  message: string | undefined,
  fallbackKey: string
): string {
  if (!message) return t(fallbackKey);
  if (message.startsWith('messages.') || message.startsWith('errors.')) return t(message);
  return getCleanErrorMessage(message, t(fallbackKey));
}

function TwoFactorAdminSection({
  editingUser,
  t,
}: {
  editingUser: NonNullable<BasicInfoStepProps['editingUser']>;
  t: (key: string) => string;
}) {
  const { confirm } = useConfirm();
  const userId = Number(editingUser.id);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(editingUser.twoFactorEnabled);
  const [twoFactorRequired, setTwoFactorRequired] = useState(editingUser.twoFactorRequired);
  const [isToggling, setIsToggling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isSelfTarget, setIsSelfTarget] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getCurrentUserIdAction();
      if (active && res.success && res.data === userId) {
        setIsSelfTarget(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleRequireToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      const res = checked
        ? await requireUserTwoFactorAction(userId)
        : await unrequireUserTwoFactorAction(userId);
      if (res.success) {
        setTwoFactorRequired(checked);
        toast.success(checked ? t('twoFactor.requireSuccess') : t('twoFactor.unrequireSuccess'));
      } else {
        toast.error(resolveActionError(t, res.message, 'twoFactor.requireError'));
      }
    } catch (error) {
      toast.error(getCleanErrorMessage(error, t('twoFactor.requireError')));
    } finally {
      setIsToggling(false);
    }
  };

  const handleReset = () => {
    confirm({
      variant: 'warning',
      title: t('twoFactor.resetConfirmTitle'),
      description: t('twoFactor.resetConfirmDescription'),
      onConfirm: async () => {
        setIsResetting(true);
        try {
          const res = await resetUserTwoFactorAction(userId);
          if (res.success) {
            setTwoFactorEnabled(false);
            toast.success(t('twoFactor.resetSuccess'));
          } else {
            toast.error(resolveActionError(t, res.message, 'twoFactor.resetError'));
          }
        } catch (error) {
          toast.error(getCleanErrorMessage(error, t('twoFactor.resetError')));
        } finally {
          setIsResetting(false);
        }
      },
    });
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{t('twoFactor.title')}</Label>
        {twoFactorEnabled ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">{t('twoFactor.enabled')}</span>
          </div>
        ) : twoFactorRequired ? (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">{t('twoFactor.pendingSetup')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
            <ShieldOff className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">{t('twoFactor.off')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <div className="space-y-0.5 pr-4">
          <p className="text-sm font-medium text-slate-700">{t('twoFactor.requireLabel')}</p>
          <p className="text-xs text-slate-500">{t('twoFactor.requireDescription')}</p>
        </div>
        <ToggleSwitch
          checked={twoFactorRequired}
          onChange={handleRequireToggle}
          disabled={isToggling}
          showPopup={false}
        />
      </div>

      {!twoFactorEnabled && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="space-y-0.5 pr-4">
            <p className="text-sm font-medium text-slate-700">{t('twoFactor.setUpNowLabel')}</p>
            <p className="text-xs text-slate-500">
              {isSelfTarget
                ? t('twoFactor.setUpNowSelfDescription')
                : t('twoFactor.setUpNowDescription')}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowSetupWizard(true)}
            className="shrink-0"
          >
            {t('twoFactor.setUpNowButton')}
          </Button>
        </div>
      )}

      {showSetupWizard && (
        <TwoFactorSetupWizard
          userId={userId}
          userName={editingUser.userName}
          isSelfTarget={isSelfTarget}
          onCancel={() => setShowSetupWizard(false)}
          onEnabled={() => {
            setTwoFactorEnabled(true);
            setShowSetupWizard(false);
            toast.success(t('twoFactorSetup.enabledSuccess'));
          }}
        />
      )}

      {twoFactorEnabled && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="space-y-0.5 pr-4">
            <p className="text-sm font-medium text-slate-700">{t('twoFactor.resetLabel')}</p>
            <p className="text-xs text-slate-500">{t('twoFactor.resetDescription')}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0"
          >
            {isResetting ? t('actions.saving') : t('twoFactor.resetButton')}
          </Button>
        </div>
      )}
    </div>
  );
}

import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function BasicInfoStep({
  formData,
  setFormData,
  editingUser,
  t,
  errors = {},
}: BasicInfoStepProps) {
  const usernameLabel = useAliasLabel('Username', t('aliasFallback.username'));
  const userCodeLabel = useAliasLabel('User_Code', t('aliasFallback.userCode'));
  const firstNameLabel = useAliasLabel('First_Name', t('aliasFallback.firstName'));
  const middleNameLabel = useAliasLabel('Middle_Name', t('aliasFallback.middleName'));
  const lastNameLabel = useAliasLabel('Last_Name', t('aliasFallback.lastName'));
  const emailLabel = useAliasLabel('Email', t('aliasFallback.email'));
  const mobileNoLabel = useAliasLabel('Mobile_No', t('aliasFallback.mobileNo'));

  return (
    <div className="pr-2">
      <div className="space-y-4 pb-2">
        <div className="bg-linear-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-200">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-700 mb-4">
            <Building2 className="w-5 h-5" />
            {t('form.personalDetails')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{usernameLabel} *</Label>
              <Input
                required
                maxLength={20}
                disabled={!!editingUser}
                value={formData.userName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9.]/g, '');
                  setFormData({ ...formData, userName: val });
                }}
                className="border-2 text-slate-700"
                placeholder={t('form.usernamePlaceholder')}
              />
              {errors.userName && <ValidationMessage message={errors.userName} />}
            </div>
            <div className="space-y-2">
              <Label>{userCodeLabel}</Label>
              <Input
                maxLength={15}
                disabled={!!editingUser}
                value={formData.userCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                  setFormData({ ...formData, userCode: val });
                }}
                className="border-2 text-slate-700"
                placeholder={t('form.userCodePlaceholder')}
              />
              {errors.userCode && <ValidationMessage message={errors.userCode} />}
            </div>
            <div className="space-y-2">
              <Label>{firstNameLabel} *</Label>
              <Input
                required
                maxLength={40}
                value={formData.firstName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '');
                  setFormData({ ...formData, firstName: val });
                }}
                className="border-2"
              />
              {errors.firstName && <ValidationMessage message={errors.firstName} />}
            </div>
            <div className="space-y-2">
              <Label>{middleNameLabel}</Label>
              <Input
                maxLength={40}
                value={formData.middleName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '');
                  setFormData({ ...formData, middleName: val });
                }}
                className="border-2"
              />
              {errors.middleName && <ValidationMessage message={errors.middleName} />}
            </div>
            <div className="space-y-2">
              <Label>{lastNameLabel} *</Label>
              <Input
                required
                maxLength={40}
                value={formData.lastName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s]/g, '');
                  setFormData({ ...formData, lastName: val });
                }}
                className="border-2"
              />
              {errors.lastName && <ValidationMessage message={errors.lastName} />}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {emailLabel} *
              </Label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9@.]/g, '');
                  setFormData({ ...formData, email: val });
                }}
                className="border-2"
              />
              {errors.email && <ValidationMessage message={errors.email} />}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {mobileNoLabel} *
              </Label>
              <Input
                required
                maxLength={10}
                value={formData.mobileNo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobileNo: val });
                }}
                className="border-2"
              />
              {errors.mobileNo && <ValidationMessage message={errors.mobileNo} />}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{t('form.address')}</Label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full min-h-[60px] p-2 rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:outline-none transition-colors text-slate-700"
                placeholder={t('form.addressPlaceholder')}
              />
            </div>

            {editingUser && (
              <div className="col-span-2">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">{t('filters.status')}</Label>
                    <p className="text-xs text-slate-500">
                      {formData.isActive ? t('filters.active') : t('filters.inactive')}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={formData.isActive}
                    onChange={(checked) =>
                      setFormData({
                        ...formData,
                        isActive: checked,
                        status: checked ? 'Active' : 'Inactive',
                      })
                    }
                    showPopup={false}
                  />
                </div>
              </div>
            )}

            {editingUser && (
              <div className="col-span-2">
                <TwoFactorAdminSection editingUser={editingUser} t={t} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
