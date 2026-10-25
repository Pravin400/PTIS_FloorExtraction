
"use client";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Layers3,
  CheckCircle2,
} from "lucide-react";
import type { UseGroup, UseGroupFormProps } from "@/types/typeOfUse.types";
import { Input } from "@/components/common/Input";
import {
  createUseGroup,
  updateUseGroup,
} from "@/app/[locale]/property-tax/typeofusemaster/actions";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Drawer } from '@/components/common/Drawer';
import { CancelButton, SaveButton, ValidationMessage } from '@/components/common';
import { validateForm } from '@/lib/utils/validation-helpers';
import { sanitizeCode, sanitizeText } from '@/lib/utils/sanitization';
import { useGroupFormValidation } from '@/hooks/TypeOfUseMaster/useGroupFormValidation';
import { GroupIconSelector, getIconKey } from './GroupIconSelector';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

type FieldErrors = {
  code?: string;
  name?: string;
};

export default function UseGroupForm({ id, initialData, allGroups: allGroupsProp = [] }: UseGroupFormProps) {
  const t = useTranslations('typeofusemaster');
  const router = useRouter();
  const isEdit = Boolean(id);

  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  const [formData, setFormData] = useState<UseGroup>(
    initialData || {
      typeOfUseGroupId: 0,
      typeOfUseGroupCode: "",
      groupName: "",
      groupIcon: "home-icon",
      isActive: true,
      status: "Active",
    }
  );

  const [allGroups] = useState<UseGroup[]>(allGroupsProp);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Use validation hook
  const { validationSchema } = useGroupFormValidation({
    formData,
    allGroups,
    isEdit,
    t,
  });

  const isActiveStatus = formData.isActive ?? true;

  const handleStatusToggle = () => {
    setFormData((p) => ({
      ...p,
      isActive: !p.isActive,
      status: p.isActive ? "Inactive" : "Active",
    }));
  };

  const showError = (field: keyof FieldErrors) =>
    (submittedOnce || touched[field as string]) && !!errors[field];

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((p) => ({ ...p, [field]: true }));

    const validationErrors = validateForm(formData, validationSchema);
    setErrors({
      code: validationErrors.typeOfUseGroupCode,
      name: validationErrors.groupName
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    const validationErrors = validateForm(formData, validationSchema);
    setErrors({
      code: validationErrors.typeOfUseGroupCode,
      name: validationErrors.groupName
    });

    if (Object.keys(validationErrors).length > 0) return;

    if (isEdit) {
      const result = await updateUseGroup({
        id: formData.typeOfUseGroupId,
        code: formData.typeOfUseGroupCode,
        name: formData.groupName,
        icon: getIconKey(formData.groupIcon),
        status: formData.isActive ? "Active" : "Inactive",
      });

      if (!result.success) {
        const errorMessage = result.message || '';
        const msg = errorMessage.toLowerCase();

        const isDup =
          msg.includes("duplicate") ||
          msg.includes("already exists") ||
          msg.includes("unique");

        if (isDup) {
          setErrors((p) => ({
            ...p,
            name: t('messages.duplicateGroupName'),
          }));
          setTouched((p) => ({
            ...p,
            name: true,
          }));
          return;
        }

        // Show backend error message
        toast.error(errorMessage || t('messages.updateGroupFailed', { use: useLabel }));
        return;
      }

      toast.success(t('messages.groupUpdated', { use: useLabel }));
    } else {
      const result = await createUseGroup({
        code: formData.typeOfUseGroupCode,
        name: formData.groupName,
        icon: getIconKey(formData.groupIcon),
        status: formData.isActive ? "Active" : "Inactive",
      });

      if (!result.success) {
        const errorMessage = result.message || '';
        const msg = errorMessage.toLowerCase();

        const isDup =
          msg.includes("duplicate") ||
          msg.includes("already exists") ||
          msg.includes("unique");

        if (isDup) {
          setErrors((p) => ({
            ...p,
            name: t('messages.duplicateGroupName'),
          }));
          setTouched((p) => ({
            ...p,
            name: true,
          }));
          return;
        }

        // Show backend error message
        toast.error(errorMessage || t('messages.createGroupFailed', { use: useLabel }));
        return;
      }

      toast.success(t('messages.groupCreated', { use: useLabel }));
    }

    router.back();
  };

  return (
    <Drawer
      open
      onClose={() => router.back()}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white shadow">
            <Layers3 size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t('group.edit', { use: useLabel }) : t('group.add', { use: useLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t('group.editSubtitle', { use: useLabel }) : t('group.addSubtitle', { use: useLabel })}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={t('buttons.cancel')}
            onClick={() => router.back()}
          />
          <SaveButton
            label={isEdit ? t('buttons.edit') : t('buttons.save')}
            type="submit"
            form="use-group-form"
          />
        </>
      }
    >
      <form
        id="use-group-form"
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#F8FAFF] p-5"
      >
        {/* ================= ACTIVE STATUS (EDIT ONLY) ================= */}
        {isEdit && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <div className="text-base font-semibold text-slate-900">{t('group.fields.status')}</div>
                  <div className="text-sm text-slate-500">
                    {t('group.title', { use: useLabel })} {t('status.isCurrently')} <span className={isActiveStatus ? "text-emerald-700 font-medium" : "text-slate-600 font-medium"}>{isActiveStatus ? t('status.active') : t('status.inactive')}</span>
                  </div>
                </div>
              </div>

              <ToggleSwitch
                checked={isActiveStatus}
                onChange={handleStatusToggle}
                showPopup={false}
              />
            </div>
          </div>
        )}

        {/* ================= BASIC DETAILS ================= */}
        <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Input
                label={t('group.fields.groupId')}
                name="typeOfUseGroupCode"
                value={formData.typeOfUseGroupCode}
                onChange={(e) => {
                  const cleaned = sanitizeCode(e.target.value, 10);
                  const next = { ...formData, typeOfUseGroupCode: cleaned };
                  setFormData(next);
                  if (submittedOnce || touched.code) {
                    const validationErrors = validateForm(next, validationSchema);
                    setErrors({
                      code: validationErrors.typeOfUseGroupCode,
                      name: validationErrors.groupName
                    });
                  }
                }}
                onBlur={() => handleBlur("code")}
                placeholder={t('group.placeholders.groupId')}
                required
                fullWidth
              />
              <ValidationMessage
                message={errors.code}
                visible={showError("code")}
              />
            </div>

            {/* Group Name */}
            <div className="flex flex-col">
             
              <Input
                label={t('group.fields.groupName')}
                name="groupName"
                value={formData.groupName}
                onChange={(e) => {
                  const cleaned = sanitizeText(e.target.value, 50);
                  const next = { ...formData, groupName: cleaned };
                  setFormData(next);

                  if (submittedOnce || touched.name) {
                    const validationErrors = validateForm(next, validationSchema);
                    setErrors({
                      code: validationErrors.typeOfUseGroupCode,
                      name: validationErrors.groupName
                    });
                  }
                }}
                onBlur={() => handleBlur("name")}
                placeholder={t('group.placeholders.groupName')}
                maxLength={50}
                required
                fullWidth
              />
              <ValidationMessage
                message={errors.name}
                visible={showError("name")}
              />
            </div>

            {/* ICON DROPDOWN (custom with icon display) */}
            <GroupIconSelector
              value={formData.groupIcon}
              onChange={(iconValue) => setFormData((p) => ({ ...p, groupIcon: iconValue }))}
              label={t('group.fields.iconType')}
              required
            />
          </div>
        </div>

        {/* ================= NOTE ================= */}
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>
            {t('group.mandatoryNote')}
          </span>
        </div>
      </form>
    </Drawer>
  );
}

