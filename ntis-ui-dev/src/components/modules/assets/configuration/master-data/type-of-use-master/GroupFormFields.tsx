import React from "react";
import { Input, ValidationMessage } from "@/components/common";
import { TypeOfUseGroupFormModel } from "@/types/asset-masters/type-of-use.types";
import { GroupIconSelector } from "./GroupIconSelector";

interface GroupFormFieldsProps {
  codeRef: React.RefObject<HTMLInputElement | null>;
  formData: TypeOfUseGroupFormModel;
  errors: Partial<Record<keyof TypeOfUseGroupFormModel, string>>;
  showError: (field: keyof TypeOfUseGroupFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleValueChange: (name: string, value: string) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function GroupFormFields({
  codeRef,
  formData,
  errors,
  showError,
  handleChange,
  handleValueChange,
  handleBlur,
  t,
}: GroupFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        ref={codeRef}
        name="typeOfUseGroupCode"
        label={t("group.fields.code.label", { default: "Group Code" })}
        required
        placeholder={t("group.fields.code.placeholder", { default: "Enter group code" })}
        value={formData.typeOfUseGroupCode}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.typeOfUseGroupCode}
        visible={showError("typeOfUseGroupCode")}
      />

      <Input
        name="groupName"
        label={t("group.fields.name.label", { default: "Group Name" })}
        required
        placeholder={t("group.fields.name.placeholder", { default: "Enter group name" })}
        value={formData.groupName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.groupName}
        visible={showError("groupName")}
      />

      <GroupIconSelector
        name="groupIcon"
        label={t("group.fields.icon.label", { default: "Group Icon" })}
        value={formData.groupIcon}
        onChange={handleValueChange}
        required
      />
      <ValidationMessage
        message={errors.groupIcon}
        visible={showError("groupIcon")}
      />
    </div>
  );
}
