"use client";

import { useMemo } from "react";
import { Wrench } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common/ActionButtons";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/select";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { FormStatusToggle } from "@/components/common";
import { MandatoryFieldsNotice } from "./MandatoryFieldsNotice";
import { useTapSizeForm } from "@/hooks/water-bill/tap-size-master/useTapSizeForm";
import type { TapSize } from "@/types/waterBill/tapSizeMaster.types";

export interface TapSizeFormProps {
  id: number | null;
  initialData?: TapSize;
}

export function TapSizeForm({ id, initialData }: Readonly<TapSizeFormProps>) {
  const {
    isEdit,
    open,
    isSubmitting,
    formData,
    errors,
    showError,
    handleChange,
    handleBlur,
    handleClose,
    handleSubmit,
    t,
    tCommon
  } = useTapSizeForm(id, initialData);

  const unitOptions = useMemo(
    () => [
      { value: "Inch", label: "Inch" },
      { value: "MM", label: "MM" },
    ],
    []
  );

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Wrench size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("drawer.editTitle") : t("drawer.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("drawer.editSubtitle") : t("drawer.addSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon("buttons.cancel")}
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? tCommon("buttons.update") : tCommon("buttons.save")}
            type="submit"
            form="tap-size-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="tap-size-form"
        onSubmit={handleSubmit}
        className="space-y-5 bg-[#F8FAFF] p-5"
        noValidate
      >
        <div className="space-y-4">
          <FormStatusToggle
            isEdit={isEdit}
            isActive={Boolean(formData.isActive)}
            onChange={(val) => handleChange("isActive", val)}
            isSubmitting={isSubmitting}
            statusLabel={formData.isActive ? tCommon("status.active") : tCommon("status.inactive")}
            description={formData.isActive ? (t("form.activeStatusOn") || "Active - Status is enabled") : (t("form.activeStatusOff") || "Inactive - Status is disabled")}
          />

          <div>
            <Input
              label={t("form.tapSizeCode.label") || "Tap Size Code"}
              required
              id="tap-size-code"
              maxLength={20}
              value={formData.tapSizeCode ?? ""}
              onChange={(e) => handleChange("tapSizeCode", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("tapSizeCode")}
              placeholder={t("form.tapSizeCode.placeholder")}
              aria-invalid={showError("tapSizeCode") ? "true" : "false"}
              aria-describedby={showError("tapSizeCode") ? "tap-size-code-error" : undefined}
            />
            <ValidationMessage
              id="tap-size-code-error"
              message={errors.tapSizeCode}
              visible={showError("tapSizeCode")}
            />
          </div>

          <div>
            <Input
              label={t("form.tapSize.label")}
              required
              id="tap-size"
              maxLength={5}
              value={formData.tapSize}
              onChange={(e) => handleChange("tapSize", e.target.value)}
              onBlur={() => handleBlur("tapSize")}
              placeholder={t("form.tapSize.placeholder")}
              aria-invalid={showError("tapSize") ? "true" : "false"}
              aria-describedby={showError("tapSize") ? "tap-size-error" : undefined}
            />
            <ValidationMessage
              id="tap-size-error"
              message={errors.tapSize}
              visible={showError("tapSize")}
            />
          </div>

          <div>
            <Input
              label={t("form.nominalSizeValue.label")}
              required
              disabled
              id="nominal-size-value"
              type="number"
              step="0.01"
              value={formData.nominalSizeValue ?? ""}
              onChange={(e) => handleChange("nominalSizeValue", e.target.value)}
              onBlur={() => handleBlur("nominalSizeValue")}
              placeholder={t("form.nominalSizeValue.placeholder")}
              aria-invalid={showError("nominalSizeValue") ? "true" : "false"}
              aria-describedby={showError("nominalSizeValue") ? "nominal-size-error" : undefined}
            />
            <ValidationMessage
              id="nominal-size-error"
              message={errors.nominalSizeValue}
              visible={showError("nominalSizeValue")}
            />
          </div>

          <div>
            <Select
              label={t("form.sizeUnit.label") || "Size Unit"}
              required
              value={formData.sizeUnit ?? ""}
              options={unitOptions}
              onChange={(_e, val) => handleChange("sizeUnit", val)}
              placeholder={t("form.sizeUnit.placeholder") || "Select Unit..."}
              error={showError("sizeUnit") ? errors.sizeUnit : undefined}
            />
          </div>
        </div>

        <MandatoryFieldsNotice message={tCommon("note.mandatory")} />
      </form>
    </Drawer>
  );
}
