"use client";

import { Network } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common/ActionButtons";
import { Input } from "@/components/common/Input";
import { TextArea } from "@/components/common/Textarea";
import { ValidationMessage } from "@/components/common/ValidationMessage";
import { FormStatusToggle } from "@/components/common";
import { MandatoryFieldsNotice } from "./MandatoryFieldsNotice";
import { useConnectionTypeForm } from "@/hooks/water-bill/connection-type-master";
import type { ConnectionType } from "@/types/waterBill/connectionTypeMaster.types";

export interface ConnectionTypeFormProps {
  id: number | null;
  initialData?: ConnectionType;
}

export function ConnectionTypeForm({ id, initialData }: Readonly<ConnectionTypeFormProps>) {
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
  } = useConnectionTypeForm(id, initialData);

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Network size={20} />
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
            form="connection-type-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="connection-type-form"
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
            description={formData.isActive ? (t("form.activeStatusOn") || "Active - Connection is enabled") : (t("form.activeStatusOff") || "Inactive - Connection is disabled")}
          />

          <div>
            <Input
              label={t("form.connectionTypeCode.label") || "Connection Type Code"}
              required
              id="connection-type-code"
              maxLength={20}
              value={formData.connectionTypeCode ?? ""}
              onChange={(e) => handleChange("connectionTypeCode", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("connectionTypeCode")}
              placeholder={t("form.connectionTypeCode.placeholder") || "e.g., RES"}
              aria-invalid={showError("connectionTypeCode") ? "true" : "false"}
              aria-describedby={showError("connectionTypeCode") ? "connection-type-code-error" : undefined}
            />
            <ValidationMessage
              id="connection-type-code-error"
              message={errors.connectionTypeCode}
              visible={showError("connectionTypeCode")}
            />
          </div>

          <div>
            <Input
              label={t("form.connectionType.label") || "Connection Type"}
              required
              id="connection-type"
              maxLength={50}
              value={formData.connectionType}
              onChange={(e) => handleChange("connectionType", e.target.value)}
              onBlur={() => handleBlur("connectionType")}
              placeholder={t("form.connectionType.placeholder") || "e.g., Residential"}
              aria-invalid={showError("connectionType") ? "true" : "false"}
              aria-describedby={showError("connectionType") ? "connection-type-error" : undefined}
            />
            <ValidationMessage
              id="connection-type-error"
              message={errors.connectionType}
              visible={showError("connectionType")}
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
              placeholder={t("form.description.placeholder") || "e.g., Standard home connection"}
              aria-invalid={showError("description") ? "true" : "false"}
              aria-describedby={showError("description") ? "description-error" : undefined}
            />
            <ValidationMessage
              id="description-error"
              message={errors.description}
              visible={showError("description")}
            />
          </div>
        </div>

        <MandatoryFieldsNotice message={tCommon("note.mandatory") || "* Indicates mandatory fields"} />
      </form>
    </Drawer>
  );
}
