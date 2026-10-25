"use client";

import React, { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Tags, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton, ToggleSwitch, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { AliasMaster } from "@/types/alias-master.types";
import { useAliasMasterForm } from "@/hooks/configuration-settings/alias-master/useAliasMasterForm";
import { FormFieldsSection, type FormFieldsSectionRef } from "./FormFieldsSection";

export default function AliasMasterForm({
  initialData,
}: {
  id?: number | null;
  initialData: AliasMaster | null;
}) {
  const t = useTranslations("aliasMaster");

  const {
    formData,
    setFormData,
    errors,
    isSubmitting,
    open,
    isEdit,
    handleChange,
    handleBlur,
    handleSubmit,
    handleClose,
    showError,
  } = useAliasMasterForm({ initialData });

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const formFieldsRef = useRef<FormFieldsSectionRef>(null);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && formFieldsRef.current?.keyNameRef?.current) {
        formFieldsRef.current.keyNameRef.current.focus();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [open, isEdit]);

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
            <Tags size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">{isEdit ? t("form.editTitle") : t("form.addTitle")}</div>
            <div className="text-sm text-slate-500">{isEdit ? t("form.editSubtitle") : t("form.subtitle")}</div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t("form.actions.cancel")} onClick={handleClose} disabled={isSubmitting} />
          <SaveButton label={isEdit ? t("form.actions.update") : t("form.actions.save")} type="submit" form="alias-master-form" isLoading={isSubmitting} />
        </>
      }
    >
      <form id="alias-master-form" onSubmit={handleSubmit} className="flex h-full flex-col gap-6 bg-[#F8FAFF] p-5">
        <div className="flex-1 space-y-6">
          {isEdit && (
            <StatusToggleCard
              ref={statusToggleRef}
              isActive={formData.isActive}
              onToggle={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
              error={errors.isActive}
              activeLabel={t("form.status.active")}
              inactiveLabel={t("form.status.inactive")}
              statusLabel={t("form.status.label")}
              description={t("form.status.description")}
            />
          )}

          <FormFieldsSection
            ref={formFieldsRef}
            formData={formData}
            errors={errors}
            showError={showError}
            isEdit={isEdit}
            onChange={handleChange}
            onBlur={handleBlur}
            t={t}
          />
        </div>

        <MandatoryFieldsNotice
          message={t.rich("form.validation.mandatoryNotice", {
            b: (chunks) => <b>{chunks}</b>,
          })}
        />
      </form>
    </Drawer>
  );
}

interface MandatoryFieldsNoticeProps {
  message: React.ReactNode;
}

function MandatoryFieldsNotice({ message }: MandatoryFieldsNoticeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

interface StatusToggleCardProps {
  isActive: boolean;
  onToggle: () => void;
  error?: string;
  activeLabel: string;
  inactiveLabel: string;
  statusLabel: string;
  description: string;
}

const StatusToggleCard = React.forwardRef<HTMLButtonElement, StatusToggleCardProps>(
  ({
    isActive,
    onToggle,
    error,
    activeLabel,
    inactiveLabel,
    statusLabel,
    description,
  }, ref) => {
    return (
      <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
        <div
          className={cn(
            "rounded-xl p-3 flex items-center justify-between",
            isActive
              ? "border border-blue-200 bg-[#F0F6FF]"
              : "border border-gray-200 bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full",
                isActive
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-200 text-gray-900"
              )}
            >
              {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
            </div>
            <div>
              <div className="font-medium text-gray-900">{statusLabel}</div>
              <div className="text-sm text-slate-500">
                {description} {isActive ? activeLabel : inactiveLabel}
              </div>
            </div>
          </div>
          <ToggleSwitch
            ref={ref}
            checked={isActive}
            onChange={onToggle}
            showPopup={false}
          />
        </div>
        <ValidationMessage message={error} visible={!!error} />
      </div>
    );
  }
);

StatusToggleCard.displayName = "StatusToggleCard";
