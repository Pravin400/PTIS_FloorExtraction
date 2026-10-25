"use client";

import { useMemo } from "react";
import { Layers } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common/ActionButtons";
import { Input } from "@/components/common/Input";
import { TextArea } from "@/components/common/Textarea";
import { Select } from "@/components/common/select";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { FormStatusToggle } from "@/components/common";
import { MeteredStatusCard } from "./MeteredStatusCard";
import { MandatoryFieldsNotice } from "./MandatoryFieldsNotice";
import { useConnectionCategoryForm } from "@/hooks/water-bill/connection-category-master";
import type { ConnectionCategory, BillingFrequencyOption } from "@/types/waterBill/connectionCategoryMaster.types";

export interface ConnectionCategoryFormProps {
  id: number | null;
  initialData?: ConnectionCategory;
  billingFrequencies?: BillingFrequencyOption[];
}

export function ConnectionCategoryForm({ id, initialData, billingFrequencies = [] }: Readonly<ConnectionCategoryFormProps>) {
  const {
    isEdit, open, isSubmitting, formData, errors, showError,
    handleChange, handleBlur, handleClose, handleSubmit,
    currentBillingMethodOptions, t, tCommon,
  } = useConnectionCategoryForm(id, initialData, billingFrequencies);

  const frequencyOptions = useMemo(
    () => billingFrequencies.map((f) => ({ value: String(f.id), label: f.billingFrequency })),
    [billingFrequencies]
  );

  const billingMethodOptions = useMemo(
    () => currentBillingMethodOptions.map((m) => ({ value: m, label: t(`billingMethods.${m}`) || m })),
    [currentBillingMethodOptions, t]
  );

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">{isEdit ? t("drawer.editTitle") : t("drawer.addTitle")}</div>
            <div className="text-sm text-slate-500">{isEdit ? t("drawer.editSubtitle") : t("drawer.addSubtitle")}</div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={tCommon("buttons.cancel")} onClick={handleClose} disabled={isSubmitting} />
          <SaveButton label={isEdit ? tCommon("buttons.update") : tCommon("buttons.save")} type="submit" form="connection-category-form" isLoading={isSubmitting} />
        </>
      }
    >
      <form id="connection-category-form" onSubmit={handleSubmit} className="space-y-5 bg-[#F8FAFF] p-5" noValidate>
        <div className="space-y-4">
          <FormStatusToggle
            isEdit={isEdit}
            isActive={Boolean(formData.isActive)}
            onChange={(val) => handleChange("isActive", val)}
            isSubmitting={isSubmitting}
            statusLabel={formData.isActive ? tCommon("status.active") : tCommon("status.inactive")}
            description={formData.isActive ? (t("form.activeStatusOn") || "Active - Category is enabled") : (t("form.activeStatusOff") || "Inactive - Category is disabled")}
          />
          <div>
            <Input
              label={t("form.connectionCategoryCode.label") || "Connection Category Code"}
              required
              id="connection-category-code"
              maxLength={20}
              value={formData.connectionCategoryCode ?? ""}
              onChange={(e) => handleChange("connectionCategoryCode", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("connectionCategoryCode")}
              placeholder={t("form.connectionCategoryCode.placeholder") || "e.g., REGULAR"}
              aria-invalid={showError("connectionCategoryCode") ? "true" : "false"}
              aria-describedby={showError("connectionCategoryCode") ? "connection-category-code-error" : undefined}
            />
            <ValidationMessage id="connection-category-code-error" message={errors.connectionCategoryCode} visible={showError("connectionCategoryCode")} />
          </div>
          <div>
            <Input
              label={t("form.connectionCategory.label") || "Connection Category"}
              required
              id="connection-category"
              maxLength={50}
              value={formData.connectionCategory}
              onChange={(e) => handleChange("connectionCategory", e.target.value)}
              onBlur={() => handleBlur("connectionCategory")}
              placeholder={t("form.connectionCategory.placeholder") || "e.g., Regular Metered"}
              aria-invalid={showError("connectionCategory") ? "true" : "false"}
              aria-describedby={showError("connectionCategory") ? "connection-category-error" : undefined}
            />
            <ValidationMessage id="connection-category-error" message={errors.connectionCategory} visible={showError("connectionCategory")} />
          </div>
          <div>
            <Select
              label={t("form.billingFrequencyId.label") || "Billing Frequency"}
              required
              value={formData.billingFrequencyId != null ? String(formData.billingFrequencyId) : ""}
              options={frequencyOptions}
              onChange={(_e, val) => handleChange("billingFrequencyId", val ? Number(val) : null)}
              placeholder={t("form.billingFrequencyId.placeholder") || "Select Billing Frequency..."}
              error={showError("billingFrequencyId") ? errors.billingFrequencyId : undefined}
            />
          </div>
          <MeteredStatusCard
            isMetered={formData.isMetered}
            onChange={(checked) => handleChange("isMetered", checked)}
            title={t("form.meteredStatusTitle") || "Metered Status"}
            onLabel={t("form.meteredStatusOn") || "Metered - Connection has a meter installed"}
            offLabel={t("form.meteredStatusOff") || "Non-Metered - Flat or fixed rate connection"}
          />
          <div>
            <Select
              label={t("form.billingMethod.label") || "Billing Method"}
              required
              value={formData.billingMethod}
              options={billingMethodOptions}
              onChange={(_e, val) => handleChange("billingMethod", val)}
              placeholder={t("form.billingMethod.placeholder") || "Select Billing Method..."}
              error={showError("billingMethod") ? errors.billingMethod : undefined}
            />
          </div>
          <div>
            <TextArea
              label={t("form.description.label") || "Description"}
              id="description"
              maxLength={300}
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() => handleBlur("description")}
              placeholder={t("form.description.placeholder") || "e.g., Standard quarterly metered category"}
              aria-invalid={showError("description") ? "true" : "false"}
              aria-describedby={showError("description") ? "description-error" : undefined}
            />
            <ValidationMessage id="description-error" message={errors.description} visible={showError("description")} />
          </div>
        </div>
        <MandatoryFieldsNotice message={tCommon("note.mandatory") || "* Indicates mandatory fields"} />
      </form>
    </Drawer>
  );
}
